using Asp.Versioning;
using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;

namespace Chambered.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
public class ManufacturersController : ODataControllerBase<Manufacturer, int>
{
    public ManufacturersController(ChamberedDbContext db) : base(db) { }
}
