using Chambered.Core.Services;
using Chambered.Data;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Chambered.Api.Controllers
{
    /// <summary>
    /// A generic, streamlined OData controller base specifically designed for secure file attachment resources.
    /// Manages file uploads (PUT), metadata queries (GET), file downloads (Download), and deletions (DELETE) using IDocumentService.
    /// </summary>
    /// <typeparam name="TDocument">The concrete document entity type.</typeparam>
    /// <typeparam name="TDto">The API client-facing document projection DTO type.</typeparam>
    /// <typeparam name="TEnum">The classification category enum.</typeparam>
    [Produces("application/json")]
    public abstract class DocumentODataControllerBase<TDocument, TDto, TEnum> : ODataController
        where TDocument : ExternalDocument
        where TDto : class
        where TEnum : struct, Enum
    {
        private readonly ChamberedDbContext _db;
        private readonly IDocumentService<TDocument, TEnum> _documentService;

        protected DocumentODataControllerBase(ChamberedDbContext db, IDocumentService<TDocument, TEnum> documentService)
        {
            _db = db;
            _documentService = documentService;
        }

        /// <summary>
        /// Maps an internal database document model to its client-facing DTO projection.
        /// </summary>
        protected abstract TDto MapToDto(TDocument document);

        /// <summary>
        /// Retrieves queryable document metadata. Supports full OData query options ($filter, $select, $orderby, etc.).
        /// Route format: GET /api/ProductDocuments
        /// </summary>
        [HttpGet]
        [EnableQuery]
        public virtual IQueryable<TDto> Get()
        {
            return _db.Set<TDocument>().Select(doc => MapToDto(doc));
        }

        /// <summary>
        /// Retrieves the metadata of a single document record by its unique primary database key.
        /// Route format: GET /api/ProductDocuments(5)
        /// </summary>
        [HttpGet]
        [EnableQuery]
        public virtual async Task<IActionResult> Get([FromRoute] int key, CancellationToken cancellationToken)
        {
            var document = await _db.Set<TDocument>().FindAsync(new object[] { key }, cancellationToken);
            if (document == null)
            {
                return NotFound(new { Message = $"Document attachment with ID {key} was not found." });
            }

            return Ok(MapToDto(document));
        }

        /// <summary>
        /// Downloads the actual raw decrypted file stream of a single document by its unique key.
        /// Bound Entity Function: GET /api/ProductDocuments(5)/Download
        /// </summary>
        [HttpGet]
        public virtual async Task<IActionResult> Download([FromRoute] int key, CancellationToken cancellationToken)
        {
            try
            {
                var download = await _documentService.DownloadDocumentAsync(key, cancellationToken);
                return File(download.FileStream, download.ContentType, download.FileName);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Message = $"Document attachment with ID {key} was not found." });
            }
            catch (FileNotFoundException)
            {
                return NotFound(new { Message = "The physical file was not found in the storage backend." });
            }
        }

        /// <summary>
        /// Downloads all files linked to the specified parent ID combined into a single ZIP archive stream.
        /// Bound Collection Function: GET /api/ProductDocuments/DownloadAll(parentId=5)
        /// </summary>
        [HttpGet]
        public virtual async Task<IActionResult> DownloadAll([FromQuery] int parentId, CancellationToken cancellationToken)
        {
            try
            {
                var download = await _documentService.DownloadAllDocumentsAsync(parentId, cancellationToken);
                return File(download.FileStream, download.ContentType, download.FileName);
            }
            catch (Exception ex)
            {
                return NotFound(new { Message = $"Failed to package documents for parent ID {parentId}.", Details = ex.Message });
            }
        }

        /// <summary>
        /// Uploads a new document securely linked to the specified parent ID and returns its newly created metadata.
        /// Route format: PUT /api/ProductDocuments(5)
        /// Where key is the parent entity ID.
        /// </summary>
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public virtual async Task<IActionResult> Put(
            [FromRoute] int key,
            IFormFile file,
            [FromForm] TEnum type,
            CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file was uploaded.");
            }

            try
            {
                using var uploadStream = file.OpenReadStream();
                var result = await _documentService.UploadDocumentAsync(key, uploadStream, file.FileName, file.ContentType, type, cancellationToken);

                var document = await _db.Set<TDocument>().FindAsync(new object[] { result.Id }, cancellationToken);
                if (document == null) return NotFound();

                var dto = MapToDto(document);
                return Created(dto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Deletes the document database metadata and purges its raw encrypted stream from physical storage.
        /// Route format: DELETE /api/ProductDocuments(5)
        /// </summary>
        [HttpDelete]
        public virtual async Task<IActionResult> Delete([FromRoute] int key, CancellationToken cancellationToken)
        {
            try
            {
                await _documentService.DeleteDocumentAsync(key, cancellationToken);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Message = $"Document attachment with ID {key} was not found." });
            }
        }

        /// <summary>
        /// Static helper for projecting classification enum categories with localization/display attributes.
        /// </summary>
        protected static IEnumerable<Chambered.Api.Models.EnumDto> GetEnumValues<TEnumHelper>() where TEnumHelper : struct, Enum
        {
            return Enum.GetValues(typeof(TEnumHelper))
                .Cast<TEnumHelper>()
                .Select(e => new Chambered.Api.Models.EnumDto
                {
                    Value = e.ToString(),
                    DisplayName = GetEnumDisplayName(e)
                });
        }

        private static string GetEnumDisplayName(Enum value)
        {
            var field = value.GetType().GetField(value.ToString());
            if (field == null) return value.ToString();
            var attribute = (System.ComponentModel.DataAnnotations.DisplayAttribute?)Attribute.GetCustomAttribute(field, typeof(System.ComponentModel.DataAnnotations.DisplayAttribute));
            return attribute?.Name ?? value.ToString();
        }
    }
}
