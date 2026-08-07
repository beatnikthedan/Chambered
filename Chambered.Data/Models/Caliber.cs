namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a standard chambering or caliber designation across firearm models.
    /// </summary>
    public class Caliber
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the unique primary key for the caliber.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the official caliber name (e.g., "9x19mm Parabellum", ".308 Winchester", "12 Gauge").
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets common alternate names or abbreviations (e.g., "9mm Luger, 9x19, 9mm NATO").
        /// </summary>
        public string? AlternateNames { get; set; }

        #endregion

        #region Navigation Properties

        /// <summary>
        /// Gets or sets firearm catalog models chambered in this caliber.
        /// </summary>
        public ICollection<Product> Models { get; set; } = new List<Product>();

        #endregion
    }
}
