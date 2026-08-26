using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the favicon service.
    /// </summary>
    public partial class FaveIconServiceLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;
        /// <summary>
        /// Logs that favicon resolution has been initiated for a webpage URL.
        /// </summary>
        /// <param name="url">The webpage URL.</param>
        [LoggerMessage(EventId = 701, EventName = "FaveIconResolutionInitiated", Level = LogLevel.Information, Message = "Initiating favicon resolution for webpage: {Url}")]
        public partial void FaveIconResolutionInitiated(string url);
        /// <summary>
        /// Logs that a favicon was successfully scraped and resolved.
        /// </summary>
        /// <param name="url">The download URL of the favicon.</param>
        [LoggerMessage(EventId = 702, EventName = "FaveIconScrapeSuccessful", Level = LogLevel.Information, Message = "Successfully scraped and downloaded favicon from {Url}")]
        public partial void FaveIconScrapeSuccessful(string url);
        /// <summary>
        /// Logs that scraping the favicon failed.
        /// </summary>
        /// <param name="url">The webpage URL.</param>
        /// <param name="ex">The exception that occurred.</param>
        [LoggerMessage(EventId = 703, EventName = "FaveIconScrapeFailed", Level = LogLevel.Warning, Message = "Failed to scrape favicon from webpage '{Url}'")]
        public partial void FaveIconScrapeFailed(string url, Exception ex);
        /// <summary>
        /// Logs that downloading a default favicon from default path failed.
        /// </summary>
        /// <param name="url">The default favicon URL.</param>
        [LoggerMessage(EventId = 704, EventName = "DefaultFaveIconDownloadFailed", Level = LogLevel.Debug, Message = "Failed to download default favicon from {Url}")]
        public partial void DefaultFaveIconDownloadFailed(string url);
    }
}
