using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    public enum OpticReticle
    {
        [Display(Name = "None")]
        None = 0,

        [Display(Name = "Red Dot (Simple)")]
        RedDot = 1,

        [Display(Name = "Circle Dot")]
        CircleDot = 2,

        [Display(Name = "Duplex")]
        Duplex = 3,

        [Display(Name = "Mil-Dot")]
        MilDot = 4,

        [Display(Name = "Bdc (Bullet Drop Compensating)")]
        Bdc = 5,

        [Display(Name = "Christmas Tree (Grid)")]
        ChristmasTree = 6,

        [Display(Name = "Chevron")]
        Chevron = 7,

        [Display(Name = "German #4")]
        GermanNo4 = 8
    }
}
