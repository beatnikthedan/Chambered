using Chambered.Data.Models;

namespace Chambered.Data.Relationships
{
    public interface IHasProduct
    {
        /// <summary>
        /// Gets or sets the foreign key for the product model.
        /// </summary>
        int? ProductId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the product model.
        /// </summary>
        Product? Product { get; set; }
    }
}
