using Chambered.Core.Services;
using Chambered.Core.Services.Models;
using Chambered.Infrastructure.LogMessages;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace Chambered.Infrastructure.Services
{
    /// <summary>
    /// Domain-agnostic service handling scraping, downloading, and hybrid caching of webpage favicons.
    /// </summary>
    public class FaveIconService : IFaveIconService
    {
        private readonly HybridCache _cache;
        private readonly HttpClient _httpClient;
        private readonly FaveIconServiceLogMessages _log;

        private static readonly TimeSpan CacheDuration = TimeSpan.FromDays(7);

        /// <summary>
        /// Initializes a new instance of the <see cref="FaveIconService"/> class.
        /// </summary>
        /// <param name="cache">The hybrid cache manager.</param>
        /// <param name="httpClient">The HTTP client.</param>
        /// <param name="logger">The logging instance.</param>
        public FaveIconService(
            HybridCache cache,
            HttpClient httpClient,
            ILogger<FaveIconService> logger)
        {
            _cache = cache;
            _httpClient = httpClient;
            _log = new FaveIconServiceLogMessages(logger);

            if (!_httpClient.DefaultRequestHeaders.UserAgent.Any())
            {
                _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            }
        }

        /// <inheritdoc/>
        public async Task<FaveIconResult?> GetFaveIconAsync(string url, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return null;
            }

            string sanitizedUrl = url.Trim().ToLowerInvariant();
            string cacheKey = $"faveicon_{sanitizedUrl.GetHashCode()}";

            return await _cache.GetOrCreateAsync(
                cacheKey,
                async token => await ScrapeAndResolveFaviconAsync(sanitizedUrl, token),
                new HybridCacheEntryOptions { Expiration = CacheDuration },
                cancellationToken: cancellationToken
            );
        }

        private async Task<FaveIconResult?> ScrapeAndResolveFaviconAsync(string url, CancellationToken cancellationToken)
        {
            _log.FaveIconResolutionInitiated(url);

            try
            {
                string targetUrl = url.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? url : "https://" + url;

                using HttpResponseMessage response = await _httpClient.GetAsync(targetUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    return await TryDefaultFaviconFallbackAsync(targetUrl, cancellationToken);
                }

                string finalBaseUrl = response.RequestMessage?.RequestUri?.ToString() ?? targetUrl;

                using HttpResponseMessage contentResponse = await _httpClient.GetAsync(finalBaseUrl, cancellationToken);
                string html = await contentResponse.Content.ReadAsStringAsync(cancellationToken);

                Regex iconRegex = new Regex("<link[^>]+rel=[\"'][^\"']*icon[^\"']*[\"'][^>]+href=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase);
                Match match = iconRegex.Match(html);

                if (match.Success)
                {
                    string href = match.Groups[1].Value;
                    string absoluteUrl = href.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                        ? href
                        : new Uri(new Uri(finalBaseUrl), href).ToString();

                    FaveIconResult? downloaded = await TryDownloadImageAsync(absoluteUrl, cancellationToken);
                    if (downloaded != null)
                    {
                        _log.FaveIconScrapeSuccessful(absoluteUrl);
                        return downloaded;
                    }
                }

                return await TryDefaultFaviconFallbackAsync(finalBaseUrl, cancellationToken);
            }
            catch (Exception ex)
            {
                _log.FaveIconScrapeFailed(url, ex);
            }

            return null;
        }

        private async Task<FaveIconResult?> TryDefaultFaviconFallbackAsync(string baseUrl, CancellationToken cancellationToken)
        {
            try
            {
                Uri baseUri = new Uri(baseUrl);
                string defaultFaviconUrl = $"{baseUri.Scheme}://{baseUri.Host}/favicon.ico";
                FaveIconResult? defaultFavicon = await TryDownloadImageAsync(defaultFaviconUrl, cancellationToken);
                if (defaultFavicon != null)
                {
                    _log.FaveIconScrapeSuccessful(defaultFaviconUrl);
                    return defaultFavicon;
                }
                _log.DefaultFaveIconDownloadFailed(defaultFaviconUrl);
            }
            catch (Exception)
            {
            }
            return null;
        }

        private async Task<FaveIconResult?> TryDownloadImageAsync(string url, CancellationToken cancellationToken)
        {
            try
            {
                HttpResponseMessage response = await _httpClient.GetAsync(url, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    byte[] bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
                    string contentType = response.Content.Headers.ContentType?.MediaType ?? "image/x-icon";

                    return new FaveIconResult
                    {
                        ImageBytes = bytes,
                        ContentType = contentType
                    };
                }
            }
            catch (Exception)
            {
            }

            return null;
        }
    }
}
