using Chambered.Core.Services.Models;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Chambered.Core.Services
{
    /// <summary>
    /// Repository abstraction for managing raw file streams in external storage backends with optional transparent encryption.
    /// </summary>
    public interface IFileStorageRepository
    {
        /// <summary>
        /// Saves a stream to the external storage backend.
        /// </summary>
        Task<FileMetadata> SaveStreamAsync(string storageKey, Stream stream, string contentType, CancellationToken cancellationToken = default);

        /// <summary>
        /// Opens a download stream for the specified storage key.
        /// </summary>
        Task<Stream> OpenStreamAsync(string storageKey, CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes the stream/file from the external storage backend.
        /// </summary>
        Task DeleteStreamAsync(string storageKey, CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if the stream/file exists on the external storage backend.
        /// </summary>
        Task<bool> ExistsAsync(string storageKey, CancellationToken cancellationToken = default);
    }
}
