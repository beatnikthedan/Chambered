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
            builder.EntitySet<ArmoryItemDocumentDto>("ArmoryItemDocuments");

            var armoryDocEntity = builder.EntityType<ArmoryItemDocumentDto>();

            armoryDocEntity.Function("Download").Returns<FileStreamResult>();

            var armoryDocColl = armoryDocEntity.Collection;
            armoryDocColl.Function("DownloadAll")
                .Returns<FileStreamResult>()
                .Parameter<int>("parentId");

            armoryDocColl.Function("GetDocumentTypes").ReturnsCollection<EnumDto>();
        }
    }
}
