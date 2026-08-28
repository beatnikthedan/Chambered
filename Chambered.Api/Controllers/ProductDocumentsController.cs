using Asp.Versioning;
using Chambered.Api.Dto;
using Chambered.Core.Services;
using Chambered.Data;
using Chambered.Data.Enums;
using Chambered.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace Chambered.Api.Controllers
{
    /// <summary>
    /// OData controller for managing Product Documents secure physical attachments.
    /// </summary>
    [ApiVersion("1.0")]
    [Authorize]
    public class ProductDocumentsController : DocumentODataControllerBase<ProductDocument, ProductDocumentDto, ProductDocumentType>
    {
        public ProductDocumentsController(
            ChamberedDbContext db,
            IDocumentService<ProductDocument, ProductDocumentType> productDocumentService)
            : base(db, productDocumentService)
        {
        }

        /// <inheritdoc/>
        protected override ProductDocumentDto MapToDto(ProductDocument doc)
        {
            return new ProductDocumentDto
            {
                Id = doc.Id,
                ProductId = doc.ProductId.GetValueOrDefault(),
                Type = doc.Type.ToString(),
                FileName = doc.FileName,
                ContentType = doc.ContentType,
                FileSizeBytes = doc.FileSizeBytes,
                IsEncrypted = doc.IsEncrypted,
                UploadedAt = doc.UploadedAt
            };
        }

        /// <summary>
        /// Retrieves the list of valid document classification types as an OData bound function.
        /// Route format: GET /api/ProductDocuments/GetDocumentTypes
        /// </summary>
        [HttpGet]
        public IActionResult GetDocumentTypes()
        {
            return Ok(GetEnumValues<ProductDocumentType>());
        }
    }
}
