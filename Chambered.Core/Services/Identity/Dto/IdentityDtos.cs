using System.Collections.Generic;

namespace Chambered.Core.Services.Identity.Dto
{
    /// <summary>
    /// Data transfer object used for creating a new user account administratively.
    /// </summary>
    public record CreateUserRequestDto(
        string Email,
        IEnumerable<string> Roles,
        string? Password = null,
        string? Username = null
    );

    /// <summary>
    /// Data transfer object used for modifying an existing user account.
    /// </summary>
    public record UpdateUserRequestDto(
        string Email,
        IEnumerable<string> Roles,
        string? Password = null
    );

    /// <summary>
    /// Data transfer object representing a detailed user account view.
    /// </summary>
    public record UserResponseDto(
        string Id,
        string Email,
        IEnumerable<string> Roles,
        string? Username = null,
        string? GravatarUrl = null
    );

    /// <summary>
    /// Data transfer object representing a security role in the system.
    /// </summary>
    public record RoleResponseDto(
        string RoleName,
        IEnumerable<string> AssignedPermissions
    );
}
