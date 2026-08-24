using BeatnikToolKit.EntityFramework.Configuration;
using BeatnikToolKit.EntityFramework.LogMessages;
using BeatnikToolKit.EntityFramework.Services.Identity.Dto;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace BeatnikToolKit.EntityFramework.Services.Identity
{
    /// <inheritdoc cref="IFederatedAuthService"/>
    /// <param name="signInManager">The identity sign-in manager.</param>
    /// <param name="userManager">The identity user manager.</param>
    /// <param name="roleManager">The identity role manager.</param>
    /// <param name="federatedOptions">The federated options configurations.</param>
    /// <param name="logger">The service logger.</param>
    /// <param name="rulebook">The authorization rulebook.</param>
    /// <param name="scopeProcessors">The custom scope processors.</param>
    public class FederatedAuthService<TUser>(
        SignInManager<TUser> signInManager,
        UserManager<TUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IOptions<FederatedAuthenticationConfiguration> federatedOptions,
        ILogger<FederatedAuthService<TUser>> logger,
        IAuthorizationRulebook rulebook,
        IEnumerable<IFederatedCustomScopeProcessor<TUser>> scopeProcessors) : IFederatedAuthService where TUser : IdentityUser, new()
    {
        private readonly SignInManager<TUser> _signInManager = signInManager ?? throw new ArgumentNullException(nameof(signInManager));
        private readonly UserManager<TUser> _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
        private readonly RoleManager<IdentityRole> _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
        private readonly IOptions<FederatedAuthenticationConfiguration> _federatedOptions = federatedOptions ?? throw new ArgumentNullException(nameof(federatedOptions));
        private readonly ILogger<FederatedAuthService<TUser>> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        private readonly IAuthorizationRulebook _rulebook = rulebook ?? throw new ArgumentNullException(nameof(rulebook));
        private readonly IEnumerable<IFederatedCustomScopeProcessor<TUser>> _scopeProcessors = scopeProcessors ?? throw new ArgumentNullException(nameof(scopeProcessors));
        private readonly FederatedAuthServiceLogMessages _log = new FederatedAuthServiceLogMessages(logger);

        /// <inheritdoc/>
        public async Task<ChallengePropertiesDto> PrepareChallengeAsync(string providerName, string redirectUri)
        {
            if (string.IsNullOrWhiteSpace(providerName))
            {
                throw new ArgumentException("Provider name cannot be null or empty.", nameof(providerName));
            }

            _log.ChallengePrepared(providerName, redirectUri);

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
            var userNameClaimKey = providerConfig?.UserProfileClaims?.UserName ?? "preferred_username";

            externalInfo.UserClaims.TryGetValue(emailClaimKey, out var email);
            if (string.IsNullOrWhiteSpace(email))
            {
                externalInfo.UserClaims.TryGetValue(ClaimTypes.Email, out email);
            }
            if (string.IsNullOrWhiteSpace(email))
            {
                externalInfo.UserClaims.TryGetValue("email", out email);
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                externalInfo.UserClaims.TryGetValue("preferred_username", out email);
                if (string.IsNullOrWhiteSpace(email))
                {
                    externalInfo.UserClaims.TryGetValue("name", out email);
                }
                if (!string.IsNullOrWhiteSpace(email) && !email.Contains("@"))
                {
                    email = $"{email}@local.sso";
                }
            }

            externalInfo.UserClaims.TryGetValue(userNameClaimKey, out var username);
            if (string.IsNullOrWhiteSpace(username))
            {
                externalInfo.UserClaims.TryGetValue(ClaimTypes.NameIdentifier, out username);
            }
            if (string.IsNullOrWhiteSpace(username))
            {
                externalInfo.UserClaims.TryGetValue("name", out username);
            }
            if (string.IsNullOrWhiteSpace(username))
            {
                username = email;
            }

            var claimsStr = string.Join("; ", externalInfo.UserClaims.Select(c => $"{c.Key}={c.Value}"));
            _log.ClaimsReceived(providerName, email ?? "Unknown", claimsStr);

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(username))
            {
                _log.RequiredClaimsMissing(providerName);
                return new FederatedLoginResponseDto(false, "Required user claims not returned by the SSO provider.", string.Empty, Enumerable.Empty<string>());
            }

            var user = await _userManager.FindByEmailAsync(email).ConfigureAwait(false);
            var loginInfo = await _userManager.FindByLoginAsync(providerName, externalInfo.ProviderKey).ConfigureAwait(false);
            var isNewUser = false;

            if (user == null && loginInfo == null)
            {
                isNewUser = true;
                user = new TUser
                {
                    UserName = username,
                    Email = email,
                    EmailConfirmed = true
                };

                foreach (var processor in _scopeProcessors)
                {
                    if (externalInfo.UserClaims.TryGetValue(processor.TargetScope, out var claimValue) && !string.IsNullOrWhiteSpace(claimValue))
                    {
                        _log.ScopeProcessingStarted(processor.TargetScope, "new_user");
                        try
                        {
                            await processor.ProcessScopeAsync(user, claimValue).ConfigureAwait(false);
                            _log.ScopeProcessingCompleted(processor.TargetScope, "new_user");
                        }
                        catch (Exception ex)
                        {
                            _log.ScopeProcessingFailed(processor.TargetScope, "new_user", ex.Message);
                        }
                    }
                }

                var createResult = await _userManager.CreateAsync(user).ConfigureAwait(false);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                    _log.AutoProvisionFailed(providerName, errors);
                    return new FederatedLoginResponseDto(false, $"Failed to create user account: {errors}", string.Empty, Enumerable.Empty<string>());
                }

                var linkResult = await _userManager.AddLoginAsync(user, new UserLoginInfo(providerName, externalInfo.ProviderKey, providerName)).ConfigureAwait(false);
                if (!linkResult.Succeeded)
                {
                    await _userManager.DeleteAsync(user).ConfigureAwait(false);
                    _log.CredentialLinkFailed(providerName);
                    return new FederatedLoginResponseDto(false, "Failed to link SSO login credentials to new user account.", string.Empty, Enumerable.Empty<string>());
                }

                _log.NewUserCreated(providerName, email, user.Id);
            }
            else if (user != null && loginInfo == null)
            {
                var linkResult = await _userManager.AddLoginAsync(user, new UserLoginInfo(providerName, externalInfo.ProviderKey, providerName)).ConfigureAwait(false);
                if (!linkResult.Succeeded)
                {
                    _log.LinkExistingFailed(providerName);
                    return new FederatedLoginResponseDto(false, "Failed to link SSO login credentials to existing user account.", string.Empty, Enumerable.Empty<string>());
                }

                _log.AccountLinked(providerName, user.Id);
            }

            if (user != null && !isNewUser)
            {
                var userProfileUpdated = false;
                foreach (var processor in _scopeProcessors)
                {
                    if (externalInfo.UserClaims.TryGetValue(processor.TargetScope, out var claimValue) && !string.IsNullOrWhiteSpace(claimValue))
                    {
                        _log.ScopeProcessingStarted(processor.TargetScope, user.Id);
                        try
                        {
                            await processor.ProcessScopeAsync(user, claimValue).ConfigureAwait(false);
                            _log.ScopeProcessingCompleted(processor.TargetScope, user.Id);
                            userProfileUpdated = true;
                        }
                        catch (Exception ex)
                        {
                            _log.ScopeProcessingFailed(processor.TargetScope, user.Id, ex.Message);
                        }
                    }
                }
                if (userProfileUpdated)
                {
                    await _userManager.UpdateAsync(user).ConfigureAwait(false);
                }
            }

            if (providerConfig != null && user != null)
            {
                var desiredRoles = new List<string>();

                if (providerConfig.EnableRoleSynchronization && !string.IsNullOrEmpty(providerConfig.UserProfileClaims?.Roles))
                {
                    var externalGroups = ParseStringListClaims(externalInfo.UserClaims, providerConfig.UserProfileClaims.Roles).ToList();
                    if (externalGroups.Any())
                    {
                        foreach (var group in externalGroups)
                        {
                            if (providerConfig.RoleMappings != null && providerConfig.RoleMappings.TryGetValue(group, out var mappedRole))
                            {
                                if (_rulebook.RoleClaimsMap.ContainsKey(mappedRole) || mappedRole.Equals(_rulebook.AdminRoleName, StringComparison.OrdinalIgnoreCase))
                                {
                                    desiredRoles.Add(mappedRole);
                                }
                                else
                                {
                                    _logger.LogWarning("External group '{Group}' mapped to role '{MappedRole}' which does not exist in the rulebook.", group, mappedRole);
                                }
                            }
                            else
                            {
                                _log.GroupSkipped(group);
                            }
                        }
                    }
                }

                if (!desiredRoles.Any())
                {
                    desiredRoles.Add(_rulebook.DefaultUserRoleName);
                }

                desiredRoles = desiredRoles.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                var currentRoles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
                var rolesToAdd = desiredRoles.Except(currentRoles, StringComparer.OrdinalIgnoreCase).ToList();
                var rolesToRemove = currentRoles.Except(desiredRoles, StringComparer.OrdinalIgnoreCase).ToList();

                if (rolesToAdd.Any())
                {
                    await _userManager.AddToRolesAsync(user, rolesToAdd).ConfigureAwait(false);
                }
                if (rolesToRemove.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, rolesToRemove).ConfigureAwait(false);
                }

                _log.RolesSynchronized(user.Email ?? string.Empty, string.Join(", ", desiredRoles));
            }

            await _signInManager.SignInAsync(user, isPersistent: false).ConfigureAwait(false);

            var roles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
            var permissions = await GetPermissionsForUserInternalAsync(user, roles).ConfigureAwait(false);

            _log.LoginSuccess(providerName, email);

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
                _log.LinkFailedWithErrors(externalInfo.ProviderName, userId, errors);
                throw new InvalidOperationException($"Failed to link external SSO account: {errors}");
            }

            _log.AccountLinked(externalInfo.ProviderName, userId);
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetConfiguredProviders()
        {
            return _federatedOptions.Value?.Providers?.Select(p => p.ProviderName) ?? Enumerable.Empty<string>();
        }

        private async Task<IEnumerable<string>> GetPermissionsForUserInternalAsync(TUser user, IEnumerable<string> roles)
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
