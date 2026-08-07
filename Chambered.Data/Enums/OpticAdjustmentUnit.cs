using System;
using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    [Flags]
    public enum OpticAdjustmentUnit
    {
        [Display(Name = "None")]
        None = 0,

        [Display(Name = "MOA")]
        Moa = 1,

        [Display(Name = "MRAD (Mil)")]
        Mrad = 2,

        [Display(Name = "IPHY")]
        Iphy = 4
    }
}
