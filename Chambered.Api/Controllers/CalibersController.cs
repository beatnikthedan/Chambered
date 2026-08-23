using Asp.Versioning;
using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;

namespace Chambered.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
public class CalibersController : ODataControllerBase<Caliber, int>
{
    public CalibersController(ChamberedDbContext db) : base(db) { }

    #region Navigation Properties

    [EnableQuery]
    [ProducesResponseType(typeof(IEnumerable<PewPew>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetModels([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    #endregion
}
