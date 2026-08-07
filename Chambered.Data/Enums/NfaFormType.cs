using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Represents the various ATF National Firearms Act (NFA) form types.
    /// </summary>
    public enum NfaFormType
    {
        /// <summary>
        /// Application to Make and Register a Firearm.
        /// </summary>
        [Display(Name = "Form 1 (Application to Make/Register)")]
        Form1,

        /// <summary>
        /// Notice of Firearms Manufactured or Imported.
        /// </summary>
        [Display(Name = "Form 2 (Notice of Manufacture/Import)")]
        Form2,

        /// <summary>
        /// Application for Tax-Exempt Transfer and Registration of Firearm.
        /// </summary>
        [Display(Name = "Form 3 (Tax-Exempt Dealer Transfer)")]
        Form3,

        /// <summary>
        /// Application for Tax-Paid Transfer and Registration of Firearm.
        /// </summary>
        [Display(Name = "Form 4 (Tax-Paid Individual Transfer)")]
        Form4,

        /// <summary>
        /// Application for Tax-Exempt Transfer and Registration of Firearm (Involuntary/Government).
        /// </summary>
        [Display(Name = "Form 5 (Tax-Exempt Individual/Gov Transfer)")]
        Form5,

        /// <summary>
        /// Application for Authorization to Export Firearms.
        /// </summary>
        [Display(Name = "Form 9 (Authorization to Export)")]
        Form9,

        /// <summary>
        /// Application for Registration of Firearms Acquired by Certain Governmental Entities.
        /// </summary>
        [Display(Name = "Form 10 (Government Acquisition Registration)")]
        Form10
    }
}
