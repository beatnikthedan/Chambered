using System.Text.Json.Serialization;

namespace BeatnikToolKit.GitVersioning.ValueObjects
{
    /// <summary>
    /// Represents a GitHub user who authored a release or uploaded an asset.
    /// </summary>
    public class GitHubAuthor
    {
        /// <summary>
        /// The GitHub username.
        /// </summary>
        [JsonPropertyName("login")]
        public string Login { get; set; }

        /// <summary>
        /// The numeric GitHub user identifier.
        /// </summary>
        [JsonPropertyName("id")]
        public long Id { get; set; }

        /// <summary>
        /// The GitHub GraphQL node identifier for the user.
        /// </summary>
        [JsonPropertyName("node_id")]
        public string NodeId { get; set; }

        /// <summary>
        /// The URL of the user's avatar image.
        /// </summary>
        [JsonPropertyName("avatar_url")]
        public string AvatarUrl { get; set; }

        /// <summary>
        /// The user's Gravatar ID, if available.
        /// </summary>
        [JsonPropertyName("gravatar_id")]
        public string GravatarId { get; set; }

        /// <summary>
        /// The API URL for this user.
        /// </summary>
        [JsonPropertyName("url")]
        public string Url { get; set; }

        /// <summary>
        /// The public HTML URL for this user's GitHub profile.
        /// </summary>
        [JsonPropertyName("html_url")]
        public string HtmlUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving the user's followers.
        /// </summary>
        [JsonPropertyName("followers_url")]
        public string FollowersUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving the users this user follows.
        /// </summary>
        [JsonPropertyName("following_url")]
        public string FollowingUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving the user's gists.
        /// </summary>
        [JsonPropertyName("gists_url")]
        public string GistsUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving repositories starred by this user.
        /// </summary>
        [JsonPropertyName("starred_url")]
        public string StarredUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving the user's subscriptions.
        /// </summary>
        [JsonPropertyName("subscriptions_url")]
        public string SubscriptionsUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving the user's organizations.
        /// </summary>
        [JsonPropertyName("organizations_url")]
        public string OrganizationsUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving the user's repositories.
        /// </summary>
        [JsonPropertyName("repos_url")]
        public string ReposUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving the user's events.
        /// </summary>
        [JsonPropertyName("events_url")]
        public string EventsUrl { get; set; }

        /// <summary>
        /// The API URL for retrieving events received by this user.
        /// </summary>
        [JsonPropertyName("received_events_url")]
        public string ReceivedEventsUrl { get; set; }

        /// <summary>
        /// The type of GitHub account (typically <c>User</c>).
        /// </summary>
        [JsonPropertyName("type")]
        public string Type { get; set; }

        /// <summary>
        /// Indicates how the user is displayed in GitHub's UI.
        /// </summary>
        [JsonPropertyName("user_view_type")]
        public string UserViewType { get; set; }

        /// <summary>
        /// Indicates whether the user is a GitHub site administrator.
        /// </summary>
        [JsonPropertyName("site_admin")]
        public bool SiteAdmin { get; set; }
    }


}
