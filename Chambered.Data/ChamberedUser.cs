namespace Chambered.Data
{
    using Chambered.Data.Models;
    using Microsoft.AspNetCore.Identity;

    public class ChamberedUser : IdentityUser
    {
        public ICollection<ArmoryItem> OwnedItems { get; set; } = [];
        public ICollection<ArmoryItem> BenificiaryItems { get; set; } = [];
        public ICollection<Arsenal> Arsenals { get; set; } = [];
    }
}
