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
    /// OData and REST controller for managing <see cref="ProductDocument"/> entities and their raw file streams.
    /// </summary>
    [ApiVersion("1.0")]
    [Authorize]
    public class ProductDocumentsController(
        ChamberedDbContext db,
        IDocumentService<ProductDocument, ProductDocumentType> productDocumentService)
        : ODataControllerBase<ProductDocument, int>(db)
    {

        #region Navigation Properties

        /// <summary>
        /// Gets the associated product for a product document.
        /// </summary>
        [EnableQuery]
        [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetProduct([FromRoute] int key)
        {
            return await GetNavigationPropertyAsync(key);
        }

        #endregion

        #region OData Functions

        /// <summary>
        /// Exposes the list of valid document classification types.
        /// </summary>
        [HttpGet]
        public IActionResult GetDocumentTypes()
        {
            return Ok(GetEnumValues<ProductDocumentType>());
        }

        #endregion

        #region Upload / Download Endpoints

        /// <summary>
        /// Uploads a product document, saves it to the configured storage engine, and inserts the DB record.
        /// </summary>
        [HttpPost("api/ProductDocuments/Upload")]
        [ProducesResponseType(typeof(ProductDocument), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Upload(
            [FromForm] IFormFile file,
            [FromForm] int productId,
            [FromForm] ProductDocumentType type,
            CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file was uploaded.");
            }

            try
            {
                using var uploadStream = file.OpenReadStream();
                var result = await productDocumentService.UploadDocumentAsync(productId, uploadStream, file.FileName, file.ContentType, type, cancellationToken);

                // Retrieve the full EF entity for return
                var document = await db.ProductDocuments.FindAsync(new object[] { result.Id }, cancellationToken);
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
        [HttpGet("api/ProductDocuments({key})/Download")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Download([FromRoute] int key, CancellationToken cancellationToken)
        {
            try
            {
                var download = await productDocumentService.DownloadDocumentAsync(key, cancellationToken);
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
        [HttpDelete("api/ProductDocuments({key})")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public override async Task<IActionResult> Delete([FromRoute] int key)
        {
            try
            {
                await productDocumentService.DeleteDocumentAsync(key);
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
