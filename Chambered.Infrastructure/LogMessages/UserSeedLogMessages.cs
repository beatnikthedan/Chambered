using System;
using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the administrative user seeding process.
    /// </summary>
    public partial class UserSeedLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        [LoggerMessage(EventId = 211, EventName = "Missing Admin Credentials", Level = LogLevel.Warning, Message = "Admin seeding skipped: Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.")]
        public partial void MissingCredentials();

        [LoggerMessage(EventId = 212, EventName = "Admin User Not Found", Level = LogLevel.Information, Message = "Admin user {Email} not found. Creating...")]
        public partial void AdminNotFound(string email);

        [LoggerMessage(EventId = 213, EventName = "Creating Missing Role", Level = LogLevel.Information, Message = "Role {Role} not found during user seeding, creating it now.")]
        public partial void CreatingRole(string role);

        [LoggerMessage(EventId = 214, EventName = "Admin Seeding Success", Level = LogLevel.Information, Message = "Admin user {Email} created and assigned to {Role} role successfully.")]
        public partial void SeedingSuccess(string email, string role);

        [LoggerMessage(EventId = 215, EventName = "Role Assignment Error", Level = LogLevel.Error, Message = "User created but failed to assign to role {Role}: {Errors}")]
        public partial void RoleAssignmentError(string role, string errors);

        [LoggerMessage(EventId = 216, EventName = "User Creation Error", Level = LogLevel.Error, Message = "Failed to create admin user: {Errors}")]
        public partial void UserCreationError(string errors);

        [LoggerMessage(EventId = 217, EventName = "Admin Already Exists", Level = LogLevel.Debug, Message = "Admin user {Email} already exists. Skipping user creation.")]
        public partial void UserAlreadyExists(string email);
    }
}
