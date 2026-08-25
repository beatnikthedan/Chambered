namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a standard chambering or caliber designation for items.
    /// </summary>
    public class Caliber : ModelBase<int>
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the official caliber name (e.g., "9x19mm Parabellum", ".308 Winchester", "12 Gauge").
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the actual measured bullet diameter in inches (e.g., 0.308, 0.355, 0.224).
        /// </summary>
        public decimal DiameterInches { get; set; }

        public string AlternateNames { get; set; }

        #endregion

        #region Navigation Properties

        /// <summary>
        /// Gets or sets catalog models chambered in this caliber.
        /// </summary>
        public ICollection<PewPew> Models { get; set; } = new List<PewPew>();

        #endregion
    }
}
