using System;
using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages
{
    /// <summary>
    /// High-performance compile-time logging methods for the background backup scheduling worker.
    /// </summary>
    public partial class BackupSchedulerLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that the backup scheduler background worker has been initialized.
        /// </summary>
        [LoggerMessage(EventId = 301, EventName = "WorkerInitialized", Level = LogLevel.Information, Message = "Backup Scheduler Background Worker initialized.")]
        public partial void WorkerInitialized();

        /// <summary>
        /// Logs that automated backups are currently disabled.
        /// </summary>
        [LoggerMessage(EventId = 302, EventName = "BackupsDisabled", Level = LogLevel.Debug, Message = "Automated backups are currently disabled. Re-checking in 1 minute...")]
        public partial void BackupsDisabled();

        /// <summary>
        /// Logs that an invalid CRON expression was configured.
        /// </summary>
        /// <param name="cron">The invalid CRON schedule string.</param>
        /// <param name="ex">The parsing exception details.</param>
        [LoggerMessage(EventId = 303, EventName = "InvalidCronExpression", Level = LogLevel.Error, Message = "Invalid CRON expression '{Cron}'. Worker will retry in 5 minutes.")]
        public partial void InvalidCronExpression(string cron, Exception ex);

        /// <summary>
        /// Logs that no future occurrences were found for the configured CRON schedule.
        /// </summary>
        /// <param name="cron">The CRON schedule string.</param>
        [LoggerMessage(EventId = 304, EventName = "NoCronOccurrences", Level = LogLevel.Warning, Message = "No future occurrences found for CRON expression '{Cron}'. Sleeping for 1 hour.")]
        public partial void NoCronOccurrences(string cron);

        /// <summary>
        /// Logs the timestamp and delay for the next scheduled backup run.
        /// </summary>
        /// <param name="nextRun">The UTC timestamp of the next occurrence.</param>
        /// <param name="delayMinutes">The total delay in minutes before execution.</param>
        [LoggerMessage(EventId = 305, EventName = "BackupScheduled", Level = LogLevel.Information, Message = "Next backup scheduled for UTC: {NextRun} (in {DelayMinutes:F1} minutes)")]
        public partial void BackupScheduled(DateTime nextRun, double delayMinutes);

        /// <summary>
        /// Logs that a scheduled backup job has been triggered.
        /// </summary>
        [LoggerMessage(EventId = 306, EventName = "TriggeringBackupJob", Level = LogLevel.Information, Message = "Triggering scheduled backup job...")]
        public partial void TriggeringBackupJob();

        /// <summary>
        /// Logs that a scheduled backup job completed successfully.
        /// </summary>
        /// <param name="path">The file path where the backup was stored.</param>
        /// <param name="size">The size of the backup file in bytes.</param>
        [LoggerMessage(EventId = 307, EventName = "BackupSuccess", Level = LogLevel.Information, Message = "Backup created successfully at {Path} ({Size} bytes).")]
        public partial void BackupSuccess(string path, long size);

        /// <summary>
        /// Logs that old backup files were purged according to the retention policy.
        /// </summary>
        /// <param name="count">The total number of deleted backup files.</param>
        [LoggerMessage(EventId = 308, EventName = "RetentionPolicyPurge", Level = LogLevel.Information, Message = "Retention policy purged {Count} old backup files.")]
        public partial void RetentionPolicyPurge(int count);

        /// <summary>
        /// Logs that a scheduled backup job execution failed.
        /// </summary>
        /// <param name="ex">The execution exception details.</param>
        [LoggerMessage(EventId = 309, EventName = "BackupJobFailed", Level = LogLevel.Error, Message = "An error occurred while executing scheduled backup.")]
        public partial void BackupJobFailed(Exception ex);
    }
}
