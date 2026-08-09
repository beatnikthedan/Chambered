using Chambered.Data.Enums;

namespace Chambered.Data.Interfaces
{
    public interface IHasNfa
    {
        /// <summary>
        /// Gets or sets the specific NFA form type for the application.
        /// </summary>
        NfaFormType NfaFormType { get; set; }

        /// <summary>
        /// Gets or sets the URL or file path for the approved NFA tax stamp document image or PDF.
        /// </summary>
        string? TaxStampDocumentUrl { get; set; }

        /// <summary>
        /// Gets or sets the date the NFA tax stamp was officially approved.
        /// </summary>
        DateTime? StampApprovalDate { get; set; }
    }
}
