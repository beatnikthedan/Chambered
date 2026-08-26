namespace BeatnikToolKit.EntityFramework.Services.Identity
{
    /// <summary>
    /// Enforces the required security schema for any application consuming the authorization library.
    /// </summary>
    public interface IAuthorizationRulebook
    {
        /// <summary>
        /// The claim type key representing granular permissions (e.g., "permission").
        /// </summary>
        string PermissionClaimType { get; }
        /// <summary>
        /// The name of the global super-user bypass role (e.g., "Admin").
        /// </summary>
        string AdminRoleName { get; }
        /// <summary>
        /// The default role assigned to basic authenticated users (e.g., "User").
        /// </summary>
        string DefaultUserRoleName { get; }
        /// <summary>
        /// The complete list of system roles mapped to their default permission claims.
        /// Used for database seeding and dynamic policies.
        /// </summary>
        IReadOnlyDictionary<string, IEnumerable<string>> RoleClaimsMap { get; }
    }
}
