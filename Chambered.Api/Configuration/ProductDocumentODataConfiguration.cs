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
            // Register standard EntitySet
            builder.EntitySet<ProductDocumentDto>("ProductDocuments");

            var productDocEntity = builder.EntityType<ProductDocumentDto>();

            // Bound Entity Function: GET /api/ProductDocuments(5)/Download
            productDocEntity.Function("Download").Returns<FileStreamResult>();

            // Bound Collection Function: GET /api/ProductDocuments/DownloadAll(parentId=5)
            var productDocColl = productDocEntity.Collection;
            productDocColl.Function("DownloadAll")
                .Returns<FileStreamResult>()
                .Parameter<int>("parentId");

            // Bound Collection Function: GET /api/ProductDocuments/GetDocumentTypes
            productDocColl.Function("GetDocumentTypes").ReturnsCollection<EnumDto>();
        }
    }
}
