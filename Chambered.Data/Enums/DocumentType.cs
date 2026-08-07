using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the classification of an embedded or attached reference document.
    /// </summary>
    public enum DocumentType
    {
        [Display(Name = "Owner's Manual")]
        OwnerManual = 0,
        [Display(Name = "Parts Diagram / Schematic")]
        PartsDiagram = 1,
        [Display(Name = "Warranty Document")]
        WarrantyDocument = 2,
        [Display(Name = "Recall Notice")]
        RecallNotice = 3,
        [Display(Name = "Spec Sheet")]
        SpecSheet = 4,
        [Display(Name = "Tax Stamp / NFA Form")]
        TaxStamp = 5,
        [Display(Name = "Receipt or Invoice")]
        ReceiptOrInvoice = 6,
        [Display(Name = "Other Document")]
        Other = 7
    }
}
