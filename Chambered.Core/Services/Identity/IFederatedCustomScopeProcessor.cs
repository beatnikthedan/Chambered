using Chambered.Data;

namespace Chambered.Core.Services.Identity
{
    /// <summary>
    /// Defines a processor for handling custom claims or scopes returned by federated authentication providers.
    /// </summary>
    public interface IFederatedCustomScopeProcessor
    {
        /// <summary>
        /// Gets the target scope or claim name this processor is registered to handle.
        /// </summary>
        string TargetScope { get; }

        /// <summary>
        /// Processes a custom scope claim for a given user profile.
        /// </summary>
        /// <param name="user">The user profile being provisioned or synchronized.</param>
        /// <param name="claimValue">The raw string value of the target custom claim or scope.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        Task ProcessScopeAsync(ChamberedUser user, string claimValue);
    }
}
