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
using System.Security.Claims;

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
                                    var principal = context.Principal;
                                    if (principal == null)
                                    {
                                        context.Fail("OIDC principal was null");
                                        return;
                                    }
                                    var subClaim = principal.FindFirst(ClaimTypes.NameIdentifier)
                                        ?? principal.FindFirst("sub")
                                        ?? principal.FindFirst("nameid");
                                    if (subClaim == null)
                                    {
                                        context.Fail("Could not resolve unique user identifier (sub claim) from OIDC token");
                                        return;
                                    }
                                    var claimsDict = principal.Claims
                                        .GroupBy(c => c.Type)
                                        .ToDictionary(
                                            g => g.Key,
                                            g => g.Count() > 1
                                                ? $"[{string.Join(",", g.Select(c => c.Value))}]"
                                                : g.First().Value
                                        );
                                    var externalInfo = new ExternalIdentityDto(context.Scheme.Name, subClaim.Value, claimsDict);
                                    var federatedAuthService = context.HttpContext.RequestServices.GetRequiredService<IFederatedAuthService>();
                                    var loginResult = await federatedAuthService.HandleCallbackAsync(context.Scheme.Name, externalInfo).ConfigureAwait(false);
                                    if (loginResult.IsSuccess)
                                    {
                                        context.HandleResponse();
                                        context.Response.Redirect(context.ReturnUri ?? "/");
                                    }
                                    else
                                    {
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
