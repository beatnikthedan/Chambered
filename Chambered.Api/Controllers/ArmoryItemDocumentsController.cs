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
    /// OData controller for managing Armory Item Documents secure physical attachments.
    /// </summary>
    [ApiVersion("1.0")]
    [Authorize]
    public class ArmoryItemDocumentsController : DocumentODataControllerBase<ArmoryItemDocument, ArmoryItemDocumentDto, ArmoryItemDocumentType>
    {
        public ArmoryItemDocumentsController(
            ChamberedDbContext db,
            IDocumentService<ArmoryItemDocument, ArmoryItemDocumentType> armoryItemDocumentService)
            : base(db, armoryItemDocumentService)
        {
        }

        /// <inheritdoc/>
        protected override ArmoryItemDocumentDto MapToDto(ArmoryItemDocument doc)
        {
            return new ArmoryItemDocumentDto
            {
                Id = doc.Id,
                ArmoryItemId = doc.ArmoryItemId.GetValueOrDefault(),
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
        /// Route format: GET /api/ArmoryItemDocuments/GetDocumentTypes
        /// </summary>
        [HttpGet]
        public IActionResult GetDocumentTypes()
        {
            return Ok(GetEnumValues<ArmoryItemDocumentType>());
        }
    }
}
