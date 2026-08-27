using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the classification of an embedded or attached reference document.
    /// </summary>
    public enum ProductDocumentType
    {
        [Display(Name = "Unknown")]
        Unknown,
        [Display(Name = "Owner's Manual")]
        OwnerManual,
        [Display(Name = "Schematic")]
        PartsDiagram,
        [Display(Name = "Warranty")]
        WarrantyDocument,
        [Display(Name = "Recall Notice")]
        RecallNotice,
        [Display(Name = "Spec Sheet")]
        SpecSheet,
        [Display(Name = "Product Image")]
        ProductImage,
    }
}
