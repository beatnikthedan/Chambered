using Chambered.Core.Services.Identity.Dto;

namespace Chambered.Core.Services.Identity
{
    /// <summary>
    /// Service contract for administrative user account operations.
    /// </summary>
    public interface IIdentityService
    {
        /// <summary>
        /// Registers a new user in the system with associated roles.
        /// </summary>
        Task<UserResponseDto> CreateUserAsync(CreateUserRequestDto request);

        /// <summary>
        /// Retrieves detailed information about a user profile by ID.
        /// </summary>
        Task<UserResponseDto> GetUserByIdAsync(string id);

        /// <summary>
        /// Retrieves all registered users in the system, optimized to eager-load roles.
        /// </summary>
        Task<IEnumerable<UserResponseDto>> GetAllUsersAsync();

        /// <summary>
        /// Updates a user account's profile details.
        /// </summary>
        Task UpdateUserAsync(string id, UpdateUserRequestDto request);

        /// <summary>
        /// Deletes a user profile.
        /// </summary>
        Task DeleteUserAsync(string id);
    }
}
