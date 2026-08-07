using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the primary functional classification of a product.
    /// </summary>
    public enum PewPewCategory
    {
        [Display(Name = "Handgun")]
        Handgun = 0,
        [Display(Name = "Rifle")]
        Rifle = 1,
        [Display(Name = "Shotgun")]
        Shotgun = 2,
        [Display(Name = "Rimfire")]
        Rimfire = 3,
        [Display(Name = "Pistol Caliber Carbine")]
        PistolCaliberCarbine = 4,
        [Display(Name = "Receiver Only")]
        ReceiverOnly = 5,
        [Display(Name = "NFA Class III")]
        NfaItem = 6,
        [Display(Name = "Precision Long Range")]
        PrecisionLongRange = 7,
        [Display(Name = "Competition")]
        Competition = 8,
        [Display(Name = "Curio & Relic")]
        CurioAndRelic = 9
    }
}
