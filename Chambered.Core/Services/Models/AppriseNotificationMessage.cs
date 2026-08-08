namespace Chambered.Core.Services.Models
{
    /// <summary>
    /// Represents a notification message to be dispatched via Apprise.
    /// </summary>
    public class AppriseNotificationMessage
    {
        /// <summary>
        /// Gets or sets the title or subject of the notification.
        /// </summary>
        /// <value>The title string.</value>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the main body content of the notification.
        /// </summary>
        /// <value>The body message string.</value>
        public string Body { get; set; }

        /// <summary>
        /// Gets or sets optional Apprise tags to target specific notification channels (e.g., "devops", "critical").
        /// </summary>
        /// <value>A list of tag names or <c>null</c>.</value>
        public IEnumerable<string> Tags { get; set; }

        /// <summary>
        /// Gets or sets the notification message type (e.g., "info", "success", "warning", "failure").
        /// </summary>
        /// <value>The type string controlling formatting/iconography in Apprise.</value>
        public string Type { get; set; } = "info";
    }
}
