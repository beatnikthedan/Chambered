using Chambered.Data.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a primary firearm or firearm receiver within the inventory system.
    /// </summary>
    public class ArmoryItem
    {
        #region Primary Identification & Relational Lookups

        /// <summary>
        /// Gets or sets the unique primary key for the firearm.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the foreign key for the manufacturer.
        /// </summary>
        public int ManufacturerId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the manufacturer.
        /// </summary>
        public Manufacturer Manufacturer { get; set; } = null!;

        /// <summary>
        /// Gets or sets the foreign key for the firearm model.
        /// </summary>
        public int FirearmModelId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the firearm model.
        /// </summary>
        public FirearmModel FirearmModel { get; set; } = null!;

        /// <summary>
        /// Gets or sets the manufacturer-stamped unique serial number.
        /// </summary>
        public string SerialNumber { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the mechanical operating action type.
        /// </summary>
        public ActionType ActionType { get; set; }

        #endregion

        #region Technical Specifications

        public decimal? BarrelLengthInches { get; set; }
        public string? TwistRate { get; set; }
        public string? ThreadPitch { get; set; }

        #endregion

        #region Legal & NFA Metadata

        public bool IsNfaItem { get; set; }
        public string? NfaFormType { get; set; }
        public string? TaxStampDocumentUrl { get; set; }
        public DateTime? StampApprovalDate { get; set; }

        #endregion

        #region Financial & Valuation

        public decimal? PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public decimal? EstimatedValue { get; set; }
        public string? Condition { get; set; }

        #endregion

        #region Usage & Maintenance Stats

        public int RoundCount { get; set; } = 0;

        #endregion

        #region Location & Ownership Context

        public string? Beneficiary { get; set; }

        public int? VaultId { get; set; }
        public Vault? Vault { get; set; }

        public int? ArsenalId { get; set; }
        public Arsenal? Arsenal { get; set; }

        #endregion

        #region Supplemental Notes & Media

        public string? ImageUrl { get; set; }
        public string? NotesMarkdown { get; set; }

        #endregion

        #region Entity Relationships

        public ICollection<Accessory> Accessories { get; set; } = new List<Accessory>();
        public ICollection<MaintenanceLog> MaintenanceLogs { get; set; } = new List<MaintenanceLog>();
        public ICollection<RangeSessionLog> RangeLogs { get; set; } = new List<RangeSessionLog>();

        #endregion
    }
}
