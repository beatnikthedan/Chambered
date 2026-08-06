namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents an isolated collection workspace, location context, or firearm portfolio.
    /// </summary>
    public class Arsenal
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the unique primary key for the arsenal.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the display name of the arsenal (e.g., "Main Collection", "Cabin Armory", "Dad's Estate").
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets an optional summary or description of this arsenal context.
        /// </summary>
        public string? Description { get; set; }

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
        /// Gets or sets the firearms directly linked to this arsenal.
        /// </summary>
        public ICollection<ArmoryItem> Firearms { get; set; } = new List<ArmoryItem>();

        #endregion
    }
}