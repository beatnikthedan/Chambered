using System.Collections.Generic;

namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Configuration binding options for dynamic OIDC/OpenID Connect federated authentication.
    /// </summary>
    public class FederatedAuthenticationConfiguration
    {
        /// <summary>
        /// Gets or sets the list of configured federated identity providers.
        /// </summary>
        public List<FederatedProviderConfiguration> Providers { get; set; } = new();
    }

    /// <summary>
    /// Configuration for a specific external OIDC/SSO Identity Provider.
    /// </summary>
    public class FederatedProviderConfiguration
    {
        /// <summary>
        /// Gets or sets the unique name of the identity provider.
        /// </summary>
        public string ProviderName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the authority URI of the OIDC identity provider.
        /// </summary>
        public string Authority { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the client identifier registered with the identity provider.
        /// </summary>
        public string ClientId { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the client secret registered with the identity provider.
        /// </summary>
        public string ClientSecret { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the callback path where OIDC tokens are received.
        /// </summary>
        public string CallbackPath { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets custom scopes to request from the identity provider in addition to standard scopes.
        /// </summary>
        public List<string> CustomScopes { get; set; } = new();

        /// <summary>
        /// Gets or sets a value indicating whether roles from the external identity provider should be synchronized to the local user.
        /// </summary>
        public bool EnableRoleSynchronization { get; set; } = true;

        /// <summary>
        /// Gets or sets a dictionary of external group/role names to internal C# roles (e.g. "authentik Admins" -> "Admin").
        /// </summary>
        public Dictionary<string, string> RoleMappings { get; set; } = new(System.StringComparer.OrdinalIgnoreCase)
        {
            { "users", "User" }
        };

        /// <summary>
        /// Gets or sets the claim mappings that bind OIDC claims to local user profile fields.
        /// </summary>
        public UserProfileClaimConfiguration UserProfileClaims { get; set; } = new();
    }

    /// <summary>
    /// Maps incoming external OIDC Claims types to local User Profile properties.
    /// </summary>
    public class UserProfileClaimConfiguration
    {
        /// <summary>
        /// Gets or sets the claim name for the email address.
        /// </summary>
        public string Email { get; set; } = "email";

        /// <summary>
        /// Gets or sets the claim name for the user's username.
        /// </summary>
        public string UserName { get; set; } = "preferred_username";

        /// <summary>
        /// Gets or sets the claim name containing the user's roles.
        /// </summary>
        public string Roles { get; set; } = "roles";
    }
}
