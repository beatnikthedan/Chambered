using Chambered.Data.Enums;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents an external document (image or manual) for a product.
    /// </summary>
    public class ArmoryItemDocument : ExternalDocument
    {
        /// <summary>
        /// Gets or sets the document type classification.
        /// </summary>
        public ArmoryItemDocumentType Type { get; set; }

        #region Product Relationship

        /// <inheritdoc/>
        public virtual int? ArmoryItemId { get; set; }

        /// <inheritdoc/>
        public virtual ArmoryItem? ArmoryItem { get; set; }

        #endregion
    }
}