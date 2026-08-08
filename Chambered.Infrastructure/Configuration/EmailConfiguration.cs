using MailKit.Security;

namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Represents the configuration settings required to send emails via an SMTP server.
    /// </summary>
    [ConfigurationSection(nameof(EmailConfiguration), null)]
    /// <summary>
    /// Represents configuration settings for connecting and authenticating with an SMTP server.
    /// </summary>
    public class EmailConfiguration
    {
        /// <summary>
        /// Gets or sets the SMTP server host name or IP address (e.g., "in-v3.mailjet.com" or "192.168.1.50").
        /// </summary>
        /// <value>The server host address.</value>
        public string Host { get; set; }

        /// <summary>
        /// Gets or sets the port number used to connect to the SMTP server.
        /// Defaults to port 587 (Standard STARTTLS).
        /// </summary>
        /// <value>The port number. Common ports are 25, 465 (Implicit SSL), 587 (STARTTLS), or 1025 (Local dev).</value>
        public int Port { get; set; } = 587;

        /// <summary>
        /// Gets or sets the username used for SMTP authentication.
        /// Can be left blank if the SMTP server does not require authentication (e.g., local mail sinks).
        /// </summary>
        /// <value>The SMTP authentication username or API key.</value>
        public string UserName { get; set; }

        /// <summary>
        /// Gets or sets the password used for SMTP authentication.
        /// </summary>
        /// <value>The SMTP authentication password or API secret.</value>
        public string Password { get; set; }

        /// <summary>
        /// Gets or sets the SSL/TLS socket security option for the connection.
        /// Defaults to <see cref="SecureSocketOptions.Auto"/>, which negotiates security based on the target port.
        /// </summary>
        /// <value>The secure socket option.</value>
        public SecureSocketOptions SecurityOption { get; set; } = SecureSocketOptions.Auto;

        /// <summary>
        /// Gets or sets a value indicating whether untrusted or self-signed SSL/TLS certificates should be allowed.
        /// </summary>
        /// <remarks>
        /// Enable this option for homelab environments, local development servers (e.g., Mailpit/MailHog), 
        /// or self-hosted mail instances using self-signed TLS certificates. Keep disabled in production.
        /// </remarks>
        /// <value><c>true</c> to ignore certificate errors; otherwise, <c>false</c>.</value>
        public bool AllowInvalidCertificates { get; set; } = false;

        /// <summary>
        /// Gets or sets the default sender email address used when a <see cref="System.Net.Mail.MailMessage"/> 
        /// does not specify a <see cref="System.Net.Mail.MailMessage.From"/> address.
        /// </summary>
        /// <value>The default sender email address.</value>
        public string DefaultFromAddress { get; set; }

        /// <summary>
        /// Gets or sets the default display name associated with <see cref="DefaultFromAddress"/>.
        /// </summary>
        /// <value>The default sender display name.</value>
        public string DefaultFromDisplayName { get; set; }
    }
}
