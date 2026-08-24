namespace BeatnikToolKit.EntityFramework.Services.Identity.Dto
{
    /// <summary>
    /// Data transfer object representing the challenge context needed to initiate an SSO redirect.
    /// </summary>
    public record ChallengePropertiesDto(
        string Scheme,
        string RedirectUri,
        IDictionary<string, string> Properties
    );

    /// <summary>
    /// Data transfer object holding security claims and provider keys returned from an external OIDC/SSO broker.
    /// </summary>
    public record ExternalIdentityDto(
        string ProviderName,
        string ProviderKey,
        IDictionary<string, string> UserClaims
    );

    /// <summary>
    /// Data transfer object representing the local authentication result of an SSO callback.
    /// </summary>
    public record FederatedLoginResponseDto(
        bool IsSuccess,
        string ErrorMessage,
        string Token,
        IEnumerable<string> AssignedPermissions
    );
}
