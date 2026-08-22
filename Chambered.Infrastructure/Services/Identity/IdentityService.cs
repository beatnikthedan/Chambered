using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Chambered.Core.Services.Identity;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Chambered.Infrastructure.LogMessages.Identity;

namespace Chambered.Infrastructure.Services.Identity
{
    /// <inheritdoc cref="IIdentityService"/>
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ChamberedUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ChamberedDbContext _db;
        private readonly ILogger<IdentityService> _logger;
        private readonly IdentityServiceLogMessages _log;

        /// <summary>
        /// Initializes a new instance of the <see cref="IdentityService"/> class.
        /// </summary>
        public IdentityService(
            UserManager<ChamberedUser> userManager,
            RoleManager<IdentityRole>? roleManager,
            ChamberedDbContext db,
            ILogger<IdentityService> logger)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _roleManager = roleManager!;
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _log = new IdentityServiceLogMessages(logger);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IdentityService"/> class without a RoleManager (backward-compatible overload for tests).
        /// </summary>
        public IdentityService(
            UserManager<ChamberedUser> userManager,
            ChamberedDbContext db,
            ILogger<IdentityService> logger)
            : this(userManager, null!, db, logger)
        {
        }

        /// <inheritdoc/>
        public async Task<UserResponseDto> CreateUserAsync(CreateUserRequestDto request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            _log.CreationInitiated(request.Email ?? string.Empty, request.Username ?? string.Empty);

            var emailToUse = !string.IsNullOrWhiteSpace(request.Email)
                ? request.Email.Trim()
                : (!string.IsNullOrWhiteSpace(request.Username)
                    ? $"{request.Username.Trim().ToLower()}@chambered.local"
                    : string.Empty);

            var usernameToUse = !string.IsNullOrWhiteSpace(request.Username)
                ? request.Username.Trim()
                : (!string.IsNullOrWhiteSpace(request.FirstName) ? request.FirstName.Trim() : emailToUse);

            var user = new ChamberedUser
            {
                UserName = usernameToUse,
                Email = emailToUse,
                FirstName = request.FirstName,
                LastName = request.LastName,
                EmailConfirmed = true
            };

            var passwordToUse = !string.IsNullOrWhiteSpace(request.Password)
                ? request.Password
                : Guid.NewGuid().ToString("N") + "1!Aa";

            var isFirstUser = !await _db.Users.AnyAsync().ConfigureAwait(false);

            var createResult = await _userManager.CreateAsync(user, passwordToUse).ConfigureAwait(false);

            if (!createResult.Succeeded)
            {
                var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                _log.CreationFailed(request.Email ?? string.Empty, errors);
                throw new InvalidOperationException($"Failed to create user account: {errors}");
            }

            try
            {
                var rolesToAssign = new List<string>();
                if (request.Roles != null && request.Roles.Any())
                {
                    rolesToAssign.AddRange(request.Roles);
                }

                if (isFirstUser && !rolesToAssign.Contains("Admin"))
                {
                    rolesToAssign.Add("Admin");
                }

                if (rolesToAssign.Any() && _roleManager != null)
                {
                    foreach (var roleName in rolesToAssign)
                    {
                        if (!await _roleManager.RoleExistsAsync(roleName).ConfigureAwait(false))
                        {
                            await _roleManager.CreateAsync(new IdentityRole(roleName)).ConfigureAwait(false);
                        }
                    }

                    var roleResult = await _userManager.AddToRolesAsync(user, rolesToAssign).ConfigureAwait(false);
                    if (!roleResult.Succeeded)
                    {
                        var roleErrors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
                        throw new InvalidOperationException($"User created, but role assignment failed: {roleErrors}");
                    }
                }
            }
            catch (Exception ex)
            {
                _log.ExceptionAssigningRoles(ex, request.Email ?? string.Empty);
                await _userManager.DeleteAsync(user).ConfigureAwait(false);
                throw;
            }

            _log.CreatedSuccessfully(request.Email ?? string.Empty, user.Id);

            return new UserResponseDto(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                request.Roles ?? Enumerable.Empty<string>(),
                user.UserName ?? user.Email,
                GetGravatarUrl(user.Email)
            );
        }

