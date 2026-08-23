namespace Chambered.Data
{
    using Chambered.Data.Models;
    using Microsoft.AspNetCore.Identity;

    public class ChamberedUser : IdentityUser
    {
        public ICollection<ArmoryItem> OwnedItems { get; set; } = new List<ArmoryItem>();
        public ICollection<ArmoryItem> BenificiaryItems { get; set; } = new List<ArmoryItem>();
    }
}
