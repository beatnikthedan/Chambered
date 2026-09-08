using Chambered.Data.Enums;
using Chambered.Data.Relationships;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents an external document (image or manual) for a product.
    /// </summary>
    public class ArmoryItemDocument : ExternalDocument, IHasArmoryItem
    {
        /// <summary>
        /// Gets or sets the document type classification.
        /// </summary>
        public ArmoryItemDocumentType Type { get; set; }

        #region IHasArmoryItem

        /// <inheritdoc/>
        public virtual int? ArmoryItemId { get; set; }

        /// <inheritdoc/>
        public virtual ArmoryItem? ArmoryItem { get; set; }

        #endregion
    }
}