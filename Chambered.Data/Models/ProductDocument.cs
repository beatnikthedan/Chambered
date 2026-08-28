using Chambered.Data.Enums;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents an external document (image or manual) for a product.
    /// </summary>
    public class ProductDocument : ExternalDocument
    {
        /// <summary>
        /// Gets or sets the document type classification.
        /// </summary>
        public ProductDocumentType Type { get; set; }

        #region Product Relationship

        /// <inheritdoc/>
        public virtual int? ProductId { get; set; }

        /// <inheritdoc/>
        public virtual Product? Product { get; set; }

        #endregion
    }
}