using System;
using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages.Identity
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the user account management service.
    /// </summary>
    public partial class IdentityServiceLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that user creation has been initiated.
        /// </summary>
        /// <param name="email">The email of the new user.</param>
        /// <param name="username">The username of the new user.</param>
        [LoggerMessage(EventId = 541, EventName = "UserCreationInitiated", Level = LogLevel.Information, Message = "User creation initiated: Email={Email}, Username={Username}")]
        public partial void CreationInitiated(string email, string username);

        /// <summary>
        /// Logs that user creation failed due to database or validation errors.
        /// </summary>
        /// <param name="email">The email.</param>
        /// <param name="errors">The details of the validation failures.</param>
        [LoggerMessage(EventId = 542, EventName = "UserCreationFailed", Level = LogLevel.Error, Message = "User creation failed: Email={Email}, Errors={Errors}")]
        public partial void CreationFailed(string email, string errors);

        /// <summary>
        /// Logs that an exception occurred while assigning roles during user creation.
        /// </summary>
        /// <param name="exception">The exception details.</param>
        /// <param name="email">The email.</param>
        [LoggerMessage(EventId = 543, EventName = "ExceptionAssigningRoles", Level = LogLevel.Error, Message = "Exception assigning roles during user creation: Email={Email}")]
        public partial void ExceptionAssigningRoles(Exception exception, string email);

        /// <summary>
        /// Logs that user creation succeeded.
        /// </summary>
        /// <param name="email">The email.</param>
        /// <param name="userId">The generated user ID.</param>
        [LoggerMessage(EventId = 544, EventName = "UserCreatedSuccessfully", Level = LogLevel.Information, Message = "User created successfully: Email={Email}, UserId={UserId}")]
        public partial void CreatedSuccessfully(string email, string userId);

        /// <summary>
        /// Logs that a user retrieval has been requested.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 545, EventName = "RetrievingUserById", Level = LogLevel.Information, Message = "Retrieving user by ID: UserId={UserId}")]
        public partial void RetrievingUserById(string userId);

        /// <summary>
        /// Logs that a bulk user query has been initiated.
        /// </summary>
        [LoggerMessage(EventId = 546, EventName = "BulkUserQueryInitiated", Level = LogLevel.Information, Message = "Bulk user query initiated")]
        public partial void BulkQueryInitiated();

        /// <summary>
        /// Logs that a bulk user query has completed successfully.
        /// </summary>
        /// <param name="count">The count of users returned.</param>
        [LoggerMessage(EventId = 547, EventName = "BulkUserQueryCompleted", Level = LogLevel.Information, Message = "Bulk user query completed: TotalUsers={Count}")]
        public partial void BulkQueryCompleted(int count);

        /// <summary>
        /// Logs that user account update has been initiated.
        /// </summary>
        /// <param name="email">The email.</param>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 548, EventName = "UserUpdateInitiated", Level = LogLevel.Information, Message = "User update initiated: Email={Email}, UserId={UserId}")]
        public partial void UpdateInitiated(string email, string userId);

        /// <summary>
        /// Logs that user account update completed successfully.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 549, EventName = "UserUpdateCompleted", Level = LogLevel.Information, Message = "User update completed: UserId={UserId}")]
        public partial void UpdateCompleted(string userId);

        /// <summary>
        /// Logs that user deletion has been initiated.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 550, EventName = "UserDeletionInitiated", Level = LogLevel.Information, Message = "User deletion initiated: UserId={UserId}")]
        public partial void DeletionInitiated(string userId);

        /// <summary>
        /// Logs that user deletion completed successfully.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        [LoggerMessage(EventId = 551, EventName = "UserDeletionCompleted", Level = LogLevel.Information, Message = "User deletion completed: UserId={UserId}")]
        public partial void DeletionCompleted(string userId);
    }
}
