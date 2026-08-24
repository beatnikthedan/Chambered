using Microsoft.Extensions.Logging;
using System;

namespace Chambered.Infrastructure.LogMessages
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the Entity Framework and database initialization extensions.
    /// </summary>
    public partial class EntityFrameworkExtensionsLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that database creation ensuring has started.
        /// </summary>
        /// <param name="contextName">The context type name.</param>
        [LoggerMessage(EventId = 201, EventName = "DatabaseCreation", Level = LogLevel.Information, Message = "Ensuring database exists and is created for {ContextName}")]
        public partial void DatabaseCreated(string contextName);

        /// <summary>
        /// Logs that database seeding routine is executing.
        /// </summary>
        /// <param name="contextName">The context type name.</param>
        [LoggerMessage(EventId = 202, EventName = "SeedingDatabase", Level = LogLevel.Information, Message = "Executing database seeding for {ContextName}")]
        public partial void SeedingDatabase(string contextName);

        /// <summary>
        /// Logs that database initialization completed successfully.
        /// </summary>
        /// <param name="contextName">The context type name.</param>
        [LoggerMessage(EventId = 203, EventName = "InitializationComplete", Level = LogLevel.Information, Message = "Database initialization completed successfully for {ContextName}")]
        public partial void InitializationComplete(string contextName);

        /// <summary>
        /// Logs that database initialization failed with an error.
        /// </summary>
        /// <param name="contextName">The context type name.</param>
        /// <param name="ex">The exception details.</param>
        [LoggerMessage(EventId = 204, EventName = "InitializationFailed", Level = LogLevel.Error, Message = "An error occurred during database initialization for {ContextName}")]
        public partial void InitializationFailed(string contextName, Exception ex);

        /// <summary>
        /// Logs that administrative user seeding was skipped due to missing credentials.
        /// </summary>
        [LoggerMessage(EventId = 211, EventName = "MissingAdminCredentials", Level = LogLevel.Warning, Message = "Admin seeding skipped: Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.")]
        public partial void MissingCredentials();

        /// <summary>
        /// Logs that the administrative user profile was not found.
        /// </summary>
        /// <param name="email">The email of the administrator.</param>
        [LoggerMessage(EventId = 212, EventName = "AdminUserNotFound", Level = LogLevel.Information, Message = "Admin user {Email} not found. Creating...")]
        public partial void AdminNotFound(string email);

        /// <summary>
        /// Logs that a system role is being created during user seeding.
        /// </summary>
        /// <param name="role">The role name.</param>
        [LoggerMessage(EventId = 213, EventName = "CreatingMissingRole", Level = LogLevel.Information, Message = "Role {Role} not found during user seeding, creating it now.")]
        public partial void CreatingRole(string role);

        /// <summary>
        /// Logs that administrative user seeding succeeded.
        /// </summary>
        /// <param name="email">The email.</param>
        /// <param name="role">The role.</param>
        [LoggerMessage(EventId = 214, EventName = "AdminSeedingSuccess", Level = LogLevel.Information, Message = "Admin user {Email} created and assigned to {Role} role successfully.")]
        public partial void SeedingSuccess(string email, string role);

        /// <summary>
        /// Logs that user role assignment failed.
        /// </summary>
        /// <param name="role">The role name.</param>
        /// <param name="errors">The details of the identity errors.</param>
        [LoggerMessage(EventId = 215, EventName = "RoleAssignmentError", Level = LogLevel.Error, Message = "User created but failed to assign to role {Role}: {Errors}")]
        public partial void RoleAssignmentError(string role, string errors);

        /// <summary>
        /// Logs that administrative user creation failed.
        /// </summary>
        /// <param name="errors">The details of the identity errors.</param>
        [LoggerMessage(EventId = 216, EventName = "UserCreationError", Level = LogLevel.Error, Message = "Failed to create admin user: {Errors}")]
        public partial void UserCreationError(string errors);

        /// <summary>
        /// Logs that the admin user already exists.
        /// </summary>
        /// <param name="email">The email of the administrator.</param>
        [LoggerMessage(EventId = 217, EventName = "AdminAlreadyExists", Level = LogLevel.Debug, Message = "Admin user {Email} already exists. Skipping user creation.")]
        public partial void UserAlreadyExists(string email);

        /// <summary>
        /// Logs that seeding of standard roles and permission claims has started.
        /// </summary>
        [LoggerMessage(EventId = 221, EventName = "SeedingIdentityDataStarted", Level = LogLevel.Information, Message = "Seeding standard roles and granular permission claims dynamically...")]
        public partial void SeedingIdentityDataStarted();

        /// <summary>
        /// Logs that a missing system role has been created.
        /// </summary>
        /// <param name="roleName">The name of the role.</param>
        [LoggerMessage(EventId = 222, EventName = "SeedingSystemRoleCreated", Level = LogLevel.Information, Message = "Creating missing system role: {RoleName}")]
        public partial void SystemRoleCreated(string roleName);

        /// <summary>
        /// Logs that a granular permission claim has been assigned to a system role.
        /// </summary>
        /// <param name="permission">The permission string.</param>
        /// <param name="roleName">The name of the role.</param>
        [LoggerMessage(EventId = 223, EventName = "SeedingPermissionAssigned", Level = LogLevel.Information, Message = "Assigning permission claim {Permission} to role {RoleName}")]
        public partial void PermissionAssigned(string permission, string roleName);
    }
}
