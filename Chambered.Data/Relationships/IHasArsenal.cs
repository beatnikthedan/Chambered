using Chambered.Data.Models;

namespace Chambered.Data.Relationships
{
    public interface IHasArsenal
    {
        /// <summary>
        /// Gets or sets the optional foreign key for the primary workspace arsenal context.
        /// </summary>
        int? ArsenalId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the assigned workspace arsenal context.
        /// </summary>
        Arsenal? Arsenal { get; set; }
    }
}
