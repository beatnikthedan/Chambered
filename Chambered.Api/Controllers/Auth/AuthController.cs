using Chambered.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace Chambered.Api.Controllers.Auth
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly SignInManager<ChamberedUser> _signInManager;
        private readonly UserManager<ChamberedUser> _userManager;
        private readonly ChamberedDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;

        public AuthController(
            SignInManager<ChamberedUser> signInManager,
            UserManager<ChamberedUser> userManager,
            ChamberedDbContext db,
            IHttpClientFactory httpClientFactory = null)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _db = db;
            _httpClientFactory = httpClientFactory;
        }

        // GET: api/auth/is-initialized
        [HttpGet("is-initialized")]
        public async Task<IActionResult> IsInitialized()
        {
            var anyUsers = await _userManager.Users.AnyAsync();
            return Ok(new { isInitialized = anyUsers });
        }

        // POST: api/auth/first-register
        [HttpPost("first-register")]
        public async Task<IActionResult> FirstRegister([FromBody] RegisterRequest request)
        {
            var anyUsers = await _userManager.Users.AnyAsync();
            if (anyUsers)
            {
                return BadRequest("The server is already initialized. Please use standard login.");
            }

            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Username and password are required.");
            }

            var user = new ChamberedUser
            {
                UserName = request.Username.Trim(),
                Email = string.IsNullOrEmpty(request.Email) ? $"{request.Username.Trim().ToLower()}@chambered.local" : request.Email.Trim(),
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            // Assign Admin role to the first registered owner
            await _userManager.AddToRoleAsync(user, "Admin");

            // Automatically sign them in
            await _signInManager.SignInAsync(user, isPersistent: true);

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                Roles = roles,
                GravatarUrl = GetGravatarUrl(user.Email)
            });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return BadRequest("Username and password are required.");

            var result = await _signInManager.PasswordSignInAsync(request.Username, request.Password, isPersistent: true, lockoutOnFailure: false);

            if (result.Succeeded)
            {
                var user = await _userManager.FindByNameAsync(request.Username);
                return Ok(new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName,
                    Email = user.Email,
                    Roles = await _userManager.GetRolesAsync(user),
                    GravatarUrl = GetGravatarUrl(user.Email)
                });
            }

            return Unauthorized("Invalid username or password.");
        }

        // POST: api/auth/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok();
        }

        // GET: api/auth/user
        [HttpGet("user")]
        public async Task<IActionResult> GetCurrentUser()
        {
            if (!User.Identity.IsAuthenticated)
                return Unauthorized();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                Roles = await _userManager.GetRolesAsync(user),
                GravatarUrl = GetGravatarUrl(user.Email)
            });
        }

        // GET: api/auth/oidc/login
        [HttpGet("oidc/login")]
        public async Task<IActionResult> OidcLogin()
        {
            var config = await _db.OidcConfigs.FirstOrDefaultAsync();
            if (config == null || !config.IsEnabled)
                return BadRequest("OIDC is not enabled or configured.");

            var state = Guid.NewGuid().ToString("N");
            // Set cookie for state verification
            Response.Cookies.Append("oidc_state", state, new CookieOptions { HttpOnly = true, SameSite = SameSiteMode.Lax });

            var redirectUri = Url.Action("OidcCallback", "AuthController", null, Request.Scheme)
                ?? $"{Request.Scheme}://{Request.Host}/api/auth/oidc/callback";

            var authUrl = $"{config.AuthUrl}?client_id={Uri.EscapeDataString(config.ClientId)}" +
                          $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                          $"&response_type=code" +
                          $"&scope=openid%20profile%20email" +
                          $"&state={state}";

            return Redirect(authUrl);
        }

        // GET: api/auth/oidc/callback
        [HttpGet("oidc/callback")]
        public async Task<IActionResult> OidcCallback([FromQuery] string code, [FromQuery] string state)
        {
            if (string.IsNullOrEmpty(code))
                return BadRequest("Auth code is missing.");

            // Verify state
            if (!Request.Cookies.TryGetValue("oidc_state", out var savedState) || savedState != state)
            {
                return BadRequest("OIDC state mismatch. Possible CSRF attack.");
            }
            Response.Cookies.Delete("oidc_state");

            var config = await _db.OidcConfigs.FirstOrDefaultAsync();
            if (config == null || !config.IsEnabled)
                return BadRequest("OIDC is disabled.");

            var redirectUri = Url.Action("OidcCallback", "AuthController", null, Request.Scheme)
                ?? $"{Request.Scheme}://{Request.Host}/api/auth/oidc/callback";

            try
            {
                using var client = new HttpClient();
                // 1. Exchange Code for Access/ID Token
                var tokenReq = new HttpRequestMessage(HttpMethod.Post, config.TokenUrl);
                var tokenParams = new List<KeyValuePair<string, string>>
                {
                    new("client_id", config.ClientId),
                    new("client_secret", config.ClientSecret),
                    new("grant_type", "authorization_code"),
                    new("code", code),
                    new("redirect_uri", redirectUri)
                };
                tokenReq.Content = new FormUrlEncodedContent(tokenParams);

                var tokenResponse = await client.SendAsync(tokenReq);
                if (!tokenResponse.IsSuccessStatusCode)
                {
                    var err = await tokenResponse.Content.ReadAsStringAsync();
                    return BadRequest($"Token exchange failed: {err}");
                }

                var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
                using var tokenDoc = JsonDocument.Parse(tokenJson);
                var accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString();

                // 2. Query UserInfo Endpoint
                var userinfoReq = new HttpRequestMessage(HttpMethod.Get, config.UserinfoUrl);
                userinfoReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

                var userinfoResponse = await client.SendAsync(userinfoReq);
                if (!userinfoResponse.IsSuccessStatusCode)
                {
                    return BadRequest("Failed to retrieve user information from OIDC provider.");
                }

                var userinfoJson = await userinfoResponse.Content.ReadAsStringAsync();
                using var userinfoDoc = JsonDocument.Parse(userinfoJson);
                var root = userinfoDoc.RootElement;

                // Extract claims
                string sub = root.GetProperty("sub").GetString() ?? "";
                string email = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() ?? "" : "";
                string preferredUsername = root.TryGetProperty("preferred_username", out var prefProp) ? prefProp.GetString() ?? "" : "";
                string name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? "" : "";

                string username = !string.IsNullOrEmpty(preferredUsername) ? preferredUsername : (!string.IsNullOrEmpty(email) ? email.Split('@')[0] : name);
                username = username.Replace(" ", "").ToLower();

                if (string.IsNullOrEmpty(username))
                    return BadRequest("Unable to resolve username from OIDC token.");

                // 3. Match or Create User
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    user = await _userManager.FindByNameAsync(username);
                }

                if (user == null)
                {
                    if (!config.AutoCreateUser)
                    {
                        return Unauthorized("Local registration is disabled and account does not exist.");
                    }

                    user = new ChamberedUser
                    {
                        UserName = username,
                        Email = string.IsNullOrEmpty(email) ? $"{username}@chambered.local" : email,
                        EmailConfirmed = true
                    };

                    var createResult = await _userManager.CreateAsync(user);
                    if (!createResult.Succeeded)
                    {
                        return BadRequest($"Failed to automatically provision user: {string.Join(", ", createResult.Errors)}");
                    }
                    await _userManager.AddToRoleAsync(user, "User");
                }

                // 4. Sign User In
                await _signInManager.SignInAsync(user, isPersistent: true);

                // Redirect user back to home
                return Redirect("/");
            }
            catch (Exception ex)
            {
                return BadRequest($"Authentication error: {ex.Message}");
            }
        }

        public static string GetGravatarUrl(string email)
        {
            if (string.IsNullOrEmpty(email))
                return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";

            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                byte[] inputBytes = System.Text.Encoding.ASCII.GetBytes(email.Trim().ToLower());
                byte[] hashBytes = md5.ComputeHash(inputBytes);

                var sb = new System.Text.StringBuilder();
                for (int i = 0; i < hashBytes.Length; i++)
                {
                    sb.Append(hashBytes[i].ToString("x2"));
                }
                return $"https://www.gravatar.com/avatar/{sb}?d=identicon";
            }
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
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
