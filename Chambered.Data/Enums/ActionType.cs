using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the mechanical operating action type of a firearm.
    /// </summary>
    public enum ActionType
    {
        [Display(Name = "Unknown")]
        Unknown,
        [Display(Name = "Semi-Automatic")]
        SemiAutomatic,
        [Display(Name = "Bolt Action")]
        BoltAction,
        [Display(Name = "Lever Action")]
        LeverAction2,
        [Display(Name = "Pump Action")]
        PumpAction,
        [Display(Name = "Revolver")]
        Revolver,
        [Display(Name = "Break Action")]
        BreakAction,
        [Display(Name = "Single Shot")]
        SingleShot,
        [Display(Name = "Full-Automatic")]
        FullAutomatic
    }
}
