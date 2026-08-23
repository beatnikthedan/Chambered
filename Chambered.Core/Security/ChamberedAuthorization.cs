using System.Collections.Generic;

namespace Chambered.Core.Security
{
    /// <summary>
    /// Defines system-wide role names, granular claim permissions, and standard claim type constants.
    /// </summary>
    public static class ChamberedAuthorization
    {
        /// <summary>
        /// The standard custom claim type used for application permissions.
        /// </summary>
        public const string PermissionClaimType = "permission";

        /// <summary>
        /// Global system roles.
        /// </summary>
        public static class Roles
        {
            public const string Admin = "Admin";
            public const string User = "User";
        }

        /// <summary>
        /// Granular permission claims for the system.
        /// </summary>
        public static class Permissions
        {
            public const string ArsenalView = "arsenal:view";
            public const string ArsenalCreate = "arsenal:create";
            public const string ArsenalEdit = "arsenal:edit";
            public const string VaultCreate = "vault:create";
            public const string ArmoryItemEdit = "armory:edit";
        }

        /// <summary>
        /// Map of roles to their default granular permission claims.
        /// </summary>
        public static readonly IReadOnlyDictionary<string, IEnumerable<string>> RoleClaimsMap = new Dictionary<string, IEnumerable<string>>
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
    }
}
