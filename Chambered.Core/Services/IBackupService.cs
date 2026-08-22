using Chambered.Core.Services.Models;
using Microsoft.AspNetCore.Http;

namespace Chambered.Core.Services
{
    /// <summary>
    /// Defines a contract for database backup and restore operations across different storage providers.
    /// </summary>
    public interface IBackupService
    {
        /// <summary>
        /// Performs an asynchronous database backup operation and saves the output to the target destination folder.
        /// </summary>
        /// <param name="destinationFolder">The target folder where the backup file will be created. If null or empty, defaults to the configured path.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>A task containing a <see cref="BackupResult"/> with metadata about the created backup.</returns>
        Task<BackupResult> CreateBackupAsync(string? destinationFolder = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Restores a database from a specific backup file asynchronously.
        /// </summary>
        /// <param name="fileName">The file name of the target backup located in the backup directory.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>A task containing a <see cref="RestoreResult"/> indicating whether the restoration succeeded.</returns>
        Task<RestoreResult> RestoreBackupAsync(string fileName, CancellationToken cancellationToken = default);

        /// <summary>
        /// Uploads a user-provided backup file to the backup directory asynchronously.
        /// </summary>
        /// <param name="file">The file payload received from an HTTP upload request.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>A task containing a <see cref="BackupFileInfo"/> representing the saved backup file.</returns>
        Task<BackupFileInfo> UploadBackupAsync(IFormFile file, CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves a list of available backup files residing in the configured backup folder.
        /// </summary>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>A task containing an enumerable collection of <see cref="BackupFileInfo"/> objects.</returns>
        Task<IEnumerable<BackupFileInfo>> GetBackupsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves an open file stream for downloading a specific backup file.
        /// </summary>
        /// <param name="fileName">The name of the target backup file.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>
        /// A task containing a tuple with the file <see cref="Stream"/>, MIME content type, and target file name; 
        /// or <see langword="null"/> if the file does not exist.
        /// </returns>
        Task<(Stream FileStream, string ContentType, string FileName)?> GetBackupStreamAsync(string fileName, CancellationToken cancellationToken = default);

        /// <summary>
        /// Permanently deletes a specific backup file from the backup directory.
        /// </summary>
        /// <param name="fileName">The name of the target backup file to delete.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns><see langword="true"/> if the file was successfully deleted; otherwise, <see langword="false"/>.</returns>
        Task<bool> DeleteBackupAsync(string fileName, CancellationToken cancellationToken = default);

        /// <summary>
        /// Cleans up older backup files in the target directory based on the configured retention threshold.
        /// </summary>
        /// <param name="destinationFolder">The directory where historical backup files reside.</param>
        /// <param name="retentionCount">The maximum number of recent backups to keep.</param>
        /// <returns>The total number of deleted backup files.</returns>
        int EnforceRetentionPolicy(string destinationFolder, int retentionCount);
    }
}
