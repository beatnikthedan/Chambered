using Chambered.Data.Models;

namespace Chambered.Data.Relationships
{
    public interface IHasVault
    {
        /// <summary>
        /// Gets or sets the optional foreign key for the physical vault container housing this item.
        /// </summary>
        int? VaultId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property for the assigned vault container.
        /// </summary>
        Vault? Vault { get; set; }
    }
}
