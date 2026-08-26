using Chambered.Data.Enums;
using Chambered.Data.Interfaces;
using Chambered.Data.Relationships;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a specific product line or catalog entry offered by a manufacturer.
    /// </summary>
    public class Product : ModelBase<int>, IItemIdentifier, IHasManufacturer
    {
        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

        #region IHasManufacturer

        /// <inheritdoc/>
        public int ManufacturerId { get; set; }

        /// <inheritdoc/>
        public Manufacturer Manufacturer { get; set; } = null!;

        #endregion

        #region Primary Identification

        /// <summary>
        /// Gets or sets the discriminator value for the product type (used for TPH inheritance mapping).
        /// </summary>
        public string ProductType { get; set; }

        /// <summary>
        /// Gets or sets the product part number.
        /// </summary>
        public string PartNumber { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the manufacturer SKU or product number (e.g., "1103").
        /// </summary>
        public string? Sku { get; set; }

        #endregion

        #region Dynamic Specifications

        /// <summary>
        /// Gets or sets ad-hoc key-value specifications mapped to a JSON column in SQL.
        /// </summary>
        public Dictionary<string, object> Specifications { get; set; } = new();

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

        /// <summary>
        /// Gets or sets individual inventory items belonging to this firearm model.
        /// </summary>
        public ICollection<ArmoryItem> ArmoryItems { get; set; } = new List<ArmoryItem>();

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
        public string TubeDiameter { get; set; }

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

    public class Suppressor : CaliberBase, IIsNfaItem
    {
        #region Physical & Mounting Specs

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
    public class Security : Product, INeedsBattery, IHasCapacity
    {
        /// <summary>
        /// Gets or sets the primary lock type (e.g., Electronic Keypad, Mechanical Dial, Biometric, Key Lock).
        /// </summary>
        public LockType LockType { get; set; } = LockType.None;

        #region IHasCapacity

        /// <inheritdoc/>
        public bool IsCapacityLimited { get; set; }

        /// <inheritdoc/>
        public int MaxCapacity { get; set; }

        #endregion

        #region INeedsBattery

        /// <inheritdoc/>
        public bool HasBattery { get; set; } = false;

        /// <inheritdoc/>
        public BatteryType BatteryType { get; set; } = BatteryType.Unknown;

        #endregion
    }

    public class Magazine : Product, IHasCapacity
    {
        #region IHasCapacity

        /// <inheritdoc/>
        public bool IsCapacityLimited { get; set; }

        /// <inheritdoc/>
        public int MaxCapacity { get; set; }

        #endregion
    }

    /// <summary>
    /// Represents smokeless or black powder used for reloading.
    /// </summary>
    public class Powder : Product
    {
        /// <summary>
        /// Gets or sets the chemical composition type (e.g., SingleBase, DoubleBase, BlackPowder).
        /// </summary>
        public PowderType PowderType { get; set; } = PowderType.Unknown;

        /// <summary>
        /// Gets or sets the physical grain shape (e.g., Extruded/Stick, Ball/Spherical, Flake).
        /// </summary>

        public PowderShape Shape { get; set; } = PowderShape.Unknown;

        /// <summary>
        /// Gets or sets the relative burn speed index or ranking category (e.g., FastPistol, SlowRifle).
        /// </summary>
        public PowderBurnRate BurnRate { get; set; } = PowderBurnRate.Unknown;

        /// <summary>
        /// Gets or sets the standard container weight in grains or pounds as sold.
        /// </summary>
        public decimal ContainerWeightLbs { get; set; }
    }

    /// <summary>
    /// Represents priming caps used to ignite powder charges.
    /// </summary>
    public class Primer : Product, IHasQuantity
    {
        /// <summary>
        /// Gets or sets the standard size classification (e.g., SmallPistol, LargePistol, SmallRifle, LargeRifle, Shotgun209).
        /// </summary>
        public PrimerSize Size { get; set; } = PrimerSize.Unknown;

        /// <summary>
        /// Gets or sets the anvil/pocket type (e.g., Boxer, Berdan).
        /// </summary>
        public PrimerType Type { get; set; } = PrimerType.Boxer;

        /// <summary>
        /// Gets or sets a value indicating whether this is a Magnum primer formulation.
        /// </summary>
        public bool IsMagnum { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether this primer is designed for match/competition tolerances.
        /// </summary>

        public bool IsMatch { get; set; }

        #region IHasQuantity

        /// <inheritdoc/>
        public int Quantity { get; set; }

        #endregion
    }

    /// <summary>
    /// Represents a bullet, slug, or projectile product used for reloading.
    /// </summary>
    public class Projectile : CaliberBase, IHasQuantity
    {
        /// <summary>
        /// Gets or sets the weight of the projectile in grains.
        /// </summary>
        public decimal WeightGrains { get; set; }

        /// <summary>
        /// Gets or sets the structural bullet shape/profile (e.g., FMJ, HPBT, Spitzer, Wadcutter, RN).
        /// </summary>
        public ProjectileProfile Profile { get; set; } = ProjectileProfile.Unknown;

        /// <summary>
        /// Gets or sets the jacket/core material construction (e.g., CopperJacketed, PolymerTipped, MonolithicCopper, LeadCast).
        /// </summary>
        public ProjectileMaterial Material { get; set; } = ProjectileMaterial.Unknown;

        /// <summary>
        /// Gets or sets the G1 Ballistic Coefficient for long-range trajectory calculations.
        /// </summary>
        public decimal? BcG1 { get; set; }

        /// <summary>
        /// Gets or sets the G7 Ballistic Coefficient (more accurate for modern boat-tail rifle bullets).
        /// </summary>
        public decimal? BcG7 { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the bullet features a boat-tail base design.
        /// </summary>
        public bool IsBoatTail { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the bullet features a factory-applied crimp groove (cannelure).
        /// </summary>
        public bool HasCannelure { get; set; }

        #region IHasQuantity

        /// <inheritdoc/>
        public int Quantity { get; set; }

        #endregion
    }

    /// <summary>
    /// Represents raw or prepped unprimed cartridge casings (brass) used for reloading.
    /// </summary>
    public class Casing : CaliberBase, IHasQuantity
    {
        #region Caliber & Physical Specs

        /// <summary>
        /// Gets or sets the metallic or composite material of the casing.
        /// </summary>
        public CaseMaterial Material { get; set; } = CaseMaterial.Brass;

        /// <summary>
        /// Gets or sets the required primer size format for the casing's primer pocket.
        /// </summary>
        public PrimerSize PrimerPocketSize { get; set; } = PrimerSize.Unknown;

        #endregion

        #region Condition & Manufacturing Attributes

        /// <summary>
        /// Gets or sets a value indicating whether the casing comes pre-primed from the factory.
        /// </summary>
        public bool IsPrimed { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the casing mouth has been pre-annealed for ductileness.
        /// </summary>
        public bool IsAnnealed { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the casing is brand new virgin brass versus fully prepped range brass.
        /// </summary>
        public bool IsVirgin { get; set; } = true;

        #endregion

        #region IHasQuantity

        /// <inheritdoc/>
        public int Quantity { get; set; }

        #endregion
    }

    /// <summary>
    /// Represents commercial, pre-assembled factory ammunition catalog products.
    /// </summary>
    public class Ammunition : CaliberBase, IHasQuantity
    {
        #region Caliber & Core Specifications

        /// <summary>
        /// Gets or sets the projectile weight in grains (e.g., 55gr, 115gr, 147gr).
        /// </summary>
        public decimal BulletWeightGrains { get; set; }

        /// <summary>
        /// Gets or sets the shape or profile of the loaded projectile.
        /// </summary>
        public ProjectileProfile ProjectileProfile { get; set; } = ProjectileProfile.Unknown;

        /// <summary>
        /// Gets or sets the cartridge case construction material.
        /// </summary>
        public CaseMaterial CaseMaterial { get; set; } = CaseMaterial.Brass;

        #endregion

        #region Performance & Ballistics

        /// <summary>
        /// Gets or sets factory-rated muzzle velocity in feet per second (fps).
        /// </summary>
        public int MuzzleVelocityFps { get; set; }

        /// <summary>
        /// Gets or sets factory-rated muzzle energy in foot-pounds (ft-lbs).
        /// </summary>
        public int MuzzleEnergyFtLbs { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether this ammunition is loaded to +P overpressure standards.
        /// </summary>
        public bool IsPlusP { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether this is non-toxic / lead-free factory ammo.
        /// </summary>
        public bool IsLeadFree { get; set; }

        public bool IsSubsonic => MuzzleVelocityFps > 0 && MuzzleVelocityFps < 1125;

        #endregion

        #region IHasQuantity

        /// <inheritdoc/>
        public int Quantity { get; set; }

        #endregion
    }

    public abstract class CaliberBase : Product
    {
        /// <summary>
        /// Gets or sets the foreign key for the cartridge caliber.
        /// </summary>
        public int CaliberId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the cartridge caliber.
        /// </summary>
        public Caliber Caliber { get; set; } = null!;
    }

    public class AmmoBox : Product, IHasCapacity
    {
        #region IHasCapacity

        /// <inheritdoc/>
        public bool IsCapacityLimited { get; set; }

        /// <inheritdoc/>
        public int MaxCapacity { get; set; }

        #endregion
    }
}
