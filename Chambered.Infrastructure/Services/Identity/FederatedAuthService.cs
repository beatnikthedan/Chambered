using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Chambered.Core.Services.Identity;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Data;
using Chambered.Infrastructure.Configuration;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chambered.Infrastructure.Services.Identity
{
    /// <inheritdoc cref="IFederatedAuthService"/>
    public class FederatedAuthService : IFederatedAuthService
    {
        private readonly SignInManager<ChamberedUser> _signInManager;
        private readonly UserManager<ChamberedUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IOptions<FederatedAuthenticationConfiguration> _federatedOptions;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FederatedAuthService> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="FederatedAuthService"/> class.
        /// </summary>
        public FederatedAuthService(
            SignInManager<ChamberedUser> signInManager,
            UserManager<ChamberedUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IOptions<FederatedAuthenticationConfiguration> federatedOptions,
            IConfiguration configuration,
            ILogger<FederatedAuthService> logger)
        {
            _signInManager = signInManager ?? throw new ArgumentNullException(nameof(signInManager));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
            _federatedOptions = federatedOptions ?? throw new ArgumentNullException(nameof(federatedOptions));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc/>
        public async Task<ChallengePropertiesDto> PrepareChallengeAsync(string providerName, string redirectUri)
        {
            if (string.IsNullOrWhiteSpace(providerName))
            {
                throw new ArgumentException("Provider name cannot be null or empty.", nameof(providerName));
            }

            _logger.LogInformation("SSO challenge prepared: Provider={Provider}, RedirectUri={RedirectUri}", providerName, redirectUri);

            var properties = _signInManager.ConfigureExternalAuthenticationProperties(providerName, redirectUri);
            var itemsDict = properties.Items.ToDictionary(kvp => kvp.Key, kvp => kvp.Value ?? string.Empty);

            return await Task.FromResult(new ChallengePropertiesDto(
                providerName,
                redirectUri,
                itemsDict
            )).ConfigureAwait(false);
        }

        /// <inheritdoc/>
        public async Task<FederatedLoginResponseDto> HandleCallbackAsync(string providerName, ExternalIdentityDto externalInfo)
        {
            if (string.IsNullOrWhiteSpace(providerName))
            {
                throw new ArgumentException("Provider name cannot be null or empty.", nameof(providerName));
            }
            if (externalInfo == null)
            {
                throw new ArgumentNullException(nameof(externalInfo));
            }

            var providerConfig = _federatedOptions.Value?.Providers?
                .FirstOrDefault(p => p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase));

            var emailClaimKey = providerConfig?.UserProfileClaims?.Email ?? "email";
            var firstNameClaimKey = providerConfig?.UserProfileClaims?.FirstName ?? "given_name";
            var lastNameClaimKey = providerConfig?.UserProfileClaims?.LastName ?? "family_name";

            externalInfo.UserClaims.TryGetValue(emailClaimKey, out var email);
            if (string.IsNullOrWhiteSpace(email))
            {
                externalInfo.UserClaims.TryGetValue(ClaimTypes.Email, out email);
            }
            if (string.IsNullOrWhiteSpace(email))
            {
                externalInfo.UserClaims.TryGetValue("email", out email);
            }

            externalInfo.UserClaims.TryGetValue(firstNameClaimKey, out var firstName);
            if (string.IsNullOrWhiteSpace(firstName))
            {
                externalInfo.UserClaims.TryGetValue(ClaimTypes.GivenName, out firstName);
            }
            if (string.IsNullOrWhiteSpace(firstName))
            {
                externalInfo.UserClaims.TryGetValue("givenname", out firstName);
            }

            externalInfo.UserClaims.TryGetValue(lastNameClaimKey, out var lastName);
            if (string.IsNullOrWhiteSpace(lastName))
            {
                externalInfo.UserClaims.TryGetValue(ClaimTypes.Surname, out lastName);
            }
            if (string.IsNullOrWhiteSpace(lastName))
            {
                externalInfo.UserClaims.TryGetValue("surname", out lastName);
            }

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            {
                _logger.LogError("SSO Callback failed: Provider={Provider}. Required claims (email, givenname, surname) missing from external metadata.", providerName);
                return new FederatedLoginResponseDto(false, "Required user claims not returned by the SSO provider.", string.Empty, Enumerable.Empty<string>());
            }

            var user = await _userManager.FindByEmailAsync(email).ConfigureAwait(false);
            var loginInfo = await _userManager.FindByLoginAsync(providerName, externalInfo.ProviderKey).ConfigureAwait(false);

            if (user == null && loginInfo == null)
            {
                user = new ChamberedUser
                {
                    UserName = email,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    EmailConfirmed = true
                };

                var createResult = await _userManager.CreateAsync(user).ConfigureAwait(false);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                    _logger.LogError("SSO Callback failed: Provider={Provider}, Reason=Failed to auto-provision user account: {Errors}", providerName, errors);
                    return new FederatedLoginResponseDto(false, $"Failed to create user account: {errors}", string.Empty, Enumerable.Empty<string>());
                }

                var linkResult = await _userManager.AddLoginAsync(user, new UserLoginInfo(providerName, externalInfo.ProviderKey, providerName)).ConfigureAwait(false);
                if (!linkResult.Succeeded)
                {
                    await _userManager.DeleteAsync(user).ConfigureAwait(false);
                    _logger.LogError("SSO Callback failed: Provider={Provider}, Reason=Failed to link external SSO credentials to auto-provisioned account.", providerName);
                    return new FederatedLoginResponseDto(false, "Failed to link SSO login credentials to new user account.", string.Empty, Enumerable.Empty<string>());
                }

                _logger.LogInformation("New SSO user created: Provider={Provider}, Email={Email}, UserId={UserId}", providerName, email, user.Id);
            }
            else if (user != null && loginInfo == null)
            {
                var linkResult = await _userManager.AddLoginAsync(user, new UserLoginInfo(providerName, externalInfo.ProviderKey, providerName)).ConfigureAwait(false);
                if (!linkResult.Succeeded)
                {
                    _logger.LogError("SSO Callback failed: Provider={Provider}, Reason=Failed to link external SSO credentials to existing account.", providerName);
                    return new FederatedLoginResponseDto(false, "Failed to link SSO login credentials to existing user account.", string.Empty, Enumerable.Empty<string>());
                }

                _logger.LogInformation("SSO account linked successfully: Provider={Provider}, UserId={UserId}", providerName, user.Id);
            }

            if (providerConfig != null)
            {
                if (providerConfig.EnableRoleSynchronization && !string.IsNullOrEmpty(providerConfig.UserProfileClaims?.Roles))
                {
                    var desiredRoles = ParseStringListClaims(externalInfo.UserClaims, providerConfig.UserProfileClaims.Roles).ToList();

                    // FIXED: Only synchronize roles if the claim actually was present and returned items.
                    // This prevents resetting/deleting a user's local roles if they log in via an SSO flow that does not return any role claim.
                    if (desiredRoles.Any())
                    {
                        var currentRoles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
                        var rolesToAdd = desiredRoles.Except(currentRoles).ToList();
                        var rolesToRemove = currentRoles.Except(desiredRoles).ToList();

                        if (rolesToAdd.Any())
                        {
                            await _userManager.AddToRolesAsync(user, rolesToAdd).ConfigureAwait(false);
                        }
                        if (rolesToRemove.Any())
                        {
                            await _userManager.RemoveFromRolesAsync(user, rolesToRemove).ConfigureAwait(false);
                        }

                        _logger.LogInformation("Roles synchronized: Email={Email}, Roles={Roles}", user.Email, string.Join(", ", desiredRoles));
                    }
                }
            }

            await _signInManager.SignInAsync(user, isPersistent: false).ConfigureAwait(false);

            var roles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
            var permissions = await GetPermissionsForUserInternalAsync(user, roles).ConfigureAwait(false);

            _logger.LogInformation("SSO Callback processed successfully: Provider={Provider}, Email={Email}", providerName, email);

            return new FederatedLoginResponseDto(true, string.Empty, string.Empty, permissions);
        }

        private static IEnumerable<string> ParseStringListClaims(IDictionary<string, string> userClaims, string claimType)
        {
            if (string.IsNullOrWhiteSpace(claimType) || !userClaims.TryGetValue(claimType, out var claimValue) || string.IsNullOrWhiteSpace(claimValue))
            {
                return Enumerable.Empty<string>();
            }

            var results = new List<string>();
            var trimmedValue = claimValue.Trim();

            if (trimmedValue.StartsWith("[") && trimmedValue.EndsWith("]"))
            {
                trimmedValue = trimmedValue.Substring(1, trimmedValue.Length - 2).Trim();
            }

            var parts = trimmedValue.Split(new[] { ',', ';', '"' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var part in parts)
            {
                var val = part.Trim();
                if (!string.IsNullOrWhiteSpace(val))
                {
                    results.Add(val);
                }
            }

            return results;
        }

        /// <inheritdoc/>
        public async Task LinkAccountAsync(string userId, ExternalIdentityDto externalInfo)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }
            if (externalInfo == null)
            {
                throw new ArgumentNullException(nameof(externalInfo));
            }

            var user = await _userManager.FindByIdAsync(userId).ConfigureAwait(false);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID '{userId}' was not found.");
            }

            var linkedUser = await _userManager.FindByLoginAsync(externalInfo.ProviderName, externalInfo.ProviderKey).ConfigureAwait(false);
            if (linkedUser != null)
            {
                throw new InvalidOperationException("This external account is already linked to another user.");
            }

            var result = await _userManager.AddLoginAsync(user, new UserLoginInfo(externalInfo.ProviderName, externalInfo.ProviderKey, externalInfo.ProviderName)).ConfigureAwait(false);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                _logger.LogError("SSO account linking failed: Provider={Provider}, User={UserId}, Errors={Errors}", externalInfo.ProviderName, userId, errors);
                throw new InvalidOperationException($"Failed to link external SSO account: {errors}");
            }

            _logger.LogInformation("SSO account linked successfully: Provider={Provider}, UserId={UserId}", externalInfo.ProviderName, userId);
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetConfiguredProviders()
        {
            return _federatedOptions.Value?.Providers?.Select(p => p.ProviderName) ?? Enumerable.Empty<string>();
        }



        private async Task<IEnumerable<string>> GetPermissionsForUserInternalAsync(ChamberedUser user, IEnumerable<string> roles)
        {
            var permissions = new List<string>();

            if (roles.Contains("Admin"))
            {
                permissions.Add("Admin");
            }
            else
            {
                foreach (var roleName in roles)
                {
                    var role = await _roleManager.FindByNameAsync(roleName).ConfigureAwait(false);
                    if (role != null)
                    {
                        var roleClaims = await _roleManager.GetClaimsAsync(role).ConfigureAwait(false);
                        foreach (var claim in roleClaims)
                        {
                            permissions.Add(claim.Value);
                        }
                    }
                }
            }

            return permissions;
        }
    }
}
