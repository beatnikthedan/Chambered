using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the physical condition rating of an armory item based on Bluebook percentage condition values.
    /// </summary>
    public enum ItemCondition
    {
        [Display(Name = "Unknown Condition")]
        Unknown = 0,
        [Display(Name = "New / Unfired (100%)")]
        Unfired = 100,
        [Display(Name = "Excellent (98%)")]
        Excellent = 98,
        [Display(Name = "Very Good (95%)")]
        VeryGood = 95,
        [Display(Name = "Good (90%)")]
        Good = 90,
        [Display(Name = "Fair (80%)")]
        Fair = 80,
        [Display(Name = "Serviceable (70%)")]
        Serviceable = 70,
        [Display(Name = "Poor (60%)")]
        Poor = 60,
        [Display(Name = "Salvage (50%)")]
        Salvage = 50,
    }
}
