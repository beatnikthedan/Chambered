using Chambered.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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

        // OIDC endpoints removed since OidcConfig was cleaned up from models.

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
