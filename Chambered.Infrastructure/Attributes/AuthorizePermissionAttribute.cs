using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace Chambered.Infrastructure.Attributes
{
    /// <summary>
    /// Custom authorization attribute mapping Chambered permissions to dynamic claim policies under Cookies and API Key schemes.
    /// </summary>
    public class AuthorizePermissionAttribute : AuthorizeAttribute
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="AuthorizePermissionAttribute"/> class.
        /// </summary>
        /// <param name="permission">The permission constant from <see cref="ChamberedRulebook.Permissions"/>.</param>
        public AuthorizePermissionAttribute(string permission)
        {
            Policy = permission;
            AuthenticationSchemes = $"{IdentityConstants.ApplicationScheme},ApiKey";
        }
    }
}
