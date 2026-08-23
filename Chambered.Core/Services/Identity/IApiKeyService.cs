using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Chambered.Core.Services.Identity.Dto;

namespace Chambered.Core.Services.Identity
{
    /// <summary>
    /// Service contract for handling system-to-system/machine integration API keys, 
    /// secure SHA-256 cryptographic validations, permissions, and revocations.
    /// </summary>
    public interface IApiKeyService
    {
        /// <summary>
        /// Generates and cryptographically stores a new API key, verifying requested claims.
        /// </summary>
        Task<ApiKeyCreatedResponseDto> CreateKeyAsync(CreateApiKeyDto dto, ClaimsPrincipal currentUser);

        /// <summary>
        /// Retrieves all active, non-revoked API keys belonging to the authenticated user.
        /// </summary>
        Task<IEnumerable<ApiKeySummaryDto>> GetKeysForUserAsync(ClaimsPrincipal currentUser);

        /// <summary>
        /// Administrative query to retrieve all API keys in the system.
        /// </summary>
        Task<IEnumerable<ApiKeyDetailDto>> GetAllSystemKeysAsync(ClaimsPrincipal currentUser);

        /// <summary>
        /// Marks a specific API key as revoked to prevent any future use.
        /// </summary>
        Task<bool> RevokeKeyAsync(int id, ClaimsPrincipal currentUser);
    }
}
