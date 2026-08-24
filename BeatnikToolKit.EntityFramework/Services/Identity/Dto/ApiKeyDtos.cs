namespace BeatnikToolKit.EntityFramework.Services.Identity.Dto
{
    /// <summary>
    /// Data transfer object containing parameters needed to generate a new API key.
    /// </summary>
    public record CreateApiKeyDto(
        string Name,
        DateTime? ExpiresAt,
        IEnumerable<string> Claims,
        string? UserId
    );

    /// <summary>
    /// Data transfer object containing the plaintext API key returned once upon creation.
    /// </summary>
    public record ApiKeyCreatedResponseDto(
        string Name,
        string PlainTextKey,
        DateTime CreatedAt,
        DateTime? ExpiresAt
    );

    /// <summary>
    /// Data transfer object representing a basic summary of an active API key.
    /// </summary>
    public record ApiKeySummaryDto(
        int Id,
        string Name,
        DateTime CreatedAt,
        DateTime? ExpiresAt
    );

    /// <summary>
    /// Data transfer object representing the complete details of an API key, including permissions.
    /// </summary>
    public record ApiKeyDetailDto(
        int Id,
        string Name,
        string OwnerId,
        DateTime CreatedAt,
        DateTime? ExpiresAt,
        IEnumerable<string> Claims
    );
}
