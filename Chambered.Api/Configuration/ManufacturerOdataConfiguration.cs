using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Dto;
using Chambered.Data.Models;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData model configuration for the Manufacturer entity and custom functions.
    /// </summary>
    public class ManufacturerOdataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            builder.EntitySet<Manufacturer>("Manufacturers");
            builder.ComplexType<FaveIconDto>();

            var manufacturer = builder.EntityType<Manufacturer>();

            var getFaviconFunc = manufacturer.Function("GetFavicon");
            getFaviconFunc.Returns<FaveIconDto>();
            
            switch (apiVersion.MajorVersion)
            {
                case 1:
                    {
                        manufacturer.Property(m => m.Name).IsRequired();
                        manufacturer.Property(m => m.Name).MaxLength = 100;
                        manufacturer.Property(m => m.WebPageUrl).MaxLength = 2048;
                        manufacturer.Property(m => m.PhoneNumber).MaxLength = 30;
                        manufacturer.Property(m => m.StreetAddress).MaxLength = 200;
                        manufacturer.Property(m => m.City).MaxLength = 100;
                        manufacturer.Property(m => m.StateOrProvince).MaxLength = 100;
                        manufacturer.Property(m => m.PostalCode).MaxLength = 20;
                        manufacturer.Property(m => m.Country).MaxLength = 100;
                        break;
                    }
            }
        }
    }
}
