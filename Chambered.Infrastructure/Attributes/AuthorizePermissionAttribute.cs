using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Chambered.Infrastructure.Attributes
{
    /// <summary>
    /// Custom authorization attribute mapping Chambered permissions to dynamic claim policies under JWT and API Key schemes.
    /// </summary>
    public class AuthorizePermissionAttribute : AuthorizeAttribute
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="AuthorizePermissionAttribute"/> class.
        /// </summary>
        /// <param name="permission">The permission constant from <see cref="Chambered.Core.Security.ChamberedAuthorization.Permissions"/>.</param>
        public AuthorizePermissionAttribute(string permission)
        {
            Policy = permission;
            AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},ApiKey";
        }
    }
}
