using BeatnikToolKit.Attributes;

namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Represents configuration settings used by <see cref="GitHubReleaseService"/>
    /// to access release information from a specific GitHub repository.
    /// </summary>
    /// <remarks>
    /// These settings are typically bound from configuration using the
    /// <c>IOptions&lt;GitHubReleaseConfiguration&gt;</c> pattern.  
    /// They define which repository to query and which User-Agent header
    /// should be sent with GitHub API requests.
    /// </remarks>
    [ConfigurationSection(nameof(GitHubReleaseConfiguration), null)]
    public class GitHubReleaseConfiguration
    {
        /// <summary>
        /// The GitHub username or organization that owns the repository
        /// containing the releases to query.
        /// </summary>
        public string RepositoryOwner { get; set; }

        /// <summary>
        /// The name of the GitHub repository whose releases should be retrieved.
        /// </summary>
        public string RepositoryName { get; set; }

        /// <summary>
        /// The User-Agent header value sent with GitHub API requests.
        /// GitHub requires a valid User-Agent string for all API calls.
        /// Defaults to <c>Repo-Version-Checker</c>.
        /// </summary>
        public string UserAgent { get; set; } = "Repo-Version-Checker";
    }
}
