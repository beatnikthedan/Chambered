using Chambered.Data;
using Chambered.Data.Models;
using Chambered.Data.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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

            var vaults = await _db.Vaults
                .Include(v => v.VaultCategory)
                .Include(v => v.ParentVault)
                .Include(v => v.ChildVaults)
                .Include(v => v.ArmoryItem)
                .Where(v => v.ArsenalId == arsenalId)
                .ToListAsync();

            var dtos = vaults.Select(v => MapToDto(v)).ToList();
            return Ok(dtos);
        }

        // GET: api/vaults/locations/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _db.VaultCategories.ToListAsync();
            return Ok(categories);
        }

        // GET: api/vaults/locations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var vault = await _db.Vaults
                .Include(v => v.VaultCategory)
                .Include(v => v.ParentVault)
                .Include(v => v.ChildVaults)
                .Include(v => v.ArmoryItem)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (vault == null)
                return NotFound();

            return Ok(MapToDto(vault));
        }

        // POST: api/vaults/locations
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VaultLocationDto model)
        {
            if (model == null)
                return BadRequest();

            if (string.IsNullOrEmpty(model.Name))
                return BadRequest("Location Name is required.");

            var arsenalId = model.ArsenalId;
            if (arsenalId == 0 || arsenalId == null)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) arsenalId = first.Id;
            }

            // Ensure we have a default category if none provided
            var categoryId = model.VaultCategoryId;
            if (categoryId == 0 || categoryId == null)
            {
                var defaultCategory = await _db.VaultCategories.FirstOrDefaultAsync();
                if (defaultCategory == null)
                {
                    defaultCategory = new VaultCategory { Name = "General Storage", Description = "Default category" };
                    _db.VaultCategories.Add(defaultCategory);
                    await _db.SaveChangesAsync();
                }
                categoryId = defaultCategory.Id;
            }

            var vault = new Vault
            {
                Name = model.Name,
                Description = model.Description,
                ArsenalId = arsenalId ?? 1,
                VaultCategoryId = categoryId.Value,
                ParentVaultId = model.ParentVaultId == 0 ? null : model.ParentVaultId,
                LockType = ParseLockType(model.SecurityLevel),
                EncryptedPasscode = model.Passcode,
                PasscodeHint = model.PasscodeHint,
                BackupKeyLocation = model.BackupKeyLocation,
                LockBatteryLastChanged = model.LockBatteryLastChanged,
                HasDehumidifier = model.HasDehumidifier,
                DehumidifierLastServiced = model.DehumidifierLastServiced,
                TargetMaxHumidityPercent = model.TargetMaxHumidityPercent
            };

            _db.Vaults.Add(vault);
            await _db.SaveChangesAsync();

            // Load fully
            var created = await _db.Vaults
                .Include(v => v.VaultCategory)
                .Include(v => v.ParentVault)
                .Include(v => v.ChildVaults)
                .Include(v => v.ArmoryItem)
                .FirstAsync(v => v.Id == vault.Id);

            return CreatedAtAction(nameof(GetById), new { id = vault.Id }, MapToDto(created));
        }

        // PUT: api/vaults/locations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] VaultLocationDto model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var vault = await _db.Vaults.FindAsync(id);
            if (vault == null)
                return NotFound();

            vault.Name = model.Name;
            vault.Description = model.Description;
            vault.VaultCategoryId = model.VaultCategoryId ?? vault.VaultCategoryId;
            vault.ParentVaultId = model.ParentVaultId == 0 ? null : model.ParentVaultId;
            if (model.SecurityLevel != null)
                vault.LockType = ParseLockType(model.SecurityLevel);
            vault.EncryptedPasscode = model.Passcode;
            vault.PasscodeHint = model.PasscodeHint;
            vault.BackupKeyLocation = model.BackupKeyLocation;
            vault.LockBatteryLastChanged = model.LockBatteryLastChanged;
            vault.HasDehumidifier = model.HasDehumidifier;
            vault.DehumidifierLastServiced = model.DehumidifierLastServiced;
            vault.TargetMaxHumidityPercent = model.TargetMaxHumidityPercent;

            await _db.SaveChangesAsync();

            // Load fully
            var updated = await _db.Vaults
                .Include(v => v.VaultCategory)
                .Include(v => v.ParentVault)
                .Include(v => v.ChildVaults)
                .Include(v => v.ArmoryItem)
                .FirstAsync(v => v.Id == vault.Id);

            return Ok(MapToDto(updated));
        }

        // DELETE: api/vaults/locations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var vault = await _db.Vaults.FindAsync(id);
            if (vault == null)
                return NotFound();

            _db.Vaults.Remove(vault);
            await _db.SaveChangesAsync();
            return Ok();
        }

        #region Helpers

        private static LockType ParseLockType(string? securityLevel)
        {
            if (string.IsNullOrEmpty(securityLevel))
                return LockType.None;

            return securityLevel.Replace(" ", "").Replace("/", "") switch
            {
                "ElectronicKeypad" => LockType.ElectronicKeypad,
                "MechanicalDial" => LockType.MechanicalDial,
                "BiometricScanner" => LockType.BiometricScanner,
                "DualKeySystem" => LockType.DualKeySystem,
                "PhysicalKeyLock" => LockType.PhysicalKeyLock,
                "RFIDTransponder" => LockType.RfidTransponder,
                "NoneCabinet" => LockType.OpenCabinet,
                _ => LockType.None
            };
        }

        private static string GetSecurityLevelString(LockType lockType)
        {
            return lockType switch
            {
                LockType.ElectronicKeypad => "Electronic Keypad",
                LockType.MechanicalDial => "Mechanical Dial",
                LockType.BiometricScanner => "Biometric Scanner",
                LockType.DualKeySystem => "Dual Key System",
                LockType.PhysicalKeyLock => "Physical Key Lock",
                LockType.RfidTransponder => "RFID Transponder",
                LockType.OpenCabinet => "None / Cabinet",
                _ => "None / Cabinet"
            };
        }

        private VaultLocationDto MapToDto(Vault v)
        {
            return new VaultLocationDto
            {
                Id = v.Id,
                Name = v.Name,
                Description = v.Description,
                ArsenalId = v.ArsenalId,
                SecurityLevel = GetSecurityLevelString(v.LockType),
                VaultCategoryId = v.VaultCategoryId,
                VaultCategoryName = v.VaultCategory?.Name ?? "General Storage",
                ParentVaultId = v.ParentVaultId,
                ParentVaultName = v.ParentVault?.Name,
                Passcode = v.EncryptedPasscode, // Transparently decrypted by symmetric value converter!
                PasscodeHint = v.PasscodeHint,
                BackupKeyLocation = v.BackupKeyLocation,
                LockBatteryLastChanged = v.LockBatteryLastChanged,
                HasDehumidifier = v.HasDehumidifier,
                DehumidifierLastServiced = v.DehumidifierLastServiced,
                TargetMaxHumidityPercent = v.TargetMaxHumidityPercent,
                ChildVaultNames = v.ChildVaults?.Select(cv => cv.Name).ToList() ?? new List<string>(),
                StoredItems = v.ArmoryItem?.Select(ai => new VaultInventoryItemDto
                {
                    Id = ai.Id,
                    SerialNumber = ai.SerialNumber
                }).ToList() ?? new List<VaultInventoryItemDto>()
            };
        }

        #endregion
    }

    public class VaultLocationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ArsenalId { get; set; }
        public string? SecurityLevel { get; set; }
        public int? VaultCategoryId { get; set; }
        public string? VaultCategoryName { get; set; }
        public int? ParentVaultId { get; set; }
        public string? ParentVaultName { get; set; }

        // Security Info
        public string? Passcode { get; set; }
        public string? PasscodeHint { get; set; }
        public string? BackupKeyLocation { get; set; }
        public DateTime? LockBatteryLastChanged { get; set; }

        // Climate Info
        public bool HasDehumidifier { get; set; }
        public DateTime? DehumidifierLastServiced { get; set; }
        public int? TargetMaxHumidityPercent { get; set; }

        // Nested lists
        public List<string> ChildVaultNames { get; set; } = new();
        public List<VaultInventoryItemDto> StoredItems { get; set; } = new();
    }

    public class VaultInventoryItemDto
    {
        public int Id { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
    }
}
