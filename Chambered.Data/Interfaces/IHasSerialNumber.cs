namespace Chambered.Data.Interfaces
{
    public interface IHasSerialNumber
    {
        /// <summary>
        /// Gets or sets the manufacturer-stamped unique serial number.
        /// </summary>
        string SerialNumber { get; set; }
    }
}
