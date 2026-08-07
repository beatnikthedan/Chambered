namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a firearm manufacturer or maker with corporate metadata and catalog listings.
    /// </summary>
    public class Manufacturer
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the unique primary key for the manufacturer.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the official name of the manufacturer (e.g., "Glock", "Sturm, Ruger & Co.").
        /// </summary>
        public string Name { get; set; } = string.Empty;

        #endregion

        #region Contact & Corporate Metadata

        /// <summary>
        /// Gets or sets the official company website URL.
        /// </summary>
        public string? WebPageUrl { get; set; }

        /// <summary>
        /// Gets or sets the primary customer support or corporate phone number.
        /// </summary>
        public string? PhoneNumber { get; set; }

        #endregion

        #region Location & Address Data

        /// <summary>
        /// Gets or sets the street address line for corporate headquarters.
        /// </summary>
        public string? StreetAddress { get; set; }

        /// <summary>
        /// Gets or sets the city where headquarters is located.
        /// </summary>
        public string? City { get; set; }

        /// <summary>
        /// Gets or sets the state, province, or region.
        /// </summary>
        public string? StateOrProvince { get; set; }

        /// <summary>
        /// Gets or sets the postal or ZIP code.
        /// </summary>
        public string? PostalCode { get; set; }

        /// <summary>
        /// Gets or sets the country of origin or location of headquarters.
        /// </summary>
        public string? Country { get; set; }

        #endregion

        #region Navigation Properties

        /// <summary>
        /// Gets or sets the catalog of firearm models produced by this manufacturer.
        /// </summary>
        public ICollection<Product> Models { get; set; } = new List<Product>();

        #endregion
    }
}
