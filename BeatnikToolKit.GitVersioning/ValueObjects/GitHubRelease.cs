using System.Text.Json.Serialization;

namespace BeatnikToolKit.GitVersioning.ValueObjects
{
    /// <summary>
    /// Represents a GitHub release, including metadata, author information,
    /// associated assets, and versioning details.
    /// </summary>
    public class GitHubRelease
    {
        /// <summary>
        /// The API URL for this release resource.
        /// </summary>
        [JsonPropertyName("url")]
        public string Url { get; set; }

        /// <summary>
        /// The API URL for retrieving assets associated with this release.
        /// </summary>
        [JsonPropertyName("assets_url")]
        public string AssetsUrl { get; set; }

        /// <summary>
        /// The API URL used to upload assets to this release.
        /// </summary>
        [JsonPropertyName("upload_url")]
        public string UploadUrl { get; set; }

        /// <summary>
        /// The public HTML URL for viewing this release on GitHub.
        /// </summary>
        [JsonPropertyName("html_url")]
        public string HtmlUrl { get; set; }

        /// <summary>
        /// The unique numeric identifier for this release.
        /// </summary>
        [JsonPropertyName("id")]
        public long Id { get; set; }

        /// <summary>
        /// Information about the GitHub user who authored the release.
        /// </summary>
        [JsonPropertyName("author")]
        public GitHubAuthor Author { get; set; }

        /// <summary>
        /// The GitHub GraphQL node identifier for this release.
        /// </summary>
        [JsonPropertyName("node_id")]
        public string NodeId { get; set; }

        /// <summary>
        /// The tag name associated with this release (e.g., <c>v5.2.0-rc2</c>).
        /// </summary>
        [JsonPropertyName("tag_name")]
        public string TagName { get; set; }

        /// <summary>
        /// The branch or commit SHA that the release is based on.
        /// </summary>
        [JsonPropertyName("target_commitish")]
        public string TargetCommitish { get; set; }

        /// <summary>
        /// The display name of the release.
        /// </summary>
        [JsonPropertyName("name")]
        public string Name { get; set; }

        /// <summary>
        /// Indicates whether the release is a draft.
        /// </summary>
        [JsonPropertyName("draft")]
        public bool Draft { get; set; }

        /// <summary>
        /// Indicates whether the release is immutable and cannot be modified.
        /// </summary>
        [JsonPropertyName("immutable")]
        public bool Immutable { get; set; }

        /// <summary>
        /// Indicates whether the release is marked as a prerelease.
        /// </summary>
        [JsonPropertyName("prerelease")]
        public bool Prerelease { get; set; }

        /// <summary>
        /// The timestamp when the release was created.
        /// </summary>
        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// The timestamp when the release was last updated.
        /// </summary>
        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// The timestamp when the release was published.
        /// </summary>
        [JsonPropertyName("published_at")]
        public DateTime PublishedAt { get; set; }

        /// <summary>
        /// A collection of assets attached to this release.
        /// </summary>
        [JsonPropertyName("assets")]
        public List<GitHubAsset> Assets { get; set; }

        /// <summary>
        /// The URL for downloading the release as a tarball archive.
        /// </summary>
        [JsonPropertyName("tarball_url")]
        public string TarballUrl { get; set; }

        /// <summary>
        /// The URL for downloading the release as a zip archive.
        /// </summary>
        [JsonPropertyName("zipball_url")]
        public string ZipballUrl { get; set; }

        /// <summary>
        /// The release notes or description text.
        /// </summary>
        [JsonPropertyName("body")]
        public string Body { get; set; }

        /// <summary>
        /// The number of times this release was mentioned in GitHub discussions.
        /// </summary>
        [JsonPropertyName("mentions_count")]
        public int MentionsCount { get; set; }

        /// <summary>
        /// Indicates whether this release is the newest release according to
        /// the versioning logic applied by the server.
        /// </summary>
        public bool IsLatest { get; set; }
    }
}
