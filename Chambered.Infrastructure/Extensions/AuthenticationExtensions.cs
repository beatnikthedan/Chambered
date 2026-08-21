using System;
using System.Text;
using Chambered.Infrastructure.Authorization;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

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
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"] ?? "ChamberedServer",
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"] ?? "AntigravitySuperSecureDevSecretKey123!"))
                };
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
            services.AddAuthorization();
            services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
            services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

            return services;
        }
    }
}
