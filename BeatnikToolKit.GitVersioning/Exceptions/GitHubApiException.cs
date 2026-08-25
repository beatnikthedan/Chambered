namespace BeatnikToolKit.GitVersioning.Exceptions
{
    /// <summary>
    /// Represents an error that occurs when a request to the GitHub API fails
    /// in a way that is not recoverable or expected by normal application flow.
    /// </summary>
    /// <remarks>
    /// This exception is thrown by <see cref="GitHubReleaseService"/> when the
    /// GitHub API returns an unexpected status code, malformed data, or when
    /// a network or deserialization error prevents a release from being retrieved.
    /// It is intended to wrap lower-level exceptions and provide a consistent
    /// error type for callers of the release service.
    /// </remarks>
    public class GitHubApiException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GitHubApiException"/> class
        /// with a specified error message describing the failure.
        /// </summary>
        /// <param name="message">
        /// A human-readable description of the GitHub API error.
        /// </param>
        public GitHubApiException(string message)
            : base(message) { }
    }

}
