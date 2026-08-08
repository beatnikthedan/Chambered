using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Represents configuration settings for connecting to an Apprise API instance.
    /// </summary>
    [ConfigurationSection(nameof(AppriseConfiguration), null)]
    public class AppriseConfiguration
    {
        /// <summary>
        /// Gets or sets the base URL or direct endpoint of the Apprise API service.
        /// (e.g., "http://192.168.1.50:8000" or "http://apprise.local:8000/notify/my-app-key").
        /// </summary>
        /// <value>The Apprise API URL host.</value>
        public string HostUrl { get; set; }

        /// <summary>
        /// Gets or sets the optional notification key/stateless ID used in Apprise API endpoints.
        /// </summary>
        /// <value>The optional state key string.</value>
        public string NotificationKey { get; set; }

        /// <summary>
        /// Gets or sets optional comma-separated target URLs if using stateless Apprise mode (e.g., "pbul://key, discord://webhook_id/webhook_token").
        /// </summary>
        /// <value>The string containing target service URLs.</value>
        public string TargetUrls { get; set; }

        /// <summary>
        /// Gets or sets the request timeout in seconds. Defaults to 10 seconds.
        /// </summary>
        /// <value>The timeout duration in seconds.</value>
        public int TimeoutSeconds { get; set; } = 10;

        /// <summary>
        /// Gets or sets a value indicating whether SSL certificate validation errors should be ignored.
        /// Useful for homelabs running self-hosted Apprise instances with self-signed HTTPS certificates.
        /// </summary>
        /// <value><c>true</c> to ignore certificate errors; otherwise, <c>false</c>.</value>
        public bool AllowInvalidCertificates { get; set; } = false;
    }
}
