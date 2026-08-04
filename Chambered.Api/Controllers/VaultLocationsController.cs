using Chambered.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Chambered.Api.Controllers
{
    [ApiController]
    [Route("api/vaults/locations")]
    [Authorize] // Requires login or API key
    public class VaultLocationsController : ControllerBase
    {
        private readonly ChamberedDbContext _db;

        public VaultLocationsController(ChamberedDbContext db)
        {
            _db = db;
        }

        // GET: api/vaults/locations
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? arsenalId)
        {
            if (arsenalId == null)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) arsenalId = first.Id;
            }

            var locations = await _db.VaultLocations
                .Where(v => v.ArsenalId == arsenalId)
                .ToListAsync();

            return Ok(locations);
        }

        // GET: api/vaults/locations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var location = await _db.VaultLocations.FindAsync(id);
            if (location == null)
                return NotFound();

            return Ok(location);
        }

        // POST: api/vaults/locations
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VaultLocation location)
        {
            if (location == null)
                return BadRequest();

            if (string.IsNullOrEmpty(location.Name))
                return BadRequest("Location Name is required.");

            if (location.ArsenalId == null)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) location.ArsenalId = first.Id;
            }

            _db.VaultLocations.Add(location);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = location.Id }, location);
        }

        // PUT: api/vaults/locations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] VaultLocation model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var location = await _db.VaultLocations.FindAsync(id);
            if (location == null)
                return NotFound();

            location.Name = model.Name;
            location.Description = model.Description;

            await _db.SaveChangesAsync();
            return Ok(location);
        }

        // DELETE: api/vaults/locations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var location = await _db.VaultLocations.FindAsync(id);
            if (location == null)
                return NotFound();

            _db.VaultLocations.Remove(location);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
