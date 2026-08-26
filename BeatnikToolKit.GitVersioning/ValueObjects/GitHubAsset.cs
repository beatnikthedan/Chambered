using System.Text.Json.Serialization;

namespace BeatnikToolKit.GitVersioning.ValueObjects
{
    /// <summary>
    /// Represents a downloadable asset attached to a GitHub release.
    /// </summary>
    public class GitHubAsset
    {
        /// <summary>
        /// The API URL for this asset resource.
        /// </summary>
        [JsonPropertyName("url")]
        public string Url { get; set; }

        /// <summary>
        /// The unique numeric identifier for this asset.
        /// </summary>
        [JsonPropertyName("id")]
        public long Id { get; set; }

        /// <summary>
        /// The GitHub GraphQL node identifier for this asset.
        /// </summary>
        [JsonPropertyName("node_id")]
        public string NodeId { get; set; }

        /// <summary>
        /// The file name of the asset.
        /// </summary>
        [JsonPropertyName("name")]
        public string Name { get; set; }

        /// <summary>
        /// An optional label describing the asset.
        /// </summary>
        [JsonPropertyName("label")]
        public string Label { get; set; }

        /// <summary>
        /// Information about the user who uploaded the asset.
        /// </summary>
        [JsonPropertyName("uploader")]
        public GitHubAuthor Uploader { get; set; }

        /// <summary>
        /// The MIME content type of the asset.
        /// </summary>
        [JsonPropertyName("content_type")]
        public string ContentType { get; set; }

        /// <summary>
        /// The current state of the asset (e.g., <c>uploaded</c>).
        /// </summary>
        [JsonPropertyName("state")]
        public string State { get; set; }

        /// <summary>
        /// The size of the asset in bytes.
        /// </summary>
        [JsonPropertyName("size")]
        public long Size { get; set; }

        /// <summary>
        /// The number of times the asset has been downloaded.
        /// </summary>
        [JsonPropertyName("download_count")]
        public int DownloadCount { get; set; }

        /// <summary>
        /// The timestamp when the asset was created.
        /// </summary>
        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// The timestamp when the asset was last updated.
        /// </summary>
        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// The public URL for downloading the asset.
        /// </summary>
        [JsonPropertyName("browser_download_url")]
        public string BrowserDownloadUrl { get; set; }
    }
}
