using Chambered.Core.Services.Models;
using Chambered.Data.Models;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Chambered.Core.Services
{
    /// <summary>
    /// Generic business service contract managing document orchestration, validations, and storage mappings.
    /// </summary>
    /// <typeparam name="TDocument">The concrete document entity type.</typeparam>
    /// <typeparam name="TEnum">The concrete document type enum.</typeparam>
    public interface IDocumentService<TDocument, TEnum>
        where TDocument : ExternalDocument
        where TEnum : struct, Enum
    {
        /// <summary>
        /// Validates parent exists, uploads file stream securely to repository, and commits database metadata.
        /// </summary>
        Task<AttachmentResult> UploadDocumentAsync(
            int parentId,
            Stream fileStream,
            string fileName,
            string contentType,
            TEnum type,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves document metadata and opens decrypted download stream.
        /// </summary>
        Task<AttachmentDownloadResult> DownloadDocumentAsync(
            int documentId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Removes database record and deletes the physical file from external storage repository.
        /// </summary>
        Task DeleteDocumentAsync(
            int documentId,
            CancellationToken cancellationToken = default);
    }
}
