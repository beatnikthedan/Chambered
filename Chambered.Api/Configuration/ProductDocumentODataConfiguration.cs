using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Dto;
using Chambered.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData configuration for Product Documents EntitySet and bound functions.
    /// </summary>
    public class ProductDocumentODataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            builder.EntitySet<ProductDocumentDto>("ProductDocuments");

            var productDocEntity = builder.EntityType<ProductDocumentDto>();

            productDocEntity.Function("Download").Returns<FileStreamResult>();

            var productDocColl = productDocEntity.Collection;
            productDocColl.Function("DownloadAll")
                .Returns<FileStreamResult>()
                .Parameter<int>("parentId");

            productDocColl.Function("GetDocumentTypes").ReturnsCollection<EnumDto>();
        }
    }
}
