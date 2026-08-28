using Chambered.Data.Models;

namespace Chambered.Data.Relationships
{
    public interface IHasManufacturer
    {
        /// <summary>
        /// Gets or sets the foreign key for the manufacturer.
        /// </summary>
        int ManufacturerId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the manufacturer.
        /// </summary>
        Manufacturer Manufacturer { get; set; }
    }
}
