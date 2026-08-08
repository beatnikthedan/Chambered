using Chambered.Core.Services.Models;

namespace Chambered.Core.Services
{
    /// <summary>
    /// Provides an abstraction for sending multi-channel push notifications via an Apprise API service.
    /// </summary>
    public interface IAppriseService
    {
        /// <summary>
        /// Sends a push notification asynchronously through the configured Apprise instance.
        /// </summary>
        /// <param name="message">The <see cref="AppriseNotificationMessage"/> containing content, tags, and type.</param>
        /// <param name="cancellationToken">An optional token to monitor for cancellation requests.</param>
        /// <returns>
        /// A task representing the asynchronous operation. The task result is <c>true</c> if Apprise accepted and delivered the notification; otherwise, <c>false</c>.
        /// </returns>
        Task<bool> SendNotificationAsync(AppriseNotificationMessage message, CancellationToken cancellationToken = default);
    }
}
