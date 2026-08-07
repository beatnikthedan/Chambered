using Chambered.Data;
using Chambered.Data.Enums;
using Chambered.Data.Extensions;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Chambered.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly ChamberedDbContext _db;

        public ProductsController(ChamberedDbContext db)
        {
            _db = db;
        }

        // GET: api/products/manufacturers
        [HttpGet("manufacturers")]
        public async Task<IActionResult> GetManufacturers()
        {
            var mfg = await _db.Manufacturers
                .OrderBy(m => m.Name)
                .Select(m => new { m.Id, m.Name })
                .ToListAsync();
            return Ok(mfg);
        }

        // GET: api/products/calibers
        [HttpGet("calibers")]
        public async Task<IActionResult> GetCalibers()
        {
            var cal = await _db.Calibers
                .OrderBy(c => c.Name)
                .Select(c => new { c.Id, c.Name })
                .ToListAsync();
            return Ok(cal);
        }


        // GET: api/products
        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] string? type)
        {
            IQueryable<Product> query = _db.Products;

            if (!string.IsNullOrEmpty(type))
            {
                query = type.ToLower() switch
                {
                    "pewpew" => query.OfType<PewPew>(),
                    "optic" => query.OfType<Optic>(),
                    "suppressor" => query.OfType<Suppressor>(),
                    "pewpewlight" => query.OfType<PewPewLight>(),
                    _ => query
                };
            }

            var products = await query
                .Include(p => p.Manufacturer)
                .OrderBy(p => p.Model)
                .ToListAsync();

            // Safely populate Caliber navigation property to avoid EF Core polymorphic include crashes
            var pewPews = products.OfType<PewPew>().ToList();
            if (pewPews.Any())
            {
                var caliberIds = pewPews.Select(p => p.CaliberId).Distinct().ToList();
                var calibers = await _db.Calibers.Where(c => caliberIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id);
                foreach (var pp in pewPews)
                {
                    if (calibers.TryGetValue(pp.CaliberId, out var cal))
                    {
                        pp.Caliber = cal;
                    }
                }
            }

            var suppressors = products.OfType<Suppressor>().ToList();
            if (suppressors.Any())
            {
                var caliberIds = suppressors.Select(s => s.MaxCaliberId).Distinct().ToList();
                var calibers = await _db.Calibers.Where(c => caliberIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id);
                foreach (var s in suppressors)
                {
                    if (calibers.TryGetValue(s.MaxCaliberId, out var cal))
                    {
                        s.MaxCaliber = cal;
                    }
                }
            }

            var dtos = products.Select(p => MapToDto(p)).ToList();
            return Ok(dtos);
        }

        // GET: api/products/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _db.Products
                .Include(p => p.Manufacturer)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();

            if (product is PewPew pp)
            {
                pp.Caliber = await _db.Calibers.FirstOrDefaultAsync(c => c.Id == pp.CaliberId);
            }
            else if (product is Suppressor sup)
            {
                sup.MaxCaliber = await _db.Calibers.FirstOrDefaultAsync(c => c.Id == sup.MaxCaliberId);
            }

            return Ok(MapToDto(product));
        }

        // POST: api/products
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductDto dto)
        {
            if (dto == null) return BadRequest();

            if (dto.ManufacturerId <= 0)
            {
                return BadRequest(new { message = "Please select a valid Manufacturer." });
            }

            if (dto is PewPewDto ppDto && ppDto.CaliberId <= 0)
            {
                return BadRequest(new { message = "Please select a valid Caliber." });
            }

            if (dto is SuppressorDto supDto && supDto.MaxCaliberId <= 0)
            {
                return BadRequest(new { message = "Please select a valid Max Caliber." });
            }

            Product product;
            if (dto is PewPewDto) product = new PewPew();
            else if (dto is OpticDto) product = new Optic();
            else if (dto is SuppressorDto) product = new Suppressor();
            else if (dto is PewPewLightDto) product = new PewPewLight();
            else product = new Product();

            UpdateEntityFromDto(product, dto);

            try
            {
                _db.Products.Add(product);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                var msg = ex.Message;
                if (ex.InnerException != null) msg += " -> " + ex.InnerException.Message;
                return StatusCode(500, new { message = "Database save failed: " + msg });
            }

            // Load fully
            var created = await _db.Products
                .Include(p => p.Manufacturer)
                .FirstAsync(p => p.Id == product.Id);

            if (created is PewPew pp)
            {
                pp.Caliber = await _db.Calibers.FirstOrDefaultAsync(c => c.Id == pp.CaliberId);
            }
            else if (created is Suppressor sup)
            {
                sup.MaxCaliber = await _db.Calibers.FirstOrDefaultAsync(c => c.Id == sup.MaxCaliberId);
            }

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, MapToDto(created));
        }

        // PUT: api/products/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductDto dto)
        {
            if (dto == null || id != dto.Id) return BadRequest();

            if (dto.ManufacturerId <= 0)
            {
                return BadRequest(new { message = "Please select a valid Manufacturer." });
            }

            if (dto is PewPewDto ppDto && ppDto.CaliberId <= 0)
            {
                return BadRequest(new { message = "Please select a valid Caliber." });
            }

            if (dto is SuppressorDto supDto && supDto.MaxCaliberId <= 0)
            {
                return BadRequest(new { message = "Please select a valid Max Caliber." });
            }

            var product = await _db.Products
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();

            UpdateEntityFromDto(product, dto);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                var msg = ex.Message;
                if (ex.InnerException != null) msg += " -> " + ex.InnerException.Message;
                return StatusCode(500, new { message = "Database update failed: " + msg });
            }

            // Load fully
            var updated = await _db.Products
                .Include(p => p.Manufacturer)
                .FirstAsync(p => p.Id == id);

            if (updated is PewPew pp)
            {
                pp.Caliber = await _db.Calibers.FirstOrDefaultAsync(c => c.Id == pp.CaliberId);
            }
            else if (updated is Suppressor sup)
            {
                sup.MaxCaliber = await _db.Calibers.FirstOrDefaultAsync(c => c.Id == sup.MaxCaliberId);
            }

            return Ok(MapToDto(updated));
        }

        // DELETE: api/products/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null) return NotFound();

            // Check if product is in use by any ArmoryItem
            var inUse = await _db.ArmoryItems.AnyAsync(ai => ai.ProductId == id);
            if (inUse)
            {
                return BadRequest(new { message = "Cannot delete product because it is currently referenced by inventory items in the armory." });
            }

            _db.Products.Remove(product);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        #region Helpers

        private ProductDto MapToDto(Product p)
        {
            if (p is PewPew pew)
            {
                return new PewPewDto
                {
                    Id = pew.Id,
                    ProductType = "PewPew",
                    Model = pew.Model,
                    PartNumber = pew.PartNumber,
                    Sku = pew.Sku,
                    ManufacturerId = pew.ManufacturerId,
                    ManufacturerName = pew.Manufacturer?.Name,
                    WebPageUrl = pew.WebPageUrl,
                    ReferenceNotes = pew.ReferenceNotes,
                    Specifications = pew.Specifications ?? new(),
                    CaliberId = pew.CaliberId,
                    CaliberName = pew.Caliber?.Name,
                    PewPewCategory = pew.PewPewCategory.GetDisplayName(),
                    ActionType = pew.ActionType.GetDisplayName()
                };
            }
            if (p is Optic opt)
            {
                return new OpticDto
                {
                    Id = opt.Id,
                    ProductType = "Optic",
                    Model = opt.Model,
                    PartNumber = opt.PartNumber,
                    Sku = opt.Sku,
                    ManufacturerId = opt.ManufacturerId,
                    ManufacturerName = opt.Manufacturer?.Name,
                    WebPageUrl = opt.WebPageUrl,
                    ReferenceNotes = opt.ReferenceNotes,
                    Specifications = opt.Specifications ?? new(),
                    MinMagnification = opt.MinMagnification,
                    MaxMagnification = opt.MaxMagnification,
                    ObjectiveDiameterMm = opt.ObjectiveDiameterMm,
                    OpticType = opt.OpticType.GetDisplayName(),
                    FocalPlane = opt.FocalPlane.GetDisplayName(),
                    Reticle = opt.Reticle.GetDisplayName(),
                    AdjustmentUnits = opt.AdjustmentUnits.GetFlagsDisplayName(),
                    TubeDiameter = opt.TubeDiameter,
                    Footprint = opt.Footprint,
                    IsIlluminated = opt.IsIlluminated,
                    MagnificationDisplay = opt.MagnificationDisplay
                };
            }
            if (p is Suppressor sup)
            {
                return new SuppressorDto
                {
                    Id = sup.Id,
                    ProductType = "Suppressor",
                    Model = sup.Model,
                    PartNumber = sup.PartNumber,
                    Sku = sup.Sku,
                    ManufacturerId = sup.ManufacturerId,
                    ManufacturerName = sup.Manufacturer?.Name,
                    WebPageUrl = sup.WebPageUrl,
                    ReferenceNotes = sup.ReferenceNotes,
                    Specifications = sup.Specifications ?? new(),
                    MaxCaliberId = sup.MaxCaliberId,
                    MaxCaliberName = sup.MaxCaliber?.Name,
                    ThreadPitch = sup.ThreadPitch,
                    AttachmentType = sup.AttachmentType.GetDisplayName(),
                    Material = sup.Material.GetDisplayName(),
                    SoundReductionDb = sup.SoundReductionDb,
                    IsFullAutoRated = sup.IsFullAutoRated,
                    IsUserServiceable = sup.IsUserServiceable
                };
            }
            if (p is PewPewLight lgt)
            {
                return new PewPewLightDto
                {
                    Id = lgt.Id,
                    ProductType = "PewPewLight",
                    Model = lgt.Model,
                    PartNumber = lgt.PartNumber,
                    Sku = lgt.Sku,
                    ManufacturerId = lgt.ManufacturerId,
                    ManufacturerName = lgt.Manufacturer?.Name,
                    WebPageUrl = lgt.WebPageUrl,
                    ReferenceNotes = lgt.ReferenceNotes,
                    Specifications = lgt.Specifications ?? new(),
                    Lumens = lgt.Lumens,
                    Candela = lgt.Candela,
                    BatteryType = lgt.BatteryType.GetDisplayName(),
                    MountType = lgt.MountType.GetDisplayName(),
                    LaserColor = lgt.LaserColor.GetDisplayName(),
                    HasRemoteSwitchPort = lgt.HasRemoteSwitchPort,
                    IsInfraredCapable = lgt.IsInfraredCapable
                };
            }

            return new ProductDto
            {
                Id = p.Id,
                ProductType = "Product",
                Model = p.Model,
                PartNumber = p.PartNumber,
                Sku = p.Sku,
                ManufacturerId = p.ManufacturerId,
                ManufacturerName = p.Manufacturer?.Name,
                WebPageUrl = p.WebPageUrl,
                ReferenceNotes = p.ReferenceNotes,
                Specifications = p.Specifications ?? new()
            };
        }

        private void UpdateEntityFromDto(Product p, ProductDto dto)
        {
            p.Model = dto.Model;
            p.PartNumber = dto.PartNumber;
            p.Sku = dto.Sku;
            p.ManufacturerId = dto.ManufacturerId;
            p.WebPageUrl = dto.WebPageUrl;
            p.ReferenceNotes = dto.ReferenceNotes;
            p.Specifications = dto.Specifications ?? new();

            if (p is PewPew pew && dto is PewPewDto pewDto)
            {
                pew.CaliberId = pewDto.CaliberId;
                if (!string.IsNullOrEmpty(pewDto.PewPewCategory))
                    pew.PewPewCategory = EnumExtensions.ParseEnumWithDisplay<PewPewCategory>(pewDto.PewPewCategory);
                if (!string.IsNullOrEmpty(pewDto.ActionType))
                    pew.ActionType = EnumExtensions.ParseEnumWithDisplay<ActionType>(pewDto.ActionType);
            }
            else if (p is Optic opt && dto is OpticDto optDto)
            {
                opt.MinMagnification = optDto.MinMagnification;
                opt.MaxMagnification = optDto.MaxMagnification;
                opt.ObjectiveDiameterMm = optDto.ObjectiveDiameterMm;
                if (!string.IsNullOrEmpty(optDto.FocalPlane))
                    opt.FocalPlane = EnumExtensions.ParseEnumWithDisplay<OpticFocalPlane>(optDto.FocalPlane);
                if (!string.IsNullOrEmpty(optDto.Reticle))
                    opt.Reticle = EnumExtensions.ParseEnumWithDisplay<OpticReticle>(optDto.Reticle);
                if (!string.IsNullOrEmpty(optDto.AdjustmentUnits))
                    opt.AdjustmentUnits = EnumExtensions.ParseFlagsEnumWithDisplay<OpticAdjustmentUnit>(optDto.AdjustmentUnits);
                opt.TubeDiameter = optDto.TubeDiameter;
                opt.Footprint = optDto.Footprint;
                opt.IsIlluminated = optDto.IsIlluminated;
                if (!string.IsNullOrEmpty(optDto.OpticType))
                    opt.OpticType = EnumExtensions.ParseEnumWithDisplay<OpticType>(optDto.OpticType);
            }
            else if (p is Suppressor sup && dto is SuppressorDto supDto)
            {
                sup.MaxCaliberId = supDto.MaxCaliberId;
                sup.ThreadPitch = supDto.ThreadPitch;
                sup.SoundReductionDb = supDto.SoundReductionDb;
                sup.IsFullAutoRated = supDto.IsFullAutoRated;
                sup.IsUserServiceable = supDto.IsUserServiceable;
                if (!string.IsNullOrEmpty(supDto.AttachmentType))
                    sup.AttachmentType = EnumExtensions.ParseEnumWithDisplay<SuppressorAttachmentType>(supDto.AttachmentType);
                if (!string.IsNullOrEmpty(supDto.Material))
                    sup.Material = EnumExtensions.ParseEnumWithDisplay<SuppressorMaterial>(supDto.Material);
            }
            else if (p is PewPewLight lgt && dto is PewPewLightDto lgtDto)
            {
                lgt.Lumens = lgtDto.Lumens;
                lgt.Candela = lgtDto.Candela;
                lgt.HasRemoteSwitchPort = lgtDto.HasRemoteSwitchPort;
                lgt.IsInfraredCapable = lgtDto.IsInfraredCapable;
                if (!string.IsNullOrEmpty(lgtDto.BatteryType))
                    lgt.BatteryType = EnumExtensions.ParseEnumWithDisplay<BatteryType>(lgtDto.BatteryType);
                if (!string.IsNullOrEmpty(lgtDto.MountType))
                    lgt.MountType = EnumExtensions.ParseEnumWithDisplay<LightMountType>(lgtDto.MountType);
                if (!string.IsNullOrEmpty(lgtDto.LaserColor))
                    lgt.LaserColor = EnumExtensions.ParseEnumWithDisplay<LaserColor>(lgtDto.LaserColor);
            }
        }

        #endregion
    }

    #region Polymorphic DTO Structure

    [JsonPolymorphic(TypeDiscriminatorPropertyName = "productType")]
    [JsonDerivedType(typeof(ProductDto), typeDiscriminator: "Product")]
    [JsonDerivedType(typeof(PewPewDto), typeDiscriminator: "PewPew")]
    [JsonDerivedType(typeof(OpticDto), typeDiscriminator: "Optic")]
    [JsonDerivedType(typeof(SuppressorDto), typeDiscriminator: "Suppressor")]
    [JsonDerivedType(typeof(PewPewLightDto), typeDiscriminator: "PewPewLight")]
    public class ProductDto
    {
        public int Id { get; set; }
        public string ProductType { get; set; } = "Product";
        public string Model { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public string? Sku { get; set; }
        public int ManufacturerId { get; set; }
        public string? ManufacturerName { get; set; }
        public string? WebPageUrl { get; set; }
        public string? ReferenceNotes { get; set; }
        public Dictionary<string, string> Specifications { get; set; } = new();
    }

    public class PewPewDto : ProductDto
    {
        public int CaliberId { get; set; }
        public string? CaliberName { get; set; }
        public string PewPewCategory { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
    }

    public class OpticDto : ProductDto
    {
        public decimal MinMagnification { get; set; }
        public decimal MaxMagnification { get; set; }
        public int ObjectiveDiameterMm { get; set; }
        public string OpticType { get; set; } = string.Empty;
        public string FocalPlane { get; set; } = string.Empty;
        public string Reticle { get; set; } = string.Empty;
        public string AdjustmentUnits { get; set; } = string.Empty;
        public string TubeDiameter { get; set; } = string.Empty;
        public string Footprint { get; set; } = string.Empty;
        public bool IsIlluminated { get; set; }
        public string MagnificationDisplay { get; set; } = string.Empty;
    }

    public class SuppressorDto : ProductDto
    {
        public int MaxCaliberId { get; set; }
        public string? MaxCaliberName { get; set; }
        public string ThreadPitch { get; set; } = string.Empty;
        public string AttachmentType { get; set; } = string.Empty;
        public string Material { get; set; } = string.Empty;
        public decimal SoundReductionDb { get; set; }
        public bool IsFullAutoRated { get; set; }
        public bool IsUserServiceable { get; set; }
    }

    public class PewPewLightDto : ProductDto
    {
        public int Lumens { get; set; }
        public int Candela { get; set; }
        public string BatteryType { get; set; } = string.Empty;
        public string MountType { get; set; } = string.Empty;
        public string LaserColor { get; set; } = string.Empty;
        public bool HasRemoteSwitchPort { get; set; }
        public bool IsInfraredCapable { get; set; }
    }

    #endregion
}
