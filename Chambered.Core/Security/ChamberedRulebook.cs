using BeatnikToolKit.EntityFramework.Services.Identity;

namespace Chambered.Core.Security
{
    /// <summary>
    /// Application-specific implementation of the authorization rulebook for Chambered.
    /// </summary>
    public class ChamberedRulebook : IAuthorizationRulebook
    {
        /// <summary>
        /// The standard permission claim type constant.
        /// </summary>
        public const string PermissionClaimTypeConstant = "permission";

        /// <summary>
        /// Global system roles.
        /// </summary>
        public static class Roles
        {
            /// <summary>
            /// The administrator role.
            /// </summary>
            public const string Admin = "Admin";

            /// <summary>
            /// The standard user role.
            /// </summary>
            public const string User = "User";
        }

        /// <summary>
        /// Granular permission claims for the system.
        /// </summary>
        public static class Permissions
        {
            /// <summary>
            /// Permission to view arsenals.
            /// </summary>
            public const string ArsenalView = "arsenal:view";

            /// <summary>
            /// Permission to create arsenals.
            /// </summary>
            public const string ArsenalCreate = "arsenal:create";

            /// <summary>
            /// Permission to edit arsenals.
            /// </summary>
            public const string ArsenalEdit = "arsenal:edit";

            /// <summary>
            /// Permission to create vaults.
            /// </summary>
            public const string VaultCreate = "vault:create";

            /// <summary>
            /// Permission to edit armory items.
            /// </summary>
            public const string ArmoryItemEdit = "armory:edit";
        }

        /// <summary>
        /// Static map of roles to their default granular permission claims.
        /// </summary>
        public static readonly IReadOnlyDictionary<string, IEnumerable<string>> RoleClaimsMapConstant = new Dictionary<string, IEnumerable<string>>
    {
        {
            Roles.Admin, new[]
            {
                Permissions.ArsenalView,
                Permissions.ArsenalCreate,
                Permissions.ArsenalEdit,
                Permissions.VaultCreate,
                Permissions.ArmoryItemEdit
            }
        },
        {
            Roles.User, new[]
            {
                Permissions.ArsenalView
            }
        }
    };

        /// <inheritdoc/>
        public string PermissionClaimType => PermissionClaimTypeConstant;

        /// <inheritdoc/>
        public string AdminRoleName => Roles.Admin;

        /// <inheritdoc/>
        public string DefaultUserRoleName => Roles.User;

        /// <inheritdoc/>
        public IReadOnlyDictionary<string, IEnumerable<string>> RoleClaimsMap => RoleClaimsMapConstant;
    }
}
