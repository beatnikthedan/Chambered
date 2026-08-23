using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Data.Models;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData configuration for isolated collections.
    /// </summary>
    public class ArsenalOdataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            builder.EntitySet<Arsenal>("Arsenals");

            switch (apiVersion.MajorVersion)
            {
                case 1:
                    {
                        var arsenal = builder.EntityType<Arsenal>();
                        arsenal.Property(a => a.Name).IsRequired();
                        arsenal.Property(a => a.Name).MaxLength = 100;
                        arsenal.Property(a => a.Description).MaxLength = 500;
                        arsenal.Property(a => a.IconName).MaxLength = 50;
                        arsenal.Property(a => a.ColorHex).MaxLength = 9;
                        break;
                    }
            }
        }
    }
}
