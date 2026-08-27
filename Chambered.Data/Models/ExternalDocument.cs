using Chambered.Data.Enums;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Abstract base class for all external file documents.
    /// </summary>
    public abstract class ExternalDocument : ModelBase<int>
    {
        #region External File Storage

        /// <summary>
        /// Gets or sets MIME content type (e.g., "image/jpeg", "application/pdf").
        /// </summary>
        public string ContentType { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the original file name.
        /// </summary>
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the file size in bytes.
        /// </summary>
        public long FileSizeBytes { get; set; }

        public DateTimeOffset UploadedAt { get; set; }

        #endregion
    }
}
