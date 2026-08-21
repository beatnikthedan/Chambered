using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Chambered.Core.Services.Identity;
using Chambered.Core.Services.Identity.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Chambered.Api.Controllers.Identity
{
    /// <summary>
    /// Handles user profiles, role assignments, registrations, and administrative user account operations.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class UsersController : ControllerBase
    {
        private readonly IIdentityService _identityService;

        /// <summary>
        /// Initializes a new instance of the <see cref="UsersController"/> class.
        /// </summary>
        public UsersController(IIdentityService identityService)
        {
            _identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        }

        /// <summary>
        /// Registers a brand new user account within the Chambered identity store.
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] CreateUserRequestDto model)
        {
            if (model == null)
            {
                return BadRequest("Registration payload cannot be null.");
            }

            try
            {
                var result = await _identityService.CreateUserAsync(model).ConfigureAwait(false);
                if (result != null)
                {
                    return Ok(result);
                }

                return BadRequest("User registration failed.");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Fetches the profile details of the currently authenticated user.
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var profile = await _identityService.GetUserByIdAsync(userId).ConfigureAwait(false);
            if (profile == null)
            {
                return NotFound("User profile not found.");
            }

            return Ok(profile);
        }

        /// <summary>
        /// Updates the profile data of the currently authenticated user.
        /// </summary>
        [HttpPut("profile")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserRequestDto model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            if (model == null)
            {
                return BadRequest("Profile update content cannot be null.");
            }

            await _identityService.UpdateUserAsync(userId, model).ConfigureAwait(false);
            return Ok();
        }

        /// <summary>
        /// Fetches all registered users within the system (Admin only).
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(IEnumerable<UserResponseDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _identityService.GetAllUsersAsync().ConfigureAwait(false);
            return Ok(users);
        }

        /// <summary>
        /// Administers a full update of another user's account properties (Admin only).
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateUser([FromRoute] string id, [FromBody] UpdateUserRequestDto model)
        {
            if (string.IsNullOrWhiteSpace(id) || model == null)
            {
                return BadRequest("Invalid route parameter or empty user model identity.");
            }

            await _identityService.UpdateUserAsync(id, model).ConfigureAwait(false);
            return Ok();
        }

        /// <summary>
        /// Deletes a user account from the identity repository (Admin only).
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteUser([FromRoute] string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest("User ID must be specified.");
            }

            await _identityService.DeleteUserAsync(id).ConfigureAwait(false);
            return Ok();
        }
    }
}
