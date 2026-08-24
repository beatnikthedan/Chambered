using Chambered.Core.Services;
using Chambered.Data.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;

namespace Chambered.Core.Utility
{
    /// <summary>
    /// An Entity Framework Core <see cref="SaveChangesInterceptor"/> that automatically populates 
    /// and protects audit fields (created/modified timestamps and user tracking) on entities 
    /// implementing <see cref="IAuditProperties"/>.
    /// </summary>
    /// <typeparam name="TUser">The identity user type inheriting from <see cref="IdentityUser"/>.</typeparam>
    public class AuditPropertiesInterceptor<TUser> : SaveChangesInterceptor where TUser : IdentityUser
    {
        private readonly ICurrentUserService<TUser> _currentUserService;
        private readonly AuditPropertiesInterceptorOptions<TUser> _options;

        /// <summary>
        /// Initializes a new instance of the <see cref="AuditPropertiesInterceptor{TUser}"/> class.
        /// </summary>
        /// <param name="currentUserService">The service used to resolve the currently authenticated user.</param>
        /// <param name="options">The configuration options for customizing audit behavior.</param>
        public AuditPropertiesInterceptor(
            ICurrentUserService<TUser> currentUserService,
            IOptions<AuditPropertiesInterceptorOptions<TUser>> options)
        {
            _currentUserService = currentUserService;
            _options = options.Value;
        }

        /// <summary>
        /// Synchronously intercepts the call to <see cref="DbContext.SaveChanges()"/> to update audit properties 
        /// before changes are saved to the database.
        /// </summary>
        /// <param name="eventData">Contextual information about the EF Core event.</param>
        /// <param name="result">The current interception result.</param>
        /// <returns>The updated interception result.</returns>
        public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
        {
            UpdateAuditFields(eventData.Context);
            return base.SavingChanges(eventData, result);
        }

        /// <summary>
        /// Asynchronously intercepts the call to <see cref="DbContext.SaveChangesAsync(CancellationToken)"/> 
        /// to update audit properties before changes are saved to the database.
        /// </summary>
        /// <param name="eventData">Contextual information about the EF Core event.</param>
        /// <param name="result">The current interception result.</param>
        /// <param name="cancellationToken">A token to observe while waiting for the task to complete.</param>
        /// <returns>A <see cref="ValueTask"/> representing the asynchronous operation with the updated interception result.</returns>
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            UpdateAuditFields(eventData.Context);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        /// <summary>
        /// Scans tracked entities implementing <see cref="IAuditProperties"/> in <see cref="EntityState.Added"/> 
        /// or <see cref="EntityState.Modified"/> states and updates their timestamps and user identifiers.
        /// Prevents modification of creation metadata on existing entities.
        /// </summary>
        /// <param name="context">The active <see cref="DbContext"/> instance, or <see langword="null"/>.</param>
        private void UpdateAuditFields(DbContext? context)
        {
            if (context == null) return;

            var entries = context.ChangeTracker.Entries<IAuditProperties>()
                .Where(e => e.State is EntityState.Added or EntityState.Modified)
                .ToList();

            if (entries.Count == 0) return;

            var user = _currentUserService.GetCurrentUser();
            var name = _options.ResolveAuditorName(user);
            var now = DateTimeOffset.UtcNow;

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity.Created == default) entry.Entity.Created = now;
                    if (string.IsNullOrWhiteSpace(entry.Entity.CreatedBy)) entry.Entity.CreatedBy = name;
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

    /// <summary>
    /// Configuration options for the <see cref="AuditPropertiesInterceptor{TUser}"/>.
    /// </summary>
    /// <typeparam name="TUser">The identity user type inheriting from <see cref="IdentityUser"/>.</typeparam>
    public class AuditPropertiesInterceptorOptions<TUser> where TUser : IdentityUser
    {
        /// <summary>
        /// Gets or sets the delegate function used to derive the auditor's display name or identifier string 
        /// from the current user instance. Defaults to returning <see cref="IdentityUser.UserName"/> or <c>"System"</c> 
        /// if the user is unauthenticated or has no username.
        /// </summary>
        public Func<TUser, string> ResolveAuditorName { get; set; } = user =>
            !string.IsNullOrWhiteSpace(user?.UserName) ? user.UserName : "System";
    }
}
