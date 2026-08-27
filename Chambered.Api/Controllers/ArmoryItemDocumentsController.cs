using Asp.Versioning;
using Chambered.Core.Services;
using Chambered.Data;
using Chambered.Data.Enums;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Chambered.Api.Controllers
{
    /// <summary>
    /// OData and REST controller for managing <see cref="ArmoryItemDocument"/> entities and their raw file streams.
    /// </summary>
    [ApiVersion("1.0")]
    [Authorize]
    public class ArmoryItemDocumentsController(
        ChamberedDbContext db,
        IDocumentService<ArmoryItemDocument, ArmoryItemDocumentType> armoryItemDocumentService)
        : ODataControllerBase<ArmoryItemDocument, int>(db)
    {
        #region Navigation Properties

        /// <summary>
        /// Gets the associated armory item for an armory item document.
        /// </summary>
        [EnableQuery]
        [ProducesResponseType(typeof(ArmoryItem), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetArmoryItem([FromRoute] int key)
        {
            return await GetNavigationPropertyAsync(key);
        }

        #endregion

        #region OData Functions

        /// <summary>
        /// Exposes the list of valid armory item document classification types.
        /// </summary>
        [HttpGet]
        public IActionResult GetDocumentTypes()
        {
            return Ok(GetEnumValues<ArmoryItemDocumentType>());
        }

        #endregion

        #region Upload / Download Endpoints

        /// <summary>
        /// Uploads an armory item document, saves it to the configured storage engine, and inserts the DB record.
        /// </summary>
        [HttpPost("api/ArmoryItemDocuments/Upload")]
        [ProducesResponseType(typeof(ArmoryItemDocument), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Upload(
            [FromForm] IFormFile file,
            [FromForm] int armoryItemId,
            [FromForm] ArmoryItemDocumentType type,
            CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file was uploaded.");
            }

            try
            {
                using var uploadStream = file.OpenReadStream();
                var result = await armoryItemDocumentService.UploadDocumentAsync(armoryItemId, uploadStream, file.FileName, file.ContentType, type, cancellationToken);

                // Retrieve the full EF entity for return
                var document = await db.ArmoryItemDocuments.FindAsync(new object[] { result.Id }, cancellationToken);
                return CreatedAtAction(nameof(Get), new { key = result.Id }, document);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Downloads the decrypted raw document stream by its unique identifier.
        /// </summary>
        [HttpGet("api/ArmoryItemDocuments({key})/Download")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Download([FromRoute] int key, CancellationToken cancellationToken)
        {
            try
            {
                var download = await armoryItemDocumentService.DownloadDocumentAsync(key, cancellationToken);
                return File(download.FileStream, download.ContentType, download.FileName);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (FileNotFoundException)
            {
                return NotFound("The physical file was not found in the storage backend.");
            }
        }

        /// <summary>
        /// Deletes the document record and removes its physical file from storage.
        /// </summary>
        [HttpDelete("api/ArmoryItemDocuments({key})")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public override async Task<IActionResult> Delete([FromRoute] int key)
        {
            try
            {
                await armoryItemDocumentService.DeleteDocumentAsync(key);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        #endregion
    }
}
