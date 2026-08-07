using Chambered.Data.Enums;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents an offline binary document or file attachment associated with a product or item.
    /// </summary>
    public class Document
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the unique primary key for the document.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the descriptive title of the document (e.g., "10/22 Factory Owner's Manual", "Exploded Parts View").
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the document type classification.
        /// </summary>
        public DocumentType Type { get; set; }

        #endregion

        #region File Data & Storage

        /// <summary>
        /// Gets or sets the raw binary file data stored directly in the database for offline access.
        /// </summary>
        public byte[] FileData { get; set; } = Array.Empty<byte>();

        /// <summary>
        /// Gets or sets the original file name (e.g., "ruger_1022_manual.pdf").
        /// </summary>
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the MIME content type (e.g., "application/pdf", "image/png").
        /// </summary>
        public string ContentType { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the file size in bytes.
        /// </summary>
        public long FileSizeBytes { get; set; }

        #endregion

        #region Relationships

        /// <summary>
        /// Gets or sets the optional foreign key for the associated product.
        /// </summary>
        public int? ProductId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the associated product.
        /// </summary>
        public Product? Product { get; set; }

        #endregion
    }
}
