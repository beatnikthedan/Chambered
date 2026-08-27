using System;

namespace Chambered.Core.Services.Models
{
    /// <summary>
    /// Value Object representing successfully written document metadata.
    /// </summary>
    public record AttachmentResult(
        int Id,
        string FileName,
        string ContentType,
        long FileSizeBytes,
        string StorageKey,
        bool IsEncrypted,
        DateTimeOffset UploadedAt
    );
}
