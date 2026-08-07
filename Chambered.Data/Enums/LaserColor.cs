using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    public enum LaserColor
    {
        [Display(Name = "None")]
        None,
        [Display(Name = "Visible Red")]
        Red,
        [Display(Name = "Visible Green")]
        Green,
        [Display(Name = "Infrared (IR)")]
        Infrared
    }
}
