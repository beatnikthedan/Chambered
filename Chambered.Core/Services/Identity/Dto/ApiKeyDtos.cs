using System;
using System.Collections.Generic;

namespace Chambered.Core.Services.Identity.Dto
{
    /// <summary>
    /// Data transfer object containing parameters needed to generate a new API key.
    /// </summary>
    public record CreateApiKeyDto(
        string Name,
        DateTimeOffset? ExpiresAt,
        IEnumerable<string> Claims,
        string? UserId
    );

    /// <summary>
    /// Data transfer object containing the plaintext API key returned once upon creation.
    /// </summary>
    public record ApiKeyCreatedResponseDto(
        string Name,
        string PlainTextKey,
        DateTimeOffset CreatedAt,
        DateTimeOffset? ExpiresAt
    );

    /// <summary>
    /// Data transfer object representing a basic summary of an active API key.
    /// </summary>
    public record ApiKeySummaryDto(
        int Id,
        string Name,
        DateTimeOffset CreatedAt,
        DateTimeOffset? ExpiresAt
    );

    /// <summary>
    /// Data transfer object representing the complete details of an API key, including permissions.
    /// </summary>
    public record ApiKeyDetailDto(
        int Id,
        string Name,
        string OwnerId,
        DateTimeOffset CreatedAt,
        DateTimeOffset? ExpiresAt,
        IEnumerable<string> Claims
    );
}
