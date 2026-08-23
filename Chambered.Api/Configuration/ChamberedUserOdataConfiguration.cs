using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Data;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData configuration for users. Registers ChamberedUser in the EDM to expose navigations in Swagger.
    /// </summary>
    public class ChamberedUserOdataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            builder.EntitySet<ChamberedUser>("ChamberedUsers");
        }
    }
}
