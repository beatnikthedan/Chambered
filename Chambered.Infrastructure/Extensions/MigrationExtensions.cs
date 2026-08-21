using System;
using System.Linq;
using System.Threading.Tasks;
using Chambered.Data;
using Chambered.Core.Security;
using Chambered.Infrastructure.LogMessages;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.Extensions
{
    /// <summary>
    /// Provides host and service provider extension methods for database initialization, schema verification, and identity seeding.
    /// </summary>
    public static class MigrationExtensions
    {
        /// <summary>
        /// Ensures the target DbContext database is created and runs an optional asynchronous seeding routine.
        /// </summary>
        public static async Task ApplyMigrations<TContext>(this IHost host, Func<IServiceProvider, Task>? seedAction = null) where TContext : DbContext
        {
            using var scope = host.Services.CreateScope();
            var services = scope.ServiceProvider;
            var contextName = typeof(TContext).Name;
            var log = new MigrationLogMessages(services.GetRequiredService<ILogger<TContext>>());

            try
            {
                var context = services.GetRequiredService<TContext>();
                
                log.DatabaseCreated(contextName);
                await context.Database.EnsureCreatedAsync().ConfigureAwait(false);

                if (seedAction != null)
                {
                    log.SeedingDatabase(contextName);
                    await seedAction(services).ConfigureAwait(false);
                }

                log.InitializationComplete(contextName);
            }
            catch (Exception e)
            {
                log.InitializationFailed(contextName, e);
            }
        }

        /// <summary>
        /// Seeds a default administrative user and role based on ADMIN_EMAIL and ADMIN_PASSWORD environment variables.
        /// </summary>
        public static async Task SeedAdminUser(this IServiceProvider services)
        {
            var logger = services.GetRequiredService<ILogger<ChamberedDbContext>>();
            var log = new UserSeedLogMessages(logger);
            var userManager = services.GetRequiredService<UserManager<ChamberedUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

            var email = Environment.GetEnvironmentVariable("ADMIN_EMAIL");
            var password = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                log.MissingCredentials();
                return;
            }

            var existingUser = await userManager.FindByEmailAsync(email).ConfigureAwait(false);
            if (existingUser == null)
            {
                log.AdminNotFound(email);

                var user = new ChamberedUser 
                { 
                    UserName = "admin", 
                    Email = email, 
                    EmailConfirmed = true 
                };
                
                var result = await userManager.CreateAsync(user, password).ConfigureAwait(false);

                if (result.Succeeded)
                {
                    string adminRole = ChamberedAuthorization.Roles.Admin;
                    if (!await roleManager.RoleExistsAsync(adminRole).ConfigureAwait(false))
                    {
                        log.CreatingRole(adminRole);
                        await roleManager.CreateAsync(new IdentityRole(adminRole)).ConfigureAwait(false);
                    }

                    var roleResult = await userManager.AddToRoleAsync(user, adminRole).ConfigureAwait(false);
                    if (roleResult.Succeeded)
                    {
                        log.SeedingSuccess(email, adminRole);
                    }
                    else
                    {
                        var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                        log.RoleAssignmentError(adminRole, errors);
                    }
                }
                else
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    log.UserCreationError(errors);
                }
            }
            else
            {
                log.UserAlreadyExists(email);
            }
        }

        /// <summary>
        /// Seeds system roles and their default claim permission structures dynamically based on core authorization mapping configuration.
        /// </summary>
        public static async Task SeedIdentityData(this IServiceProvider services)
        {
            var logger = services.GetRequiredService<ILogger<ChamberedDbContext>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

            logger.LogInformation("Seeding standard roles and granular permission claims dynamically...");

            foreach (var entry in ChamberedAuthorization.RoleClaimsMap)
            {
                if (!await roleManager.RoleExistsAsync(entry.Key).ConfigureAwait(false))
                {
                    logger.LogInformation("Creating missing system role: {RoleName}", entry.Key);
                    await roleManager.CreateAsync(new IdentityRole(entry.Key)).ConfigureAwait(false);
                }

                var role = await roleManager.FindByNameAsync(entry.Key).ConfigureAwait(false);
                if (role != null)
                {
                    var existingClaims = await roleManager.GetClaimsAsync(role).ConfigureAwait(false);
                    foreach (var permission in entry.Value)
                    {
                        if (!existingClaims.Any(c => c.Value == permission))
                        {
                            logger.LogInformation("Assigning permission claim {Permission} to role {RoleName}", permission, entry.Key);
                            await roleManager.AddClaimAsync(role, new System.Security.Claims.Claim(ChamberedAuthorization.PermissionClaimType, permission)).ConfigureAwait(false);
                        }
                    }
                }
            }
        }
    }
}
