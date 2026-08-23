using Chambered.Data.Enums;
using Chambered.Data.Interfaces;

namespace Chambered.Data.Models
{    
    /// <summary>
    /// Represents a secure container, room, vehicle, or physical location where armory items or ammunition are stored.
    /// </summary>
    public class Vault : ModelBase<int>, IItemIdentifier, IHasBattery, ICurrentCapcity
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the foreign key of the associated catalog product.
        /// </summary>
        public int? ProductId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the associated catalog product.
        /// </summary>
        public Security? Product { get; set; }

        #endregion

        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

        #region Classification & Ownership

        /// <summary>
        /// Gets or sets the foreign key for the owning arsenal context.
        /// </summary>
        public int ArsenalId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the owning arsenal context.
        /// </summary>
        public Arsenal? Arsenal { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the vault category.
        /// </summary>
        public VaultCategory VaultCategory { get; set; } = VaultCategory.Unknown;

        /// <summary>
        /// Gets or sets the foreign key for a parent vault/location if this item is nested inside another (e.g., Lockbox inside a Truck).
        /// </summary>
        public int? ParentVaultId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the parent vault/location.
        /// </summary>
        public Vault? ParentVault { get; set; }

        /// <summary>
        /// Gets or sets the collection of child vaults nested within this storage node.
        /// </summary>
        public ICollection<Vault> ChildVaults { get; set; } = new List<Vault>();

        #endregion

        #region Access Controls & Security

        /// <summary>
        /// Gets or sets the AES-encrypted combination or passcode string.
        /// </summary>
        public string? EncryptedPasscode { get; set; }

        /// <summary>
        /// Gets or sets the initialization vector (IV) or salt used for decrypting the passcode.
        /// </summary>
        public string? EncryptionIv { get; set; }

        /// <summary>
        /// Gets or sets a hint to remind the owner of the code without storing the actual code.
        /// </summary>
        public string? PasscodeHint { get; set; }

        /// <summary>
        /// Gets or sets the location or key number of physical backup override keys.
        /// </summary>
        public string? BackupKeyLocation { get; set; }

        #endregion

        #region Environment & Maintenance Metadata

        /// <summary>
        /// Gets or sets a value indicating whether this vault contains an active dehumidifier or desiccant pack.
        /// </summary>
        public bool HasDehumidifier { get; set; }

        /// <summary>
        /// Gets or sets the date the desiccant media was last recharged/replaced or dehumidifier serviced.
        /// </summary>
        public DateTime? DehumidifierLastServiced { get; set; }

        /// <summary>
        /// Gets or sets the target humidity percentage threshold for climate alerts.
        /// </summary>
        public int? TargetMaxHumidityPercent { get; set; }

        #endregion

        #region ICurrentCapacity

        /// <inheritdoc/>
        public int CurrentCapacity { get; set; }

        #endregion

        #region IHasBattery

        /// <inheritdoc/>
        public DateTime? BatteryLastChangedDate { get; set; }

        /// <inheritdoc/>
        public DateTime? BatteryExpirationDate { get; set; }

        #endregion

        #region Navigation Properties

        /// <summary>
        /// Gets or sets the items currently stored in this vault.
        /// </summary>
        public ICollection<ArmoryItem> ArmoryItems { get; set; } = new List<ArmoryItem>();

        /// <summary>
        /// Gets or sets the ammunition inventory stored in this vault.
        /// </summary>
        // public ICollection<AmmunitionInventory> Ammunition { get; set; } = new List<AmmunitionInventory>();

        /// <summary>
        /// Gets or sets the standalone accessories stored in this vault.
        /// </summary>
        // public ICollection<Accessory> Accessories { get; set; } = new List<Accessory>();

        #endregion
    }
}
