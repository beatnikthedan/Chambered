using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Chambered.Data
{
    using Chambered.Data.Models;
    using Microsoft.AspNetCore.Identity;

    public class ChamberedUser : IdentityUser
    {
        // Add custom fields later if needed
        // public string DisplayName { get; set; }

        public ICollection<ArmoryItem> OwnedItems { get; set; } = new List<ArmoryItem>();
        public ICollection<ArmoryItem> BenificiaryItems { get; set; } = new List<ArmoryItem>();
    }
}
