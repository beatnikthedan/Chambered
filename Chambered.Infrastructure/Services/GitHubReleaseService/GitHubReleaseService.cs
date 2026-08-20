using Chambered.Core.Exceptions;
using Chambered.Core.Services;
using Chambered.Core.Services.Models;
using Chambered.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net;

namespace Chambered.Infrastructure.Services.GitHubReleaseService
{
    /// <summary>
    /// Provides operations for retrieving release information from a GitHub repository,
    /// including the latest release, release history, and specific tagged releases.
    /// </summary>
    /// <remarks>
    /// This service uses a typed <see cref="HttpClient"/> registered via
    /// <c>AddHttpClient</c> and is configured through
    /// <see cref="GitHubReleaseConfiguration"/> using the <c>IOptions</c> pattern.
    /// Logging is performed through <see cref="ILogger{GitHubReleaseService}"/>.
    /// </remarks>
    public class GitHubReleaseService : IGitHubReleaseService
    {
        private readonly HttpClient _client;
        private readonly IOptions<GitHubReleaseConfiguration> _options;
        private readonly ILogger<GitHubReleaseService> _logger;
        private readonly string _baseUrl;

        /// <summary>
        /// Initializes a new instance of the <see cref="GitHubReleaseService"/> class.
        /// </summary>
        /// <param name="client">
        /// The <see cref="HttpClient"/> instance used to communicate with the GitHub API.
        /// This client is supplied by dependency injection via <c>AddHttpClient</c> and
        /// is automatically managed by the framework.
        /// </param>
        /// <param name="options">
        /// Strongly typed configuration settings specifying the GitHub repository owner
        /// and repository name from which release information should be retrieved.
        /// </param>
        /// <param name="logger">
        /// The logger used to record diagnostic and operational information during
        /// GitHub API interactions.
        /// </param>
        /// <remarks>
        /// The constructor configures the required GitHub User-Agent header and builds
        /// the base API URL for all subsequent release queries.
        /// </remarks>
        public GitHubReleaseService(HttpClient client, IOptions<GitHubReleaseConfiguration> options, ILogger<GitHubReleaseService> logger)
        {
            _options = options;
            _client = client;
            _client.DefaultRequestHeaders.UserAgent.ParseAdd(_options.Value.UserAgengt);
            _logger = logger;
            _baseUrl = $"https://api.github.com/repos/{_options.Value.RepositoryOwner}/{_options.Value.RepositoryName}/releases";
        }

        /// <inheritdoc cref="IGitHubReleaseService.GetReleaseByTag(string)"/>
        public async Task<GitHubRelease> GetReleaseByTag(string tag)
        {
            _logger.LogInformation("Requesting GitHub release with tag '{Tag}'", tag);

            try
            {
                var json = await _client.GetStringAsync($"{_baseUrl}/tags/{tag}");
                var release = JsonConvert.DeserializeObject<GitHubRelease>(json);

                var latestJson = await _client.GetStringAsync($"{_baseUrl}/latest");
                var latestStable = JsonConvert.DeserializeObject<GitHubRelease>(latestJson);

                if (release.TagName == latestStable.TagName)
                {
                    release.IsLatest = true;
                }

                _logger.LogInformation("Successfully retrieved release '{Tag}'", tag);
                return release;
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogWarning("GitHub release with tag '{Tag}' was not found", tag);
                throw new GitHubReleaseNotFoundException(tag);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving GitHub release '{Tag}'", tag);
                throw new GitHubApiException($"Failed to retrieve release '{tag}': {ex.Message}");
            }
        }

        /// <inheritdoc cref="IGitHubReleaseService.GetLatestRelease(bool)"/>
        public async Task<GitHubRelease> GetLatestRelease(bool includePrerelease = false)
        {
            _logger.LogInformation("Requesting latest GitHub release (IncludePrerelease={IncludePrerelease})", includePrerelease);

            try
            {
                if (!includePrerelease)
                {
                    var json = await _client.GetStringAsync($"{_baseUrl}/latest");
                    var latest = JsonConvert.DeserializeObject<GitHubRelease>(json);
                    latest.IsLatest = true;

                    _logger.LogInformation("Successfully retrieved latest stable release '{Tag}'", latest.TagName);
                    return latest;
                }

                var allJson = await _client.GetStringAsync(_baseUrl);
                var all = JsonConvert.DeserializeObject<List<GitHubRelease>>(allJson);

                var newest = all.FirstOrDefault();
                if (newest != null)
                {
                    newest.IsLatest = true;
                    _logger.LogInformation("Successfully retrieved latest prerelease '{Tag}'", newest.TagName);
                }
                else
                {
                    _logger.LogWarning("No releases found when requesting latest prerelease");
                }

                return newest;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving latest GitHub release");
                throw new GitHubApiException($"Failed to retrieve latest release: {ex.Message}");
            }
        }

        /// <inheritdoc cref="IGitHubReleaseService.GetReleaseHistory(bool)"/>
        public async Task<List<GitHubRelease>> GetReleaseHistory(bool includePrerelease = false)
        {
            _logger.LogInformation("Requesting GitHub release history (IncludePrerelease={IncludePrerelease})", includePrerelease);

            try
            {
                var json = await _client.GetStringAsync(_baseUrl);
                var releases = JsonConvert.DeserializeObject<List<GitHubRelease>>(json);

                if (!includePrerelease)
                {
                    releases = releases.Where(r => !r.Prerelease).ToList();
                    _logger.LogInformation("Filtered release history to stable releases only");
                }

                var latest = releases.FirstOrDefault();
                if (latest != null)
                {
                    latest.IsLatest = true;
                }

                _logger.LogInformation("Successfully retrieved {Count} releases", releases.Count);
                return releases;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving GitHub release history");
                throw new GitHubApiException($"Failed to retrieve release history: {ex.Message}");
            }
        }
    }
}
