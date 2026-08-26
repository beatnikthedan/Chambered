using BeatnikToolKit.EntityFramework.Services.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Chambered.Infrastructure.Authorization
{
    /// <summary>
    /// Dynamically generates authorization policies on-demand, eliminating manual registrations.
    /// </summary>
    /// <param name="options">The authorization options from the framework context.</param>
    /// <param name="rulebook">The registered authorization rulebook.</param>
    public class PermissionPolicyProvider(
        IOptions<AuthorizationOptions> options,
        IAuthorizationRulebook rulebook) : IAuthorizationPolicyProvider
    {
        private readonly DefaultAuthorizationPolicyProvider _backupProvider = new DefaultAuthorizationPolicyProvider(options);
        private readonly IAuthorizationRulebook _rulebook = rulebook;

        /// <inheritdoc/>
        public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            var schemes = new[] { IdentityConstants.ApplicationScheme, "ApiKey" };

            if (policyName == _rulebook.AdminRoleName)
            {
                var adminPolicy = new AuthorizationPolicyBuilder(schemes)
                    .RequireRole(_rulebook.AdminRoleName)
                    .Build();

                return Task.FromResult<AuthorizationPolicy?>(adminPolicy);
            }

            var permissionPolicy = new AuthorizationPolicyBuilder(schemes)
                .AddRequirements(new PermissionRequirement(policyName))
                .Build();

            return Task.FromResult<AuthorizationPolicy?>(permissionPolicy);
        }

        /// <inheritdoc/>
        public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => _backupProvider.GetDefaultPolicyAsync();

        /// <inheritdoc/>
        public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => _backupProvider.GetFallbackPolicyAsync();
    }
}
