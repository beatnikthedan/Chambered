using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace BeatnikToolKit.EntityFramework.Services
{
    /// <summary>
    /// Provides access to details of the currently authenticated user extracted directly from the HTTP context's <see cref="ClaimsPrincipal"/>.
    /// </summary>
    /// <typeparam name="TUser">The identity user type inheriting from <see cref="IdentityUser"/> with a parameterless constructor.</typeparam>
    /// <param name="httpContextAccessor">The accessor used to gain access to the current <see cref="HttpContext"/>.</param>
    /// <param name="options">The configuration options for customizing claim mapping onto the user object.</param>
    public class CurrentUserService<TUser>(
        IHttpContextAccessor httpContextAccessor,
        IOptions<CurrentUserServiceOptions<TUser>> options) : ICurrentUserService<TUser> where TUser : IdentityUser, new()
    {
        private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
        private readonly CurrentUserServiceOptions<TUser> _options = options.Value;

        /// <summary>
        /// Constructs and returns a <typeparamref name="TUser"/> instance populated with properties extracted from the current user's claims.
        /// </summary>
        /// <returns>
        /// A <typeparamref name="TUser"/> object populated with standard claims (<see cref="ClaimTypes.NameIdentifier"/>, <see cref="ClaimTypes.Email"/>, and <see cref="ClaimTypes.Name"/>) 
        /// as well as any custom claims configured via <see cref="CurrentUserServiceOptions{TUser}.MapCustomClaims"/>. 
        /// Returns a new, unpopulated <typeparamref name="TUser"/> instance if the current user is unauthenticated or no HTTP context is available.
        /// </returns>
        public TUser GetCurrentUser()
        {
            var httpContext = _httpContextAccessor?.HttpContext;
            var principal = httpContext?.User;
            var isAuthenticated = principal?.Identity?.IsAuthenticated ?? false;

            if (!isAuthenticated)
            {
                return new TUser();
            }

            var user = new TUser
            {
                Id = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                Email = principal.FindFirst(ClaimTypes.Email)?.Value,
                UserName = principal.FindFirst(ClaimTypes.Name)?.Value
            };

            _options.MapCustomClaims?.Invoke(principal, user);

            return user;
        }
    }

    /// <summary>
    /// Configuration options for <see cref="CurrentUserService{TUser}"/>.
    /// </summary>
    /// <typeparam name="TUser">The identity user type inheriting from <see cref="IdentityUser"/> with a parameterless constructor.</typeparam>
    public class CurrentUserServiceOptions<TUser> where TUser : IdentityUser, new()
    {
        /// <summary>
        /// Gets or sets an optional delegate to map custom/derived claims onto the user object.
        /// </summary>
        public Action<ClaimsPrincipal, TUser>? MapCustomClaims { get; set; }
    }
}
