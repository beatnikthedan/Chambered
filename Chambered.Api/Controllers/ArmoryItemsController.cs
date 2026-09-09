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
    public async Task<ActionResult> GetAccessories([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(IEnumerable<ArmoryItemDocument>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetArmoryItemDocuments([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    #endregion

    [HttpGet]
    public IActionResult GetArmoryItemDocumentTypes()
    {
        return Ok(GetEnumValues<ArmoryItemDocumentType>());
    }

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

    /// <summary>
    /// Gets the list of available armory item types, including the base ArmoryItem type and all of its derived subclasses.
    /// </summary>
    /// <returns>A list of armory item type names.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ODataValue<string>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<string>> GetArmoryItemTypes()
    {
        var baseType = typeof(ArmoryItem);
        var types = System.Reflection.Assembly.GetAssembly(baseType)!
            .GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && (t == baseType || t.IsSubclassOf(baseType)))
            .Select(t => t.Name)
            .OrderBy(name => name == "ArmoryItem" ? 0 : 1)
            .ThenBy(name => name)
            .ToList();

        return Ok(types);
    }
}
