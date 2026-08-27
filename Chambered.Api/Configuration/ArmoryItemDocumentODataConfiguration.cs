using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Dto;
using Chambered.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData configuration for Armory Item Documents EntitySet and bound functions.
    /// </summary>
    public class ArmoryItemDocumentODataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            // Register standard EntitySet
            builder.EntitySet<ArmoryItemDocumentDto>("ArmoryItemDocuments");

            var armoryDocEntity = builder.EntityType<ArmoryItemDocumentDto>();

            // Bound Entity Function: GET /api/ArmoryItemDocuments(5)/Download
            armoryDocEntity.Function("Download").Returns<FileStreamResult>();

            // Bound Collection Function: GET /api/ArmoryItemDocuments/DownloadAll(parentId=5)
            var armoryDocColl = armoryDocEntity.Collection;
            armoryDocColl.Function("DownloadAll")
                .Returns<FileStreamResult>()
                .Parameter<int>("parentId");

            // Bound Collection Function: GET /api/ArmoryItemDocuments/GetDocumentTypes
            armoryDocColl.Function("GetDocumentTypes").ReturnsCollection<EnumDto>();
        }
    }
}
