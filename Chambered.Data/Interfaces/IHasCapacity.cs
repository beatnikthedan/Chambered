namespace Chambered.Data.Interfaces
{
    public interface IHasCapacity
    {
        /// <summary>
        /// Gets or sets a value indicating whether the product has a limited capacity.
        /// </summary>
        bool IsCapacityLimited { get; set; }

        /// <summary>
        /// Gets or sets the maximum capacity of the product.
        /// </summary>
        int MaxCapacity { get; set; }
    }
}
