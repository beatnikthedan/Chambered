using Chambered.Api.Authentication;
using Chambered.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading.Tasks;

namespace Chambered.Api.Controllers.Settings
{
    [ApiController]
    [Route("api/settings")]
    [Authorize(Roles = "Admin")] // Settings management is administrative
    public class SettingsController : ControllerBase
    {
        private readonly ChamberedDbContext _db;
        private readonly UserManager<ChamberedUser> _userManager;

        public SettingsController(ChamberedDbContext db, UserManager<ChamberedUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        // ==========================================
        // 1. OIDC CONFIGURATION ENDPOINTS
        // ==========================================

        [HttpGet("oidc")]
        public async Task<IActionResult> GetOidcConfig()
        {
            var config = await _db.OidcConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new OidcConfig();
                _db.OidcConfigs.Add(config);
                await _db.SaveChangesAsync();
            }
            return Ok(config);
        }

        [HttpPost("oidc")]
        public async Task<IActionResult> UpdateOidcConfig([FromBody] OidcConfig config)
        {
            var existing = await _db.OidcConfigs.FirstOrDefaultAsync();
            if (existing == null)
            {
                _db.OidcConfigs.Add(config);
            }
            else
            {
                existing.IsEnabled = config.IsEnabled;
                existing.ClientId = config.ClientId ?? "";
                existing.ClientSecret = config.ClientSecret ?? "";
                existing.IssuerUrl = config.IssuerUrl ?? "";
                existing.AuthUrl = config.AuthUrl ?? "";
                existing.TokenUrl = config.TokenUrl ?? "";
                existing.UserinfoUrl = config.UserinfoUrl ?? "";
                existing.JwksUrl = config.JwksUrl ?? "";
                existing.AutoCreateUser = config.AutoCreateUser;
            }

            await _db.SaveChangesAsync();
            return Ok(config);
        }

        [HttpPost("oidc/discover")]
        public async Task<IActionResult> DiscoverOidc([FromBody] DiscoverRequest request)
        {
            if (string.IsNullOrEmpty(request.IssuerUrl))
                return BadRequest("Issuer URL is required.");

            var url = request.IssuerUrl.Trim().TrimEnd('/');
            if (!url.EndsWith(".well-known/openid-configuration"))
            {
                url = $"{url}/.well-known/openid-configuration";
            }

            try
            {
                using var client = new HttpClient();
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest($"Failed to fetch metadata from {url}. Status: {response.StatusCode}");
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                var result = new OidcConfig
                {
                    IssuerUrl = request.IssuerUrl,
                    AuthUrl = root.TryGetProperty("authorization_endpoint", out var auth) ? auth.GetString() ?? "" : "",
                    TokenUrl = root.TryGetProperty("token_endpoint", out var token) ? token.GetString() ?? "" : "",
                    UserinfoUrl = root.TryGetProperty("userinfo_endpoint", out var uinfo) ? uinfo.GetString() ?? "" : "",
                    JwksUrl = root.TryGetProperty("jwks_uri", out var jwks) ? jwks.GetString() ?? "" : ""
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Discovery error: {ex.Message}");
            }
        }

        // ==========================================
        // 2. API KEYS ENDPOINTS
        // ==========================================

        [HttpGet("apikeys")]
        public async Task<IActionResult> GetApiKeys()
        {
            var keys = await _db.ApiKeys
                .Include(k => k.User)
                .Select(k => new ApiKeyDto
                {
                    Id = k.Id,
                    Name = k.Name,
                    UserId = k.UserId,
                    UserName = k.User.UserName,
                    TokenPreview = k.TokenPreview,
                    IsActive = k.IsActive,
                    CreatedAt = k.CreatedAt
                })
                .ToListAsync();

            return Ok(keys);
        }

        [HttpPost("apikeys")]
        public async Task<IActionResult> CreateApiKey([FromBody] CreateApiKeyRequest request)
        {
            if (string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.UserId))
                return BadRequest("Key Name and User are required.");

            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
                return BadRequest("Assigned User not found.");

            // Generate a secure API Key
            var randomBytes = new byte[24];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            var rawToken = "cham_" + Convert.ToBase64String(randomBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "")
                .Trim();

            var hash = ApiKeyAuthHandler.HashToken(rawToken);
            var preview = "cham_..." + rawToken.Substring(rawToken.Length - 4);

            var apiKey = new ApiKey
            {
                Name = request.Name,
                UserId = user.Id,
                TokenHash = hash,
                TokenPreview = preview,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.ApiKeys.Add(apiKey);
            await _db.SaveChangesAsync();

            // Return raw token exactly ONCE so the user can copy/paste it
            return Ok(new
            {
                apiKey = new ApiKeyDto
                {
                    Id = apiKey.Id,
                    Name = apiKey.Name,
                    UserId = apiKey.UserId,
                    UserName = user.UserName,
                    TokenPreview = apiKey.TokenPreview,
                    IsActive = apiKey.IsActive,
                    CreatedAt = apiKey.CreatedAt
                },
                rawToken = rawToken
            });
        }

        [HttpDelete("apikeys/{id}")]
        public async Task<IActionResult> DeleteApiKey(int id)
        {
            var key = await _db.ApiKeys.FindAsync(id);
            if (key == null)
                return NotFound();

            _db.ApiKeys.Remove(key);
            await _db.SaveChangesAsync();
            return Ok();
        }

        // ==========================================
        // 3. USER MANAGEMENT ENDPOINTS
        // ==========================================

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? "",
                    Email = user.Email ?? "",
                    Roles = await _userManager.GetRolesAsync(user),
                    GravatarUrl = Chambered.Api.Controllers.Auth.AuthController.GetGravatarUrl(user.Email)
                });
            }

            return Ok(userDtos);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return BadRequest("Username and Password are required.");

            var existing = await _userManager.FindByNameAsync(request.Username);
            if (existing != null)
                return BadRequest("Username is already taken.");

            var user = new ChamberedUser
            {
                UserName = request.Username,
                Email = string.IsNullOrEmpty(request.Email) ? $"{request.Username}@chambered.local" : request.Email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            var role = request.IsAdmin ? "Admin" : "User";
            await _userManager.AddToRoleAsync(user, role);

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                Roles = new List<string> { role },
                GravatarUrl = Chambered.Api.Controllers.Auth.AuthController.GetGravatarUrl(user.Email)
            });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound();

            // Prevent self-deletion
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId == user.Id)
            {
                return BadRequest("You cannot delete your own account.");
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest("Failed to delete user.");
            }

            return Ok();
        }
    }

    public class DiscoverRequest
    {
        public string IssuerUrl { get; set; }
    }

    public class CreateApiKeyRequest
    {
        public string Name { get; set; }
        public string UserId { get; set; }
    }

    public class ApiKeyDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string TokenPreview { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUserRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public IList<string> Roles { get; set; }
        public string GravatarUrl { get; set; }
    }
}
