namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Represents configuration settings for user authentication and login behavior.
    /// </summary>
    [ConfigurationSection(nameof(LoginConfiguration), null)]
    public class LoginConfiguration
    {
        /// <summary>
        /// Gets or sets the cookie session lifetime in days.
        /// </summary>
        /// <value>
        /// The number of days a session cookie remains valid. The default is 7 days.
        /// </value>
        public int SessionLifetime { get; set; } = 7;

        /// <summary>
        /// Gets or sets a value indicating whether local user logins are disabled.
        /// </summary>
        /// <value>
        /// <c>true</c> if local user authentication is disabled; otherwise, <c>false</c>.
        /// </value>
        public bool DisableLocalUsers { get; set; }

        public bool DisableNewUserRegistration { get; set; }
    }
}
