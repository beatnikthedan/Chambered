using BeatnikToolKit.GitVersioning.Configuration;
using BeatnikToolKit.GitVersioning.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BeatnikToolKit.GitVersioning.Extensions
{
    public static class GitVersioningExtensions
    {
        public static IServiceCollection AddGitHubVersioning(this IServiceCollection services)
        {
            services.AddOptions<GitHubReleaseConfiguration>().Configure<IConfiguration>((settings, configuration) => { configuration.GetSection(nameof(GitHubReleaseConfiguration)).Bind(settings); });

            services.AddHttpClient<IGitHubReleaseService, GitHubReleaseService>();

            //services.AddMemoryCache();

            return services;
        }
    }
}
