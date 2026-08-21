namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Configuration binding options for identity services.
    /// </summary>
    public class IdentityConfiguration
    {
        public string Website { get; set; } = string.Empty;
        public string DefaultEmailAddress { get; set; } = string.Empty;
    }
}
