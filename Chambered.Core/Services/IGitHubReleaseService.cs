using Chambered.Core.Services.Models;

namespace Chambered.Core.Services
{
    /// <summary>
    /// Provides access to GitHub release metadata for the ATSPM project,
    /// including tagged releases, the latest release, and full release history.
    /// </summary>
    public interface IGitHubReleaseService
    {
        /// <summary>
        /// Retrieves a specific GitHub release by its tag name.
        /// </summary>
        /// <param name="tag">
        /// The release tag to look up (for example, <c>v5.2.0-rc2</c>).
        /// This must match an existing GitHub release tag exactly.
        /// </param>
        /// <returns>
        /// A <see cref="GitHubRelease"/> representing the release associated with the specified tag.
        /// </returns>
        /// <exception cref="GitHubReleaseNotFoundException"></exception>
        /// <exception cref="GitHubApiException"></exception>
        Task<GitHubRelease> GetReleaseByTag(string tag);

        /// <summary>
        /// Retrieves the most recent GitHub release.
        /// </summary>
        /// <param name="includePrerelease">
        /// If <c>true</c>, prerelease versions (e.g., release candidates) are included
        /// when determining the newest release.  
        /// If <c>false</c>, only stable releases are considered.
        /// </param>
        /// <returns>
        /// The newest <see cref="GitHubRelease"/> according to the specified prerelease behavior.
        /// The returned release will have <see cref="GitHubRelease.IsLatest"/> set to <c>true</c>.
        /// </returns>
        /// <exception cref="GitHubApiException"></exception>
        Task<GitHubRelease> GetLatestRelease(bool includePrerelease);

        /// <summary>
        /// Retrieves the full release history from GitHub.
        /// </summary>
        /// <param name="includePrerelease">
        /// If <c>true</c>, prerelease versions are included in the history.  
        /// If <c>false</c>, only stable releases are returned.
        /// </param>
        /// <returns>
        /// A list of <see cref="GitHubRelease"/> objects ordered from newest to oldest.
        /// </returns>
        /// <exception cref="GitHubApiException"></exception>
        Task<List<GitHubRelease>> GetReleaseHistory(bool includePrerelease);
    }
}
