using System.Threading.Tasks;
using Chambered.Core.Security;
using Microsoft.AspNetCore.Authorization;

namespace Chambered.Infrastructure.Authorization
{
    /// <summary>
    /// Evaluates the user principal claims against dynamic permission requirements with a global Admin role bypass.
    /// </summary>
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        /// <inheritdoc />
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            // Global Bypass: Admins possess all privileges
            if (context.User.IsInRole(ChamberedAuthorization.Roles.Admin))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            // Evaluate specific permission claims
            var hasPermission = context.User.HasClaim(c => c.Type == ChamberedAuthorization.PermissionClaimType && c.Value == requirement.Permission);
            if (hasPermission)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
