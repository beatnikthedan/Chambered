using Chambered.Data;
using Chambered.Data.Models;
using Chambered.Data.Enums;
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

            var items = await _db.ArmoryItems
                .Include(i => i.Product)
                    .ThenInclude(p => p.Manufacturer)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Caliber)
                .Include(i => i.Vault)
                .Where(f => f.ArsenalId == arsenalId)
                .ToListAsync();

            var dtos = items.Select(i => MapToDto(i)).ToList();
            return Ok(dtos);
        }

        // GET: api/armory/products
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _db.Products
                .Include(p => p.Manufacturer)
                .Include(p => p.Caliber)
                .OrderBy(p => p.Name)
                .ToListAsync();

            var dtos = products.Select(p => new
            {
                id = p.Id,
                name = p.Name,
                sku = p.Sku,
                category = p.Category.ToString(),
                actionType = FormatActionType(p.ActionType),
                manufacturerId = p.ManufacturerId,
                manufacturer = p.Manufacturer?.Name ?? "",
                caliberId = p.CaliberId,
                caliber = p.Caliber?.Name ?? ""
            }).ToList();

            return Ok(dtos);
        }

        // GET: api/armory/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.ArmoryItems
                .Include(i => i.Product)
                    .ThenInclude(p => p.Manufacturer)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Caliber)
                .Include(i => i.Vault)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (item == null)
                return NotFound();

            return Ok(MapToDto(item));
        }

        // POST: api/armory
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ArmoryItemDto model)
        {
            if (model == null)
                return BadRequest();

            if (string.IsNullOrEmpty(model.Manufacturer) || string.IsNullOrEmpty(model.Model))
                return BadRequest("Manufacturer and Model are required.");

            var arsenalId = model.ArsenalId;
            if (arsenalId == null || arsenalId == 0)
            {
                var first = await _db.Arsenals.FirstOrDefaultAsync();
                if (first != null) arsenalId = first.Id;
            }

            // Resolve relational references
            Product product = null;
            if (model.FirearmModelId > 0)
            {
                product = await _db.Products
                    .Include(p => p.Manufacturer)
                    .Include(p => p.Caliber)
                    .FirstOrDefaultAsync(p => p.Id == model.FirearmModelId);
            }

            if (product == null && !string.IsNullOrEmpty(model.Manufacturer) && !string.IsNullOrEmpty(model.Model))
            {
                var manufacturer = await ResolveManufacturerAsync(model.Manufacturer);
                var caliber = await ResolveCaliberAsync(model.Caliber ?? "Unknown");
                product = await ResolveProductAsync(model.Model, manufacturer.Id, caliber.Id);
            }

            if (product == null)
            {
                return BadRequest("A valid product selection or manufacturer/model is required.");
            }

            var vaultId = await ResolveVaultIdAsync(model.StorageLocation, arsenalId ?? 1);

            var armoryItem = new ArmoryItem
            {
                ProductId = product.Id,
                SerialNumber = model.SerialNumber ?? "",
                BarrelLengthInches = model.BarrelLengthInches ?? 0,
                TwistRate = model.TwistRate,
                ThreadPitch = model.ThreadPitch,
                IsNfaItem = model.IsNfaItem,
                NfaFormType = model.NfaFormType,
                TaxStampDocumentUrl = model.TaxStampDocumentUrl,
                StampApprovalDate = model.StampApprovalDate,
                PurchasePrice = model.PurchasePrice,
                PurchaseDate = model.PurchaseDate,
                EstimatedValue = model.CurrentValue ?? model.EstimatedValue,
                Condition = model.Condition,
                RoundCount = model.RoundCount,
                Beneficiary = model.Beneficiary,
                VaultId = vaultId,
                ArsenalId = arsenalId,
                ImageUrl = model.ImageUrl,
                NotesMarkdown = model.NotesMarkdown ?? model.Notes
            };

            _db.ArmoryItems.Add(armoryItem);
            await _db.SaveChangesAsync();

            // Load and map fully
            var created = await _db.ArmoryItems
                .Include(i => i.Product)
                    .ThenInclude(p => p.Manufacturer)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Caliber)
                .Include(i => i.Vault)
                .FirstAsync(i => i.Id == armoryItem.Id);

            return CreatedAtAction(nameof(GetById), new { id = armoryItem.Id }, MapToDto(created));
        }

        // PUT: api/armory/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ArmoryItemDto model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var armoryItem = await _db.ArmoryItems.FindAsync(id);
            if (armoryItem == null)
                return NotFound();

            var arsenalId = (model.ArsenalId != null && model.ArsenalId > 0) ? model.ArsenalId.Value : (armoryItem.ArsenalId ?? 1);
            armoryItem.ArsenalId = arsenalId;

            // Resolve relational references
            Product product = null;
            if (model.FirearmModelId > 0)
            {
                product = await _db.Products
                    .Include(p => p.Manufacturer)
                    .Include(p => p.Caliber)
                    .FirstOrDefaultAsync(p => p.Id == model.FirearmModelId);
            }

            if (product == null && !string.IsNullOrEmpty(model.Manufacturer) && !string.IsNullOrEmpty(model.Model))
            {
                var manufacturer = await ResolveManufacturerAsync(model.Manufacturer);
                var caliber = await ResolveCaliberAsync(model.Caliber ?? "Unknown");
                product = await ResolveProductAsync(model.Model, manufacturer.Id, caliber.Id);
            }

            if (product == null)
            {
                return BadRequest("A valid product selection or manufacturer/model is required.");
            }

            var vaultId = await ResolveVaultIdAsync(model.StorageLocation, arsenalId);

            armoryItem.ProductId = product.Id;
            armoryItem.SerialNumber = model.SerialNumber ?? "";
            armoryItem.BarrelLengthInches = model.BarrelLengthInches ?? 0;
            armoryItem.TwistRate = model.TwistRate;
            armoryItem.ThreadPitch = model.ThreadPitch;
            armoryItem.IsNfaItem = model.IsNfaItem;
            armoryItem.NfaFormType = model.NfaFormType;
            armoryItem.TaxStampDocumentUrl = model.TaxStampDocumentUrl;
            armoryItem.StampApprovalDate = model.StampApprovalDate;
            armoryItem.PurchasePrice = model.PurchasePrice;
            armoryItem.PurchaseDate = model.PurchaseDate;
            armoryItem.EstimatedValue = model.CurrentValue ?? model.EstimatedValue;
            armoryItem.Condition = model.Condition;
            armoryItem.RoundCount = model.RoundCount;
            armoryItem.Beneficiary = model.Beneficiary;
            armoryItem.VaultId = vaultId;
            armoryItem.ImageUrl = model.ImageUrl;
            armoryItem.NotesMarkdown = model.NotesMarkdown ?? model.Notes;

            await _db.SaveChangesAsync();

            // Load and map fully
            var updated = await _db.ArmoryItems
                .Include(i => i.Product)
                    .ThenInclude(p => p.Manufacturer)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Caliber)
                .Include(i => i.Vault)
                .FirstAsync(i => i.Id == armoryItem.Id);

            return Ok(MapToDto(updated));
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

        #region Helpers

        private ArmoryItemDto MapToDto(ArmoryItem i)
        {
            return new ArmoryItemDto
            {
                Id = i.Id,
                ManufacturerId = i.Product?.ManufacturerId ?? 0,
                Manufacturer = i.Product?.Manufacturer?.Name ?? "",
                FirearmModelId = i.ProductId,
                Model = i.Product?.Name ?? "",
                Caliber = i.Product?.Caliber?.Name ?? "",
                SerialNumber = i.SerialNumber,
                ActionType = i.Product != null ? FormatActionType(i.Product.ActionType) : "Semi-Automatic",
                BarrelLengthInches = i.BarrelLengthInches,
                TwistRate = i.TwistRate,
                ThreadPitch = i.ThreadPitch,
                IsNfaItem = i.IsNfaItem,
                NfaFormType = i.NfaFormType,
                TaxStampDocumentUrl = i.TaxStampDocumentUrl,
                StampApprovalDate = i.StampApprovalDate,
                PurchasePrice = i.PurchasePrice,
                PurchaseDate = i.PurchaseDate,
                CurrentValue = i.EstimatedValue,
                EstimatedValue = i.EstimatedValue,
                Condition = i.Condition ?? "Good (90%)",
                RoundCount = i.RoundCount,
                Beneficiary = i.Beneficiary,
                VaultId = i.VaultId,
                StorageLocation = i.Vault?.Name ?? "Main Vault",
                ArsenalId = i.ArsenalId,
                ImageUrl = i.ImageUrl,
                NotesMarkdown = i.NotesMarkdown,
                Notes = i.NotesMarkdown ?? "",
                AccessoriesListJson = "[]",
                MaintenanceTasksJson = "[]",
                RangeHistoryJson = "[]"
            };
        }

        private async Task<Manufacturer> ResolveManufacturerAsync(string name)
        {
            var mfg = await _db.Manufacturers.FirstOrDefaultAsync(m => m.Name.ToLower() == name.ToLower());
            if (mfg == null)
            {
                mfg = new Manufacturer { Name = name, Country = "United States" };
                _db.Manufacturers.Add(mfg);
                await _db.SaveChangesAsync();
            }
            return mfg;
        }

        private async Task<Caliber> ResolveCaliberAsync(string name)
        {
            if (string.IsNullOrEmpty(name)) name = "9x19mm Parabellum";

            var caliber = await _db.Calibers.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower() || (c.AlternateNames != null && c.AlternateNames.ToLower().Contains(name.ToLower())));
            if (caliber == null)
            {
                caliber = new Caliber { Name = name, AlternateNames = name };
                _db.Calibers.Add(caliber);
                await _db.SaveChangesAsync();
            }
            return caliber;
        }

        private async Task<Product> ResolveProductAsync(string modelName, int mfgId, int caliberId)
        {
            var prod = await _db.Products.FirstOrDefaultAsync(p => p.Name.ToLower() == modelName.ToLower() && p.ManufacturerId == mfgId);
            if (prod == null)
            {
                prod = new Product
                {
                    Name = modelName,
                    ManufacturerId = mfgId,
                    CaliberId = caliberId,
                    Category = ProductCategory.Handgun // fallback category
                };
                _db.Products.Add(prod);
                await _db.SaveChangesAsync();
            }
            return prod;
        }

        private async Task<int?> ResolveVaultIdAsync(string locationName, int arsenalId)
        {
            if (string.IsNullOrEmpty(locationName)) return null;

            var vault = await _db.Vaults.FirstOrDefaultAsync(v => v.Name.ToLower() == locationName.ToLower() && v.ArsenalId == arsenalId);
            if (vault == null)
            {
                var category = await _db.VaultCategories.FirstOrDefaultAsync();
                if (category == null)
                {
                    category = new VaultCategory { Name = "General Storage", Description = "Default storage categories" };
                    _db.VaultCategories.Add(category);
                    await _db.SaveChangesAsync();
                }

                vault = new Vault
                {
                    Name = locationName,
                    ArsenalId = arsenalId,
                    VaultCategoryId = category.Id,
                    LockType = LockType.PhysicalKeyLock
                };
                _db.Vaults.Add(vault);
                await _db.SaveChangesAsync();
            }
            return vault.Id;
        }

        private ActionType ParseActionType(string actionStr)
        {
            if (string.IsNullOrEmpty(actionStr)) return ActionType.Unknown;

            var normalized = actionStr.Replace("-", "").Replace(" ", "").ToLower();
            if (normalized.Contains("semiauto")) return ActionType.SemiAutomatic;
            if (normalized.Contains("boltaction")) return ActionType.BoltAction;
            if (normalized.Contains("leveraction")) return ActionType.LeverAction2;
            if (normalized.Contains("pumpaction")) return ActionType.PumpAction;
            if (normalized.Contains("revolver")) return ActionType.Revolver;
            if (normalized.Contains("breakaction")) return ActionType.BreakAction;
            if (normalized.Contains("singleshot")) return ActionType.SingleShot;
            if (normalized.Contains("fullauto")) return ActionType.FullAutomatic;

            return ActionType.Unknown;
        }

        private string FormatActionType(ActionType action)
        {
            return action switch
            {
                ActionType.SemiAutomatic => "Semi-Automatic",
                ActionType.BoltAction => "Bolt Action",
                ActionType.LeverAction2 => "Lever Action",
                ActionType.PumpAction => "Pump Action",
                ActionType.Revolver => "Revolver",
                ActionType.BreakAction => "Break Action",
                ActionType.SingleShot => "Single Shot",
                ActionType.FullAutomatic => "Full-Automatic",
                _ => "Unknown"
            };
        }

        private ItemCondition? ParseCondition(string conditionStr)
        {
            if (string.IsNullOrWhiteSpace(conditionStr)) return null;
            var str = conditionStr.ToLower();
            if (str.Contains("100") || str.Contains("unfired")) return ItemCondition.Unfired;
            if (str.Contains("98") || str.Contains("excellent")) return ItemCondition.Excellent;
            if (str.Contains("95") || str.Contains("very good")) return ItemCondition.VeryGood;
            if (str.Contains("90") || str.Contains("good")) return ItemCondition.Good;
            if (str.Contains("80") || str.Contains("fair")) return ItemCondition.Fair;
            if (str.Contains("70") || str.Contains("serviceable")) return ItemCondition.Serviceable;
            if (str.Contains("60") || str.Contains("poor")) return ItemCondition.Poor;
            if (str.Contains("50") || str.Contains("salvage")) return ItemCondition.Salvage;
            return ItemCondition.Unknown;
        }

        private string FormatCondition(ItemCondition? condition)
        {
            if (condition == null) return "Good (90%)";
            return condition switch
            {
                ItemCondition.Unfired => "New / Unfired (100%)",
                ItemCondition.Excellent => "Excellent (98%)",
                ItemCondition.VeryGood => "Very Good (95%)",
                ItemCondition.Good => "Good (90%)",
                ItemCondition.Fair => "Fair (80%)",
                ItemCondition.Serviceable => "Serviceable (70%)",
                ItemCondition.Poor => "Poor (60%)",
                ItemCondition.Salvage => "Salvage (50%)",
                _ => "Good (90%)"
            };
        }

        #endregion
    }

    public class ArmoryItemDto
    {
        public int Id { get; set; }
        public int ManufacturerId { get; set; }
        public string? Manufacturer { get; set; }
        public int FirearmModelId { get; set; }
        public string? Model { get; set; }
        public string? Caliber { get; set; }
        public string? SerialNumber { get; set; }
        public string? ActionType { get; set; }
        public decimal? BarrelLengthInches { get; set; }
        public string? TwistRate { get; set; }
        public string? ThreadPitch { get; set; }
        public bool IsNfaItem { get; set; }
        public string? NfaFormType { get; set; }
        public string? TaxStampDocumentUrl { get; set; }
        public DateTime? StampApprovalDate { get; set; }
        public decimal? PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public decimal? CurrentValue { get; set; }
        public decimal? EstimatedValue { get; set; }
        public string? Condition { get; set; }
        public int RoundCount { get; set; }
        public string? Beneficiary { get; set; }
        public int? VaultId { get; set; }
        public string? StorageLocation { get; set; }
        public int? ArsenalId { get; set; }
        public string? ImageUrl { get; set; }
        public string? NotesMarkdown { get; set; }
        public string? Notes { get; set; }
        public string? AccessoriesListJson { get; set; }
        public string? MaintenanceTasksJson { get; set; }
        public string? RangeHistoryJson { get; set; }
    }

    public class IncrementRoundsRequest
    {
        public int Count { get; set; }
    }
}
