using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    public enum SuppressorMaterial
    {
        [Display(Name = "Titanium")]
        Titanium,
        [Display(Name = "Stainless Steel")]
        StainlessSteel,
        [Display(Name = "Aluminum")]
        Aluminum,
        [Display(Name = "Inconel")]
        Inconel,
        [Display(Name = "Carbon Fiber")]
        CarbonFiber,
        [Display(Name = "Cobalt 6")]
        Cobalt
    }
}
