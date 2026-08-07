using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    public enum SuppressorAttachmentType
    {
        [Display(Name = "Direct Thread")]
        DirectThread,
        [Display(Name = "Quick Detach (QD)")]
        QuickDetach,
        [Display(Name = "3-Lug (Tri-Lug)")]
        TriLug,
        [Display(Name = "ASR Mount")]
        ASR,
        [Display(Name = "KeyMo Mount")]
        KeyMo
    }
}
