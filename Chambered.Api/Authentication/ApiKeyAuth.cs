using Chambered.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace Chambered.Api.Authentication
{
    public class ApiKeyAuthOptions : AuthenticationSchemeOptions
    {
    }

    public class ApiKeyAuthHandler : AuthenticationHandler<ApiKeyAuthOptions>
    {
        private readonly ChamberedDbContext _db;

        public ApiKeyAuthHandler(
            IOptionsMonitor<ApiKeyAuthOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ChamberedDbContext db)
            : base(options, logger, encoder)
        {
            _db = db;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.TryGetValue("Authorization", out var authHeaderValues))
            {
                return AuthenticateResult.NoResult();
            }

            var authHeader = authHeaderValues.ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return AuthenticateResult.NoResult();
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            if (string.IsNullOrEmpty(token))
            {
                return AuthenticateResult.NoResult();
            }

            // Hash the incoming token to check against the database
            var hashedToken = HashToken(token);

            var apiKey = await _db.ApiKeys
                .Include(k => k.User)
                .FirstOrDefaultAsync(k => k.TokenHash == hashedToken && k.IsActive);

            if (apiKey == null || apiKey.User == null)
            {
                return AuthenticateResult.Fail("Invalid or inactive API Key.");
            }

            // Create ClaimsPrincipal for the authenticated user
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, apiKey.User.Id),
                new Claim(ClaimTypes.Name, apiKey.User.UserName ?? ""),
                new Claim("ApiKey", apiKey.Name),
                new Claim(ClaimTypes.Role, "User"), // Standard user role
                new Claim(ClaimTypes.Role, "Admin") // API Keys can perform administrative actions
            };

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);

            return AuthenticateResult.Success(ticket);
        }

        public static string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToHexString(hash).ToLower();
        }
    }
}
