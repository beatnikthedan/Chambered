namespace Chambered.Core.Services.Models
{
    /// <summary>
    /// Represents physical file storage outcome metadata.
    /// </summary>
    public record FileMetadata(
        string StorageKey,
        string ContentType,
        long SizeInBytes,
        string Hash
    );
}
