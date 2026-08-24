using Asp.Versioning;
using Chambered.Core.Services.Identity;
using Chambered.Core.Services.Identity.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chambered.Api.Controllers.Identity
{
    /// <summary>
    /// Provides endpoints for managing API keys, including creation, retrieval, and revocation.
    /// </summary>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ApiKeyController : ControllerBase
    {
        private readonly IApiKeyService _apiKeyService;

        /// <summary>
        /// Initializes a new instance of the <see cref="ApiKeyController"/> class.
        /// </summary>
        public ApiKeyController(IApiKeyService apiKeyService)
        {
            _apiKeyService = apiKeyService ?? throw new ArgumentNullException(nameof(apiKeyService));
        }

        /// <summary>
        /// Generates and stores a new API key for the authenticated user.
        /// </summary>
        [HttpPost("create")]
        [ProducesResponseType(typeof(ApiKeyCreatedResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Create([FromBody] CreateApiKeyDto dto)
        {
            try
            {
                var result = await _apiKeyService.CreateKeyAsync(dto, User).ConfigureAwait(false);
                return Ok(result);
            }
            catch (ArgumentNullException ex)
            {
                return Problem(
                    detail: ex.Message,
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Invalid Request"
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(
                    detail: ex.Message,
                    statusCode: StatusCodes.Status404NotFound,
                    title: "User Not Found"
                );
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(
                    detail: ex.Message,
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Insufficient Permissions"
                );
            }
        }

        /// <summary>
        /// Retrieves all active, non-revoked API keys belonging to the authenticated user.
        /// </summary>
        [HttpGet("my-keys")]
        [ProducesResponseType(typeof(IEnumerable<ApiKeySummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetMyKeys()
        {
            try
            {
                var keys = await _apiKeyService.GetKeysForUserAsync(User).ConfigureAwait(false);
                return Ok(keys);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(
                    detail: ex.Message,
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized"
                );
            }
        }

        /// <summary>
        /// Retrieves all active, non-revoked API keys in the system.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("all-keys")]
        [ProducesResponseType(typeof(IEnumerable<ApiKeyDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetAllKeys()
        {
            var keys = await _apiKeyService.GetAllSystemKeysAsync(User).ConfigureAwait(false);
            return Ok(keys);
        }

        /// <summary>
        /// Marks a specific API key as revoked to prevent further use.
        /// </summary>
        [HttpPost("revoke/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Revoke(int id)
        {
            try
            {
                var wasRevoked = await _apiKeyService.RevokeKeyAsync(id, User).ConfigureAwait(false);
                if (!wasRevoked)
                {
                    return Ok(new { Message = "API Key was already revoked." });
                }

                return Ok(new { Message = "API Key has been revoked." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Problem(
                    detail: ex.Message,
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized"
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Problem(
                    detail: ex.Message,
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Key Not Found"
                );
            }
        }
    }
}
