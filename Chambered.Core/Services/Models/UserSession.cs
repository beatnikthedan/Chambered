namespace Chambered.Core.Services.Models
{
    /// <summary>
    /// Represents the user session context containing essential claims.
    /// </summary>
    public class UserSession
    {
        /// <summary>
        /// Gets or sets a value indicating whether the user is authenticated.
        /// </summary>
        public bool IsAuthenticated { get; set; }
        /// <summary>
        /// Gets or sets the unique user identifier.
        /// </summary>
        public string? Id { get; set; }
        /// <summary>
        /// Gets or sets the user's full name or display name.
        /// </summary>
        public string? FullName { get; set; }
        /// <summary>
        /// Gets or sets the user's email address.
        /// </summary>
        public string? Email { get; set; }
    }
}
