using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    public enum LightMountType
    {
        [Display(Name = "None")]
        None,
        [Display(Name = "MIL-STD-1913 Picatinny")]
        Picatinny,
        [Display(Name = "M-LOK Slot")]
        Mlok,
        [Display(Name = "KeyMod Slot")]
        KeyMod,
        [Display(Name = "Glock Accessory Rail")]
        GlockRail,
        [Display(Name = "Universal Accessory Rail")]
        UniversalRail
    }
}
