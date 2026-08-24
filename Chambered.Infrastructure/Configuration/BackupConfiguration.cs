using BeatnikToolKit.Attributes;

namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Represents configuration options for automated system backups.
    /// </summary>
    [ConfigurationSection(nameof(BackupConfiguration), null)]
    public class BackupConfiguration
    {
        /// <summary>
        /// Gets or sets a value indicating whether automated scheduled backups are enabled.
        /// </summary>
        /// <value><c>true</c> if enabled; otherwise, <c>false</c>.</value>
        public bool Enabled { get; set; } = false;

        /// <summary>
        /// Gets or sets the file system path where backup files are saved.
        /// Defaults to "./backups".
        /// </summary>
        /// <value>The target backup directory path.</value>
        public string BackupPath { get; set; } = "./backups";

        /// <summary>
        /// Gets or sets the Cron expression defining the schedule for automated backups.
        /// Defaults to "0 2 * * *" (Every day at 2:00 AM).
        /// </summary>
        /// <value>The Cron schedule string.</value>
        public string CronSchedule { get; set; } = "0 2 * * *";

        /// <summary>
        /// Gets or sets the maximum number of historical backup files to keep. Older files will be purged.
        /// </summary>
        /// <value>The retention threshold count.</value>
        public int RetentionCount { get; set; } = 7;
    }
}
