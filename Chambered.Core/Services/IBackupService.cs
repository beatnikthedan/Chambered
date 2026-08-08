using Chambered.Core.Services.Models;

namespace Chambered.Core.Services
{
    /// <summary>
    /// Provides an abstraction for creating system backups and managing backup lifecycles.
    /// </summary>
    public interface IBackupService
    {
        /// <summary>
        /// Performs a backup operation asynchronously and saves the artifact to the specified output folder.
        /// </summary>
        /// <param name="destinationFolder">The target folder where backup artifacts should be written.</param>
        /// <param name="cancellationToken">An optional token to monitor for cancellation requests.</param>
        /// <returns>
        /// A task representing the operation. The task result contains a <see cref="BackupResult"/> with metadata about the created backup.
        /// </returns>
        Task<BackupResult> CreateBackupAsync(string destinationFolder, CancellationToken cancellationToken = default);

        /// <summary>
        /// Cleans up older backup files in the target directory based on the configured retention policy.
        /// </summary>
        /// <param name="destinationFolder">The folder containing historical backup files.</param>
        /// <param name="retentionCount">The maximum number of recent backups to keep.</param>
        /// <returns>The total number of deleted backup files.</returns>
        int EnforceRetentionPolicy(string destinationFolder, int retentionCount);
    }
}
