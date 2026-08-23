namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents an isolated collection.
    /// </summary>
    public class Arsenal : ModelBase<int>, IItemIdentifier
    {
        #region Primary Identification

        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

        /// <summary>
        /// Gets or sets the string identifier for the UI icon (e.g., "Shield", "Home", "Trees", "Truck").
        /// </summary>
        public string? IconName { get; set; }

        /// <summary>
        /// Gets or sets the hex color code used for tab indicators and badge accents in the UI (e.g., "#2563EB").
        /// </summary>
        public string? ColorHex { get; set; }

        #endregion

        #region Navigation Properties

        /// <summary>
        /// Gets or sets the collection of users from IdentityDbContext that have access to this arsenal.
        /// </summary>
        public ICollection<ChamberedUser> Users { get; set; } = new List<ChamberedUser>();

        /// <summary>
        /// Gets or sets the physical vaults associated with this arsenal.
        /// </summary>
        public ICollection<Vault> Vaults { get; set; } = new List<Vault>();

        /// <summary>
        /// Gets or sets the armory items directly linked to this arsenal.
        /// </summary>
        public ICollection<ArmoryItem> ArmoryItems { get; set; } = new List<ArmoryItem>();

        #endregion
    }
}