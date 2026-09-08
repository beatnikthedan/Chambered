using Chambered.Data.Enums;
using Chambered.Data.Relationships;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents an external document (image or manual) for a product.
    /// </summary>
    public class ProductDocument : ExternalDocument, IHasProduct
    {
        /// <summary>
        /// Gets or sets the document type classification.
        /// </summary>
        public ProductDocumentType Type { get; set; }

        #region IHasProduct

        /// <inheritdoc/>
        public int? ProductId { get; set; }

        /// <inheritdoc/>
        public Product? Product { get; set; }

        #endregion
    }
}