using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    public enum OpticFocalPlane
    {
        [Display(Name = "None")]
        None = 0,

        [Display(Name = "First Focal Plane (FFP)")]
        Ffp = 1,

        [Display(Name = "Second Focal Plane (SFP)")]
        Sfp = 2
    }
}
