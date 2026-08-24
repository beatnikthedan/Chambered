using BeatnikToolKit.EntityFramework.LogMessages;
using BeatnikToolKit.EntityFramework.Services.Identity.Dto;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace BeatnikToolKit.EntityFramework.Services.Identity
{
    /// <inheritdoc cref="IRoleService"/>
    public class RoleService(
        RoleManager<IdentityRole> roleManager,
        ILogger<RoleService> logger) : IRoleService
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
        private readonly ILogger<RoleService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        private readonly RoleServiceLogMessages _log = new RoleServiceLogMessages(logger);

        /// <inheritdoc/>
        public async Task CreateRoleAsync(string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                throw new ArgumentException("Role name cannot be null or empty.", nameof(roleName));
            }

            _log.CreationInitiated(roleName);

            var existingRole = await _roleManager.FindByNameAsync(roleName).ConfigureAwait(false);
            if (existingRole != null)
            {
                throw new InvalidOperationException($"Role '{roleName}' already exists.");
            }

            var result = await _roleManager.CreateAsync(new IdentityRole(roleName)).ConfigureAwait(false);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to create role: {errors}");
            }

            _log.CreatedSuccessfully(roleName);
        }

        /// <inheritdoc/>
        public async Task DeleteRoleAsync(string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                throw new ArgumentException("Role name cannot be null or empty.", nameof(roleName));
            }

            _log.DeletionInitiated(roleName);

            var role = await _roleManager.FindByNameAsync(roleName).ConfigureAwait(false);
            if (role == null)
            {
                throw new KeyNotFoundException($"Role '{roleName}' was not found.");
            }

            var result = await _roleManager.DeleteAsync(role).ConfigureAwait(false);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to delete role: {errors}");
            }

            _log.DeletedSuccessfully(roleName);
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<RoleResponseDto>> GetAllRolesAsync()
        {
            var roles = await _roleManager.Roles
                .OrderBy(r => r.Name)
                .ToListAsync()
                .ConfigureAwait(false);

            var roleResponseDtos = new List<RoleResponseDto>();
            foreach (var role in roles)
            {
                var claims = await _roleManager.GetClaimsAsync(role).ConfigureAwait(false);
                roleResponseDtos.Add(new RoleResponseDto(
                    role.Name ?? string.Empty,
                    claims.Select(c => c.Value).ToList()
                ));
            }

            return roleResponseDtos;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<string>> GetClaimsForRoleAsync(string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                throw new ArgumentException("Role name cannot be null or empty.", nameof(roleName));
            }

            var role = await _roleManager.FindByNameAsync(roleName).ConfigureAwait(false);
            if (role == null)
            {
                throw new KeyNotFoundException($"Role '{roleName}' was not found.");
            }

            var claims = await _roleManager.GetClaimsAsync(role).ConfigureAwait(false);
            return claims.Select(c => c.Value).ToList();
        }

        /// <inheritdoc/>
        public async Task SyncClaimsToRoleAsync(string roleName, IEnumerable<string> permissions)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                throw new ArgumentException("Role name cannot be null or empty.", nameof(roleName));
            }
            if (permissions == null)
            {
                throw new ArgumentNullException(nameof(permissions));
            }

            _log.SyncingClaimsToRole(roleName);

            var role = await _roleManager.FindByNameAsync(roleName).ConfigureAwait(false);
            if (role == null)
            {
                throw new KeyNotFoundException($"Role '{roleName}' was not found.");
            }

            var existingClaims = await _roleManager.GetClaimsAsync(role).ConfigureAwait(false);
            var existingValues = existingClaims.Select(c => c.Value).ToHashSet();
            var targetValues = permissions.ToHashSet();

            var claimsToAdd = targetValues.Except(existingValues).ToList();
            var claimsToRemove = existingClaims.Where(c => !targetValues.Contains(c.Value)).ToList();

            foreach (var claim in claimsToRemove)
            {
                var result = await _roleManager.RemoveClaimAsync(role, claim).ConfigureAwait(false);
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException($"Failed to remove stale claim '{claim.Value}' from role '{roleName}'.");
                }
            }

            foreach (var permission in claimsToAdd)
            {
                var newClaim = new Claim(ClaimTypes.Role, permission);
                var result = await _roleManager.AddClaimAsync(role, newClaim).ConfigureAwait(false);
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException($"Failed to assign claim '{permission}' to role '{roleName}'.");
                }
            }

            _log.RoleClaimsSynchronized(roleName, claimsToAdd.Count, claimsToRemove.Count);
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<string>> GetAllSystemPermissionsAsync()
        {
            var roles = await _roleManager.Roles.ToListAsync().ConfigureAwait(false);
            var allPermissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var role in roles)
            {
                var claims = await _roleManager.GetClaimsAsync(role).ConfigureAwait(false);
                foreach (var claim in claims)
                {
                    if (!string.IsNullOrWhiteSpace(claim.Value))
                    {
                        allPermissions.Add(claim.Value);
                    }
                }
            }

            return allPermissions;
        }
    }
}
