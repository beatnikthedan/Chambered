using System;
using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages.Identity
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the API key management service.
    /// </summary>
    public partial class ApiKeyServiceLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that API key creation has been initiated.
        /// </summary>
        /// <param name="name">The name of the API key.</param>
        /// <param name="userId">The target user ID.</param>
        /// <param name="creatorId">The creator ID.</param>
        [LoggerMessage(EventId = 501, EventName = "ApiKeyCreationInitiated", Level = LogLevel.Information, Message = "API Key creation initiated: Name={Name}, User={UserId}, Creator={CreatorId}")]
        public partial void CreationInitiated(string name, string userId, string creatorId);

        /// <summary>
        /// Logs that an unauthorized key permissions delegation occurred.
        /// </summary>
        /// <param name="creatorId">The creator ID.</param>
        /// <param name="permission">The unauthorized permission requested.</param>
        /// <param name="name">The name of the key.</param>
        [LoggerMessage(EventId = 502, EventName = "UnauthorizedDelegation", Level = LogLevel.Warning, Message = "Unauthorized key permissions delegation: Creator={CreatorId} requested permission={Permission} on key={Name}")]
        public partial void UnauthorizedDelegation(string creatorId, string permission, string name);

        /// <summary>
        /// Logs that an API key has been created successfully.
        /// </summary>
        /// <param name="name">The name of the key.</param>
        /// <param name="keyId">The ID of the key.</param>
        /// <param name="ownerId">The owner user ID.</param>
        [LoggerMessage(EventId = 503, EventName = "ApiKeyCreated", Level = LogLevel.Information, Message = "API Key created successfully: Name={Name}, KeyId={KeyId}, Owner={OwnerId}")]
        public partial void KeyCreated(string name, int keyId, string ownerId);

        /// <summary>
        /// Logs that API keys are being retrieved for a user.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 504, EventName = "RetrievingKeys", Level = LogLevel.Information, Message = "Retrieving API keys for user: User={UserId}")]
        public partial void RetrievingKeys(string userId);

        /// <summary>
        /// Logs that all system API keys are being retrieved by an administrator.
        /// </summary>
        /// <param name="adminId">The admin user ID.</param>
        [LoggerMessage(EventId = 505, EventName = "RetrievingAllKeys", Level = LogLevel.Information, Message = "Retrieving all active system API keys: Admin={AdminId}")]
        public partial void RetrievingAllKeys(string adminId);

        /// <summary>
        /// Logs that API key revocation has been requested.
        /// </summary>
        /// <param name="userId">The user ID requesting revocation.</param>
        /// <param name="keyId">The key ID.</param>
        [LoggerMessage(EventId = 506, EventName = "RevocationRequested", Level = LogLevel.Information, Message = "API Key revocation requested: User={UserId}, KeyId={KeyId}")]
        public partial void RevocationRequested(string userId, string keyId);

        /// <summary>
        /// Logs that a revocation request was made for an already revoked key.
        /// </summary>
        /// <param name="keyId">The key ID.</param>
        [LoggerMessage(EventId = 507, EventName = "AlreadyRevoked", Level = LogLevel.Warning, Message = "API Key already revoked: KeyId={KeyId}")]
        public partial void AlreadyRevoked(string keyId);

        /// <summary>
        /// Logs that an API key was successfully revoked.
        /// </summary>
        /// <param name="keyId">The key ID.</param>
        [LoggerMessage(EventId = 508, EventName = "RevocationSuccess", Level = LogLevel.Information, Message = "API Key revoked successfully: KeyId={KeyId}")]
        public partial void RevocationSuccess(string keyId);
    }
}
