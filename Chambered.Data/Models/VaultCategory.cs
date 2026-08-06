namespace Chambered.Data.Models
{
    /// <summary>
    /// Lookup table for categorizing storage units (e.g., "Full Safe", "Lockbox", "Vehicle", "Display Case").
    /// </summary>
    public class VaultCategory
    {
        /// <summary>
        /// Gets or sets the unique identifier for the category.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the name of the category (e.g., "Heavy Safe", "Portable Lockbox", "Vehicle Storage").
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets a description of what this storage type typically entails.
        /// </summary>
        public string? Description { get; set; }
    }
}
