using Chambered.Core.Services.Identity;
using Microsoft.AspNetCore.Authorization;

namespace Chambered.Infrastructure.Authorization
{
    /// <summary>
    /// Evaluates the user principal claims against dynamic permission requirements with a global super-user bypass.
    /// </summary>
    /// <param name="rulebook">The authorization rulebook implementation.</param>
    public class PermissionAuthorizationHandler(IAuthorizationRulebook rulebook) : AuthorizationHandler<PermissionRequirement>
    {
        private readonly IAuthorizationRulebook _rulebook = rulebook;

        /// <inheritdoc/>
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            if (context.User.IsInRole(_rulebook.AdminRoleName))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            var hasPermission = context.User.HasClaim(c =>
                c.Type == _rulebook.PermissionClaimType &&
                c.Value == requirement.Permission);

            if (hasPermission)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
