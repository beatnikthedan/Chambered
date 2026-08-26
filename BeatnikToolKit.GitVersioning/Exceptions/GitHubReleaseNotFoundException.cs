namespace BeatnikToolKit.GitVersioning.Exceptions
{
    /// <summary>
    /// Represents an error that occurs when a specific GitHub release
    /// cannot be found using the provided tag name.
    /// </summary>
    /// <remarks>
    /// This exception is thrown by <see cref="GitHubReleaseService"/> when the
    /// GitHub API returns a <c>404 Not Found</c> response for a release tag.
    /// It provides a clear and consistent way for callers to detect missing
    /// releases without relying on HTTP status codes.
    /// </remarks>
    public class GitHubReleaseNotFoundException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GitHubReleaseNotFoundException"/> class
        /// with a message indicating which tag could not be found.
        /// </summary>
        /// <param name="tag">
        /// The release tag that was requested but not found in the GitHub repository.
        /// </param>
        public GitHubReleaseNotFoundException(string tag)
            : base($"GitHub release with tag '{tag}' was not found.") { }
    }

}
