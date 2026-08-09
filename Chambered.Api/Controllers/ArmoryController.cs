using Chambered.Data;
using Chambered.Data.Enums;
using Chambered.Data.Extensions;
using Chambered.Data.Interfaces;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
                    .ThenInclude(p => (p as PewPew).Caliber)
                .Include(i => i.Product)
                    .ThenInclude(p => (p as Suppressor).MaxCaliber)
                .Include(i => i.Vault)
                .Include(i => i.Arsenal)
                .Include(i => i.Owner)
                .Include(i => i.Beneficiary)
                .Include(i => i.MountedAccessories)
                    .ThenInclude(acc => acc.Product)
                        .ThenInclude(p => p.Manufacturer)
                .Include(i => i.MountedAccessories)
                    .ThenInclude(acc => acc.Product)
                        .ThenInclude(p => (p as PewPew).Caliber)
                .Include(i => i.MountedAccessories)
                    .ThenInclude(acc => acc.Product)
                        .ThenInclude(p => (p as Suppressor).MaxCaliber)
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
                .Include(p => (p as PewPew).Caliber)
                .Include(p => (p as Suppressor).MaxCaliber)
                .OrderBy(p => p.Model)
                .ToListAsync();

            var dtos = products.Select(p =>
            {
                string caliberName = "";
                int caliberId = 0;
                string actionType = "N/A";
                string productType = "General";

                if (p is PewPew pew)
                {
                    caliberName = pew.Caliber?.Name ?? "";
                    caliberId = pew.CaliberId;
                    actionType = FormatActionType(pew.ActionType);
                    productType = "PewPew";
                }
                else if (p is Suppressor sup)
                {
                    caliberName = sup.MaxCaliber?.Name ?? "";
                    caliberId = sup.MaxCaliberId;
                    productType = "Suppressor";
                }
                else if (p is Optic)
                {
                    productType = "Optic";
                }
                else if (p is PewPewLight)
                {
                    productType = "PewPewLight";
                }

                return new
                {
                    id = p.Id,
                    name = p.Model,
                    sku = p.Sku,
                    partNumber = p.PartNumber,
                    category = productType,
                    actionType = actionType,
                    manufacturerId = p.ManufacturerId,
                    manufacturer = p.Manufacturer?.Name ?? "",
                    caliberId = caliberId,
                    caliber = caliberName
                };
            }).ToList();

            return Ok(dtos);
        }

        // GET: api/armory/enums
        [HttpGet("enums")]
        public IActionResult GetEnums()
        {
            return Ok(new
            {
                actionTypes = Enum.GetValues<ActionType>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = FormatActionType(e) }).ToList(),
                documentTypes = Enum.GetValues<DocumentType>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = FormatDocumentType(e) }).ToList(),
                itemConditions = Enum.GetValues<ItemCondition>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = FormatCondition(e) }).ToList(),
                lockTypes = Enum.GetValues<LockType>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = FormatLockType(e) }).ToList(),
                nfaFormTypes = Enum.GetValues<NfaFormType>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = FormatNfaFormType(e) }).ToList(),
                productCategories = Enum.GetValues<PewPewCategory>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = FormatProductCategory(e) }).ToList(),
                suppressorMaterials = Enum.GetValues<SuppressorMaterial>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = e.GetDisplayName() }).ToList(),
                suppressorAttachmentTypes = Enum.GetValues<SuppressorAttachmentType>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = e.GetDisplayName() }).ToList(),
                opticFocalPlanes = Enum.GetValues<OpticFocalPlane>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = e.GetDisplayName() }).ToList(),
                opticReticles = Enum.GetValues<OpticReticle>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = e.GetDisplayName() }).ToList(),
                opticAdjustmentUnits = Enum.GetValues<OpticAdjustmentUnit>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = e.GetDisplayName() }).ToList(),
                batteryTypes = Enum.GetValues<BatteryType>().OrderBy(e => (int)e).Select(e => new { id = (int)e, name = e.ToString(), label = e.GetDisplayName() }).ToList()
            });
        }

        // GET: api/armory/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.ArmoryItems
                .Include(i => i.Product)
                    .ThenInclude(p => p.Manufacturer)
                .Include(i => i.Product)
                    .ThenInclude(p => (p as PewPew).Caliber)
                .Include(i => i.Product)
                    .ThenInclude(p => (p as Suppressor).MaxCaliber)
                .Include(i => i.Vault)
                .Include(i => i.Arsenal)
                .Include(i => i.Owner)
                .Include(i => i.Beneficiary)
                .Include(i => i.MountedAccessories)
                    .ThenInclude(acc => acc.Product)
                        .ThenInclude(p => p.Manufacturer)
                .Include(i => i.MountedAccessories)
                    .ThenInclude(acc => acc.Product)
                        .ThenInclude(p => (p as PewPew).Caliber)
                .Include(i => i.MountedAccessories)
                    .ThenInclude(acc => acc.Product)
                        .ThenInclude(p => (p as Suppressor).MaxCaliber)
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

            // Determine concrete ArmoryItem type based on product subclass
            ArmoryItem armoryItem;

            if (product is PewPew)
            {
                armoryItem = new PewArmoryItem
                {
                    BarrelLengthInches = model.BarrelLengthInches ?? 0,
                    TwistRate = model.TwistRate,
                    ThreadPitch = model.ThreadPitch,
                    IsNfaItem = model.IsNfaItem,
                    NfaFormType = !string.IsNullOrEmpty(model.NfaFormType) && Enum.TryParse<NfaFormType>(model.NfaFormType, true, out var formType) ? formType : null,
                    TaxStampDocumentUrl = model.TaxStampDocumentUrl,
                    StampApprovalDate = model.StampApprovalDate
                };
            }
            else if (product is Suppressor)
            {
                armoryItem = new SuppressorArmoryItem
                {
                    IsNfaItem = true, // Suppressors are always NFA items
                    NfaFormType = !string.IsNullOrEmpty(model.NfaFormType) && Enum.TryParse<NfaFormType>(model.NfaFormType, true, out var formType) ? formType : NfaFormType.Form4,
                    TaxStampDocumentUrl = model.TaxStampDocumentUrl,
                    StampApprovalDate = model.StampApprovalDate
                };
            }
            else if (product is Optic)
            {
                armoryItem = new OpticArmoryItem
                {
                    BatteryLastChangedDate = model.BatteryLastChangedDate,
                    BatteryExpirationDate = model.BatteryExpirationDate
                };
            }
            else if (product is PewPewLight)
            {
                armoryItem = new LightArmoryItem
                {
                    BatteryLastChangedDate = model.BatteryLastChangedDate,
                    BatteryExpirationDate = model.BatteryExpirationDate
                };
            }
            else
            {
                armoryItem = new ArmoryItem();
            }

            // Set common inventory parameters
            armoryItem.ProductId = product.Id;
            armoryItem.ParentItemId = model.ParentItemId;
            armoryItem.SerialNumber = model.SerialNumber ?? "";
            armoryItem.PurchasePrice = model.PurchasePrice;
            armoryItem.PurchaseDate = model.PurchaseDate;
            armoryItem.EstimatedValue = model.CurrentValue ?? model.EstimatedValue;
            armoryItem.Condition = ParseCondition(model.Condition);
            armoryItem.RoundCount = model.RoundCount;
            armoryItem.OwnerId = string.IsNullOrWhiteSpace(model.OwnerId) ? null : model.OwnerId;
            armoryItem.BeneficiaryId = string.IsNullOrWhiteSpace(model.BeneficiaryId) ? null : model.BeneficiaryId;
            armoryItem.VaultId = vaultId;
            armoryItem.ArsenalId = arsenalId;
            armoryItem.ImageUrl = model.ImageUrl;
            armoryItem.NotesMarkdown = model.NotesMarkdown ?? model.Notes;

            _db.ArmoryItems.Add(armoryItem);
            await _db.SaveChangesAsync();

            // Load and map fully
            var created = await _db.ArmoryItems
                .Include(i => i.Product)
                    .ThenInclude(p => p.Manufacturer)
                .Include(i => i.Product)
                    .ThenInclude(p => (p as PewPew).Caliber)
                .Include(i => i.Product)
                    .ThenInclude(p => (p as Suppressor).MaxCaliber)
                .Include(i => i.Vault)
                .Include(i => i.Arsenal)
                .Include(i => i.Owner)
                .Include(i => i.Beneficiary)
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
            armoryItem.ParentItemId = model.ParentItemId;
            armoryItem.SerialNumber = model.SerialNumber ?? "";
            if (armoryItem is PewArmoryItem pew)
            {
                pew.BarrelLengthInches = model.BarrelLengthInches ?? 0;
                pew.TwistRate = model.TwistRate;
                pew.ThreadPitch = model.ThreadPitch;
            }

            if (armoryItem is NfaArmoryItem nfa)
            {
                nfa.IsNfaItem = model.IsNfaItem;
                nfa.NfaFormType = !string.IsNullOrEmpty(model.NfaFormType) && Enum.TryParse<NfaFormType>(model.NfaFormType, true, out var formType) ? formType : null;
                nfa.TaxStampDocumentUrl = model.TaxStampDocumentUrl;
                nfa.StampApprovalDate = model.StampApprovalDate;
            }

            if (armoryItem is IHasBattery bat)
            {
                bat.BatteryLastChangedDate = model.BatteryLastChangedDate;
                bat.BatteryExpirationDate = model.BatteryExpirationDate;
            }
            armoryItem.PurchasePrice = model.PurchasePrice;
            armoryItem.PurchaseDate = model.PurchaseDate;
            armoryItem.EstimatedValue = model.CurrentValue ?? model.EstimatedValue;
            armoryItem.Condition = ParseCondition(model.Condition);
            armoryItem.RoundCount = model.RoundCount;
            armoryItem.OwnerId = string.IsNullOrWhiteSpace(model.OwnerId) ? null : model.OwnerId;
            armoryItem.BeneficiaryId = string.IsNullOrWhiteSpace(model.BeneficiaryId) ? null : model.BeneficiaryId;
            armoryItem.VaultId = vaultId;
            armoryItem.ImageUrl = model.ImageUrl;
            armoryItem.NotesMarkdown = model.NotesMarkdown ?? model.Notes;

            await _db.SaveChangesAsync();

            // Load and map fully
            var updated = await _db.ArmoryItems
                .Include(i => i.Product)
                    .ThenInclude(p => p.Manufacturer)
                .Include(i => i.Product)
                    .ThenInclude(p => (p as PewPew).Caliber)
                .Include(i => i.Product)
                    .ThenInclude(p => (p as Suppressor).MaxCaliber)
                .Include(i => i.Vault)
                .Include(i => i.Arsenal)
                .Include(i => i.Owner)
                .Include(i => i.Beneficiary)
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

        // POST: api/armory/{id}/mount?parentId={parentId}
        [HttpPost("{id}/mount")]
        public async Task<IActionResult> Mount(int id, [FromQuery] int parentId)
        {
            var childItem = await _db.ArmoryItems.FindAsync(id);
            if (childItem == null)
                return NotFound("Child accessory not found.");

            var parentItem = await _db.ArmoryItems.FindAsync(parentId);
            if (parentItem == null)
                return NotFound("Parent firearm/item not found.");

            childItem.ParentItemId = parentId;
            await _db.SaveChangesAsync();

            return Ok();
        }

        // POST: api/armory/{id}/unmount
        [HttpPost("{id}/unmount")]
        public async Task<IActionResult> Unmount(int id)
        {
            var childItem = await _db.ArmoryItems.FindAsync(id);
            if (childItem == null)
                return NotFound("Accessory not found.");

            childItem.ParentItemId = null;
            await _db.SaveChangesAsync();

            return Ok();
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
                Model = i.Product?.Model ?? "",
                PartNumber = i.Product?.PartNumber,
                Sku = i.Product?.Sku,
                WebPageUrl = i.Product?.WebPageUrl,
                ManufacturerWebPageUrl = i.Product?.Manufacturer?.WebPageUrl,
                Caliber = i.Product is PewPew pew ? (pew.Caliber?.Name ?? "") : (i.Product is Suppressor sup ? (sup.MaxCaliber?.Name ?? "") : ""),
                SerialNumber = i.SerialNumber,
                ActionType = i.Product is PewPew p ? FormatActionType(p.ActionType) : "Semi-Automatic",
                BarrelLengthInches = i is PewArmoryItem pewItem ? pewItem.BarrelLengthInches : null,
                TwistRate = i is PewArmoryItem twistItem ? twistItem.TwistRate : null,
                ThreadPitch = i is PewArmoryItem threadItem ? threadItem.ThreadPitch : null,
                IsNfaItem = i is NfaArmoryItem nfaItem ? nfaItem.IsNfaItem : false,
                NfaFormType = i is NfaArmoryItem formItem ? formItem.NfaFormType?.ToString() : null,
                TaxStampDocumentUrl = i is NfaArmoryItem stampDoc ? stampDoc.TaxStampDocumentUrl : null,
                StampApprovalDate = i is NfaArmoryItem stampDate ? stampDate.StampApprovalDate : null,
                BatteryLastChangedDate = i is IHasBattery batItem ? batItem.BatteryLastChangedDate : null,
                BatteryExpirationDate = i is IHasBattery expItem ? expItem.BatteryExpirationDate : null,
                BatteryType = i.Product is INeedsBattery needBat ? (BatteryType?)needBat.BatteryType : null,
                ItemType = i.GetType().Name,
                PurchasePrice = i.PurchasePrice,
                PurchaseDate = i.PurchaseDate,
                CurrentValue = i.EstimatedValue,
                EstimatedValue = i.EstimatedValue,
                Condition = FormatCondition(i.Condition),
                RoundCount = i.RoundCount,
                OwnerId = i.OwnerId,
                Owner = i.Owner?.UserName ?? "",
                BeneficiaryId = i.BeneficiaryId,
                Beneficiary = i.Beneficiary?.UserName ?? "",
                VaultId = i.VaultId,
                StorageLocation = i.Vault?.Name ?? "Main Vault",
                ArsenalId = i.ArsenalId,
                ArsenalName = i.Arsenal?.Name,
                ArsenalColor = i.Arsenal?.ColorHex,
                ArsenalIcon = i.Arsenal?.IconName,
                ImageUrl = i.ImageUrl,
                NotesMarkdown = i.NotesMarkdown,
                Notes = i.NotesMarkdown ?? "",
                AccessoriesListJson = "[]",
                MaintenanceTasksJson = "[]",
                RangeHistoryJson = "[]",
                ParentItemId = i.ParentItemId,
                ParentItemName = i.ParentItem != null ? $"{i.ParentItem.Product?.Manufacturer?.Name} {i.ParentItem.Product?.Model}" : null,
                MountedAccessories = i.MountedAccessories != null
                    ? i.MountedAccessories.Select(acc => new ArmoryItemDto
                    {
                        Id = acc.Id,
                        ManufacturerId = acc.Product?.ManufacturerId ?? 0,
                        Manufacturer = acc.Product?.Manufacturer?.Name ?? "",
                        FirearmModelId = acc.ProductId,
                        Model = acc.Product?.Model ?? "",
                        SerialNumber = acc.SerialNumber,
                        Caliber = acc.Product is PewPew accPew ? (accPew.Caliber?.Name ?? "") : (acc.Product is Suppressor accSup ? (accSup.MaxCaliber?.Name ?? "") : ""),
                        RoundCount = acc.RoundCount,
                        Condition = FormatCondition(acc.Condition),
                        ImageUrl = acc.ImageUrl,
                        NotesMarkdown = acc.NotesMarkdown,
                        Notes = acc.NotesMarkdown ?? "",
                        ParentItemId = acc.ParentItemId,
                        PartNumber = acc.Product?.PartNumber,
                        Sku = acc.Product?.Sku,
                        WebPageUrl = acc.Product?.WebPageUrl,
                        ManufacturerWebPageUrl = acc.Product?.Manufacturer?.WebPageUrl
                    }).ToList()
                    : new List<ArmoryItemDto>()
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
            var prod = await _db.Products.FirstOrDefaultAsync(p => p.Model.ToLower() == modelName.ToLower() && p.ManufacturerId == mfgId);
            if (prod == null)
            {
                prod = new PewPew
                {
                    Model = modelName,
                    ManufacturerId = mfgId,
                    CaliberId = caliberId,
                    PewPewCategory = PewPewCategory.Handgun // fallback category
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
            var displayName = action.GetDisplayName();
            if (displayName != action.ToString()) return displayName;

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
            var displayName = condition.GetDisplayName();
            if (displayName != condition.ToString()) return displayName;

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

        private string FormatDocumentType(DocumentType doc)
        {
            var displayName = doc.GetDisplayName();
            if (displayName != doc.ToString()) return displayName;

            return doc switch
            {
                DocumentType.OwnerManual => "Owner's Manual",
                DocumentType.PartsDiagram => "Parts Diagram / Schematic",
                DocumentType.WarrantyDocument => "Warranty Document",
                DocumentType.RecallNotice => "Recall Notice",
                DocumentType.SpecSheet => "Spec Sheet",
                DocumentType.TaxStamp => "Tax Stamp / NFA Form",
                DocumentType.ReceiptOrInvoice => "Receipt or Invoice",
                _ => "Other Document"
            };
        }

        private string FormatLockType(LockType lockType)
        {
            var displayName = lockType.GetDisplayName();
            if (displayName != lockType.ToString()) return displayName;

            return lockType switch
            {
                LockType.ElectronicKeypad => "Electronic Keypad",
                LockType.MechanicalDial => "Mechanical Dial",
                LockType.BiometricScanner => "Biometric Scanner",
                LockType.DualKeySystem => "Dual Key System",
                LockType.PhysicalKeyLock => "Physical Key Lock",
                LockType.RfidTransponder => "RFID Transponder",
                LockType.OpenCabinet => "None / Cabinet",
                LockType.ActionLock => "Action Lock",
                _ => "None / Open Cabinet"
            };
        }

        private string FormatNfaFormType(NfaFormType form)
        {
            var displayName = form.GetDisplayName();
            if (displayName != form.ToString()) return displayName;

            return form switch
            {
                NfaFormType.Form1 => "ATF Form 1 (Manufacture)",
                NfaFormType.Form2 => "ATF Form 2 (Notice of Manufacture)",
                NfaFormType.Form3 => "ATF Form 3 (Dealer-to-Dealer)",
                NfaFormType.Form4 => "ATF Form 4 (Tax-Paid Transfer)",
                NfaFormType.Form5 => "ATF Form 5 (Tax-Exempt Transfer)",
                NfaFormType.Form9 => "ATF Form 9 (Export)",
                NfaFormType.Form10 => "ATF Form 10 (Government)",
                _ => form.ToString()
            };
        }

        private string FormatProductCategory(PewPewCategory cat)
        {
            var displayName = cat.GetDisplayName();
            if (displayName != cat.ToString()) return displayName;

            return cat switch
            {
                PewPewCategory.Handgun => "Handgun / Pistol",
                PewPewCategory.Rifle => "Centerfire Rifle",
                PewPewCategory.Shotgun => "Shotgun",
                PewPewCategory.Rimfire => "Rimfire Rifle / Pistol",
                PewPewCategory.PistolCaliberCarbine => "Pistol Caliber Carbine (PCC)",
                PewPewCategory.ReceiverOnly => "Receiver / Frame Only",
                PewPewCategory.NfaItem => "NFA regulated Item (SBR/Suppressor)",
                PewPewCategory.PrecisionLongRange => "Precision Long Range",
                PewPewCategory.Competition => "Competition Match",
                PewPewCategory.CurioAndRelic => "Curio & Relic (C&R)",
                _ => cat.ToString()
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
        public DateTime? BatteryLastChangedDate { get; set; }
        public DateTime? BatteryExpirationDate { get; set; }
        public BatteryType? BatteryType { get; set; }
        public string? ItemType { get; set; }
        public decimal? PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public decimal? CurrentValue { get; set; }
        public decimal? EstimatedValue { get; set; }
        public string? Condition { get; set; }
        public int RoundCount { get; set; }
        public string? OwnerId { get; set; }
        public string? Owner { get; set; }
        public string? BeneficiaryId { get; set; }
        public string? Beneficiary { get; set; }
        public int? VaultId { get; set; }
        public string? StorageLocation { get; set; }
        public int? ArsenalId { get; set; }
        public string? ArsenalName { get; set; }
        public string? ArsenalColor { get; set; }
        public string? ArsenalIcon { get; set; }
        public string? ImageUrl { get; set; }
        public string? NotesMarkdown { get; set; }
        public string? Notes { get; set; }
        public string? PartNumber { get; set; }
        public string? Sku { get; set; }
        public string? WebPageUrl { get; set; }
        public string? ManufacturerWebPageUrl { get; set; }
        public string? AccessoriesListJson { get; set; }
        public string? MaintenanceTasksJson { get; set; }
        public string? RangeHistoryJson { get; set; }

        public int? ParentItemId { get; set; }
        public string? ParentItemName { get; set; }
        public List<ArmoryItemDto> MountedAccessories { get; set; } = new();
    }

    public class IncrementRoundsRequest
    {
        public int Count { get; set; }
    }
}
