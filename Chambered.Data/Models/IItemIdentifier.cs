namespace Chambered.Data.Models
{
    public interface IItemIdentifier
    {
        /// <summary>
        /// Item friendly name
        /// </summary>
        string Name { get; set; }

        /// <summary>
        /// Item description
        /// </summary>
        string? Description { get; set; }
    }
}
