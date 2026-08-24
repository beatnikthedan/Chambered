using Chambered.Core.Services.Identity;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Core.Utility;
using Chambered.Data;
using Chambered.Data.Models;
using Chambered.Infrastructure.LogMessages.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Chambered.Infrastructure.Services.Identity
{
    /// <inheritdoc cref="IApiKeyService"/>
    public class ApiKeyService : IApiKeyService
    {
        private readonly ChamberedDbContext _db;
        private readonly UserManager<ChamberedUser> _userManager;
        private readonly ILogger<ApiKeyService> _logger;
        private readonly ApiKeyServiceLogMessages _log;

        /// <summary>
        /// Initializes a new instance of the <see cref="ApiKeyService"/> class.
        /// </summary>
        public ApiKeyService(
            ChamberedDbContext db,
            UserManager<ChamberedUser> userManager,
            ILogger<ApiKeyService> logger)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _log = new ApiKeyServiceLogMessages(logger);
        }

        /// <inheritdoc/>
        public async Task<ApiKeyCreatedResponseDto> CreateKeyAsync(CreateApiKeyDto dto, ClaimsPrincipal currentUser)
        {
            if (dto == null)
            {
                throw new ArgumentNullException(nameof(dto), "The request body could not be parsed.");
            }

            var currentUserId = _userManager.GetUserId(currentUser) ?? "Unknown";
            string userId;

            if (!string.IsNullOrEmpty(dto.UserId))
            {
                var targetUser = await _userManager.FindByIdAsync(dto.UserId).ConfigureAwait(false);
                if (targetUser == null)
                {
                    throw new KeyNotFoundException($"User with ID '{dto.UserId}' was not found.");
                }
                userId = dto.UserId;
            }
            else
            {
                userId = currentUserId;
                if (userId == "Unknown")
                {
                    throw new UnauthorizedAccessException("The authenticated user identity could not be resolved.");
                }
            }

            _log.CreationInitiated(dto.Name, userId, currentUserId);

            var isGlobalAdmin = currentUser.HasClaim(c => c.Type == ClaimTypes.Role && c.Value == "Admin")
                                || currentUser.IsInRole("Admin");

            if (!isGlobalAdmin && dto.Claims != null)
            {
                foreach (var requestedClaim in dto.Claims)
                {
                    if (!currentUser.HasClaim(c => c.Type == ClaimTypes.Role && c.Value == requestedClaim) && !currentUser.IsInRole(requestedClaim))
                    {
                        _log.UnauthorizedDelegation(currentUserId, requestedClaim, dto.Name);
                        throw new UnauthorizedAccessException($"You cannot grant the permission '{requestedClaim}' because you do not possess it.");
                    }
                }
            }

            var (rawKey, hash) = ApiKeyGenerator.CreateKey();

            var apiKey = new ApiKey
            {
                Name = dto.Name,
                KeyHash = hash,
                OwnerId = userId,
                ExpiresAt = dto.ExpiresAt,
                IsRevoked = false,
                Claims = dto.Claims?.Select(r => new ApiKeyClaim
                {
                    Type = ClaimTypes.Role,
                    Value = r
                }).ToList() ?? new List<ApiKeyClaim>()
            };

            _db.ApiKeys.Add(apiKey);
            await _db.SaveChangesAsync().ConfigureAwait(false);

            _log.KeyCreated(apiKey.Name, apiKey.Id, apiKey.OwnerId);

            return new ApiKeyCreatedResponseDto(
                dto.Name,
                rawKey,
                apiKey.CreatedAt,
                apiKey.ExpiresAt
            );
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<ApiKeySummaryDto>> GetKeysForUserAsync(ClaimsPrincipal currentUser)
        {
            var userId = _userManager.GetUserId(currentUser);
            if (userId == null)
            {
                throw new UnauthorizedAccessException("The authenticated user identity could not be resolved.");
            }

            _log.RetrievingKeys(userId);

            var keys = await _db.ApiKeys
                .AsNoTracking()
                .Where(k => k.OwnerId == userId && !k.IsRevoked)
                .ToListAsync()
                .ConfigureAwait(false);

            return keys.Select(k => new ApiKeySummaryDto(k.Id, k.Name, k.CreatedAt, k.ExpiresAt));
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<ApiKeyDetailDto>> GetAllSystemKeysAsync(ClaimsPrincipal currentUser)
        {
            var adminId = _userManager.GetUserId(currentUser) ?? "Unknown";

            _log.RetrievingAllKeys(adminId);

            var keys = await _db.ApiKeys
                .AsNoTracking()
                .Include(k => k.Claims)
                .Where(k => !k.IsRevoked)
                .ToListAsync()
                .ConfigureAwait(false);

            return keys.Select(k => new ApiKeyDetailDto(
                k.Id,
                k.Name,
                k.OwnerId,
                k.CreatedAt,
                k.ExpiresAt,
                k.Claims.Select(c => c.Value).ToList()
            ));
        }

        /// <inheritdoc/>
        public async Task<bool> RevokeKeyAsync(int id, ClaimsPrincipal currentUser)
        {
            var userId = _userManager.GetUserId(currentUser);
            if (userId == null)
            {
                throw new UnauthorizedAccessException("The authenticated user identity could not be resolved.");
            }

            _log.RevocationRequested(userId, id.ToString());

            // Admins can revoke any key; users can only revoke their own keys
            var isGlobalAdmin = currentUser.HasClaim(c => c.Type == ClaimTypes.Role && c.Value == "Admin")
                                || currentUser.IsInRole("Admin");

            var apiKey = await _db.ApiKeys
                .FirstOrDefaultAsync(k => k.Id == id && (isGlobalAdmin || k.OwnerId == userId))
                .ConfigureAwait(false);

            if (apiKey == null)
            {
                throw new KeyNotFoundException($"API Key with ID {id} not found or access denied.");
            }

            if (apiKey.IsRevoked)
            {
                _log.AlreadyRevoked(id.ToString());
                return false;
            }

            apiKey.IsRevoked = true;
            await _db.SaveChangesAsync().ConfigureAwait(false);

            _log.RevocationSuccess(id.ToString());

            return true;
        }
    }
}
