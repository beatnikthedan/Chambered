namespace Chambered.Data.Interfaces
{
    /// <summary>
    /// Unifies battery and power cell tracking capabilities across inventories.
    /// </summary>
    public interface IHasBattery
    {
        /// <summary>
        /// Gets or sets the date the battery was last changed.
        /// </summary>
        public DateTime? BatteryLastChangedDate { get; set; }

        /// <summary>
        /// Gets or sets the battery expiration date.
        /// </summary>
        public DateTime? BatteryExpirationDate { get; set; }
    }
}
