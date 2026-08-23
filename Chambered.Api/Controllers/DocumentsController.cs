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
public class DocumentsController : ODataControllerBase<Document, int>
{
    public DocumentsController(ChamberedDbContext db) : base(db) { }

    #region Navigation Properties

    [EnableQuery]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetProduct([FromRoute] int key)
    {
        return await GetNavigationPropertyAsync(key);
    }

    #endregion

    [HttpGet]
    public IActionResult GetDocumentTypes()
    {
        return Ok(GetEnumValues<DocumentType>());
    }
}
