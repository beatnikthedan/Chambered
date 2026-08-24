using BeatnikToolKit.EntityFramework.Services.Identity.Dto;

namespace BeatnikToolKit.EntityFramework.Services.Identity
{
    /// <summary>
    /// Service contract for provider-agnostic Single Sign-On (SSO) handshakes, 
    /// OAuth/OIDC external profile challenge mapping, and local account linkage.
    /// </summary>
    public interface IFederatedAuthService
    {
        /// <summary>
        /// configures the challenge properties and authentication properties for initiating an external OIDC handshake.
        /// </summary>
        Task<ChallengePropertiesDto> PrepareChallengeAsync(string providerName, string redirectUri);

        /// <summary>
        /// Processes external authentication callbacks, mapping claims, and returning an identity token.
        /// </summary>
        Task<FederatedLoginResponseDto> HandleCallbackAsync(string providerName, ExternalIdentityDto externalInfo);

        /// <summary>
        /// Links an existing local user account to an external Single Sign-On credentials context.
        /// </summary>
        Task LinkAccountAsync(string userId, ExternalIdentityDto externalInfo);

        /// <summary>
        /// Retrieves the names of all configured external identity providers.
        /// </summary>
        IEnumerable<string> GetConfiguredProviders();
    }
}
