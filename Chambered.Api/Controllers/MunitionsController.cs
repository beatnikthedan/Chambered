using Chambered.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Chambered.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires login or API key
    public class MunitionsController : ControllerBase
    {
        private readonly ChamberedDbContext _db;

        public MunitionsController(ChamberedDbContext db)
        {
            _db = db;
        }

        // GET: api/munitions
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? arsenalId)
        {
            if (arsenalId == null)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) arsenalId = first.Id;
            }

            var lots = await _db.AmmoLots
                .Include(l => l.Cartridge)
                .Include(l => l.Projectile)
                    .ThenInclude(p => p.Manufacturer)
                .Include(l => l.Powder)
                .Include(l => l.FactoryAmmo)
                    .ThenInclude(f => f.Manufacturer)
                .Where(l => l.ArsenalId == arsenalId)
                .OrderByDescending(l => l.DateLoaded)
                .ToListAsync();

            return Ok(lots);
        }

        // GET: api/munitions/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var lot = await _db.AmmoLots
                .Include(l => l.Cartridge)
                .Include(l => l.Projectile)
                    .ThenInclude(p => p.Manufacturer)
                .Include(l => l.Powder)
                .Include(l => l.FactoryAmmo)
                    .ThenInclude(f => f.Manufacturer)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lot == null)
                return NotFound();

            return Ok(lot);
        }

        // POST: api/munitions
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AmmoLot model)
        {
            if (model == null)
                return BadRequest();

            if (model.CartridgeId <= 0)
                return BadRequest("Cartridge selection is required.");

            if (model.Quantity < 0)
                return BadRequest("Quantity cannot be negative.");

            // Standardize loading date
            if (model.DateLoaded == default)
                model.DateLoaded = DateTime.UtcNow;

            if (model.ArsenalId == null)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) model.ArsenalId = first.Id;
            }

            _db.AmmoLots.Add(model);
            await _db.SaveChangesAsync();

            // Reload for full navigation property inclusion
            var fullLot = await _db.AmmoLots
                .Include(l => l.Cartridge)
                .Include(l => l.Projectile)
                    .ThenInclude(p => p.Manufacturer)
                .Include(l => l.Powder)
                .Include(l => l.FactoryAmmo)
                    .ThenInclude(f => f.Manufacturer)
                .FirstOrDefaultAsync(l => l.Id == model.Id);

            return CreatedAtAction(nameof(GetById), new { id = model.Id }, fullLot);
        }

        // PUT: api/munitions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AmmoLot model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var lot = await _db.AmmoLots.FindAsync(id);
            if (lot == null)
                return NotFound();

            lot.CartridgeId = model.CartridgeId;
            lot.ProjectileId = model.ProjectileId;
            lot.PowderId = model.PowderId;
            lot.PowderChargeGrains = model.PowderChargeGrains;
            lot.CartridgeOverallLength = model.CartridgeOverallLength;
            lot.FactoryAmmoId = model.FactoryAmmoId;
            lot.Quantity = model.Quantity;
            lot.LotNumber = model.LotNumber;
            lot.DateLoaded = model.DateLoaded;
            lot.Notes = model.Notes;

            await _db.SaveChangesAsync();

            // Reload
            var fullLot = await _db.AmmoLots
                .Include(l => l.Cartridge)
                .Include(l => l.Projectile)
                    .ThenInclude(p => p.Manufacturer)
                .Include(l => l.Powder)
                .Include(l => l.FactoryAmmo)
                    .ThenInclude(f => f.Manufacturer)
                .FirstOrDefaultAsync(l => l.Id == lot.Id);

            return Ok(fullLot);
        }

        // DELETE: api/munitions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var lot = await _db.AmmoLots.FindAsync(id);
            if (lot == null)
                return NotFound();

            _db.AmmoLots.Remove(lot);
            await _db.SaveChangesAsync();
            return Ok();
        }

        // POST: api/munitions/{id}/adjust-quantity
        [HttpPost("{id}/adjust-quantity")]
        public async Task<IActionResult> AdjustQuantity(int id, [FromBody] AdjustQuantityRequest request)
        {
            var lot = await _db.AmmoLots.FindAsync(id);
            if (lot == null)
                return NotFound();

            lot.Quantity += request.Delta;
            if (lot.Quantity < 0)
                lot.Quantity = 0; // Prevent negative inventory

            await _db.SaveChangesAsync();
            return Ok(new { quantity = lot.Quantity });
        }

        // GET: api/munitions/cartridges
        [HttpGet("cartridges")]
        public async Task<IActionResult> GetCartridges()
        {
            var cartridges = await _db.Cartridges.OrderBy(c => c.Name).ToListAsync();
            return Ok(cartridges);
        }

        // GET: api/munitions/projectiles
        [HttpGet("projectiles")]
        public async Task<IActionResult> GetProjectiles()
        {
            var projectiles = await _db.Projectiles
                .Include(p => p.Manufacturer)
                .OrderBy(p => p.Name)
                .ToListAsync();
            return Ok(projectiles);
        }

        // GET: api/munitions/powders
        [HttpGet("powders")]
        public async Task<IActionResult> GetPowders()
        {
            var powders = await _db.Powders.OrderBy(p => p.Manufacturer).ThenBy(p => p.Name).ToListAsync();
            return Ok(powders);
        }

        // GET: api/munitions/factory-ammo
        [HttpGet("factory-ammo")]
        public async Task<IActionResult> GetFactoryAmmoCatalog()
        {
            var factoryAmmo = await _db.FactoryAmmo
                .Include(f => f.Manufacturer)
                .Include(f => f.Cartridge)
                .Include(f => f.Projectile)
                .OrderBy(f => f.Manufacturer.Name)
                .ThenBy(f => f.Sku)
                .ToListAsync();
            return Ok(factoryAmmo);
        }
    }

    public class AdjustQuantityRequest
    {
        public int Delta { get; set; }
    }
}
