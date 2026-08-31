using Microsoft.Extensions.Logging;

namespace BeatnikToolKit.GitVersioning.LogMessages
{
    /// <summary>
    /// Provides strongly-typed high-performance logging methods for the GitHub release service.
    /// </summary>
    public partial class GitHubReleaseServiceLogMessages(ILogger logger)
    {
        private readonly ILogger _logger = logger;

        /// <summary>
        /// Logs that a release is being fetched from GitHub API.
        /// </summary>
        /// <param name="tag">The release tag name.</param>
        [LoggerMessage(EventId = 601, EventName = "FetchingRelease", Level = LogLevel.Information, Message = "Fetching release '{Tag}' from GitHub API")]
        public partial void FetchingRelease(string tag);

        /// <summary>
        /// Logs that a release with the specified tag was not found.
        /// </summary>
        /// <param name="tag">The release tag name.</param>
        [LoggerMessage(EventId = 602, EventName = "ReleaseNotFound", Level = LogLevel.Warning, Message = "GitHub release with tag '{Tag}' was not found")]
        public partial void ReleaseNotFound(string tag);

        /// <summary>
        /// Logs an error that occurred while retrieving a specific release.
        /// </summary>
        /// <param name="ex">The exception that occurred.</param>
        /// <param name="tag">The release tag name.</param>
        [LoggerMessage(EventId = 603, EventName = "ErrorRetrievingRelease", Level = LogLevel.Error, Message = "Error retrieving GitHub release '{Tag}'")]
        public partial void ErrorRetrievingRelease(Exception ex, string tag);

        /// <summary>
        /// Logs an error that occurred while retrieving the latest release.
        /// </summary>
        /// <param name="ex">The exception that occurred.</param>
        [LoggerMessage(EventId = 604, EventName = "ErrorRetrievingLatestRelease", Level = LogLevel.Error, Message = "Error retrieving latest GitHub release")]
        public partial void ErrorRetrievingLatestRelease(Exception ex);

        /// <summary>
        /// Logs an error that occurred while retrieving the release history.
        /// </summary>
        /// <param name="ex">The exception that occurred.</param>
        [LoggerMessage(EventId = 605, EventName = "ErrorRetrievingReleaseHistory", Level = LogLevel.Error, Message = "Error retrieving GitHub release history")]
        public partial void ErrorRetrievingReleaseHistory(Exception ex);
    }
}
