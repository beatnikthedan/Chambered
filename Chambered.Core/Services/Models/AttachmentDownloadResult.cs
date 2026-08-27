using System.IO;

namespace Chambered.Core.Services.Models
{
    /// <summary>
    /// Value Object representing decrypted attachment stream and metadata ready for download.
    /// </summary>
    public record AttachmentDownloadResult(
        Stream FileStream,
        string FileName,
        string ContentType
    );
}
