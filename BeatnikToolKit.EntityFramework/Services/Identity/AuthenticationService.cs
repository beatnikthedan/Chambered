using BeatnikToolKit.EntityFramework.Configuration;
using BeatnikToolKit.EntityFramework.LogMessages;
using BeatnikToolKit.EntityFramework.Services.Identity.Dto;
using BeatnikToolKit.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Mail;
using System.Text;

namespace BeatnikToolKit.EntityFramework.Services.Identity
{
    /// <inheritdoc cref="IAuthenticationService"/>
    public class AuthenticationService<TUser>(
        SignInManager<TUser> signInManager,
        UserManager<TUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IEmailService emailService,
        IOptions<IdentityConfiguration> identityOptions,
        ILogger<AuthenticationService<TUser>> logger) : IAuthenticationService where TUser : IdentityUser
    {
        private readonly SignInManager<TUser> _signInManager = signInManager ?? throw new ArgumentNullException(nameof(signInManager));
        private readonly UserManager<TUser> _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
        private readonly RoleManager<IdentityRole> _roleManager = roleManager ?? throw new ArgumentNullException(nameof(roleManager));
        private readonly IEmailService _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        private readonly IOptions<IdentityConfiguration> _identityOptions = identityOptions ?? throw new ArgumentNullException(nameof(identityOptions));
        private readonly ILogger<AuthenticationService<TUser>> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        private readonly AuthenticationServiceLogMessages _log = new AuthenticationServiceLogMessages(logger);

        /// <inheritdoc/>
        public async Task<AuthenticationResponseDto> LoginAsync(LoginRequestDto request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            _log.LoginAttempted(request.Email);

            var user = await _userManager.FindByEmailAsync(request.Email).ConfigureAwait(false);
            if (user == null)
            {
                user = await _userManager.FindByNameAsync(request.Email).ConfigureAwait(false);
            }

            if (user == null)
            {
                _log.LoginFailureUserNotFound(request.Email);
                throw new UnauthorizedAccessException("Incorrect username or password");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false).ConfigureAwait(false);
            if (!result.Succeeded)
            {
                _log.LoginFailureIncorrectPassword(request.Email);
                throw new UnauthorizedAccessException("Incorrect username or password");
            }

            await _signInManager.SignInAsync(user, isPersistent: request.RememberMe).ConfigureAwait(false);

            var roles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
            if (!roles.Any())
            {
                var totalUsersCount = await _userManager.Users.CountAsync().ConfigureAwait(false);
                if (totalUsersCount == 1)
                {
                    if (!await _roleManager.RoleExistsAsync("Admin").ConfigureAwait(false))
                    {
                        await _roleManager.CreateAsync(new IdentityRole("Admin")).ConfigureAwait(false);
                    }
                    var addResult = await _userManager.AddToRoleAsync(user, "Admin").ConfigureAwait(false);
                    if (addResult.Succeeded)
                    {
                        _log.PromotedSetupUserToAdmin(user.Id);
                        roles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
                    }
                }
            }

            var permissions = await GetPermissionsForUserInternalAsync(user, roles).ConfigureAwait(false);

            _log.LoginSuccess(request.Email, user.Id);

            return new AuthenticationResponseDto(
                user.Id,
                user.Email ?? string.Empty,
                string.Empty,
                string.Empty,
                0,
                roles,
                permissions,
                user.UserName ?? user.Email,
                GetGravatarUrl(user.Email)
            );
        }

        /// <inheritdoc/>
        public async Task LogoutAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }

            _log.LogoutRequested(userId);
            await _signInManager.SignOutAsync().ConfigureAwait(false);
        }

        /// <inheritdoc/>
        public async Task<TokenRefreshResponseDto> RefreshTokenAsync(TokenRefreshRequestDto request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            throw new NotSupportedException("Refresh tokens are currently not configured in the host identity context. Please log in again.");
        }

        /// <inheritdoc/>
        public async Task InitiateForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            _log.ForgotPasswordInitiated(request.Email);

            var user = await _userManager.FindByEmailAsync(request.Email).ConfigureAwait(false);
            if (user == null)
            {
                _log.ForgotPasswordNonExistentEmail(request.Email);
                return;
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user).ConfigureAwait(false);
            var uriEncodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var callbackUrl = $"{_identityOptions.Value.Website}/change-password?username={user.UserName}&token={uriEncodedToken}";

            var mailMessage = new MailMessage();
            mailMessage.To.Add(request.Email);
            mailMessage.Subject = "Reset Password";
            mailMessage.Body = $"<p>Please reset your password by clicking <a href=\"{callbackUrl}\">here</a>.</p>";
            mailMessage.IsBodyHtml = true;

            var emailSent = await _emailService.SendEmailAsync(mailMessage).ConfigureAwait(false);
            if (!emailSent)
            {
                _log.ForgotPasswordEmailFailed(request.Email);
                throw new InvalidOperationException("Password reset email could not be sent because no email service is configured.");
            }
        }

        /// <inheritdoc/>
        public async Task ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var user = await _userManager.FindByEmailAsync(request.Email).ConfigureAwait(false);
            if (user == null)
            {
                _log.PasswordResetFailureUserNotFound(request.Email);
                throw new KeyNotFoundException($"User with email '{request.Email}' was not found.");
            }

            var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
            var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword).ConfigureAwait(false);

            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                _log.PasswordResetFailed(request.Email, errors);
                throw new InvalidOperationException($"Password reset failed: {errors}");
            }

            _log.PasswordResetSuccess(request.Email);
        }

        /// <inheritdoc/>
        public async Task<bool> VerifyPasswordAsync(string userId, string password)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }

            var user = await _userManager.FindByIdAsync(userId).ConfigureAwait(false);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID '{userId}' was not found.");
            }

            return await _userManager.CheckPasswordAsync(user, password).ConfigureAwait(false);
        }

        /// <inheritdoc/>
        public async Task ChangePasswordAsync(string userId, ChangePasswordRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var user = await _userManager.FindByIdAsync(userId).ConfigureAwait(false);
            if (user == null)
            {
                _log.PasswordChangeFailureUserNotFound(userId);
                throw new KeyNotFoundException($"User with ID '{userId}' was not found.");
            }

            var result = await _userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword).ConfigureAwait(false);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                _log.PasswordChangeFailed(userId, errors);
                throw new InvalidOperationException($"Failed to update password: {errors}");
            }

            _log.PasswordChangeSuccess(userId);
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

        /// <inheritdoc/>
        public async Task<bool> IsInitializedAsync()
        {
            return await _userManager.Users.AnyAsync().ConfigureAwait(false);
        }

        private static string GetGravatarUrl(string? email)
        {
            if (string.IsNullOrEmpty(email))
                return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

            using var md5 = System.Security.Cryptography.MD5.Create();
            var inputBytes = Encoding.ASCII.GetBytes(email.Trim().ToLower());
            var hashBytes = md5.ComputeHash(inputBytes);

            var sb = new StringBuilder();
            for (int i = 0; i < hashBytes.Length; i++)
            {
                sb.Append(hashBytes[i].ToString("x2"));
            }

            return $"https://www.gravatar.com/avatar/{sb}?d=mp";
        }
    }
}
