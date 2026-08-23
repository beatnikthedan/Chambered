using Chambered.Core.Services;
using Chambered.Core.Services.Models;
using Chambered.Data.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Chambered.Core.Utility
{
    /// <summary>
    /// Entity Framework Core SaveChangesInterceptor to automatically populate audit properties.
    /// </summary>
    public class AuditPropertiesInterceptor : SaveChangesInterceptor
    {
        private readonly ICurrentUserService<UserSession> _currentUserService;

        /// <summary>
        /// Initializes a new instance of the <see cref="AuditPropertiesInterceptor"/> class.
        /// </summary>
        /// <param name="currentUserService">The current user service.</param>
        public AuditPropertiesInterceptor(ICurrentUserService<UserSession> currentUserService)
        {
            _currentUserService = currentUserService;
        }

        /// <inheritdoc/>
        public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
        {
            UpdateAuditFields(eventData.Context);
            return base.SavingChanges(eventData, result);
        }

        /// <inheritdoc/>
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            UpdateAuditFields(eventData.Context);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        private void UpdateAuditFields(DbContext? context)
        {
            if (context == null)
            {
                return;
            }

            var entries = context.ChangeTracker.Entries<IAuditProperties>()
                .Where(e => e.State is EntityState.Added or EntityState.Modified)
                .ToList();

            if (entries.Count == 0)
            {
                return;
            }

            var user = _currentUserService.GetCurrentUser();
            var name = !string.IsNullOrWhiteSpace(user?.FullName)
                ? user.FullName.Trim()
                : "System";

            var now = DateTimeOffset.UtcNow;

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity.Created == default)
                    {
                        entry.Entity.Created = now;
                    }
                    if (string.IsNullOrWhiteSpace(entry.Entity.CreatedBy))
                    {
                        entry.Entity.CreatedBy = name;
                    }
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Property(x => x.Created).IsModified = false;
                    entry.Property(x => x.CreatedBy).IsModified = false;
                }

                entry.Entity.Modified = now;
                entry.Entity.ModifiedBy = name;
            }
        }
    }
}
