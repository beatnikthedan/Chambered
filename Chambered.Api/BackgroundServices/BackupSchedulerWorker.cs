using Chambered.Core.Services;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.LogMessages;
using Cronos;
using Microsoft.Extensions.Options;

namespace Chambered.Api.BackgroundServices
{
    /// <summary>
    /// Background hosted service that periodically triggers backups and handles retention policy cleanup based on CRON expressions.
    /// </summary>
    public class BackupSchedulerWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IOptionsMonitor<BackupConfiguration> _optionsMonitor;
        private readonly ILogger<BackupSchedulerWorker> _logger;
        private readonly BackupSchedulerLogMessages _workerLogger;

        /// <summary>
        /// Initializes a new instance of the <see cref="BackupSchedulerWorker"/> class.
        /// </summary>
        /// <param name="scopeFactory">The service scope factory used to construct scoped instances of <see cref="IBackupService"/>.</param>
        /// <param name="optionsMonitor">The configuration monitor for dynamic updates of <see cref="BackupConfiguration"/>.</param>
        /// <param name="logger">The diagnostic logger instance.</param>
        public BackupSchedulerWorker(
            IServiceScopeFactory scopeFactory,
            IOptionsMonitor<BackupConfiguration> optionsMonitor,
            ILogger<BackupSchedulerWorker> logger)
        {
            _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
            _optionsMonitor = optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _workerLogger = new BackupSchedulerLogMessages(_logger);
        }

        /// <inheritdoc/>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _workerLogger.WorkerInitialized();

            while (!stoppingToken.IsCancellationRequested)
            {
                var config = _optionsMonitor.CurrentValue;

                if (!config.Enabled)
                {
                    _workerLogger.BackupsDisabled();
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                    continue;
                }

                CronExpression cronExpression;
                try
                {
                    cronExpression = CronExpression.Parse(config.CronSchedule, CronFormat.Standard);
                }
                catch (Exception ex)
                {
                    _workerLogger.InvalidCronExpression(config.CronSchedule, ex);
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    continue;
                }

                DateTime? nextRunUtc = cronExpression.GetNextOccurrence(DateTime.UtcNow, TimeZoneInfo.Utc);

                if (!nextRunUtc.HasValue)
                {
                    _workerLogger.NoCronOccurrences(config.CronSchedule);
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                    continue;
                }

                var delay = nextRunUtc.Value - DateTime.UtcNow;
                if (delay > TimeSpan.Zero)
                {
                    _workerLogger.BackupScheduled(nextRunUtc.Value, delay.TotalMinutes);
                    await Task.Delay(delay, stoppingToken);
                }

                if (stoppingToken.IsCancellationRequested) break;

                // Execute the backup operation in a scoped context
                await RunBackupJobAsync(config, stoppingToken);
            }
        }

        /// <summary>
        /// Resolves the scoped <see cref="IBackupService"/> and runs a scheduled backup task and retention policy purge.
        /// </summary>
        /// <param name="config">The active snapshot configuration settings.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        private async Task RunBackupJobAsync(BackupConfiguration config, CancellationToken cancellationToken)
        {
            _workerLogger.TriggeringBackupJob();

            using (var scope = _scopeFactory.CreateScope())
            {
                var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();

                try
                {
                    var result = await backupService.CreateBackupAsync(config.BackupPath, cancellationToken);

                    _workerLogger.BackupSuccess(result.FilePath, result.SizeInBytes);

                    int deleted = backupService.EnforceRetentionPolicy(config.BackupPath, config.RetentionCount);
                    if (deleted > 0)
                    {
                        _workerLogger.RetentionPolicyPurge(deleted);
                    }
                }
                catch (Exception ex)
                {
                    _workerLogger.BackupJobFailed(ex);
                }
            }
        }
    }
}