        /// <inheritdoc/>
        public async Task<UserResponseDto> GetUserByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(id));
            }

            _log.RetrievingUserById(id);

            var user = await _userManager.FindByIdAsync(id).ConfigureAwait(false);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID '{id}' was not found.");
            }

            var roles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);

            return new UserResponseDto(
                user.Id,
                user.Email ?? string.Empty,
                user.FirstName,
                user.LastName,
                roles,
                user.UserName ?? user.Email,
                GetGravatarUrl(user.Email)
            );
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<UserResponseDto>> GetAllUsersAsync()
        {
            _log.BulkQueryInitiated();

            var users = await _userManager.Users
                .OrderBy(u => u.UserName)
                .ToListAsync()
                .ConfigureAwait(false);

            var userRolesQuery = await _db.UserRoles
                .Join(_db.Roles,
                      ur => ur.RoleId,
                      r => r.Id,
                      (ur, r) => new { ur.UserId, r.Name })
                .ToListAsync()
                .ConfigureAwait(false);

            var rolesGroupedByUser = userRolesQuery
                .GroupBy(ur => ur.UserId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.Name).ToList());

            var userResponseDtos = new List<UserResponseDto>();
            foreach (var user in users)
            {
                rolesGroupedByUser.TryGetValue(user.Id, out var roles);

                userResponseDtos.Add(new UserResponseDto(
                    user.Id,
                    user.Email ?? string.Empty,
                    user.FirstName,
                    user.LastName,
                    roles ?? Enumerable.Empty<string>(),
                    user.UserName ?? user.Email,
                    GetGravatarUrl(user.Email)
                ));
            }

            _log.BulkQueryCompleted(userResponseDtos.Count);

            return userResponseDtos;
        }

        /// <inheritdoc/>
        public async Task UpdateUserAsync(string id, UpdateUserRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(id));
            }
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            _log.UpdateInitiated(request.Email ?? string.Empty, id);

            var user = await _userManager.FindByIdAsync(id).ConfigureAwait(false);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID '{id}' was not found.");
            }

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;
            user.UserName = request.Email;

            var updateResult = await _userManager.UpdateAsync(user).ConfigureAwait(false);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join("; ", updateResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to update identity user details: {errors}");
            }

            var currentRoles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
            var rolesToAdd = request.Roles.Except(currentRoles).ToList();
            var rolesToRemove = currentRoles.Except(request.Roles).ToList();

            if (rolesToAdd.Any())
            {
                await _userManager.AddToRolesAsync(user, rolesToAdd).ConfigureAwait(false);
            }
            if (rolesToRemove.Any())
            {
                await _userManager.RemoveFromRolesAsync(user, rolesToRemove).ConfigureAwait(false);
            }

            _log.UpdateCompleted(id);
        }

        /// <inheritdoc/>
        public async Task DeleteUserAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(id));
            }

            _log.DeletionInitiated(id);

            var user = await _userManager.FindByIdAsync(id).ConfigureAwait(false);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID '{id}' was not found.");
            }

            var deleteResult = await _userManager.DeleteAsync(user).ConfigureAwait(false);
            if (!deleteResult.Succeeded)
            {
                var errors = string.Join("; ", deleteResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to delete user account: {errors}");
            }

            _log.DeletionCompleted(id);
        }

        private static string GetGravatarUrl(string? email)
        {
            if (string.IsNullOrEmpty(email))
                return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

            using var md5 = System.Security.Cryptography.MD5.Create();
            var inputBytes = System.Text.Encoding.ASCII.GetBytes(email.Trim().ToLower());
            var hashBytes = md5.ComputeHash(inputBytes);

            var sb = new System.Text.StringBuilder();
            for (int i = 0; i < hashBytes.Length; i++)
            {
                sb.Append(hashBytes[i].ToString("x2"));
            }

            return $"https://www.gravatar.com/avatar/{sb}?d=mp";
        }
    }
}
