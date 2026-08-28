using Chambered.Data.Models;

namespace Chambered.Data.Relationships
{
    public interface IHasProducts
    {
        ICollection<Product> Products { get; set; }
    }
}
