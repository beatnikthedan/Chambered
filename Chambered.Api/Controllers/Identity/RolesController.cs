using Asp.Versioning;
using Chambered.Core.Services.Identity;
using Chambered.Core.Services.Identity.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chambered.Api.Controllers.Identity
{
    /// <summary>
    /// Handles roles and role-claims mapping management.
    /// </summary>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Authorize(Roles = "Admin")]
    [Produces("application/json")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        /// <summary>
        /// Initializes a new instance of the <see cref="RolesController"/> class.
        /// </summary>
        public RolesController(IRoleService roleService)
        {
            _roleService = roleService ?? throw new ArgumentNullException(nameof(roleService));
        }

        /// <summary>
        /// Retrieves the list of all available system permissions configured in Chambered.
        /// </summary>
        [HttpGet("permissions")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSystemPermissions()
        {
            var permissions = await _roleService.GetAllSystemPermissionsAsync().ConfigureAwait(false);
            return Ok(permissions);
        }

        /// <summary>
        /// Retrieves the list of all defined roles in the system.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<RoleResponseDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _roleService.GetAllRolesAsync().ConfigureAwait(false);
            return Ok(roles);
        }

        /// <summary>
        /// Creates a brand new system role.
        /// </summary>
        [HttpPost("{roleName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateRole([FromRoute] string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return BadRequest("Role name cannot be empty.");
            }

            await _roleService.CreateRoleAsync(roleName).ConfigureAwait(false);
            return Ok();
        }

        /// <summary>
        /// Deletes an existing system role.
        /// </summary>
        [HttpDelete("{roleName}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteRole([FromRoute] string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return BadRequest("Role name must be specified.");
            }

            await _roleService.DeleteRoleAsync(roleName).ConfigureAwait(false);
            return Ok();
        }

        /// <summary>
        /// Retrieves the exact permissions mapped to a specific system role.
        /// </summary>
        [HttpGet("{roleName}/claims")]
        [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetRoleClaims([FromRoute] string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return BadRequest("Role name is required.");
            }

            var claims = await _roleService.GetClaimsForRoleAsync(roleName).ConfigureAwait(false);
            return Ok(claims);
        }

        /// <summary>
        /// Updates the set of permission claims assigned to a specific system role.
        /// </summary>
        [HttpPost("{roleName}/claims")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateRoleClaims([FromRoute] string roleName, [FromBody] IEnumerable<string> claims)
        {
            if (string.IsNullOrWhiteSpace(roleName) || claims == null)
            {
                return BadRequest("Role name and claim permissions list are required.");
            }

            await _roleService.SyncClaimsToRoleAsync(roleName, claims).ConfigureAwait(false);
            return Ok();
        }
    }
}
