using System;

namespace Chambered.Api.Dto
{
    /// <summary>
    /// API projection for product documents.
    /// </summary>
    public class ProductDocumentDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public bool IsEncrypted { get; set; }
        public DateTimeOffset UploadedAt { get; set; }
    }

    /// <summary>
    /// API projection for armory item documents.
    /// </summary>
    public class ArmoryItemDocumentDto
    {
        public int Id { get; set; }
        public int ArmoryItemId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public bool IsEncrypted { get; set; }
        public DateTimeOffset UploadedAt { get; set; }
    }
}
