using Chambered.Data.Enums;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a specific product line or catalog entry offered by a manufacturer.
    /// </summary>
    public class Product
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the unique primary key for the product.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the product model.
        /// </summary>
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the product part number.
        /// </summary>
        public string PartNumber { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the manufacturer SKU or product number (e.g., "1103").
        /// </summary>
        public string? Sku { get; set; }

        /// <summary>
        /// Gets or sets the primary functional category assigned to this product.
        /// </summary>
        public ProductCategory Category { get; set; }

        /// <summary>
        /// Gets or sets the mechanical operating action type for this product line.
        /// </summary>
        public ActionType ActionType { get; set; }

        /// <summary>
        /// Gets or sets the foreign key for the manufacturer.
        /// </summary>
        public int ManufacturerId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the manufacturer.
        /// </summary>
        public Manufacturer Manufacturer { get; set; } = null!;

        /// <summary>
        /// Gets or sets the foreign key for the default factory caliber.
        /// </summary>
        public int CaliberId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the default factory caliber.
        /// </summary>
        public Caliber Caliber { get; set; } = null!;

        #endregion

        #region External Links & Reference

        /// <summary>
        /// Gets or sets the official manufacturer web page URL.
        /// </summary>
        public string? WebPageUrl { get; set; }

        /// <summary>
        /// Gets or sets reference notes or historical details regarding the product line.
        /// </summary>
        public string? ReferenceNotes { get; set; }

        #endregion

        #region Embedded Media

        /// <summary>
        /// Gets or sets raw image binary data for the product preview image (stored offline).
        /// </summary>
        public byte[]? ImageData { get; set; }

        /// <summary>
        /// Gets or sets the MIME content type for the embedded image (e.g., "image/jpeg", "image/png").
        /// </summary>
        public string? ImageContentType { get; set; }

        #endregion

        #region Navigation Properties

        /// <summary>
        /// Gets or sets the collection of embedded offline reference documents (manuals, diagrams, etc.).
        /// </summary>
        public ICollection<Document> Documents { get; set; } = new List<Document>();

        /// <summary>
        /// Gets or sets individual inventory items belonging to this product line.
        /// </summary>
        public ICollection<ArmoryItem> ArmoryItems { get; set; } = new List<ArmoryItem>();

        #endregion
    }
}
