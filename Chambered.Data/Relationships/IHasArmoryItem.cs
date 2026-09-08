using Chambered.Data.Models;

namespace Chambered.Data.Relationships
{
    public interface IHasArmoryItem
    {
        int? ArmoryItemId { get; set; }

        ArmoryItem? ArmoryItem { get; set; }
    }
}
