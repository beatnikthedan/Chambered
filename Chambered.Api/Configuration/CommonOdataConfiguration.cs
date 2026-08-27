using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Dto.Versioning;
using Chambered.Api.Models;
using Chambered.Data.Models;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// Configures global complex types, caliber settings, manufacturers, and documents.
    /// </summary>
    public class CommonOdataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            if (builder is ODataConventionModelBuilder conventionBuilder)
            {
                conventionBuilder.EnableLowerCamelCase();
            }

            builder.ComplexType<EnumDto>();
            builder.ComplexType<GitHubReleaseDto>();

            builder.EntitySet<Caliber>("Calibers");

            switch (apiVersion.MajorVersion)
            {
                case 1:
                    {
                        var caliber = builder.EntityType<Caliber>();
                        caliber.Property(c => c.Name).IsRequired();
                        caliber.Property(c => c.Name).MaxLength = 100;
                        caliber.Property(c => c.AlternateNames).MaxLength = 250;

                        break;
                    }
            }
        }
    }
}
