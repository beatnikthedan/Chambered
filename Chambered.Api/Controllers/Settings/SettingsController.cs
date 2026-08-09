using Chambered.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        // OIDC Config endpoints removed since OidcConfig model was cleaned up.

        // ApiKeys endpoints removed since ApiKeys model was cleaned up.

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
