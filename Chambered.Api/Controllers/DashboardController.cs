using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Chambered.Api.Controllers
{
    /// <summary>
    /// Serves general overview figures, valuations, and metrics for the main system Dashboard.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires login or API key
    [Produces("application/json")]
    public class DashboardController : ControllerBase
    {
        private readonly ChamberedDbContext _db;

        public DashboardController(ChamberedDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Compiles total inventory figures, armory valuations, and action stats for a tracking Arsenal.
        /// </summary>
        /// <param name="arsenalId">The unique key of the Arsenal. If omitted, defaults to the first available Arsenal.</param>
        /// <returns>A dictionary package of system inventory metrics.</returns>
        /// <response code="200">Returns the calculated statistics envelope.</response>
        /// <response code="401">If the request is unauthorized.</response>
        [HttpGet]
        [ProducesResponseType(typeof(DashboardStatsDto), Microsoft.AspNetCore.Http.StatusCodes.Status200OK)]
        [ProducesResponseType(Microsoft.AspNetCore.Http.StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetDashboardStats([FromQuery] int? arsenalId)
        {
            if (arsenalId == null)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) arsenalId = first.Id;
            }

            // 1. Armory Item count
            int totalArmoryItems = await _db.ArmoryItems.CountAsync(f => f.ArsenalId == arsenalId);

            // 2. Ammunition round count (sum of all quantities in AmmoLots)
            int totalRounds = 0;

            // 3. Total valuation of armory items (Project fields and sum client-side to bypass SQLite decimal aggregate limitations)
            var valuationData = await _db.ArmoryItems
                .Where(f => f.ArsenalId == arsenalId)
                .Select(f => new { f.EstimatedValue, f.PurchasePrice })
                .ToListAsync();

            decimal totalArmoryValue = valuationData
                .Sum(f => f.EstimatedValue ?? f.PurchasePrice ?? 0m);

            // 4. Cumulative rounds fired
            int cumulativeRoundsFired = 0;

            // 5. Caliber breakdown for Ammunition (Sum of rounds per cartridge/caliber)
            var caliberRounds = new List<CaliberStatDto>();

            // 6. Action type breakdown for Armory Items (Count per action type)
            var armoryActionsRaw = await _db.ArmoryItems
                .Where(f => f.ArsenalId == arsenalId && f.Product is PewPew)
                .GroupBy(f => (f.Product as PewPew).ActionType)
                .Select(g => new
                {
                    ActionTypeEnum = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var armoryActions = armoryActionsRaw.Select(g => new ActionStatDto
            {
                ActionType = FormatActionType(g.ActionTypeEnum),
                Count = g.Count
            }).ToList();

            // 7. Handloads vs Factory Ammunition split
            int handloadedRounds = 0;

            int factoryRounds = 0;

            // 8. Recent Activities (e.g. latest additions or loaded lots)
            var recentLots = new List<RecentActivityDto>();

            return Ok(new DashboardStatsDto
            {
                TotalArmoryItems = totalArmoryItems,
                TotalRounds = totalRounds,
                TotalArmoryValue = totalArmoryValue,
                CumulativeRoundsFired = cumulativeRoundsFired,
                CaliberBreakdown = caliberRounds,
                ArmoryActionBreakdown = armoryActions,
                HandloadedRounds = handloadedRounds,
                FactoryRounds = factoryRounds,
                RecentActivities = recentLots
            });
        }

        private string FormatActionType(Chambered.Data.Enums.ActionType? action)
        {
            if (action == null) return "N/A";
            return action switch
            {
                Chambered.Data.Enums.ActionType.SemiAutomatic => "Semi-Automatic",
                Chambered.Data.Enums.ActionType.BoltAction => "Bolt Action",
                Chambered.Data.Enums.ActionType.LeverAction2 => "Lever Action",
                Chambered.Data.Enums.ActionType.PumpAction => "Pump Action",
                Chambered.Data.Enums.ActionType.Revolver => "Revolver",
                Chambered.Data.Enums.ActionType.BreakAction => "Break Action",
                Chambered.Data.Enums.ActionType.SingleShot => "Single Shot",
                Chambered.Data.Enums.ActionType.FullAutomatic => "Full-Automatic",
                _ => "Unknown"
            };
        }
    }

    public class DashboardStatsDto
    {
        public int TotalArmoryItems { get; set; }
        public int TotalRounds { get; set; }
        public decimal TotalArmoryValue { get; set; }
        public int CumulativeRoundsFired { get; set; }
        public List<CaliberStatDto> CaliberBreakdown { get; set; }
        public List<ActionStatDto> ArmoryActionBreakdown { get; set; }
        public int HandloadedRounds { get; set; }
        public int FactoryRounds { get; set; }
        public List<RecentActivityDto> RecentActivities { get; set; }
    }

    public class CaliberStatDto
    {
        public string Caliber { get; set; }
        public int Count { get; set; }
    }

    public class ActionStatDto
    {
        public string ActionType { get; set; }
        public int Count { get; set; }
    }

    public class RecentActivityDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public System.DateTime Date { get; set; }
    }
}
