using Asp.Versioning;
using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;

namespace Chambered.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
public class CalibersController : ODataControllerBase<Caliber, int>
{
    public CalibersController(ChamberedDbContext db) : base(db) { }
}
