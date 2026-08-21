using System;
using System.Text;
using Chambered.Infrastructure.Authorization;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Chambered.Infrastructure.Extensions
{
    /// <summary>
    /// Provides service collection extension methods to cleanly register decoupled authentication and dynamic claims authorization.
    /// </summary>
    public static class AuthenticationExtensions
    {
        /// <summary>
        /// Registers 100% pure JWT Bearer, custom ApiKey schemes, and dynamic Federated OIDC providers.
        /// </summary>
        public static IServiceCollection AddChamberedAuthentication(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
        {
            var authBuilder = services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Identity.IdentityConstants.ApplicationScheme;
                options.DefaultChallengeScheme = Microsoft.AspNetCore.Identity.IdentityConstants.ApplicationScheme;
                options.DefaultScheme = Microsoft.AspNetCore.Identity.IdentityConstants.ApplicationScheme;
            })
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>("ApiKey", null);

            var federatedAuthSection = configuration.GetSection("FederatedAuthentication");
            if (federatedAuthSection.Exists())
            {
                services.Configure<FederatedAuthenticationConfiguration>(federatedAuthSection);
                var fedOptions = federatedAuthSection.Get<FederatedAuthenticationConfiguration>();

                if (fedOptions?.Providers != null)
                {
                    foreach (var provider in fedOptions.Providers)
                    {
                        authBuilder.AddOpenIdConnect(provider.ProviderName, options =>
                        {
                            options.Authority = provider.Authority;
                            options.ClientId = provider.ClientId;
                            options.ClientSecret = provider.ClientSecret;
                            options.CallbackPath = provider.CallbackPath;
                            options.ResponseType = "code";
                            options.SaveTokens = true;
                            options.GetClaimsFromUserInfoEndpoint = true;

                            if (provider.CustomScopes != null)
                            {
                                foreach (var scope in provider.CustomScopes)
                                {
                                    options.Scope.Add(scope);
                                }
                            }
                        });
                    }
                }
            }

            return services;
        }

        /// <summary>
        /// Registers dynamic on-demand authorization policy providers and evaluators.
        /// </summary>
        public static IServiceCollection AddChamberedAuthorization(this IServiceCollection services)
        {
            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder(
                    Microsoft.AspNetCore.Identity.IdentityConstants.ApplicationScheme,
                    "ApiKey")
                    .RequireAuthenticatedUser()
                    .Build();
            });
            services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
            services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

            return services;
        }
    }
}
