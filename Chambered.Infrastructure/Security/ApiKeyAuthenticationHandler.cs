using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Chambered.Core.Utility;
using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chambered.Infrastructure.Security
{
    /// <summary>
    /// Authenticates requests utilizing a secure cryptographically hashed API key provided in the "X-API-KEY" header.
    /// </summary>
    public class ApiKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        private readonly ChamberedDbContext _context;

        /// <summary>
        /// Initializes a new instance of the <see cref="ApiKeyAuthenticationHandler"/> class.
        /// </summary>
        public ApiKeyAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options, 
            ILoggerFactory logger, 
            UrlEncoder encoder, 
            ChamberedDbContext context) : base(options, logger, encoder)
        {
            _context = context;
        }

        /// <inheritdoc />
        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.TryGetValue("X-API-KEY", out var extractedKey))
            {
                return AuthenticateResult.NoResult();
            }

            string providedKey = extractedKey.ToString();
            string hashedKey = ApiKeyGenerator.HashKey(providedKey);

            var now = DateTime.UtcNow;
            var apiKey = await _context.Set<ApiKey>()
                .Include(k => k.Claims)
                .FirstOrDefaultAsync(k => k.KeyHash == hashedKey
                                       && !k.IsRevoked
                                       && (k.ExpiresAt == null || k.ExpiresAt > now))
                .ConfigureAwait(false);

            if (apiKey == null)
            {
                return AuthenticateResult.Fail("Invalid, revoked, or expired API Key.");
            }

            var claimsList = new List<Claim>();

            if (apiKey.Claims != null)
            {
                foreach (var c in apiKey.Claims)
                {
                    claimsList.Add(new Claim(c.Type ?? ClaimTypes.Role, c.Value ?? ""));
                }
            }

            if (!string.IsNullOrEmpty(apiKey.OwnerId))
            {
                claimsList.Add(new Claim(ClaimTypes.NameIdentifier, apiKey.OwnerId));
                claimsList.Add(new Claim(ClaimTypes.GivenName, apiKey.OwnerId));
            }

            if (!string.IsNullOrEmpty(apiKey.Name))
            {
                claimsList.Add(new Claim(ClaimTypes.Surname, apiKey.Name));
            }

            claimsList.Add(new Claim("AuthenticationMethod", "ApiKey"));

            var identity = new ClaimsIdentity(claimsList, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);

            return AuthenticateResult.Success(ticket);
        }
    }
}
