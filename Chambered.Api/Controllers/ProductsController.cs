using Asp.Versioning;
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
    [ProducesResponseType(typeof(IEnumerable<Document>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetDocuments([FromRoute] int key)
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
    public IActionResult GetOpticTypes()
    {
        return Ok(GetEnumValues<OpticType>());
    }

    [HttpGet]
    public IActionResult GetPewPewCategories()
    {
        return Ok(GetEnumValues<PewPewCategory>());
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
}
