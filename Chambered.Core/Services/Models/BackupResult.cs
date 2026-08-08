namespace Chambered.Core.Services.Models
{
    /// <summary>
    /// Represents the outcome of an executed backup operation.
    /// </summary>
    public class BackupResult
    {
        /// <summary>
        /// Gets or sets the full file path of the created backup archive or file.
        /// </summary>
        /// <value>The absolute path to the backup file.</value>
        public string FilePath { get; set; }

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
}
