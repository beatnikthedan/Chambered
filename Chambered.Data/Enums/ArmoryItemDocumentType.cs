using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the classification of an embedded or attached reference document.
    /// </summary>
    public enum ArmoryItemDocumentType
    {
        [Display(Name = "Unknown")]
        Unknown,
        [Display(Name = "Picture")]
        Picture,
        [Display(Name = "Tax Stamp")]
        TaxStamp,
        [Display(Name = "Receipt")]
        ReceiptOrInvoice,
    }
}
