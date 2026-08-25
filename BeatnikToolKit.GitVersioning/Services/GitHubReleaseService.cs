using BeatnikToolKit.GitVersioning.Configuration;
using BeatnikToolKit.GitVersioning.Exceptions;
using BeatnikToolKit.GitVersioning.ValueObjects;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
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
        private readonly IMemoryCache _cache;
        private readonly string _baseUrl;
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> Locks = new();

        private SemaphoreSlim GetLock(string key) => Locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));

        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(15);

        /// <summary>
        /// Initializes a new instance of the <see cref="GitHubReleaseService"/> class.
        /// </summary>
        public GitHubReleaseService(
            HttpClient client,
            IOptions<GitHubReleaseConfiguration> options,
            ILogger<GitHubReleaseService> logger,
            IMemoryCache cache)
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

            if (_cache.TryGetValue(cacheKey, out GitHubRelease cachedRelease))
            {
                return cachedRelease;
            }

            var keyLock = GetLock(cacheKey);
            await keyLock.WaitAsync();
            try
            {
                if (_cache.TryGetValue(cacheKey, out cachedRelease))
                {
                    return cachedRelease;
                }

                _logger.LogInformation("Cache miss. Requesting GitHub release with tag '{Tag}' from API", tag);

                var json = await _client.GetStringAsync($"{_baseUrl}/tags/{tag}");
                var release = JsonSerializer.Deserialize<GitHubRelease>(json);

                var latestStable = await GetLatestRelease(includePrerelease: false);

                if (release != null)
                {
                    release.IsLatest = !string.IsNullOrEmpty(release.TagName) &&
                                       string.Equals(release.TagName, latestStable?.TagName, StringComparison.OrdinalIgnoreCase);
                }

                _cache.Set(cacheKey, release, CacheDuration);
                _logger.LogInformation("Successfully retrieved release '{Tag}' from GitHub API", tag);
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
            finally
            {
                keyLock.Release();
            }
        }

        /// <inheritdoc/>
        public async Task<GitHubRelease> GetLatestRelease(bool includePrerelease = false)
        {
            string cacheKey = $"github_release_latest_prerelease_{includePrerelease}";

            if (_cache.TryGetValue(cacheKey, out GitHubRelease cachedRelease))
            {
                return cachedRelease;
            }

            var keyLock = GetLock(cacheKey);
            await keyLock.WaitAsync();
            try
            {
                if (_cache.TryGetValue(cacheKey, out cachedRelease))
                {
                    return cachedRelease;
                }

                _logger.LogInformation("Cache miss. Requesting latest GitHub release (IncludePrerelease={IncludePrerelease}) from API", includePrerelease);

                if (!includePrerelease)
                {
                    var json = await _client.GetStringAsync($"{_baseUrl}/latest");
                    var latest = JsonSerializer.Deserialize<GitHubRelease>(json);

                    if (latest != null)
                    {
                        latest.IsLatest = true;
                        _logger.LogInformation("Successfully retrieved latest stable release '{Tag}' from GitHub API", latest.TagName);
                    }

                    _cache.Set(cacheKey, latest, CacheDuration);
                    return latest;
                }

                var allJson = await _client.GetStringAsync(_baseUrl);
                var all = JsonSerializer.Deserialize<List<GitHubRelease>>(allJson);

                var newest = all?.FirstOrDefault();
                if (newest != null)
                {
                    newest.IsLatest = true;
                    _logger.LogInformation("Successfully retrieved latest prerelease '{Tag}' from GitHub API", newest.TagName);
                }
                else
                {
                    _logger.LogWarning("No releases found when requesting latest prerelease from GitHub API");
                }

                _cache.Set(cacheKey, newest, CacheDuration);
                return newest;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving latest GitHub release");
                throw new GitHubApiException($"Failed to retrieve latest release: {ex.Message}");
            }
            finally
            {
                keyLock.Release();
            }
        }

        /// <inheritdoc/>
        public async Task<List<GitHubRelease>> GetReleaseHistory(bool includePrerelease = false)
        {
            string cacheKey = $"github_release_history_prerelease_{includePrerelease}";

            if (_cache.TryGetValue(cacheKey, out List<GitHubRelease> cachedHistory))
            {
                return cachedHistory;
            }

            var keyLock = GetLock(cacheKey);
            await keyLock.WaitAsync();
            try
            {
                if (_cache.TryGetValue(cacheKey, out cachedHistory))
                {
                    return cachedHistory;
                }

                _logger.LogInformation("Cache miss. Requesting GitHub release history (IncludePrerelease={IncludePrerelease}) from API", includePrerelease);

                var json = await _client.GetStringAsync(_baseUrl);
                var releases = JsonSerializer.Deserialize<List<GitHubRelease>>(json) ?? new List<GitHubRelease>();

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

                _cache.Set(cacheKey, releases, CacheDuration);
                _logger.LogInformation("Successfully retrieved {Count} releases from GitHub API", releases.Count);
                return releases;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving GitHub release history");
                throw new GitHubApiException($"Failed to retrieve release history: {ex.Message}");
            }
            finally
            {
                keyLock.Release();
            }
        }
    }
}