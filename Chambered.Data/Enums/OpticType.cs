using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    public enum OpticType
    {
        [Display(Name = "Unknown")]
        Unknown,
        [Display(Name = "LPVO (Low Power Variable Optic)")]
        Lpvo,
        [Display(Name = "Red Dot Sight")]
        RedDot,
        [Display(Name = "Prism Scope")]
        Prism,
        [Display(Name = "Long Range Precision Scope")]
        LongRangeScope,
        [Display(Name = "Holographic Weapon Sight")]
        Holographic,
        [Display(Name = "Thermal Imaging Optic")]
        Thermal,
        [Display(Name = "Night Vision Optic")]
        NightVision
    }
}
