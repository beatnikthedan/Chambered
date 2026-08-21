using Chambered.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Chambered.Api.Controllers.Settings
{
    [ApiController]
    [Route("api/settings")]
    [Authorize]
    public class SettingsController(
    IOptions<IdentityOptions> identityOptions,
    IOptions<AppriseConfiguration> appriseConfiguration,
    IOptions<BackupConfiguration> backupConfiguration) : ControllerBase
    {
        private readonly IOptions<IdentityOptions> _identityOptions = identityOptions;
        private readonly IOptions<AppriseConfiguration> _appriseConfiguration = appriseConfiguration;
        private readonly IOptions<BackupConfiguration> _backupConfiguration = backupConfiguration;

        [HttpGet("password-policy")]
        [Produces("application/json")]
        [AllowAnonymous]
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

        [HttpGet("apprise-settings")]
        [Produces("application/json")]
        [AllowAnonymous]
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

        [HttpGet("backup-settings")]
        [Produces("application/json")]
        [AllowAnonymous]
        public ActionResult<AppriseSettingsResponseDto> GetBackupSettings()
        {
            var opts = _backupConfiguration.Value;

            var response = new ConfigurationSectionResponseDto(
                Enabled: opts.Enabled,
                BackupPath: opts.BackupPath,
                CronSchedule: opts.CronSchedule,
                RetentionCount: opts.RetentionCount
            );

            return Ok(response);
        }
    }

    public record PasswordPolicyResponseDto(
    int MinLength,
    bool RequireUpper,
    bool RequireLower,
    bool RequireNumbers,
    bool RequireSpecial
);

    public record AppriseSettingsResponseDto(
        bool AllowInvalidCertificates,
        string HostUrl,
        string NotificationKey,
        string TargetUrls,
        int TimeoutSeconds
    );

    public record ConfigurationSectionResponseDto(
        bool Enabled,
        string BackupPath,
        string CronSchedule,
        int RetentionCount
        );

}
