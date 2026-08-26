using Chambered.Data.Relationships;

namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a manufacturer or maker with corporate metadata and catalog listings.
    /// </summary>
    public class Manufacturer : ModelBase<int>, IHasProducts
    {
        #region Primary Identification

        /// <summary>
        /// Gets or sets the official name of the manufacturer.
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

        #region IHasProducts

        /// <inheritdoc/>
        public ICollection<Product> Products { get; set; } = new List<Product>();

        #endregion
    }
}
