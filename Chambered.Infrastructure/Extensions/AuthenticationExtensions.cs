using Chambered.Core.Services.Identity;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Infrastructure.Authorization;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
                            options.RequireHttpsMetadata = !environment.IsDevelopment();
                            options.Authority = provider.Authority;
                            options.ClientId = provider.ClientId;
                            options.ClientSecret = provider.ClientSecret;
                            options.CallbackPath = provider.CallbackPath;
                            options.ResponseType = "code";
                            options.ResponseMode = "query";
                            options.SaveTokens = true;
                            options.GetClaimsFromUserInfoEndpoint = true;

                            if (provider.CustomScopes != null)
                            {
                                foreach (var scope in provider.CustomScopes)
                                {
                                    options.Scope.Add(scope);
                                }
                            }

                            options.Events = new Microsoft.AspNetCore.Authentication.OpenIdConnect.OpenIdConnectEvents
                            {
                                OnRemoteFailure = context =>
                                {
                                    var errorMessage = context.Failure?.Message ?? "Remote OIDC authentication failed";
                                    context.Response.Redirect($"/login?error={System.Net.WebUtility.UrlEncode(errorMessage)}");
                                    context.HandleResponse();
                                    return Task.CompletedTask;
                                },
                                OnTicketReceived = async context =>
                                {
                                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("OidcAuthentication");
                                    logger.LogInformation("================== SSO SYNC DIAGNOSTICS ==================");
                                    logger.LogInformation("OIDC Ticket Received: Scheme={Scheme}", context.Scheme.Name);
                                    logger.LogInformation("User Claims Extracted from SSO Token:");

                                    var principal = context.Principal;
                                    if (principal == null) 
                                    {
                                        logger.LogWarning("OIDC Ticket Principal is null!");
                                        logger.LogInformation("=========================================================");
                                        return;
                                    }

                                    foreach (var claim in principal.Claims)
                                    {
                                        logger.LogInformation("  [Claim] {Type} = {Value}", claim.Type, claim.Value);
                                    }
                                    logger.LogInformation("=========================================================");

                                    var providerName = context.Scheme.Name;
                                    var subClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) 
                                        ?? principal.FindFirst("sub")
                                        ?? principal.FindFirst("nameid")
                                        ?? principal.FindFirst(System.Security.Claims.ClaimTypes.Name);

                                    if (subClaim == null) 
                                    {
                                        logger.LogError("OIDC Ticket failed: Could not find NameIdentifier or sub claim!");
                                        return;
                                    }

                                    var providerKey = subClaim.Value;
                                    var claimsDict = principal.Claims
                                        .GroupBy(c => c.Type)
                                        .ToDictionary(g => g.Key, g => g.First().Value);

                                    var externalInfo = new ExternalIdentityDto(providerName, providerKey, claimsDict);
                                    
                                    var federatedAuthService = context.HttpContext.RequestServices.GetRequiredService<IFederatedAuthService>();
                                    var loginResult = await federatedAuthService.HandleCallbackAsync(providerName, externalInfo).ConfigureAwait(false);

                                    if (loginResult.IsSuccess)
                                    {
                                        logger.LogInformation("OIDC Ticket processed successfully. Issuing Application cookie and redirecting to {ReturnUri}", context.ReturnUri ?? "/");
                                        context.HandleResponse();
                                        context.Response.Redirect(context.ReturnUri ?? "/");
                                    }
                                    else
                                    {
                                        logger.LogError("OIDC Ticket processing failed: {Error}", loginResult.ErrorMessage);
                                        context.Fail(loginResult.ErrorMessage);
                                    }
                                }
                            };
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
