using Microsoft.Extensions.Options;
using Cronos;
using Chambered.Infrastructure.Configuration;
using Chambered.Core.Services;

namespace Chambered.Api.BackgroundServices
{
    
//    // 1. Bind Options Configuration
//builder.Services.Configure<BackupConfiguration>(
//    builder.Configuration.GetSection("Backup"));

//// 2. Register Database Backup Implementation (Swap Sqlite for Postgres as needed)
//string connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

//    // FOR SQLITE:
//    builder.Services.AddScoped<IBackupService>(sp => 
//    new SqliteBackupService(connectionString, sp.GetRequiredService<IOptionsSnapshot<BackupConfiguration>>(), sp.GetRequiredService<ILogger<SqliteBackupService>>()));

//// FOR POSTGRESQL (Uncomment when switching to Postgres):
//// builder.Services.AddScoped<IBackupService>(sp => 
////     new PostgresBackupService(connectionString, sp.GetRequiredService<IOptionsSnapshot<BackupConfiguration>>(), sp.GetRequiredService<ILogger<PostgresBackupService>>()));

//// 3. Register the Scheduled Background Worker
//builder.Services.AddHostedService<BackupSchedulerWorker>();
    
    
    
    
    /// <summary>
    /// Background hosted service that periodically triggers backups and handles retention policy cleanup based on CRON expressions.
    /// </summary>
    public class BackupSchedulerWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IOptionsMonitor<BackupConfiguration> _optionsMonitor;
        private readonly ILogger<BackupSchedulerWorker> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="BackupSchedulerWorker"/> class.
        /// </summary>
        public BackupSchedulerWorker(
            IServiceScopeFactory scopeFactory,
            IOptionsMonitor<BackupConfiguration> optionsMonitor,
            ILogger<BackupSchedulerWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _optionsMonitor = optionsMonitor;
            _logger = logger;
        }

        /// <inheritdoc/>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Backup Scheduler Background Worker initialized.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var config = _optionsMonitor.CurrentValue;

                if (!config.Enabled)
                {
                    _logger.LogDebug("Automated backups are currently disabled. Re-checking in 1 minute...");
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
                    _logger.LogError(ex, "Invalid CRON expression '{Cron}'. Worker will retry in 5 minutes.", config.CronSchedule);
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    continue;
                }

                DateTime? nextRunUtc = cronExpression.GetNextOccurrence(DateTime.UtcNow, TimeZoneInfo.Utc);

                if (!nextRunUtc.HasValue)
                {
                    _logger.LogWarning("No future occurrences found for CRON expression '{Cron}'. Sleeping for 1 hour.", config.CronSchedule);
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                    continue;
                }

                var delay = nextRunUtc.Value - DateTime.UtcNow;
                if (delay > TimeSpan.Zero)
                {
                    _logger.LogInformation("Next backup scheduled for UTC: {NextRun} (in {DelayMinutes:F1} minutes)",
                        nextRunUtc.Value, delay.TotalMinutes);

                    await Task.Delay(delay, stoppingToken);
                }

                if (stoppingToken.IsCancellationRequested) break;

                // Execute the backup operation in a scoped context
                await RunBackupJobAsync(config, stoppingToken);
            }
        }

        private async Task RunBackupJobAsync(BackupConfiguration config, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Triggering scheduled backup job...");

            using (var scope = _scopeFactory.CreateScope())
            {
                var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();

                try
                {
                    var result = await backupService.CreateBackupAsync(config.BackupPath, cancellationToken);

                    _logger.LogInformation("Backup created successfully at {Path} ({Size} bytes).",
                        result.FilePath, result.SizeInBytes);

                    int deleted = backupService.EnforceRetentionPolicy(config.BackupPath, config.RetentionCount);
                    if (deleted > 0)
                    {
                        _logger.LogInformation("Retention policy purged {Count} old backup files.", deleted);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while executing scheduled backup.");
                }
            }
        }
    }
}
