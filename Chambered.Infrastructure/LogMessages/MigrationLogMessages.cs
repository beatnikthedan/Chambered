using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the database setup process.
    /// </summary>
    public partial class MigrationLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        [LoggerMessage(EventId = 201, EventName = "Database Creation", Level = LogLevel.Information, Message = "Ensuring database exists and is created for {ContextName}")]
        public partial void DatabaseCreated(string contextName);

        [LoggerMessage(EventId = 202, EventName = "Seeding Database", Level = LogLevel.Information, Message = "Executing database seeding for {ContextName}")]
        public partial void SeedingDatabase(string contextName);

        [LoggerMessage(EventId = 203, EventName = "Initialization Complete", Level = LogLevel.Information, Message = "Database initialization completed successfully for {ContextName}")]
        public partial void InitializationComplete(string contextName);

        [LoggerMessage(EventId = 204, EventName = "Initialization Failed", Level = LogLevel.Error, Message = "An error occurred during database initialization for {ContextName}")]
        public partial void InitializationFailed(string contextName, Exception ex);
    }
}
