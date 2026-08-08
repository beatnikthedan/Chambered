using Chambered.Data.Enums;
using Chambered.Data.Interfaces;
using System.ComponentModel.DataAnnotations;

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

        #endregion
    }

    public class PewPew : Product
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
        public ActionType ActionType { get; set; }

        /// <summary>
        /// Gets or sets individual inventory items belonging to this firearm model.
        /// </summary>
        public ICollection<ArmoryItem> ArmoryItems { get; set; } = new List<ArmoryItem>();
    }

    public enum OpticType
    {
        [Display(Name = "LPVO (Low Power Variable Optic)")]
        Lpvo,
        [Display(Name = "Red Dot Sight")]
        RedDot,
        [Display(Name = "Prism Scope")]
        Prism,
        [Display(Name = "Long Range Precision Scope")]
        LongRangeScope,
        [Display(Name = "Holographic Weapon Sight")]
        Holographic,
        [Display(Name = "Thermal Imaging Optic")]
        Thermal,
        [Display(Name = "Night Vision Optic")]
        NightVision
    }

    public class Optic : Product, INeedsBattery
    {
        public bool HasBattery { get; set; } = false;
        public BatteryType BatteryType { get; set; } = BatteryType.Unknown;

        #region Magnification & Lens Specs

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

        #endregion

        #region Optical Details

        /// <summary>
        /// Primary category classification for the optic.
        /// </summary>
        public OpticType OpticType { get; set; }

        /// <summary>
        /// Focal plane location (e.g., FFP, SFP).
        /// </summary>
        public OpticFocalPlane FocalPlane { get; set; }

        /// <summary>
        /// Name or model of the reticle pattern.
        /// </summary>
        public OpticReticle Reticle { get; set; }

        /// <summary>
        /// Turret adjustment units (e.g., MOA, MRAD).
        /// </summary>
        public OpticAdjustmentUnit AdjustmentUnits { get; set; }

        /// <summary>
        /// Main body tube diameter or mounting interface.
        /// </summary>
        public string TubeDiameter { get; set; } = string.Empty;

        /// <summary>
        /// Mounting footprint pattern for reflex or red dot sights.
        /// </summary>
        public string Footprint { get; set; } = string.Empty;

        /// <summary>
        /// Indicates whether the reticle or dot features electronic illumination.
        /// </summary>
        public bool IsIlluminated { get; set; }

        #endregion

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
    }

    public class Suppressor : Product
    {
        #region Physical & Mounting Specs

        /// <summary>
        /// Maximum caliber rating for safe operation.
        /// </summary>
        public int MaxCaliberId { get; set; }

        /// <summary>
        /// Navigation property for the maximum caliber rating.
        /// </summary>
        public Caliber MaxCaliber { get; set; } = null!;

        /// <summary>
        /// Thread pitch specification for direct thread mounting interfaces.
        /// </summary>
        public string ThreadPitch { get; set; } = string.Empty;

        /// <summary>
        /// Method used to connect the suppressor to the firearm barrel or muzzle device.
        /// </summary>
        public SuppressorAttachmentType AttachmentType { get; set; }

        /// <summary>
        /// Primary construction material used in the baffles and body housing.
        /// </summary>
        public SuppressorMaterial Material { get; set; }

        #endregion

        #region Operational Specs

        /// <summary>
        /// Estimated decibel reduction provided by the suppressor.
        /// </summary>
        public decimal SoundReductionDb { get; set; }

        /// <summary>
        /// Indicates whether the suppressor is rated for sustained full-automatic fire.
        /// </summary>
        public bool IsFullAutoRated { get; set; }

        /// <summary>
        /// Indicates whether the user can disassemble the unit for cleaning and maintenance.
        /// </summary>
        public bool IsUserServiceable { get; set; }

        #endregion
    }

    public class PewPewLight : Product, INeedsBattery
    {
        public bool HasBattery { get; set; } = true;
        public BatteryType BatteryType { get; set; } = BatteryType.Cr123A;

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
        public LightMountType MountType { get; set; }

        /// <summary>
        /// Integrated laser emitter color or spectrum type.
        /// </summary>
        public LaserColor LaserColor { get; set; }

        /// <summary>
        /// Indicates whether the light housing features an input port for remote switch tailcaps.
        /// </summary>
        public bool HasRemoteSwitchPort { get; set; }

        /// <summary>
        /// Indicates whether the light features an integrated infrared (IR) illuminator mode.
        /// </summary>
        public bool IsInfraredCapable { get; set; }

        #endregion
    }

    /// <summary>
    /// Represents a security, safe, lock, or secure container product catalog entry.
    /// </summary>
    public class Security : Product, INeedsBattery
    {
        public bool HasBattery { get; set; } = false;
        public BatteryType BatteryType { get; set; } = BatteryType.Unknown;
    }
}
