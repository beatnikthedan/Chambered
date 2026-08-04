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
    [Authorize]
    public class ArsenalsController : ControllerBase
    {
        private readonly ChamberedDbContext _db;

        public ArsenalsController(ChamberedDbContext db)
        {
            _db = db;
        }

        // GET: api/arsenals
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var arsenals = await _db.Arsenals.ToListAsync();
            return Ok(arsenals);
        }

        // POST: api/arsenals
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Arsenal arsenal)
        {
            if (arsenal == null || string.IsNullOrWhiteSpace(arsenal.Name))
                return BadRequest("Arsenal name is required.");

            // Resolve authenticated User ID
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                arsenal.OwnerId = userId;
            }

            _db.Arsenals.Add(arsenal);
            await _db.SaveChangesAsync();

            return Ok(arsenal);
        }

        // DELETE: api/arsenals/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var arsenal = await _db.Arsenals.FindAsync(id);
            if (arsenal == null)
                return NotFound();

            // Clean up armory items and ammo lots inside this arsenal
            var armoryItems = await _db.ArmoryItems.Where(f => f.ArsenalId == id).ToListAsync();
            _db.ArmoryItems.RemoveRange(armoryItems);

            var lots = await _db.AmmoLots.Where(l => l.ArsenalId == id).ToListAsync();
            _db.AmmoLots.RemoveRange(lots);

            _db.Arsenals.Remove(arsenal);
            await _db.SaveChangesAsync();

            return Ok();
        }
    }
}
