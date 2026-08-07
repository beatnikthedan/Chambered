using Chambered.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace Chambered.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires login or API key
    public class DashboardController : ControllerBase
    {
        private readonly ChamberedDbContext _db;

        public DashboardController(ChamberedDbContext db)
        {
            _db = db;
        }

        [HttpGet]
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
            int totalRounds = await _db.AmmoLots.Where(l => l.ArsenalId == arsenalId).SumAsync(l => l.Quantity);

            // 3. Total valuation of armory items (Project fields and sum client-side to bypass SQLite decimal aggregate limitations)
            var valuationData = await _db.ArmoryItems
                .Where(f => f.ArsenalId == arsenalId)
                .Select(f => new { f.EstimatedValue, f.PurchasePrice })
                .ToListAsync();

            decimal totalArmoryValue = valuationData
                .Sum(f => f.EstimatedValue ?? f.PurchasePrice ?? 0m);

            // 4. Cumulative rounds fired
            int cumulativeRoundsFired = await _db.ArmoryItems.Where(f => f.ArsenalId == arsenalId).SumAsync(f => f.RoundCount);

            // 5. Caliber breakdown for Ammunition (Sum of rounds per cartridge/caliber)
            var caliberRounds = await _db.AmmoLots
                .Include(l => l.Cartridge)
                .Where(l => l.ArsenalId == arsenalId)
                .GroupBy(l => l.Cartridge.Name)
                .Select(g => new CaliberStatDto
                {
                    Caliber = g.Key,
                    Count = g.Sum(l => l.Quantity)
                })
                .ToListAsync();

            // 6. Action type breakdown for Armory Items (Count per action type)
            var armoryActionsRaw = await _db.ArmoryItems
                .Where(f => f.ArsenalId == arsenalId)
                .GroupBy(f => f.Product.ActionType)
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
            int handloadedRounds = await _db.AmmoLots
                .Where(l => l.ArsenalId == arsenalId && l.FactoryAmmoId == null)
                .SumAsync(l => l.Quantity);

            int factoryRounds = await _db.AmmoLots
                .Where(l => l.ArsenalId == arsenalId && l.FactoryAmmoId != null)
                .SumAsync(l => l.Quantity);

            // 8. Recent Activities (e.g. latest additions or loaded lots)
            var recentLots = await _db.AmmoLots
                .Include(l => l.Cartridge)
                .Where(l => l.ArsenalId == arsenalId)
                .OrderByDescending(l => l.DateLoaded)
                .Take(3)
                .Select(l => new RecentActivityDto
                {
                    Title = l.FactoryAmmoId == null ? "Handload Lot Loaded" : "Factory Ammo Lot Logged",
                    Description = $"{l.Quantity} rounds of {l.Cartridge.Name} ({l.LotNumber})",
                    Date = l.DateLoaded
                })
                .ToListAsync();

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

        private string FormatActionType(Chambered.Data.Enums.ActionType action)
        {
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
