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
    [Route("api/armory")]
    [Authorize] // Requires login or API key
    public class ArmoryController : ControllerBase
    {
        private readonly ChamberedDbContext _db;

        public ArmoryController(ChamberedDbContext db)
        {
            _db = db;
        }

        // GET: api/armory
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? arsenalId)
        {
            if (arsenalId == null)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) arsenalId = first.Id;
            }

            var armoryItems = await _db.ArmoryItems
                .Where(f => f.ArsenalId == arsenalId)
                .ToListAsync();
            return Ok(armoryItems);
        }

        // GET: api/armory/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var armoryItem = await _db.ArmoryItems.FindAsync(id);
            if (armoryItem == null)
                return NotFound();

            return Ok(armoryItem);
        }

        // POST: api/armory
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ArmoryItem armoryItem)
        {
            if (armoryItem == null)
                return BadRequest();

            if (string.IsNullOrEmpty(armoryItem.Manufacturer) || string.IsNullOrEmpty(armoryItem.Model))
                return BadRequest("Manufacturer and Model are required.");

            if (armoryItem.ArsenalId == null)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) armoryItem.ArsenalId = first.Id;
            }

            _db.ArmoryItems.Add(armoryItem);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = armoryItem.Id }, armoryItem);
        }

        // PUT: api/armory/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ArmoryItem model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var armoryItem = await _db.ArmoryItems.FindAsync(id);
            if (armoryItem == null)
                return NotFound();

            armoryItem.Manufacturer = model.Manufacturer;
            armoryItem.Model = model.Model;
            armoryItem.Caliber = model.Caliber;
            armoryItem.BarrelLengthInches = model.BarrelLengthInches;
            armoryItem.TwistRate = model.TwistRate;
            armoryItem.ActionType = model.ActionType;
            armoryItem.SerialNumber = model.SerialNumber;
            armoryItem.Notes = model.Notes;
            armoryItem.PurchasePrice = model.PurchasePrice;
            armoryItem.PurchaseDate = model.PurchaseDate;
            armoryItem.CurrentValue = model.CurrentValue;
            armoryItem.Condition = model.Condition;
            armoryItem.ImageUrl = model.ImageUrl;
            armoryItem.RoundCount = model.RoundCount;

            // Update newly added legacy, notes, and maintenance columns
            armoryItem.Beneficiary = model.Beneficiary;
            armoryItem.StorageLocation = model.StorageLocation;
            armoryItem.NotesMarkdown = model.NotesMarkdown;
            armoryItem.AccessoriesListJson = model.AccessoriesListJson;
            armoryItem.MaintenanceTasksJson = model.MaintenanceTasksJson;
            armoryItem.RangeHistoryJson = model.RangeHistoryJson;

            await _db.SaveChangesAsync();
            return Ok(armoryItem);
        }

        // DELETE: api/armory/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var armoryItem = await _db.ArmoryItems.FindAsync(id);
            if (armoryItem == null)
                return NotFound();

            _db.ArmoryItems.Remove(armoryItem);
            await _db.SaveChangesAsync();
            return Ok();
        }

        // POST: api/armory/{id}/increment-rounds
        [HttpPost("{id}/increment-rounds")]
        public async Task<IActionResult> IncrementRounds(int id, [FromBody] IncrementRoundsRequest request)
        {
            var armoryItem = await _db.ArmoryItems.FindAsync(id);
            if (armoryItem == null)
                return NotFound();

            if (request.Count < 0)
                return BadRequest("Count must be non-negative.");

            armoryItem.RoundCount += request.Count;
            await _db.SaveChangesAsync();

            return Ok(new { roundCount = armoryItem.RoundCount });
        }
    }

    public class IncrementRoundsRequest
    {
        public int Count { get; set; }
    }
}
