using Chambered.Core.Services.Models;

namespace Chambered.Core.Services
{
    /// <summary>
    /// Service for resolving, downloading, and caching favicons from raw webpage URLs.
    /// </summary>
    public interface IFaveIconService
    {
        /// <summary>
        /// Retrieves the favicon for a specific webpage URL, using hybrid cache.
        /// </summary>
        /// <param name="url">The absolute webpage URL.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>A favicon result containing image bytes and content type, or null if none resolved.</returns>
        Task<FaveIconResult?> GetFaveIconAsync(string url, CancellationToken cancellationToken = default);
    }
}
