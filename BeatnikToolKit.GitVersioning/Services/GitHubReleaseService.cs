using BeatnikToolKit.GitVersioning.Configuration;
using BeatnikToolKit.GitVersioning.Exceptions;
using BeatnikToolKit.GitVersioning.ValueObjects;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Text.Json;

namespace BeatnikToolKit.GitVersioning.Services
{
    /// <summary>
    /// Provides operations for retrieving release information from a GitHub repository,
    /// including the latest release, release history, and specific tagged releases.
    /// Uses an in-memory cache to prevent GitHub API rate-limiting issues.
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
        private readonly HybridCache _cache;
        private readonly string _baseUrl;

        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(15);

        /// <summary>
        /// Initializes a new instance of the <see cref="GitHubReleaseService"/> class.
        /// </summary>
        /// <param name="client">The HTTP client used to perform API calls.</param>
        /// <param name="options">The configuration options containing GitHub API endpoints and credentials.</param>
        /// <param name="logger">The logger instance.</param>
        /// <param name="cache">The hybrid cache service.</param>
        public GitHubReleaseService(
            HttpClient client,
            IOptions<GitHubReleaseConfiguration> options,
            ILogger<GitHubReleaseService> logger,
            HybridCache cache)
        {
            _options = options;
            _client = client;
            _client.DefaultRequestHeaders.UserAgent.ParseAdd(_options.Value.UserAgent);
            _logger = logger;
            _baseUrl = $"https://api.github.com/repos/{_options.Value.RepositoryOwner}/{_options.Value.RepositoryName}/releases";
            _cache = cache;
        }

        /// <inheritdoc/>
        public async Task<GitHubRelease> GetReleaseByTag(string tag)
        {
            string cacheKey = $"github_release_tag_{tag}";

            return await _cache.GetOrCreateAsync(
                cacheKey,
                async token =>
                {
                    try
                    {
                        _logger.LogInformation("Fetching release '{Tag}' from GitHub API", tag);

                        var json = await _client.GetStringAsync($"{_baseUrl}/tags/{tag}");
                        var release = JsonSerializer.Deserialize<GitHubRelease>(json);

                        var latestStable = await GetLatestRelease(includePrerelease: false);

                        if (release != null)
                        {
                            release.IsLatest = !string.IsNullOrEmpty(release.TagName) &&
                                               string.Equals(release.TagName, latestStable?.TagName, StringComparison.OrdinalIgnoreCase);
                        }

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
                },
                new HybridCacheEntryOptions { Expiration = CacheDuration }
            ) ?? throw new GitHubReleaseNotFoundException(tag);
        }

        /// <inheritdoc/>
        public async Task<GitHubRelease> GetLatestRelease(bool includePrerelease = false)
        {
            string cacheKey = $"github_release_latest_prerelease_{includePrerelease}";

            return await _cache.GetOrCreateAsync(
                cacheKey,
                async token =>
                {
                    try
                    {
                        if (!includePrerelease)
                        {
                            var json = await _client.GetStringAsync($"{_baseUrl}/latest");
                            var latest = JsonSerializer.Deserialize<GitHubRelease>(json);

                            if (latest != null)
                            {
                                latest.IsLatest = true;
                            }

                            return latest;
                        }

                        var allJson = await _client.GetStringAsync(_baseUrl);
                        var all = JsonSerializer.Deserialize<List<GitHubRelease>>(allJson);

                        var newest = all?.FirstOrDefault();
                        if (newest != null)
                        {
                            newest.IsLatest = true;
                        }

                        return newest;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error retrieving latest GitHub release");
                        throw new GitHubApiException($"Failed to retrieve latest release: {ex.Message}");
                    }
                },
                new HybridCacheEntryOptions { Expiration = CacheDuration }
            );
        }

        /// <inheritdoc/>
        public async Task<List<GitHubRelease>> GetReleaseHistory(bool includePrerelease = false)
        {
            string cacheKey = $"github_release_history_prerelease_{includePrerelease}";

            return await _cache.GetOrCreateAsync(
                cacheKey,
                async token =>
                {
                    try
                    {
                        var json = await _client.GetStringAsync(_baseUrl);
                        var releases = JsonSerializer.Deserialize<List<GitHubRelease>>(json) ?? new List<GitHubRelease>();

                        if (!includePrerelease)
                        {
                            releases = releases.Where(r => !r.Prerelease).ToList();
                        }

                        var latest = releases.FirstOrDefault();
                        if (latest != null)
                        {
                            latest.IsLatest = true;
                        }

                        return releases;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error retrieving GitHub release history");
                        throw new GitHubApiException($"Failed to retrieve release history: {ex.Message}");
                    }
                },
                new HybridCacheEntryOptions { Expiration = CacheDuration }
            ) ?? new List<GitHubRelease>();
        }
    }
}