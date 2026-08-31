using Asp.Versioning;
using Chambered.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Chambered.Api.Controllers.Settings
{
    /// <summary>
    /// Provides access to general application settings, including password policies and notification configurations.
    /// </summary>
    /// <param name="identityOptions">The security identity password options.</param>
    /// <param name="appriseConfiguration">The Apprise notifications configuration options.</param>
    /// <param name="loginConfiguration"></param>
    /// <param name="emailConfiguration"></param>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/settings")]
    [Authorize]
    public class SettingsController(
        IOptions<IdentityOptions> identityOptions,
        IOptions<AppriseConfiguration> appriseConfiguration,
        IOptions<LoginConfiguration> loginConfiguration,
        IOptions<EmailConfiguration> emailConfiguration) : ControllerBase
    {
        private readonly IOptions<IdentityOptions> _identityOptions = identityOptions;
        private readonly IOptions<AppriseConfiguration> _appriseConfiguration = appriseConfiguration;
        private readonly IOptions<LoginConfiguration> _loginConfiguration = loginConfiguration;
        private readonly IOptions<EmailConfiguration> _emailConfiguration = emailConfiguration;

        /// <summary>
        /// Retrieves the active password complexity policy settings.
        /// </summary>
        /// <returns>A data transfer object describing password length and character requirements.</returns>
        /// <response code="200">Returns the configured password policy settings.</response>
        /// <response code="401">If the request is unauthorized.</response>
        [HttpGet("password-policy")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(PasswordPolicyResponseDto), StatusCodes.Status200OK)]
        public ActionResult<PasswordPolicyResponseDto> GetPasswordPolicy()
        {
            var opts = _identityOptions.Value.Password;

            var response = new PasswordPolicyResponseDto(
                MinLength: opts.RequiredLength,
                RequireUpper: opts.RequireUppercase,
                RequireLower: opts.RequireLowercase,
                RequireNumbers: opts.RequireDigit,
                RequireSpecial: opts.RequireNonAlphanumeric
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves the system Apprise notification connection settings.
        /// </summary>
        /// <returns>A data transfer object containing host URL, credentials key, and delivery endpoints.</returns>
        /// <response code="200">Returns the active Apprise configurations.</response>
        /// <response code="401">If the request is unauthorized.</response>
        [HttpGet("apprise-settings")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(AppriseSettingsResponseDto), StatusCodes.Status200OK)]
        public ActionResult<AppriseSettingsResponseDto> GetAppriseSettings()
        {
            var opts = _appriseConfiguration.Value;

            var response = new AppriseSettingsResponseDto(
                AllowInvalidCertificates: opts.AllowInvalidCertificates,
                HostUrl: opts.HostUrl,
                NotificationKey: opts.NotificationKey,
                TargetUrls: opts.TargetUrls,
                TimeoutSeconds: opts.TimeoutSeconds
            );

            return Ok(response);
        }

        [HttpGet("login-settings")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(LoginConfigurationResponseDto), StatusCodes.Status200OK)]
        public ActionResult<LoginConfigurationResponseDto> GetLoginSettings()
        {
            var opts = _loginConfiguration.Value;

            var response = new LoginConfigurationResponseDto(
                SessionLifetime: opts.SessionLifetime,
                DisableLocalUsers: opts.DisableLocalUsers,
                DisableNewUserRegistration: opts.DisableNewUserRegistration
            );

            return Ok(response);
        }

        [HttpGet("email-settings")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(EmailConfigurationResponseDto), StatusCodes.Status200OK)]
        public ActionResult<EmailConfigurationResponseDto> GetEmailSettings()
        {
            var opts = _emailConfiguration.Value;

            var response = new EmailConfigurationResponseDto(
                Host: opts.Host ?? string.Empty,
                Port: opts.Port,
                UserName: opts.UserName ?? string.Empty,
                HasPassword: !string.IsNullOrWhiteSpace(opts.Password),
                SecurityOption: opts.SecurityOption.ToString(),
                AllowInvalidCertificates: opts.AllowInvalidCertificates,
                DefaultFromAddress: opts.DefaultFromAddress ?? string.Empty,
                DefaultFromDisplayName: opts.DefaultFromDisplayName ?? string.Empty
            );

            return Ok(response);
        }
    }

    /// <summary>
    /// Data transfer object defining password complexity criteria.
    /// </summary>
    /// <param name="MinLength">The minimum character length requirement.</param>
    /// <param name="RequireUpper">Indicates whether uppercase characters are mandatory.</param>
    /// <param name="RequireLower">Indicates whether lowercase characters are mandatory.</param>
    /// <param name="RequireNumbers">Indicates whether numeric digits are mandatory.</param>
    /// <param name="RequireSpecial">Indicates whether non-alphanumeric characters are mandatory.</param>
    public record PasswordPolicyResponseDto(
        int MinLength,
        bool RequireUpper,
        bool RequireLower,
        bool RequireNumbers,
        bool RequireSpecial
    );

    /// <summary>
    /// Data transfer object defining Apprise push notification properties.
    /// </summary>
    /// <param name="AllowInvalidCertificates">Indicates whether self-signed SSL certs are trusted.</param>
    /// <param name="HostUrl">The push notification server URL.</param>
    /// <param name="NotificationKey">The secret Apprise decryption key.</param>
    /// <param name="TargetUrls">The delivery endpoints payload.</param>
    /// <param name="TimeoutSeconds">The connection timeout parameter.</param>
    public record AppriseSettingsResponseDto(
        bool AllowInvalidCertificates,
        string HostUrl,
        string NotificationKey,
        string TargetUrls,
        int TimeoutSeconds
    );

    public record LoginConfigurationResponseDto(
        int SessionLifetime,
        bool DisableLocalUsers,
        bool DisableNewUserRegistration
    );

    public record EmailConfigurationResponseDto(
        string Host,
        int Port,
        string UserName,
        bool HasPassword,
        string SecurityOption,
        bool AllowInvalidCertificates,
        string DefaultFromAddress,
        string DefaultFromDisplayName
        );
}
