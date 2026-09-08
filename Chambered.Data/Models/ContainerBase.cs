using Chambered.Data.Interfaces;
using Chambered.Data.Relationships;

namespace Chambered.Data.Models
{
    public abstract class ContainerBase : ModelBase<int>, IItemIdentifier, IHasProduct, IHasArsenal, ICurrentCapcity
    {
        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

        #region IHasProduct

        /// <inheritdoc/>
        public int? ProductId { get; set; }

        /// <inheritdoc/>
        public Product? Product { get; set; }

        #endregion

        #region IHasArsenal

        /// <inheritdoc/>
        public int? ArsenalId { get; set; }

        /// <inheritdoc/>
        public Arsenal? Arsenal { get; set; }

        #endregion

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
