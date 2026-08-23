using Chambered.Core.Services;
using Chambered.Core.Services.Models;
using Microsoft.AspNetCore.Http;

namespace Chambered.Infrastructure.Services
{
    /// <summary>
    /// Service that extracts session details for the currently authenticated user from the HTTP context.
    /// </summary>
    /// <param name="httpContextAccessor">The HTTP context accessor.</param>
    public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService<UserSession>
    {
        private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

        /// <inheritdoc/>
        public virtual UserSession GetCurrentUser()
        {
            var httpContext = _httpContextAccessor?.HttpContext;
            if (httpContext == null)
            {
                return new UserSession { IsAuthenticated = false };
            }

            var principal = httpContext.User;
            var isAuthenticated = principal?.Identity?.IsAuthenticated ?? false;

            if (!isAuthenticated)
            {
                return new UserSession { IsAuthenticated = false };
            }

            return new UserSession
            {
                IsAuthenticated = true,
                Id = principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
                FullName = principal?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value,
                Email = principal?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            };
        }
    }
}
