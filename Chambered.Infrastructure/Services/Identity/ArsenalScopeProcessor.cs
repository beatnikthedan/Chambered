using BeatnikToolKit.EntityFramework.Services.Identity;
using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Chambered.Infrastructure.Services.Identity
{
    /// <summary>
    /// Processes and synchronizes the custom 'arsenals' claim returned from the federated provider.
    /// </summary>
    /// <param name="db">The database context.</param>
    public class ArsenalScopeProcessor(ChamberedDbContext db) : IFederatedCustomScopeProcessor<ChamberedUser>
    {
        private readonly ChamberedDbContext _db = db ?? throw new ArgumentNullException(nameof(db));

        /// <inheritdoc/>
        public string TargetScope => "arsenals";

        /// <inheritdoc/>
        public async Task ProcessScopeAsync(ChamberedUser user, string claimValue)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            if (string.IsNullOrWhiteSpace(claimValue))
            {
                return;
            }

            try
            {
                var arsenalIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(claimValue);
                if (arsenalIds == null || !arsenalIds.Any())
                {
                    return;
                }

                var validArsenals = await _db.Set<Arsenal>()
                    .Where(a => arsenalIds.Contains(a.Id))
                    .ToListAsync()
                    .ConfigureAwait(false);

                user.Arsenals ??= new List<Arsenal>();
                user.Arsenals.Clear();

                foreach (var arsenal in validArsenals)
                {
                    user.Arsenals.Add(arsenal);
                }
            }
            catch (System.Text.Json.JsonException)
            {
                var parts = claimValue.Split(new[] { ',', ';', '[', ']', ' ' }, StringSplitOptions.RemoveEmptyEntries);
                var arsenalIds = new List<int>();

                foreach (var part in parts)
                {
                    if (int.TryParse(part, out var id))
                    {
                        arsenalIds.Add(id);
                    }
                }

                if (!arsenalIds.Any())
                {
                    return;
                }

                var validArsenals = await _db.Set<Arsenal>()
                    .Where(a => arsenalIds.Contains(a.Id))
                    .ToListAsync()
                    .ConfigureAwait(false);

                user.Arsenals ??= new List<Arsenal>();
                user.Arsenals.Clear();

                foreach (var arsenal in validArsenals)
                {
                    user.Arsenals.Add(arsenal);
                }
            }
        }
    }
}
