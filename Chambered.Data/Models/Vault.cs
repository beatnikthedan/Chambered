using Chambered.Data.Enums;
using Chambered.Data.Interfaces;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a secure container, room, vehicle, or physical location where armory items or ammunition are stored.
    /// </summary>
    public class Vault : ContainerBase, IHasBattery
    {
        #region Classification & Ownership  

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

        #endregion
    }
}
