using Asp.Versioning;
using Chambered.Api.Dto;
using Chambered.Core.Services;
using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;

namespace Chambered.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
public class ManufacturersController(ChamberedDbContext db, IFaveIconService faveIconService) : ODataControllerBase<Manufacturer, int>(db)
{
    private readonly IFaveIconService _faveIconService = faveIconService;
        
    #region Navigation Properties

    [EnableQuery]
    [ProducesResponseType(typeof(IEnumerable<Product>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetProduct([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    #endregion

    #region Functions

    /// <summary>
    /// Retrieves the cached favicon for the specified manufacturer.
    /// </summary>
    [HttpGet]
    [Authorize] // Enforce token authentication
    [ProducesResponseType(typeof(FaveIconDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFavicon([FromRoute] int key, CancellationToken cancellationToken)
    {
        var mfg = await db.Manufacturers.FindAsync(new object[] { key }, cancellationToken);
        if (mfg == null || string.IsNullOrWhiteSpace(mfg.WebPageUrl))
        {
            return NotFound();
        }
        var result = await _faveIconService.GetFaveIconAsync(mfg.WebPageUrl, cancellationToken);
        if (result == null || result.ImageBytes.Length == 0)
        {
            return NotFound();
        }
        var dto = new FaveIconDto
        {
            Base64Data = Convert.ToBase64String(result.ImageBytes),
            ContentType = result.ContentType
        };
        return Ok(dto);
    }

    #endregion
}
