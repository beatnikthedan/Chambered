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
    public class FaveIconService(
        HybridCache cache,
        HttpClient httpClient,
        ILogger<FaveIconService> logger) : IFaveIconService
    {
        private readonly HybridCache _cache = cache;
        private readonly HttpClient _httpClient = httpClient;
        private readonly FaveIconServiceLogMessages _log = new FaveIconServiceLogMessages(logger);
        private static readonly TimeSpan CacheDuration = TimeSpan.FromDays(7);

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
                var targetUrl = url.StartsWith("http") ? url : "https://" + url;
                var html = await _httpClient.GetStringAsync(targetUrl, cancellationToken);

                var iconRegex = new Regex("<link[^>]+rel=[\"'](<shortcut icon|icon>)[\"'][^>]+href=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase);
                var match = iconRegex.Match(html);
                if (match.Success)
                {
                    var href = match.Groups[2].Value;
                    var absoluteUrl = href.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                        ? href
                        : new Uri(new Uri(targetUrl), href).ToString();
                    var downloaded = await TryDownloadImageAsync(absoluteUrl, cancellationToken);
                    if (downloaded != null)
                    {
                        _log.FaveIconScrapeSuccessful(absoluteUrl);
                        return downloaded;
                    }
                }
                var baseUri = new Uri(targetUrl);
                var defaultFaviconUrl = $"{baseUri.Scheme}://{baseUri.Host}/favicon.ico";
                var defaultFavicon = await TryDownloadImageAsync(defaultFaviconUrl, cancellationToken);
                if (defaultFavicon != null)
                {
                    _log.FaveIconScrapeSuccessful(defaultFaviconUrl);
                    return defaultFavicon;
                }

                _log.DefaultFaveIconDownloadFailed(defaultFaviconUrl);
            }
            catch (Exception ex)
            {
                _log.FaveIconScrapeFailed(url, ex);
            }
            return null;
        }
        private async Task<FaveIconResult?> TryDownloadImageAsync(string url, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _httpClient.GetAsync(url, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
                    var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/x-icon";
                    return new FaveIconResult
                    {
                        ImageBytes = bytes,
                        ContentType = contentType
                    };
                }
            }
            catch (Exception)
            {
                // Catch network timeout/errors to continue gracefully
            }
            return null;
        }
    }
}
