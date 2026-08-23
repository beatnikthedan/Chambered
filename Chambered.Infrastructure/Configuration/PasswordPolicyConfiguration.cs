namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Represents configuration settings for password validation rules and complexity requirements.
    /// </summary>
    [ConfigurationSection(nameof(PasswordPolicyConfiguration), null)]
    public class PasswordPolicyConfiguration
    {
        /// <summary>
        /// Gets or sets the minimum required length for a password.
        /// </summary>
        /// <value>
        /// The minimum length a password must be. Defaults to <c>6</c>.
        /// </value>
        public int RequiredLength { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether passwords must contain a non-alphanumeric character.
        /// </summary>
        /// <value>
        /// <see langword="true"/> if passwords must contain a non-alphanumeric character; otherwise, <see langword="false"/>. Defaults to <see langword="true"/>.
        /// </value>
        public bool RequireNonAlphanumeric { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether passwords must contain a lowercase ASCII character.
        /// </summary>
        /// <value>
        /// <see langword="true"/> if passwords must contain a lowercase ASCII character; otherwise, <see langword="false"/>. Defaults to <see langword="true"/>.
        /// </value>
        public bool RequireLowercase { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether passwords must contain an uppercase ASCII character.
        /// </summary>
        /// <value>
        /// <see langword="true"/> if passwords must contain an uppercase ASCII character; otherwise, <see langword="false"/>. Defaults to <see langword="true"/>.
        /// </value>
        public bool RequireUppercase { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether passwords must contain a digit.
        /// </summary>
        /// <value>
        /// <see langword="true"/> if passwords must contain a digit; otherwise, <see langword="false"/>. Defaults to <see langword="true"/>.
        /// </value>
        public bool RequireDigit { get; set; }
    }
}
