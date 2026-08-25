namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a secure container, room, vehicle, or physical location where armory items or ammunition are stored.
    /// </summary>
    public class AmmoBox : ContainerBase
    {
        #region Primary Identification & Relational Lookups

        /// <summary>
        /// Gets or sets the discriminator value for the item type (used for TPH inheritance mapping).
        /// </summary>
        public string ItemType { get; set; }

        /// <summary>
        /// Gets or sets the foreign key for the catalog product model.
        /// </summary>
        public int ProductId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the catalog product model.
        /// </summary>
        public Product? Product { get; set; }

        #endregion

        #region Heirarchy

        /// <summary>
        /// Gets or sets the foreign key for a parent vault/location if this item is nested inside another (e.g., Lockbox inside a Truck).
        /// </summary>
        public int? ParentAmmoBoxId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the parent vault/location.
        /// </summary>
        public AmmoBox? ParentAmmoBox { get; set; }

        /// <summary>
        /// Gets or sets the collection of child vaults nested within this storage node.
        /// </summary>
        public ICollection<AmmoBox> ChildAmmoBoxes { get; set; } = new List<AmmoBox>();

        #endregion

        public int ReloadingRecipeId { get; set; }

        public ReloadingRecipe? ReloadingRecipe { get; set; }

        #region Navigation Properties

        #endregion
    }
}