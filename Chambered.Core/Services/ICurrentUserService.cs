namespace Chambered.Core.Services
{
    /// <summary>
    /// Service contract to retrieve session context for the current user.
    /// </summary>
    /// <typeparam name="TUserSession">The type of the user session model.</typeparam>
    public interface ICurrentUserService<TUserSession>
    {
        /// <summary>
        /// Retrieves the current user's session details.
        /// </summary>
        /// <returns>The current user session context.</returns>
        TUserSession GetCurrentUser();
    }
}
