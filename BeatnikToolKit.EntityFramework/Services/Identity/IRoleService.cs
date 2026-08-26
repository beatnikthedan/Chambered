using BeatnikToolKit.EntityFramework.Services.Identity.Dto;

namespace BeatnikToolKit.EntityFramework.Services.Identity
{
    /// <summary>
    /// Service contract for handling system roles and associated security permissions.
    /// </summary>
    public interface IRoleService
    {
        /// <summary>
        /// Registers a new security role in the system.
        /// </summary>
        Task CreateRoleAsync(string roleName);

        /// <summary>
        /// Deletes a security role if it has no active user assignments.
        /// </summary>
        Task DeleteRoleAsync(string roleName);

        /// <summary>
        /// Retrieves all security roles registered in the system along with their active permissions.
        /// </summary>
        Task<IEnumerable<RoleResponseDto>> GetAllRolesAsync();

        /// <summary>
        /// Retrieves the list of active functional permission claims assigned to a specific role.
        /// </summary>
        Task<IEnumerable<string>> GetClaimsForRoleAsync(string roleName);

        /// <summary>
        /// Synchronizes permission claims to a role atomically.
        /// </summary>
        Task SyncClaimsToRoleAsync(string roleName, IEnumerable<string> permissions);

        /// <summary>
        /// Retrieves all possible functional permissions defined in the system.
        /// </summary>
        Task<IEnumerable<string>> GetAllSystemPermissionsAsync();
    }
}
