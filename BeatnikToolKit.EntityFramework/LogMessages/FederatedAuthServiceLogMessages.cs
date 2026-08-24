using Microsoft.Extensions.Logging;

namespace BeatnikToolKit.EntityFramework.LogMessages
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for federated OIDC authentication.
    /// </summary>
    public partial class FederatedAuthServiceLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that an SSO challenge was prepared.
        /// </summary>
        /// <param name="provider">The name of the OIDC provider.</param>
        /// <param name="redirectUri">The redirect URI.</param>
        [LoggerMessage(EventId = 251, EventName = "OidcChallengePrepared", Level = LogLevel.Information, Message = "SSO challenge prepared: Provider={Provider}, RedirectUri={RedirectUri}")]
        public partial void ChallengePrepared(string provider, string redirectUri);

        /// <summary>
        /// Logs raw user claims received from the identity provider at Debug level.
        /// </summary>
        /// <param name="provider">The OIDC provider name.</param>
        /// <param name="email">The email of the authenticated user.</param>
        /// <param name="claims">All user claims formatted as a key-value string.</param>
        [LoggerMessage(EventId = 252, EventName = "OidcClaimsReceived", Level = LogLevel.Debug, Message = "OIDC User Claims received from {Provider} for Email={Email}: {Claims}")]
        public partial void ClaimsReceived(string provider, string email, string claims);

        /// <summary>
        /// Logs that auto-provisioning of a new OIDC user failed.
        /// </summary>
        /// <param name="provider">The OIDC provider name.</param>
        /// <param name="errors">The details of the identity creation failures.</param>
        [LoggerMessage(EventId = 253, EventName = "OidcAutoProvisionFailed", Level = LogLevel.Error, Message = "SSO Callback failed: Provider={Provider}, Reason=Failed to auto-provision user account: {Errors}")]
        public partial void AutoProvisionFailed(string provider, string errors);

        /// <summary>
        /// Logs that linking OIDC credentials to the newly created account failed.
        /// </summary>
        /// <param name="provider">The OIDC provider.</param>
        [LoggerMessage(EventId = 254, EventName = "OidcCredentialLinkFailed", Level = LogLevel.Error, Message = "SSO Callback failed: Provider={Provider}, Reason=Failed to link external SSO credentials to auto-provisioned account.")]
        public partial void CredentialLinkFailed(string provider);

        /// <summary>
        /// Logs that a new SSO user was successfully provisioned.
        /// </summary>
        /// <param name="provider">The provider name.</param>
        /// <param name="email">The email.</param>
        /// <param name="userId">The generated user ID.</param>
        [LoggerMessage(EventId = 255, EventName = "OidcNewUserCreated", Level = LogLevel.Information, Message = "New SSO user created: Provider={Provider}, Email={Email}, UserId={UserId}")]
        public partial void NewUserCreated(string provider, string email, string userId);

        /// <summary>
        /// Logs that OIDC credential linking to an existing account failed.
        /// </summary>
        /// <param name="provider">The provider.</param>
        [LoggerMessage(EventId = 256, EventName = "OidcLinkExistingFailed", Level = LogLevel.Error, Message = "SSO Callback failed: Provider={Provider}, Reason=Failed to link external SSO credentials to existing account.")]
        public partial void LinkExistingFailed(string provider);

        /// <summary>
        /// Logs that an OIDC login account was successfully linked to a user.
        /// </summary>
        /// <param name="provider">The provider.</param>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 257, EventName = "OidcAccountLinked", Level = LogLevel.Information, Message = "SSO account linked successfully: Provider={Provider}, UserId={UserId}")]
        public partial void AccountLinked(string provider, string userId);

        /// <summary>
        /// Logs that SSO roles were successfully synchronized.
        /// </summary>
        /// <param name="email">The email of the synchronized user.</param>
        /// <param name="roles">The list of mapped roles.</param>
        [LoggerMessage(EventId = 258, EventName = "OidcRolesSynchronized", Level = LogLevel.Information, Message = "SSO Roles Synchronized: Email={Email}, MappedRoles={Roles}")]
        public partial void RolesSynchronized(string email, string roles);

        /// <summary>
        /// Logs that an incoming SSO group was skipped because it was not found in the explicit RoleMappings configuration.
        /// </summary>
        /// <param name="group">The skipped external group name.</param>
        [LoggerMessage(EventId = 259, EventName = "OidcGroupSkipped", Level = LogLevel.Information, Message = "SSO Group skipped (no explicit mapping found): {Group}")]
        public partial void GroupSkipped(string group);

        /// <summary>
        /// Logs that OIDC callback processed successfully.
        /// </summary>
        /// <param name="provider">The provider.</param>
        /// <param name="email">The user email.</param>
        [LoggerMessage(EventId = 260, EventName = "OidcLoginSuccess", Level = LogLevel.Information, Message = "SSO Callback processed successfully: Provider={Provider}, Email={Email}")]
        public partial void LoginSuccess(string provider, string email);

        /// <summary>
        /// Logs OIDC required claims missing error.
        /// </summary>
        /// <param name="provider">The OIDC provider.</param>
        [LoggerMessage(EventId = 261, EventName = "OidcRequiredClaimsMissing", Level = LogLevel.Error, Message = "SSO Callback failed: Provider={Provider}. Required claims (email, givenname, surname) missing from external metadata.")]
        public partial void RequiredClaimsMissing(string provider);

        /// <summary>
        /// Logs OIDC linking failure with error details.
        /// </summary>
        /// <param name="provider">The provider.</param>
        /// <param name="userId">The user ID.</param>
        /// <param name="errors">The details of the database failure.</param>
        [LoggerMessage(EventId = 262, EventName = "OidcLinkFailedWithErrors", Level = LogLevel.Error, Message = "SSO account linking failed: Provider={Provider}, User={UserId}, Errors={Errors}")]
        public partial void LinkFailedWithErrors(string provider, string userId, string errors);

        /// <summary>
        /// Logs that custom scope processing was started.
        /// </summary>
        /// <param name="scope">The scope name.</param>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 263, EventName = "OidcScopeProcessingStarted", Level = LogLevel.Information, Message = "Custom scope processing started: Scope={Scope}, UserId={UserId}")]
        public partial void ScopeProcessingStarted(string scope, string userId);

        /// <summary>
        /// Logs that custom scope processing completed successfully.
        /// </summary>
        /// <param name="scope">The scope name.</param>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 264, EventName = "OidcScopeProcessingCompleted", Level = LogLevel.Information, Message = "Custom scope processing completed successfully: Scope={Scope}, UserId={UserId}")]
        public partial void ScopeProcessingCompleted(string scope, string userId);

        /// <summary>
        /// Logs that custom scope processing failed with an error.
        /// </summary>
        /// <param name="scope">The scope name.</param>
        /// <param name="userId">The user ID.</param>
        /// <param name="error">The exception error details.</param>
        [LoggerMessage(EventId = 265, EventName = "OidcScopeProcessingFailed", Level = LogLevel.Error, Message = "Custom scope processing failed: Scope={Scope}, UserId={UserId}, Error={Error}")]
        public partial void ScopeProcessingFailed(string scope, string userId, string error);
    }

}