using Asp.Versioning;
using Chambered.Core.Services;
using Chambered.Core.Services.Models;
using Chambered.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Chambered.Api.Controllers.Settings
{
    /// <summary>
    /// Provides management endpoints for database backup operations including manual generation,
    /// file uploads, metadata browsing, download streams, and restoration. Access is restricted to Administrators.
    /// </summary>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/backups")]
    [Authorize(Roles = "Admin")]
    public class BackupsController : ControllerBase
    {
        private readonly IBackupService _backupService;
        private readonly IOptions<BackupConfiguration> _backupConfiguration;

        /// <summary>
        /// Initializes a new instance of the <see cref="BackupsController"/> class.
        /// </summary>
        /// <param name="backupService">The active database backup service implementation.</param>
        /// <param name="backupConfiguration">The system backup options configuration.</param>
        public BackupsController(IBackupService backupService, IOptions<BackupConfiguration> backupConfiguration)
        {
            _backupService = backupService;
            _backupConfiguration = backupConfiguration;
        }

        /// <summary>
        /// Retrieves a list of all available database backup files.
        /// </summary>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>A collection of backup file metadata objects.</returns>
        /// <response code="200">Returns the collection of available backup files.</response>
        /// <response code="401">If the request is unauthorized.</response>
        /// <response code="403">If the user is not an administrator.</response>
        [HttpGet]
        [Produces("application/json")]
        [ProducesResponseType(typeof(IEnumerable<BackupFileInfo>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<BackupFileInfo>>> GetBackups(CancellationToken cancellationToken)
        {
            var backups = await _backupService.GetBackupsAsync(cancellationToken);
            return Ok(backups);
        }

        /// <summary>
        /// Triggers an immediate manual creation of a database backup artifact.
        /// </summary>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>Metadata describing the newly created backup artifact.</returns>
        /// <response code="200">Returns metadata for the successfully generated backup file.</response>
        /// <response code="401">If the request is unauthorized.</response>
        /// <response code="403">If the user is not an administrator.</response>
        /// <response code="500">If an unhandled error occurs during the backup process.</response>
        [HttpPost("create")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(BackupResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<BackupResult>> CreateBackup(CancellationToken cancellationToken)
        {
            var result = await _backupService.CreateBackupAsync(null, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Uploads an external backup file to the application's target backup directory.
        /// </summary>
        /// <param name="file">The uploaded backup file payload.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>Metadata for the uploaded and stored backup artifact.</returns>
        /// <response code="200">Returns metadata for the successfully uploaded file.</response>
        /// <response code="400">If the provided file is empty or missing.</response>
        /// <response code="401">If the request is unauthorized.</response>
        /// <response code="403">If the user is not an administrator.</response>
        [HttpPost("upload")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(BackupFileInfo), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<BackupFileInfo>> UploadBackup(IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("A valid non-empty backup file must be provided.");
            }

            var result = await _backupService.UploadBackupAsync(file, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Streams a specific backup file for browser download.
        /// </summary>
        /// <param name="fileName">The target file name of the backup artifact to download.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>A binary file stream of the requested backup file.</returns>
        /// <response code="200">Returns the binary file stream.</response>
        /// <response code="401">If the request is unauthorized.</response>
        /// <response code="403">If the user is not an administrator.</response>
        /// <response code="404">If the requested backup file does not exist.</response>
        [HttpGet("{fileName}/download")]
        [Produces("application/octet-stream")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DownloadBackup(string fileName, CancellationToken cancellationToken)
        {
            var result = await _backupService.GetBackupStreamAsync(fileName, cancellationToken);
            if (result == null)
            {
                return NotFound($"Backup file '{fileName}' was not found.");
            }

            var (stream, contentType, downloadName) = result.Value;
            return File(stream, contentType, downloadName);
        }

        /// <summary>
        /// Permanently deletes a specified backup file from the storage folder.
        /// </summary>
        /// <param name="fileName">The target file name of the backup artifact to delete.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>No content on success.</returns>
        /// <response code="204">If the file was successfully deleted.</response>
        /// <response code="401">If the request is unauthorized.</response>
        /// <response code="403">If the user is not an administrator.</response>
        /// <response code="404">If the backup file was not found.</response>
        [HttpDelete("{fileName}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteBackup(string fileName, CancellationToken cancellationToken)
        {
            bool deleted = await _backupService.DeleteBackupAsync(fileName, cancellationToken);
            if (!deleted)
            {
                return NotFound($"Backup file '{fileName}' was not found.");
            }

            return NoContent();
        }

        /// <summary>
        /// Restores the active application database from a specified backup file.
        /// </summary>
        /// <param name="fileName">The target backup file name to restore from.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>A status result detailing the outcome of the restoration process.</returns>
        /// <response code="200">If the restoration operation succeeded.</response>
        /// <response code="400">If the restoration operation failed or the file was invalid.</response>
        /// <response code="401">If the request is unauthorized.</response>
        /// <response code="403">If the user is not an administrator.</response>
        [HttpPost("{fileName}/restore")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(RestoreResult), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> RestoreBackup(string fileName, CancellationToken cancellationToken)
        {
            var result = await _backupService.RestoreBackupAsync(fileName, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        /// <summary>
        /// Retrieves the current system automated backup configurations.
        /// </summary>
        /// <returns>The active backup scheduling configurations DTO.</returns>
        /// <response code="200">Returns the configured backup properties.</response>
        /// <response code="401">If the request is unauthorized.</response>
        /// <response code="403">If the user is not an administrator.</response>
        [HttpGet("backup-settings")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(ConfigurationSectionResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public ActionResult<ConfigurationSectionResponseDto> GetBackupSettings()
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

    /// <summary>
    /// Data transfer object containing backup schedule and path configurations.
    /// </summary>
    /// <param name="Enabled">Indicates whether automated schedule is active.</param>
    /// <param name="BackupPath">The file system directory where backups are saved.</param>
    /// <param name="CronSchedule">The CRON notation schedule.</param>
    /// <param name="RetentionCount">The maximum number of backup archives kept before deletion.</param>
    public record ConfigurationSectionResponseDto(
        bool Enabled,
        string BackupPath,
        string CronSchedule,
        int RetentionCount
    );
}
