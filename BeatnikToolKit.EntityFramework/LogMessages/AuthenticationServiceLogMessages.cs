using Microsoft.Extensions.Logging;

namespace BeatnikToolKit.EntityFramework.LogMessages
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the user authentication service.
    /// </summary>
    public partial class AuthenticationServiceLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that a login attempt was initiated.
        /// </summary>
        /// <param name="email">The email of the attempting user.</param>
        [LoggerMessage(EventId = 521, EventName = "LoginAttempted", Level = LogLevel.Information, Message = "Login attempt initiated: Email={Email}")]
        public partial void LoginAttempted(string email);

        /// <summary>
        /// Logs that a login failed because the user was not found.
        /// </summary>
        /// <param name="email">The email of the attempting user.</param>
        [LoggerMessage(EventId = 522, EventName = "LoginFailureUserNotFound", Level = LogLevel.Warning, Message = "Login failure: Email={Email}, Reason=User not found")]
        public partial void LoginFailureUserNotFound(string email);

        /// <summary>
        /// Logs that a login failed due to an incorrect password.
        /// </summary>
        /// <param name="email">The email of the attempting user.</param>
        [LoggerMessage(EventId = 523, EventName = "LoginFailureIncorrectPassword", Level = LogLevel.Warning, Message = "Login failure: Email={Email}, Reason=Incorrect password")]
        public partial void LoginFailureIncorrectPassword(string email);

        /// <summary>
        /// Logs that the sole setup user account was successfully promoted to Admin.
        /// </summary>
        /// <param name="userId">The ID of the promoted user.</param>
        [LoggerMessage(EventId = 524, EventName = "PromotedSetupUserToAdmin", Level = LogLevel.Information, Message = "Successfully promoted the sole setup user account to Admin: UserId={UserId}")]
        public partial void PromotedSetupUserToAdmin(string userId);

        /// <summary>
        /// Logs that a login was successful.
        /// </summary>
        /// <param name="email">The email of the user.</param>
        /// <param name="userId">The ID of the user.</param>
        [LoggerMessage(EventId = 525, EventName = "LoginSuccess", Level = LogLevel.Information, Message = "Login success: Email={Email}, UserId={UserId}")]
        public partial void LoginSuccess(string email, string userId);

        /// <summary>
        /// Logs that a logout was requested.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 526, EventName = "LogoutRequested", Level = LogLevel.Information, Message = "Logout requested: UserId={UserId}")]
        public partial void LogoutRequested(string userId);

        /// <summary>
        /// Logs that forgot password process was initiated.
        /// </summary>
        /// <param name="email">The user email.</param>
        [LoggerMessage(EventId = 527, EventName = "ForgotPasswordInitiated", Level = LogLevel.Information, Message = "Forgot password initiated: Email={Email}")]
        public partial void ForgotPasswordInitiated(string email);

        /// <summary>
        /// Logs that forgot password was requested for a non-existent email address.
        /// </summary>
        /// <param name="email">The email.</param>
        [LoggerMessage(EventId = 528, EventName = "ForgotPasswordNonExistentEmail", Level = LogLevel.Warning, Message = "Forgot password requested for non-existent email: Email={Email}")]
        public partial void ForgotPasswordNonExistentEmail(string email);

        /// <summary>
        /// Logs that forgot password email delivery failed.
        /// </summary>
        /// <param name="email">The email.</param>
        [LoggerMessage(EventId = 529, EventName = "ForgotPasswordEmailFailed", Level = LogLevel.Error, Message = "Forgot password email delivery failed: Email={Email}")]
        public partial void ForgotPasswordEmailFailed(string email);

        /// <summary>
        /// Logs that password reset failed because the user was not found.
        /// </summary>
        /// <param name="email">The email.</param>
        [LoggerMessage(EventId = 530, EventName = "PasswordResetFailureUserNotFound", Level = LogLevel.Warning, Message = "Password reset failed: Email={Email}, Reason=User not found")]
        public partial void PasswordResetFailureUserNotFound(string email);

        /// <summary>
        /// Logs that password reset failed due to validation or process errors.
        /// </summary>
        /// <param name="email">The email.</param>
        /// <param name="errors">The detailed error messages.</param>
        [LoggerMessage(EventId = 531, EventName = "PasswordResetFailed", Level = LogLevel.Error, Message = "Password reset failed: Email={Email}, Errors={Errors}")]
        public partial void PasswordResetFailed(string email, string errors);

        /// <summary>
        /// Logs that a password reset completed successfully.
        /// </summary>
        /// <param name="email">The email.</param>
        [LoggerMessage(EventId = 532, EventName = "PasswordResetSuccess", Level = LogLevel.Information, Message = "Password reset success: Email={Email}")]
        public partial void PasswordResetSuccess(string email);

        /// <summary>
        /// Logs that a password change failed because the user was not found.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 533, EventName = "PasswordChangeFailureUserNotFound", Level = LogLevel.Warning, Message = "Password change failed: UserId={UserId}, Reason=User not found")]
        public partial void PasswordChangeFailureUserNotFound(string userId);

        /// <summary>
        /// Logs that a password change failed due to validation errors.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        /// <param name="errors">The errors list.</param>
        [LoggerMessage(EventId = 534, EventName = "PasswordChangeFailed", Level = LogLevel.Error, Message = "Password change failed: UserId={UserId}, Errors={Errors}")]
        public partial void PasswordChangeFailed(string userId, string errors);

        /// <summary>
        /// Logs that a password change completed successfully.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 535, EventName = "PasswordChangeSuccess", Level = LogLevel.Information, Message = "Password change success: UserId={UserId}")]
        public partial void PasswordChangeSuccess(string userId);
    }
}
