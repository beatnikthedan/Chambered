using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    public enum BatteryType
    {
        [Display(Name = "Unknown Battery")]
        Unknown,
        [Display(Name = "CR123A Lithium")]
        Cr123A,
        [Display(Name = "CR2 Lithium")]
        Cr2,
        [Display(Name = "CR2032 Coin Cell")]
        Cr2032,
        [Display(Name = "AA Alkaline/Lithium")]
        Aa,
        [Display(Name = "AAA Alkaline/Lithium")]
        Aaa,
        [Display(Name = "18650 Li-Ion Rechargeable")]
        LiIon18650,
        [Display(Name = "18350 Li-Ion Rechargeable")]
        LiIon18350,
        [Display(Name = "Integrated USB Rechargeable")]
        IntegratedRechargeable
    }
}
