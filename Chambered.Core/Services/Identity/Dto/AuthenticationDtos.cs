namespace Chambered.Core.Services.Identity.Dto
{
    /// <summary>
    /// Data transfer object representing the login credentials of a user.
    /// </summary>
    public record LoginRequestDto(
        string Email,
        string Password,
        bool RememberMe
    );

    /// <summary>
    /// Data transfer object containing the result of a successful user authentication.
    /// </summary>
    public record AuthenticationResponseDto(
        string UserId,
        string Email,
        string AccessToken,
        string RefreshToken,
        int ExpiresInSeconds,
        IEnumerable<string> Roles,
        IEnumerable<string> Permissions,
        string? Username = null,
        string? GravatarUrl = null
    );

    /// <summary>
    /// Data transfer object containing the refresh token used to request a new access token.
    /// </summary>
    public record TokenRefreshRequestDto(
        string RefreshToken
    );

    /// <summary>
    /// Data transfer object containing the newly issued access and refresh tokens.
    /// </summary>
    public record TokenRefreshResponseDto(
        string AccessToken,
        string RefreshToken,
        int ExpiresInSeconds
    );

    /// <summary>
    /// Data transfer object representing a request to initiate a password reset.
    /// </summary>
    public record ForgotPasswordRequestDto(
        string Email
    );

    /// <summary>
    /// Data transfer object representing the credentials needed to reset a user's password using a verified token.
    /// </summary>
    public record ResetPasswordRequestDto(
        string Email,
        string Token,
        string NewPassword
    );

    /// <summary>
    /// Data transfer object representing a request to change an authenticated user's password.
    /// </summary>
    public record ChangePasswordRequestDto(
        string OldPassword,
        string NewPassword
    );
}
