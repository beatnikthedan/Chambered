using Asp.Versioning;
using Chambered.Data;
using Chambered.Data.Enums;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chambered.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
public class DocumentsController : ODataControllerBase<Document, int>
{
    public DocumentsController(ChamberedDbContext db) : base(db) { }

    [HttpGet]
    public IActionResult GetDocumentTypes()
    {
        return Ok(GetEnumValues<DocumentType>());
    }
}
