using Chambered.Data.Interfaces;

namespace Chambered.Data.Models
{
    public abstract class ContainerBase : ModelBase<int>, IItemIdentifier, ICurrentCapcity
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the foreign key of the associated catalog product.
        /// </summary>
        public int? ProductId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the associated catalog product.
        /// </summary>
        public Product? Product { get; set; }

        #endregion

        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

        /// <summary>
        /// Gets or sets the foreign key for the owning arsenal context.
        /// </summary>
        public int ArsenalId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the owning arsenal context.
        /// </summary>
        public Arsenal? Arsenal { get; set; }

        #region ICurrentCapacity

        /// <inheritdoc/>
        public int CurrentCapacity { get; set; }

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
    }
}
