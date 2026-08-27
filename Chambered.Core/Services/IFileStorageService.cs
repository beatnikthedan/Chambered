using Chambered.Data.Models;

namespace Chambered.Core.Services
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Uploads a file stream using a unique key (e.g., "invoices/2026/guid.pdf") 
        /// and returns stored metadata.
        /// </summary>
        Task<FileMetadata> UploadAsync(string storageKey, Stream content, string contentType, CancellationToken cancellationToken = default);

        /// <summary>
        /// Downloads the file as a stream.
        /// </summary>
        Task<Stream> DownloadAsync(string storageKey, CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if the file exists without downloading its content.
        /// </summary>
        Task<bool> ExistsAsync(string storageKey, CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes a file by its unique key.
        /// </summary>
        Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);

        /// <summary>
        /// Generates a direct access URL or pre-signed temporary link for the frontend.
        /// </summary>
        Task<string> GetAccessUrlAsync(string storageKey, TimeSpan? expiresIn = null, CancellationToken cancellationToken = default);
    }

    public record FileMetadata(string StorageKey, string ContentType, long SizeInBytes, string Hash);
}
