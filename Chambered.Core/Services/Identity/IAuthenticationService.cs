using Chambered.Core.Services.Identity.Dto;

namespace Chambered.Core.Services.Identity
{
    /// <summary>
    /// Service contract for handling user session lifecycles, JWT token generations, 
    /// credentials validation, and self-service password cycles.
    /// </summary>
    public interface IAuthenticationService
    {
        /// <summary>
        /// Authenticates user credentials and returns a JSON Web Token (JWT) along with refresh token and claims.
        /// </summary>
        Task<AuthenticationResponseDto> LoginAsync(LoginRequestDto request);

        /// <summary>
        /// Revokes the current session and token context for the specified user.
        /// </summary>
        Task LogoutAsync(string userId);

        /// <summary>
        /// Generates a new access token using a cryptographically secure refresh token.
        /// </summary>
        Task<TokenRefreshResponseDto> RefreshTokenAsync(TokenRefreshRequestDto request);

        /// <summary>
        /// Initiates a self-service password reset workflow, generating and sending a token via an configured channel.
        /// </summary>
        Task InitiateForgotPasswordAsync(ForgotPasswordRequestDto request);

        /// <summary>
        /// Resets a user's password using a verified email reset token.
        /// </summary>
        Task ResetPasswordAsync(ResetPasswordRequestDto request);

        /// <summary>
        /// Performs self-service validation of a user's password.
        /// </summary>
        Task<bool> VerifyPasswordAsync(string userId, string password);

        /// <summary>
        /// Updates an authenticated user's password.
        /// </summary>
        Task ChangePasswordAsync(string userId, ChangePasswordRequestDto request);

        /// <summary>
        /// Checks whether the system has been initialized with at least one user account.
        /// </summary>
        Task<bool> IsInitializedAsync();
    }
}
