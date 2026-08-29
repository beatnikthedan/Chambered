using Asp.Versioning;
using Chambered.Api.Models;
using Chambered.Data;
using Chambered.Data.Enums;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;

namespace Chambered.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
public class ProductsController : ODataControllerBase<Product, int>
{
    public ProductsController(ChamberedDbContext db) : base(db) { }

    #region Navigation Properties

    [EnableQuery]
    [ProducesResponseType(typeof(Manufacturer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetManufacturer([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(Caliber), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetCaliber([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(IEnumerable<ProductDocument>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetProductDocuments([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(IEnumerable<ArmoryItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetArmoryItems([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    #endregion

    [HttpGet]
    public IActionResult GetActionTypes()
    {
        return Ok(GetEnumValues<ActionType>());
    }

    [HttpGet]
    public IActionResult GetBatteryTypes()
    {
        return Ok(GetEnumValues<BatteryType>());
    }

    [HttpGet]
    public IActionResult GetCaseMaterials()
    {
        return Ok(GetEnumValues<CaseMaterial>());
    }

    [HttpGet]
    public IActionResult GetLaserColors()
    {
        return Ok(GetEnumValues<LaserColor>());
    }

    [HttpGet]
    public IActionResult GetLightMountTypes()
    {
        return Ok(GetEnumValues<LightMountType>());
    }

    [HttpGet]
    public IActionResult GetLockTypes()
    {
        return Ok(GetEnumValues<LockType>());
    }

    [HttpGet]
    public IActionResult GetOpticAdjustmentUnits()
    {
        return Ok(GetEnumValues<OpticAdjustmentUnit>());
    }

    [HttpGet]
    public IActionResult GetOpticReticles()
    {
        return Ok(GetEnumValues<OpticReticle>());
    }

    [HttpGet]
    public IActionResult GetPewPewCategories()
    {
        return Ok(GetEnumValues<PewPewCategory>());
    }

    [HttpGet]
    public IActionResult GetPowderBurnRates()
    {
        return Ok(GetEnumValues<PowderBurnRate>());
    }

    [HttpGet]
    public IActionResult GetPowderShapes()
    {
        return Ok(GetEnumValues<PowderShape>());
    }

    [HttpGet]
    public IActionResult GetPowderTypes()
    {
        return Ok(GetEnumValues<PowderType>());
    }

    [HttpGet]
    public IActionResult GetPrimerSizes()
    {
        return Ok(GetEnumValues<PrimerSize>());
    }

    [HttpGet]
    public IActionResult GetPrimerTypes()
    {
        return Ok(GetEnumValues<PrimerType>());
    }

    [HttpGet]
    public IActionResult GetProductDocumentTypes()
    {
        return Ok(GetEnumValues<ProductDocumentType>());
    }

    [HttpGet]
    public IActionResult GetProjectileMaterials()
    {
        return Ok(GetEnumValues<ProjectileMaterial>());
    }

    [HttpGet]
    public IActionResult GetProjectileProfiles()
    {
        return Ok(GetEnumValues<ProjectileProfile>());
    }
    [HttpGet]
    public IActionResult GetSuppressorAttachmentTypes()
    {
        return Ok(GetEnumValues<SuppressorAttachmentType>());
    }

    [HttpGet]
    public IActionResult GetSuppressorMaterials()
    {
        return Ok(GetEnumValues<SuppressorMaterial>());
    }

    /// <summary>
    /// Gets the list of available product types, including the base Product type and all of its derived subclasses.
    /// </summary>
    /// <returns>A list of product type names.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ODataValue<string>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<string>> GetProductTypes()
    {
        var baseType = typeof(Product);
        var types = System.Reflection.Assembly.GetAssembly(baseType)!
            .GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && (t == baseType || t.IsSubclassOf(baseType)))
            .Select(t => t.Name)
            .OrderBy(name => name == "Product" ? 0 : 1)
            .ThenBy(name => name)
            .ToList();

        return Ok(types);
    }
}
