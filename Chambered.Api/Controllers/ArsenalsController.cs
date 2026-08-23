using Asp.Versioning;
using Chambered.Api.Controllers.Settings;
using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;

namespace Chambered.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
public class ArsenalsController : ODataControllerBase<Arsenal, int>
{
    public ArsenalsController(ChamberedDbContext db) : base(db) { }

    #region Navigation Properties

    [EnableQuery]
    [ProducesResponseType(typeof(ChamberedUser), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetChamberedUsers([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    [EnableQuery]
    [ProducesResponseType(typeof(IEnumerable<Vault>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetVaults([FromRoute] int key)
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
}
