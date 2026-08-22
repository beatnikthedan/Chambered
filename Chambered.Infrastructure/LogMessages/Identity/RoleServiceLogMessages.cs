using System;
using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages.Identity
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the role management service.
    /// </summary>
    public partial class RoleServiceLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that role creation was initiated.
        /// </summary>
        /// <param name="roleName">The name of the role.</param>
        [LoggerMessage(EventId = 561, EventName = "RoleCreationInitiated", Level = LogLevel.Information, Message = "Role creation initiated: RoleName={RoleName}")]
        public partial void CreationInitiated(string roleName);

        /// <summary>
        /// Logs that a role was successfully created.
        /// </summary>
        /// <param name="roleName">The role name.</param>
        [LoggerMessage(EventId = 562, EventName = "RoleCreatedSuccessfully", Level = LogLevel.Information, Message = "Role created successfully: RoleName={RoleName}")]
        public partial void CreatedSuccessfully(string roleName);

        /// <summary>
        /// Logs that role deletion was initiated.
        /// </summary>
        /// <param name="roleName">The role name.</param>
        [LoggerMessage(EventId = 563, EventName = "RoleDeletionInitiated", Level = LogLevel.Information, Message = "Role deletion initiated: RoleName={RoleName}")]
        public partial void DeletionInitiated(string roleName);

        /// <summary>
        /// Logs that a role was successfully deleted.
        /// </summary>
        /// <param name="roleName">The role name.</param>
        [LoggerMessage(EventId = 564, EventName = "RoleDeletedSuccessfully", Level = LogLevel.Information, Message = "Role deleted successfully: RoleName={RoleName}")]
        public partial void DeletedSuccessfully(string roleName);

        /// <summary>
        /// Logs that claims synchronization to a role has been initiated.
        /// </summary>
        /// <param name="roleName">The role name.</param>
        [LoggerMessage(EventId = 565, EventName = "SyncingClaimsToRole", Level = LogLevel.Information, Message = "Syncing claims to role: RoleName={RoleName}")]
        public partial void SyncingClaimsToRole(string roleName);

        /// <summary>
        /// Logs that role claims were successfully synchronized.
        /// </summary>
        /// <param name="roleName">The role name.</param>
        /// <param name="addedCount">The number of claims added.</param>
        /// <param name="removedCount">The number of claims removed.</param>
        [LoggerMessage(EventId = 566, EventName = "RoleClaimsSynchronized", Level = LogLevel.Information, Message = "Role claims synchronized: RoleName={RoleName}, Added={AddedCount}, Removed={RemovedCount}")]
        public partial void RoleClaimsSynchronized(string roleName, int addedCount, int removedCount);
    }
}
