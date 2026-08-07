using Chambered.Data.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents an item in your armory.
    /// </summary>
    public class ArmoryItem
    {
        #region Primary Identification & Relational Lookups

        /// <summary>
        /// Gets or sets the unique primary key for the armory item.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the foreign key for the catalog product model.
        /// </summary>
        public int ProductId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the catalog product model.
        /// </summary>
        public Product Product { get; set; } = null!;

        /// <summary>
        /// Gets or sets the manufacturer-stamped unique serial number.
        /// </summary>
        public string SerialNumber { get; set; } = string.Empty;

        #endregion

        #region Technical Specifications

        /// <summary>
        /// Gets or sets the barrel length measured in inches.
        /// </summary>
        public decimal? BarrelLengthInches { get; set; }

        /// <summary>
        /// Gets or sets the rifling twist rate (e.g., "1:7", "1:10").
        /// </summary>
        public string? TwistRate { get; set; }

        /// <summary>
        /// Gets or sets the muzzle thread pitch (e.g., "1/2x28", "5/8x24").
        /// </summary>
        public string? ThreadPitch { get; set; }

        #endregion

        #region Legal & NFA Metadata

        /// <summary>
        /// Gets or sets a value indicating whether this item falls under NFA regulation (e.g., SBR, Suppressor).
        /// </summary>
        public bool IsNfaItem { get; set; }

        /// <summary>
        /// Gets or sets the specific NFA form type for the application.
        /// </summary>
        public NfaFormType? NfaFormType { get; set; }

        /// <summary>
        /// Gets or sets the URL or file path for the approved NFA tax stamp document image or PDF.
        /// </summary>
        public string? TaxStampDocumentUrl { get; set; }

        /// <summary>
        /// Gets or sets the date the NFA tax stamp was officially approved.
        /// </summary>
        public DateTime? StampApprovalDate { get; set; }

        #endregion

        #region Financial & Valuation

        /// <summary>
        /// Gets or sets the original purchase price paid for the item.
        /// </summary>
        public decimal? PurchasePrice { get; set; }

        /// <summary>
        /// Gets or sets the date the item was acquired.
        /// </summary>
        public DateTime? PurchaseDate { get; set; }

        /// <summary>
        /// Gets or sets the current estimated market value.
        /// </summary>
        public decimal? EstimatedValue { get; set; }

        /// <summary>
        /// Gets or sets the physical condition rating of the item.
        /// </summary>
        public ItemCondition? Condition { get; set; }

        #endregion

        #region Usage & Maintenance Stats

        /// <summary>
        /// Gets or sets the total cumulative round count fired through this item.
        /// </summary>
        public int RoundCount { get; set; } = 0;

        #endregion

        #region Location & Ownership Context

        /// <summary>
        /// Gets or sets the optional foreign key for the designated estate beneficiary for legal and legacy tracking.
        /// </summary>
        public string? OwnerId { get; set; }


        /// <summary>
        /// Gets or sets the designated estate beneficiary for legal and legacy tracking.
        /// </summary>
        public ChamberedUser? Owner { get; set; }

        /// <summary>
        /// Gets or sets the optional foreign key for the designated estate beneficiary for legal and legacy tracking.
        /// </summary>
        public string? BeneficiaryId { get; set; }


        /// <summary>
        /// Gets or sets the designated estate beneficiary for legal and legacy tracking.
        /// </summary>
        public ChamberedUser? Beneficiary { get; set; }

        /// <summary>
        /// Gets or sets the optional foreign key for the physical vault container housing this item.
        /// </summary>
        public int? VaultId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the assigned vault container.
        /// </summary>
        public Vault? Vault { get; set; }

        /// <summary>
        /// Gets or sets the optional foreign key for the primary workspace arsenal context.
        /// </summary>
        public int? ArsenalId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the assigned workspace arsenal context.
        /// </summary>
        public Arsenal? Arsenal { get; set; }

        /// <summary>
        /// Gets or sets the optional foreign key for the parent armory item (for mounted accessories).
        /// </summary>
        public int? ParentItemId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the parent armory item.
        /// </summary>
        public ArmoryItem? ParentItem { get; set; }

        /// <summary>
        /// Gets or sets the collection of mounted accessories under this armory item.
        /// </summary>
        public ICollection<ArmoryItem> MountedAccessories { get; set; } = new List<ArmoryItem>();

        #endregion

        #region Supplemental Notes & Media

        /// <summary>
        /// Gets or sets the image URL for the specific individual item photo.
        /// </summary>
        public string? ImageUrl { get; set; }

        /// <summary>
        /// Gets or sets Markdown-formatted custom user notes, modification history, or build details.
        /// </summary>
        public string? NotesMarkdown { get; set; }

        #endregion

        #region Entity Relationships

        //public ICollection<Accessory> Accessories { get; set; } = new List<Accessory>();
        //public ICollection<MaintenanceLog> MaintenanceLogs { get; set; } = new List<MaintenanceLog>();
        //public ICollection<RangeSessionLog> RangeLogs { get; set; } = new List<RangeSessionLog>();

        #endregion
    }
}
