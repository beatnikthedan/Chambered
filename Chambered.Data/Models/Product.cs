using Chambered.Data.Enums;
using Chambered.Data.Interfaces;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a specific product line or catalog entry offered by a manufacturer.
    /// </summary>
    public class Product : IItemIdentifier
    {
        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

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
        /// Gets or sets the foreign key for the manufacturer.
        /// </summary>
        public int ManufacturerId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the manufacturer.
        /// </summary>
        public Manufacturer Manufacturer { get; set; } = null!;

        #endregion

        #region Dynamic Specifications

        /// <summary>
        /// Gets or sets ad-hoc key-value specifications mapped to a JSON column in SQL.
        /// </summary>
        public Dictionary<string, string> Specifications { get; set; } = new();

        #endregion

        #region External Links & Reference

        /// <summary>
        /// Gets or sets the official manufacturer web page URL.
        /// </summary>
        public string? WebPageUrl { get; set; }

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

        #endregion
    }

    public class PewPew : Product, IIsNfaItem
    {
        /// <summary>
        /// Gets or sets the primary functional category assigned to this pew pew.
        /// </summary>
        public PewPewCategory PewPewCategory { get; set; }

        /// <summary>
        /// Gets or sets the foreign key for the default factory caliber.
        /// </summary>
        public int CaliberId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the default factory caliber.
        /// </summary>
        public Caliber Caliber { get; set; } = null!;

        /// <summary>
        /// Gets or sets the mechanical operating action type for this product line.
        /// </summary>
        public ActionType ActionType { get; set; } = ActionType.Unknown;

        /// <summary>
        /// Gets or sets individual inventory items belonging to this firearm model.
        /// </summary>
        public ICollection<ArmoryItem> ArmoryItems { get; set; } = new List<ArmoryItem>();

        #region IIsNfaItem
        
        /// <inheritdoc/>
        public bool IsNfaItem { get; set; } = false;

        #endregion
    }

    public class Optic : Product, INeedsBattery
    {
        /// <summary>
        /// Minimum magnification level.
        /// </summary>
        public decimal MinMagnification { get; set; } = 1.0m;

        /// <summary>
        /// Maximum magnification level.
        /// </summary>
        public decimal MaxMagnification { get; set; } = 1.0m;

        /// <summary>
        /// Objective lens diameter in millimeters.
        /// </summary>
        public int ObjectiveDiameterMm { get; set; }

        /// <summary>
        /// Primary category classification for the optic.
        /// </summary>
        public OpticType OpticType { get; set; } = OpticType.Unknown;

        /// <summary>
        /// Name or model of the reticle pattern.
        /// </summary>
        public OpticReticle Reticle { get; set; } = OpticReticle.None;

        /// <summary>
        /// Turret adjustment units (e.g., MOA, MRAD).
        /// </summary>
        public OpticAdjustmentUnit AdjustmentUnits { get; set; } = OpticAdjustmentUnit.None;

        /// <summary>
        /// Main body tube diameter or mounting interface in millimeters.
        /// </summary>
        public int TubeDiameter { get; set; }

        /// <summary>
        /// Indicates whether the reticle or dot features electronic illumination.
        /// </summary>
        public bool IsIlluminated { get; set; }

        #region Computed Properties

        /// <summary>
        /// Indicates whether the optic has a variable magnification range.
        /// </summary>
        public bool IsVariablePower => MaxMagnification > MinMagnification;

        /// <summary>
        /// Formatted representation of the optical magnification and objective size.
        /// </summary>
        public string MagnificationDisplay
        {
            get
            {
                if (!IsVariablePower)
                {
                    return ObjectiveDiameterMm > 0
                        ? $"{MinMagnification:G}x{ObjectiveDiameterMm}mm"
                        : $"{MinMagnification:G}x";
                }

                return ObjectiveDiameterMm > 0
                    ? $"{MinMagnification:G}-{MaxMagnification:G}x{ObjectiveDiameterMm}mm"
                    : $"{MinMagnification:G}-{MaxMagnification:G}x";
            }
        }

        #endregion

        #region INeedsBattery

        /// <inheritdoc/>
        public bool HasBattery { get; set; } = false;

        /// <inheritdoc/>
        public BatteryType BatteryType { get; set; } = BatteryType.Unknown;

        #endregion
    }

    public class Suppressor : Product, IIsNfaItem
    {
        #region Physical & Mounting Specs

        /// <summary>
        /// Maximum caliber rating for safe operation.
        /// </summary>
        public int CaliberId { get; set; }

        /// <summary>
        /// Navigation property for the maximum caliber rating.
        /// </summary>
        public Caliber Caliber { get; set; } = null!;

        /// <summary>
        /// Thread pitch specification for direct thread mounting interfaces.
        /// </summary>
        public string ThreadPitch { get; set; } = string.Empty;

        /// <summary>
        /// Method used to connect the suppressor to the firearm barrel or muzzle device.
        /// </summary>
        public SuppressorAttachmentType AttachmentType { get; set; } = SuppressorAttachmentType.Unknown;

        /// <summary>
        /// Primary construction material used in the baffles and body housing.
        /// </summary>
        public SuppressorMaterial Material { get; set; } = SuppressorMaterial.Unknown;

        #endregion

        #region Operational Specs

        /// <summary>
        /// Estimated decibel reduction provided by the suppressor.
        /// </summary>
        public int SoundReductionDb { get; set; }

        /// <summary>
        /// Indicates whether the suppressor is rated for sustained full-automatic fire.
        /// </summary>
        public bool IsFullAutoRated { get; set; }

        /// <summary>
        /// Indicates whether the user can disassemble the unit for cleaning and maintenance.
        /// </summary>
        public bool IsUserServiceable { get; set; }

        #endregion

        #region IIsNfaItem

        /// <inheritdoc/>
        public bool IsNfaItem { get; set; } = false;

        #endregion
    }

    public class PewPewLight : Product, INeedsBattery
    {
        #region Output & Electrical Specs

        /// <summary>
        /// Total luminous flux output rating in lumens.
        /// </summary>
        public int Lumens { get; set; }

        /// <summary>
        /// Peak beam intensity rating in candela.
        /// </summary>
        public int Candela { get; set; }

        #endregion

        #region Mounting & Controls

        /// <summary>
        /// Mounting rail interface requirement.
        /// </summary>
        public LightMountType MountType { get; set; } = LightMountType.None;

        /// <summary>
        /// Integrated laser emitter color or spectrum type.
        /// </summary>
        public LaserColor LaserColor { get; set; } = LaserColor.None;

        /// <summary>
        /// Indicates whether the light housing features an input port for remote switch tailcaps.
        /// </summary>
        public bool HasRemoteSwitchPort { get; set; }

        /// <summary>
        /// Indicates whether the light features an integrated infrared (IR) illuminator mode.
        /// </summary>
        public bool IsInfraredCapable { get; set; }

        #endregion

        #region INeedsBattery

        /// <inheritdoc/>
        public bool HasBattery { get; set; } = false;

        /// <inheritdoc/>
        public BatteryType BatteryType { get; set; } = BatteryType.Unknown;

        #endregion
    }

    /// <summary>
    /// Represents a security, safe, lock, or secure container product catalog entry.
    /// </summary>
    public class Security : Product, INeedsBattery
    {
        /// <summary>
        /// Gets or sets the primary lock type (e.g., Electronic Keypad, Mechanical Dial, Biometric, Key Lock).
        /// </summary>
        public LockType LockType { get; set; } = LockType.None;

        #region INeedsBattery

        /// <inheritdoc/>
        public bool HasBattery { get; set; } = false;

        /// <inheritdoc/>
        public BatteryType BatteryType { get; set; } = BatteryType.Unknown;

        #endregion
    }
}
