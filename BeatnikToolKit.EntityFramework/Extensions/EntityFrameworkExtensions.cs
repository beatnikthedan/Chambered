using BeatnikToolKit.EntityFramework.Configuration;
using BeatnikToolKit.EntityFramework.LogMessages;
using BeatnikToolKit.EntityFramework.Services;
using BeatnikToolKit.EntityFramework.Services.Identity;
using BeatnikToolKit.EntityFramework.Utility;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Microsoft.Extensions.DependencyInjection
{
    /// <summary>
    /// Provides extension methods for Entity Framework database migrations and seeding operations.
    /// </summary>
    public static class EntityFrameworkExtensions
    {
        public static IServiceCollection AddIdentityServices<TContext, TUser>(this IServiceCollection services) where TContext : IdentityDbContext<TUser> where TUser : IdentityUser, new()
        {
            services.AddOptions<FederatedAuthenticationConfiguration>().Configure<IConfiguration>((settings, configuration) =>{configuration.GetSection(nameof(FederatedAuthenticationConfiguration)).Bind(settings);});
            services.AddOptions<IdentityConfiguration>().Configure<IConfiguration>((settings, configuration) => { configuration.GetSection(nameof(IdentityConfiguration)).Bind(settings); });

            services.AddScoped<IAuthenticationService, AuthenticationService<TUser>>();
            services.AddScoped<IFederatedAuthService, FederatedAuthService<TUser>>();
            services.AddScoped<IIdentityService, IdentityService<TContext, TUser>>();
            services.AddScoped<IRoleService, RoleService>();

            services.AddIdentity<TUser, IdentityRole>(options =>
            {
                // Static options like unique email can remain here
                options.User.RequireUniqueEmail = false;
            }).AddEntityFrameworkStores<TContext>().AddDefaultTokenProviders();

            return services;
        }
        
        /// <summary>
        /// Registers the generic current user service and configures custom claims mapping.
        /// </summary>
        /// <typeparam name="TUser">The identity user type.</typeparam>
        /// <param name="services">The service collection.</param>
        /// <param name="mapCustomClaims">The custom claims mapping action.</param>
        /// <returns>The updated service collection.</returns>
        public static IServiceCollection AddCurrentUserService<TUser>(
            this IServiceCollection services,
            Action<ClaimsPrincipal, TUser>? mapCustomClaims = null)
            where TUser : IdentityUser, new()
        {
            services.AddScoped<ICurrentUserService<TUser>, CurrentUserService<TUser>>();

            services.Configure<CurrentUserServiceOptions<TUser>>(options =>
            {
                options.MapCustomClaims = mapCustomClaims;
            });
            return services;
        }

        /// <summary>
        /// Registers the generic audit properties interceptor and configures custom name formatting.
        /// </summary>
        /// <typeparam name="TUser">The identity user type.</typeparam>
        /// <param name="services">The service collection.</param>
        /// <param name="resolveAuditorName">The custom function to resolve auditor names.</param>
        /// <returns>The updated service collection.</returns>
        public static IServiceCollection AddAuditPropertiesInterceptor<TUser>(
            this IServiceCollection services,
            Func<TUser, string>? resolveAuditorName = null)
            where TUser : IdentityUser
        {
            services.AddScoped<AuditPropertiesInterceptor<TUser>>();

            services.Configure<AuditPropertiesInterceptorOptions<TUser>>(options =>
            {
                if (resolveAuditorName != null)
                {
                    options.ResolveAuditorName = resolveAuditorName;
                }
            });
            return services;
        }

        /// <summary>
        /// Ensures the target DbContext database is created and runs an optional asynchronous seeding routine.
        /// </summary>
        /// <typeparam name="TContext">The database context type.</typeparam>
        /// <param name="host">The system host provider context.</param>
        /// <param name="seedAction">The optional seed initialization action.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        public static async Task ApplyMigrations<TContext>(this IHost host, Func<IServiceProvider, Task>? seedAction = null) where TContext : DbContext
        {
            using var scope = host.Services.CreateScope();
            var services = scope.ServiceProvider;
            var contextName = typeof(TContext).Name;
            var log = new EntityFrameworkExtensionsLogMessages(services.GetRequiredService<ILogger<TContext>>());

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
        /// <param name="services">The service provider to resolve managers.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        public static async Task SeedAdminUser<TContext, TUser>(this IServiceProvider services) where TContext : IdentityDbContext<TUser> where TUser : IdentityUser, new()
        {
            var logger = services.GetRequiredService<ILogger<TContext>>();
            var log = new EntityFrameworkExtensionsLogMessages(logger);
            var userManager = services.GetRequiredService<UserManager<TUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var rulebook = services.GetRequiredService<IAuthorizationRulebook>();

            var configuration = services.GetRequiredService<IConfiguration>();
            var email = configuration["ADMIN_EMAIL"];
            var password = configuration["ADMIN_PASSWORD"];

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                log.MissingCredentials();
                return;
            }

            var existingUser = await userManager.FindByEmailAsync(email).ConfigureAwait(false);
            if (existingUser == null)
            {
                log.AdminNotFound(email);

                var user = new TUser
                {
                    UserName = "admin",
                    Email = email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, password).ConfigureAwait(false);

                if (result.Succeeded)
                {
                    string adminRole = rulebook.AdminRoleName;
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
        /// <param name="services">The service provider to resolve managers.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        public static async Task SeedIdentityData<TContext, TUser>(this IServiceProvider services) where TContext : IdentityDbContext<TUser> where TUser : IdentityUser
        {
            var logger = services.GetRequiredService<ILogger<TContext>>();
            var log = new EntityFrameworkExtensionsLogMessages(logger);
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var rulebook = services.GetRequiredService<IAuthorizationRulebook>();

            log.SeedingIdentityDataStarted();

            foreach (var entry in rulebook.RoleClaimsMap)
            {
                if (!await roleManager.RoleExistsAsync(entry.Key).ConfigureAwait(false))
                {
                    log.SystemRoleCreated(entry.Key);
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
                            log.PermissionAssigned(permission, entry.Key);
                            await roleManager.AddClaimAsync(role, new Claim(rulebook.PermissionClaimType, permission)).ConfigureAwait(false);
                        }
                    }
                }
            }
        }
    }
}
