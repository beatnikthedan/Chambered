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
            builder.EntitySet<Document>("Documents");

            var documentsColl = builder.EntityType<Document>().Collection;
            documentsColl.Function("GetDocumentTypes").ReturnsCollection<EnumDto>();

            switch (apiVersion.MajorVersion)
            {
                case 1:
                    {
                        var caliber = builder.EntityType<Caliber>();
                        caliber.Property(c => c.Name).IsRequired();
                        caliber.Property(c => c.Name).MaxLength = 100;
                        caliber.Property(c => c.AlternateNames).MaxLength = 250;

                        var document = builder.EntityType<Document>();
                        document.Property(d => d.Title).IsRequired();
                        document.Property(d => d.Title).MaxLength = 150;
                        document.Property(d => d.FileData).IsRequired();
                        document.Property(d => d.FileName).IsRequired();
                        document.Property(d => d.FileName).MaxLength = 255;
                        document.Property(d => d.ContentType).IsRequired();
                        document.Property(d => d.ContentType).MaxLength = 100;
                        document.Property(d => d.FileSizeBytes).IsRequired();

                        break;
                    }
            }
        }
    }
}
