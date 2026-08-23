using System.Threading.Tasks;
using Chambered.Core.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Chambered.Infrastructure.Authorization
{
    /// <summary>
    /// Dynamically generates authorization policies on-demand, eliminating manual registrations.
    /// </summary>
    public class PermissionPolicyProvider : IAuthorizationPolicyProvider
    {
        private readonly DefaultAuthorizationPolicyProvider _backupProvider;

        /// <summary>
        /// Initializes a new instance of the <see cref="PermissionPolicyProvider"/> class.
        /// </summary>
        public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
        {
            _backupProvider = new DefaultAuthorizationPolicyProvider(options);
        }

        /// <inheritdoc />
        public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            var schemes = new[] { Microsoft.AspNetCore.Identity.IdentityConstants.ApplicationScheme, "ApiKey" };

            // Handle explicit requests for the Admin-only policy
            if (policyName == ChamberedAuthorization.Roles.Admin)
            {
                var adminPolicy = new AuthorizationPolicyBuilder(schemes)
                    .RequireRole(ChamberedAuthorization.Roles.Admin)
                    .Build();

                return Task.FromResult<AuthorizationPolicy?>(adminPolicy);
            }

            // Dynamically generate policies based on permission claims
            var permissionPolicy = new AuthorizationPolicyBuilder(schemes)
                .AddRequirements(new PermissionRequirement(policyName))
                .Build();

            return Task.FromResult<AuthorizationPolicy?>(permissionPolicy);
        }

        /// <inheritdoc />
        public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => _backupProvider.GetDefaultPolicyAsync();

        /// <inheritdoc />
        public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => _backupProvider.GetFallbackPolicyAsync();
    }
}
