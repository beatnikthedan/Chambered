using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages
{
    /// <summary>
    /// Shared high-performance compile-time logging methods for SQLite and PostgreSQL database backup providers.
    /// </summary>
    public partial class BackupServiceLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that a download request was received for a non-existent backup file.
        /// </summary>
        /// <param name="fileName">The target backup file name.</param>
        [LoggerMessage(EventId = 401, EventName = "DownloadRequestedNonExistent", Level = LogLevel.Warning, Message = "Download requested for non-existent backup file: {FileName}")]
        public partial void DownloadRequestedNonExistent(string fileName);

        /// <summary>
        /// Logs that a backup file is being uploaded.
        /// </summary>
        /// <param name="originalName">The original name of the uploaded file.</param>
        /// <param name="safeFileName">The safe timestamp-stamped destination name.</param>
        [LoggerMessage(EventId = 402, EventName = "UploadingBackupFile", Level = LogLevel.Information, Message = "Uploading backup file {OriginalName} as {SafeFileName}")]
        public partial void UploadingBackupFile(string originalName, string safeFileName);

        /// <summary>
        /// Logs that a delete request was received for a non-existent backup file.
        /// </summary>
        /// <param name="fileName">The target backup file name.</param>
        [LoggerMessage(EventId = 403, EventName = "DeleteRequestedNonExistent", Level = LogLevel.Warning, Message = "Delete requested for non-existent backup file: {FileName}")]
        public partial void DeleteRequestedNonExistent(string fileName);

        /// <summary>
        /// Logs that a backup file was successfully deleted.
        /// </summary>
        /// <param name="fileName">The deleted backup file name.</param>
        [LoggerMessage(EventId = 404, EventName = "SuccessfullyDeletedBackup", Level = LogLevel.Information, Message = "Successfully deleted backup file: {FileName}")]
        public partial void SuccessfullyDeletedBackup(string fileName);

        /// <summary>
        /// Logs that a backup file deletion failed.
        /// </summary>
        /// <param name="fileName">The target backup file name.</param>
        /// <param name="ex">The deletion exception details.</param>
        [LoggerMessage(EventId = 405, EventName = "FailedToDeleteBackup", Level = LogLevel.Error, Message = "Failed to delete backup file: {FileName}")]
        public partial void FailedToDeleteBackup(string fileName, Exception ex);

        /// <summary>
        /// Logs that an old backup file was deleted to enforce the retention policy.
        /// </summary>
        /// <param name="fileName">The deleted old backup file name.</param>
        [LoggerMessage(EventId = 406, EventName = "EnforcedRetentionDeletedFile", Level = LogLevel.Information, Message = "Enforced retention policy: deleted old backup {FileName}")]
        public partial void EnforcedRetentionDeletedFile(string fileName);

        /// <summary>
        /// Logs that old backup deletion failed during retention policy enforcement.
        /// </summary>
        /// <param name="fileName">The target backup file name.</param>
        /// <param name="ex">The purging exception details.</param>
        [LoggerMessage(EventId = 407, EventName = "FailedToEnforceRetention", Level = LogLevel.Error, Message = "Failed to enforce retention policy on file {FileName}")]
        public partial void FailedToEnforceRetention(string fileName, Exception ex);

        /// <summary>
        /// Logs that an online SQLite backup has been initiated.
        /// </summary>
        /// <param name="backupPath">The target backup file path.</param>
        [LoggerMessage(EventId = 408, EventName = "StartingSqliteBackup", Level = LogLevel.Information, Message = "Starting SQLite online database backup to path: {BackupPath}")]
        public partial void StartingSqliteBackup(string backupPath);

        /// <summary>
        /// Logs that an online SQLite backup completed successfully.
        /// </summary>
        /// <param name="duration">The total duration in milliseconds.</param>
        /// <param name="size">The size of the generated file in bytes.</param>
        [LoggerMessage(EventId = 409, EventName = "SqliteBackupCompleted", Level = LogLevel.Information, Message = "SQLite backup successfully completed in {Duration} ms. Size: {Size} bytes.")]
        public partial void SqliteBackupCompleted(double duration, long size);

        /// <summary>
        /// Logs that SQLite restore failed because the target backup file could not be found.
        /// </summary>
        /// <param name="backupPath">The safe path checked for the backup.</param>
        [LoggerMessage(EventId = 410, EventName = "SqliteRestoreFailedNotFound", Level = LogLevel.Warning, Message = "SQLite restore failed: file not found at {BackupPath}")]
        public partial void SqliteRestoreFailedNotFound(string backupPath);

        /// <summary>
        /// Logs that an online SQLite database restoration has begun.
        /// </summary>
        /// <param name="backupPath">The path of the source backup file.</param>
        [LoggerMessage(EventId = 411, EventName = "RestoringSqliteDatabase", Level = LogLevel.Information, Message = "Restoring SQLite database from target backup: {BackupPath}")]
        public partial void RestoringSqliteDatabase(string backupPath);

        /// <summary>
        /// Logs that an online SQLite database restoration completed successfully.
        /// </summary>
        /// <param name="fileName">The name of the backup file restored.</param>
        [LoggerMessage(EventId = 412, EventName = "SqliteDatabaseRestored", Level = LogLevel.Information, Message = "SQLite database successfully restored from {FileName}")]
        public partial void SqliteDatabaseRestored(string fileName);

        /// <summary>
        /// Logs that SQLite database restoration failed.
        /// </summary>
        /// <param name="fileName">The target backup file name.</param>
        /// <param name="ex">The restoration exception details.</param>
        [LoggerMessage(EventId = 413, EventName = "FailedToRestoreSqlite", Level = LogLevel.Error, Message = "Failed to restore SQLite database from {FileName}")]
        public partial void FailedToRestoreSqlite(string fileName, Exception ex);

        /// <summary>
        /// Logs that a PostgreSQL backup process has been initiated.
        /// </summary>
        /// <param name="backupPath">The target backup file path.</param>
        [LoggerMessage(EventId = 414, EventName = "StartingPostgresBackup", Level = LogLevel.Information, Message = "Starting PostgreSQL backup process to path: {BackupPath}")]
        public partial void StartingPostgresBackup(string backupPath);

        /// <summary>
        /// Logs that the pg_dump process failed.
        /// </summary>
        /// <param name="exitCode">The shell command exit code.</param>
        /// <param name="error">The process stderr diagnostic output.</param>
        [LoggerMessage(EventId = 415, EventName = "PostgresDumpFailed", Level = LogLevel.Error, Message = "pg_dump failed with exit code {ExitCode}. Details: {Error}")]
        public partial void PostgresDumpFailed(int exitCode, string error);

        /// <summary>
        /// Logs that a PostgreSQL backup process completed successfully.
        /// </summary>
        /// <param name="duration">The total duration in milliseconds.</param>
        /// <param name="size">The size of the generated dump in bytes.</param>
        [LoggerMessage(EventId = 416, EventName = "PostgresBackupCompleted", Level = LogLevel.Information, Message = "PostgreSQL backup completed in {Duration} ms. Size: {Size} bytes.")]
        public partial void PostgresBackupCompleted(double duration, long size);

        /// <summary>
        /// Logs that a PostgreSQL database restoration failed because the target backup file could not be found.
        /// </summary>
        /// <param name="backupPath">The path checked for the backup.</param>
        [LoggerMessage(EventId = 417, EventName = "PostgresRestoreFailedNotFound", Level = LogLevel.Warning, Message = "PostgreSQL restore failed: file not found at {BackupPath}")]
        public partial void PostgresRestoreFailedNotFound(string backupPath);

        /// <summary>
        /// Logs that a PostgreSQL database restoration has begun.
        /// </summary>
        /// <param name="backupPath">The source backup file path.</param>
        [LoggerMessage(EventId = 418, EventName = "RestoringPostgresDatabase", Level = LogLevel.Information, Message = "Restoring PostgreSQL database from target backup: {BackupPath}")]
        public partial void RestoringPostgresDatabase(string backupPath);

        /// <summary>
        /// Logs that the psql restore process failed.
        /// </summary>
        /// <param name="exitCode">The shell command exit code.</param>
        /// <param name="error">The process stderr diagnostic output.</param>
        [LoggerMessage(EventId = 419, EventName = "PostgresRestoreFailed", Level = LogLevel.Error, Message = "psql restore failed with exit code {ExitCode}. Details: {Error}")]
        public partial void PostgresRestoreFailed(int exitCode, string error);

        /// <summary>
        /// Logs that a PostgreSQL database restoration completed successfully.
        /// </summary>
        /// <param name="fileName">The name of the backup file restored.</param>
        [LoggerMessage(EventId = 420, EventName = "PostgresDatabaseRestored", Level = LogLevel.Information, Message = "PostgreSQL database restored successfully from {FileName}")]
        public partial void PostgresDatabaseRestored(string fileName);

        /// <summary>
        /// Logs that an unexpected error occurred during psql restore execution.
        /// </summary>
        /// <param name="fileName">The target backup file name.</param>
        /// <param name="ex">The system exception details.</param>
        [LoggerMessage(EventId = 421, EventName = "PostgresRestoreError", Level = LogLevel.Error, Message = "Error executing psql restore for file {FileName}")]
        public partial void PostgresRestoreError(string fileName, Exception ex);
    }
}
