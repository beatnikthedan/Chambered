namespace Chambered.Core.Services.Models
{
    /// <summary>
    /// Represents the outcome of an executed database backup operation.
    /// </summary>
    public class BackupResult
    {
        /// <summary>
        /// Gets or sets the full file path of the created backup archive or file.
        /// </summary>
        /// <value>The absolute path to the backup file.</value>
        public string FilePath { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the total size of the generated backup file in bytes.
        /// </summary>
        /// <value>The size in bytes.</value>
        public long SizeInBytes { get; set; }

        /// <summary>
        /// Gets or sets the total duration taken to complete the backup.
        /// </summary>
        /// <value>The execution duration.</value>
        public TimeSpan Duration { get; set; }

        /// <summary>
        /// Gets or sets the list of individual components or files included in this backup (e.g., "SQLite DB", "User Uploads").
        /// </summary>
        /// <value>The list of included items.</value>
        public List<string> IncludedItems { get; set; } = new List<string>();
    }

    /// <summary>
    /// Represents metadata details for an individual backup artifact file.
    /// </summary>
    public record BackupFileInfo
    {
        /// <summary>
        /// Gets the name of the backup file (e.g., <c>"backup_20260821_120000.db"</c>).
        /// </summary>
        public string FileName { get; init; } = string.Empty;

        /// <summary>
        /// Gets the date and time in UTC when the backup file was created.
        /// </summary>
        public DateTime Date { get; init; }

        /// <summary>
        /// Gets the total size of the backup file in bytes.
        /// </summary>
        public long SizeInBytes { get; init; }

        /// <summary>
        /// Initializes a new instance of the <see cref="BackupFileInfo"/> record.
        /// </summary>
        public BackupFileInfo() { }

        /// <summary>
        /// Initializes a new instance of the <see cref="BackupFileInfo"/> record with specified parameters.
        /// </summary>
        /// <param name="fileName">The file name of the backup.</param>
        /// <param name="date">The creation timestamp in UTC.</param>
        /// <param name="sizeInBytes">The file size in bytes.</param>
        public BackupFileInfo(string fileName, DateTime date, long sizeInBytes)
        {
            FileName = fileName;
            Date = date;
            SizeInBytes = sizeInBytes;
        }
    }

    /// <summary>
    /// Represents the outcome of a database restoration operation.
    /// </summary>
    public record RestoreResult
    {
        /// <summary>
        /// Gets a value indicating whether the database restoration was successful.
        /// </summary>
        public bool Success { get; init; }

        /// <summary>
        /// Gets diagnostic information, error details, or a summary message regarding the outcome.
        /// </summary>
        public string Message { get; init; } = string.Empty;

        /// <summary>
        /// Initializes a new instance of the <see cref="RestoreResult"/> record.
        /// </summary>
        public RestoreResult() { }

        /// <summary>
        /// Initializes a new instance of the <see cref="RestoreResult"/> record with specified parameters.
        /// </summary>
        /// <param name="success">Indicates if the restoration succeeded.</param>
        /// <param name="message">A descriptive status or error message.</param>
        public RestoreResult(bool success, string message)
        {
            Success = success;
            Message = message;
        }
    }
}
