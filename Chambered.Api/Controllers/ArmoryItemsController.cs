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
public class ArmoryItemsController : ODataControllerBase<ArmoryItem, int>
{
    public ArmoryItemsController(ChamberedDbContext db) : base(db) { }

    #region Navigation Properties

    [EnableQuery]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetProduct([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(Vault), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetVault([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(Arsenal), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetArsenal([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(ChamberedUser), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetOwner([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(ChamberedUser), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetBeneficiary([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(ArmoryItem), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetParentItem([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(IEnumerable<ArmoryItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetMountedAccessories([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    #endregion

    [HttpGet]
    public IActionResult GetItemConditions()
    {
        return Ok(GetEnumValues<ItemCondition>());
    }

    [HttpGet]
    public IActionResult GetNfaFormTypes()
    {
        return Ok(GetEnumValues<NfaFormType>());
    }
}
