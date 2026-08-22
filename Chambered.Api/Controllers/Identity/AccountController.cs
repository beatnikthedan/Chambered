using Asp.Versioning;
using Chambered.Core.Services.Identity;
using Chambered.Core.Services.Identity.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Chambered.Api.Controllers.Identity
{
    /// <summary>
    /// Handles user account operations including authentication, password management, and Single Sign-On (SSO) integration.
    /// </summary>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces("application/json")]
    public class AccountController : ControllerBase
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly IFederatedAuthService _federatedAuthService;

        /// <summary>
        /// Initializes a new instance of the <see cref="AccountController"/> class.
        /// </summary>
        public AccountController(
            IAuthenticationService authenticationService,
            IFederatedAuthService federatedAuthService)
        {
            _authenticationService = authenticationService ?? throw new ArgumentNullException(nameof(authenticationService));
            _federatedAuthService = federatedAuthService ?? throw new ArgumentNullException(nameof(federatedAuthService));
        }

        /// <summary>
        /// Authenticates a user with a local username and password, returning a JWT token upon success.
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthenticationResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto model)
        {
            if (model == null)
            {
                return BadRequest("Login credentials cannot be null.");
            }

            try
            {
                var result = await _authenticationService.LoginAsync(model).ConfigureAwait(false);
                if (result != null)
                {
                    return Ok(result);
                }

                return Unauthorized("Invalid login credentials.");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        /// <summary>
        /// Revokes the current active session, invalidating the authorization token.
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> Logout()
        {
            var userId = User.Identity?.Name;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            await _authenticationService.LogoutAsync(userId).ConfigureAwait(false);
            return Ok();
        }

        /// <summary>
        /// Initiates a secure password reset request, sending a verification link to the specified email address.
        /// </summary>
        [HttpPost("forgot-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto model)
        {
            if (model == null)
            {
                return BadRequest("Forgot password request cannot be null.");
            }

            await _authenticationService.InitiateForgotPasswordAsync(model).ConfigureAwait(false);
            return Ok();
        }

        /// <summary>
        /// Completes a password reset flow, applying the new password using the verified reset token.
        /// </summary>
        [HttpPost("reset-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto model)
        {
            if (model == null)
            {
                return BadRequest("Reset password request cannot be null.");
            }

            await _authenticationService.ResetPasswordAsync(model).ConfigureAwait(false);
            return Ok();
        }

        /// <summary>
        /// Initiates an OIDC Single Sign-On challenge by executing the business logic service and returning a browser challenge redirect.
        /// </summary>
        [HttpGet("external-challenge")]
        [AllowAnonymous]
        public async Task<IActionResult> PrepareChallenge([FromQuery] string providerName, [FromQuery] string redirectUri)
        {
            if (string.IsNullOrWhiteSpace(providerName) || string.IsNullOrWhiteSpace(redirectUri))
            {
                return BadRequest("Provider name and redirect URI are required.");
            }

            // Keep the service call intact
            var result = await _federatedAuthService.PrepareChallengeAsync(providerName, redirectUri).ConfigureAwait(false);

            // Reconstruct the ASP.NET Core AuthenticationProperties from the DTO returned by the service
            var properties = new Microsoft.AspNetCore.Authentication.AuthenticationProperties(
                result.Properties.ToDictionary(kvp => kvp.Key, kvp => (string?)kvp.Value)
            );

            // Issue the HTTP 302 Redirect to the OIDC provider
            return Challenge(properties, result.Scheme);
        }

        /// <summary>
        /// Handles Single Sign-On callbacks, returning local session tokens.
        /// </summary>
        [HttpPost("external-callback")]
        [ProducesResponseType(typeof(FederatedLoginResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> HandleCallback([FromQuery] string providerName, [FromBody] ExternalIdentityDto externalInfo)
        {
            if (string.IsNullOrWhiteSpace(providerName) || externalInfo == null)
            {
                return BadRequest("Provider name and external identity metadata are required.");
            }

            var result = await _federatedAuthService.HandleCallbackAsync(providerName, externalInfo).ConfigureAwait(false);
            if (result.IsSuccess)
            {
                return Ok(result);
            }

            return BadRequest(result.ErrorMessage);
        }

        /// <summary>
        /// Links an existing authenticated local user account to an external SSO provider login credential.
        /// </summary>
        [HttpPost("link-external")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> LinkExternal([FromQuery] string userId, [FromBody] ExternalIdentityDto externalInfo)
        {
            if (string.IsNullOrWhiteSpace(userId) || externalInfo == null)
            {
                return BadRequest("User ID and external identity metadata are required.");
            }

            await _federatedAuthService.LinkAccountAsync(userId, externalInfo).ConfigureAwait(false);
            return Ok();
        }

        /// <summary>
        /// Retrieves the list of configured external OIDC Single Sign-On (SSO) identity provider names.
        /// </summary>
        [HttpGet("providers")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        public IActionResult GetConfiguredProviders()
        {
            var providers = _federatedAuthService.GetConfiguredProviders();
            return Ok(providers);
        }

        /// <summary>
        /// Checks whether the system has been initialized with at least one user account.
        /// </summary>
        [HttpGet("is-initialized")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        public async Task<IActionResult> IsInitialized()
        {
            var isInitialized = await _authenticationService.IsInitializedAsync().ConfigureAwait(false);
            return Ok(new { IsInitialized = isInitialized });
        }
    }
}
