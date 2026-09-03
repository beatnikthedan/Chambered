using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Dto;
using Chambered.Api.Models;
using Chambered.Data.Models;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData configuration for products and their derived subclasses.
    /// </summary>
    public class ProductOdataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            builder.EntitySet<Product>("Products");

            var productColl = builder.EntityType<Product>().Collection;
            productColl.Function("GetProductTypes").ReturnsCollection<string>();
            productColl.Function("GetActionTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetBatteryTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetCaseMaterials").ReturnsCollection<EnumDto>();
            productColl.Function("GetLaserColors").ReturnsCollection<EnumDto>();
            productColl.Function("GetLightMountTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetLockTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetOpticAdjustmentUnits").ReturnsCollection<EnumDto>();
            productColl.Function("GetOpticReticles").ReturnsCollection<EnumDto>();
            productColl.Function("GetOpticTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetPewPewCategories").ReturnsCollection<EnumDto>();
            productColl.Function("GetPowderBurnRates").ReturnsCollection<EnumDto>();
            productColl.Function("GetPowderShapes").ReturnsCollection<EnumDto>();
            productColl.Function("GetPowderTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetPrimerSizes").ReturnsCollection<EnumDto>();
            productColl.Function("GetPrimerTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetProductDocumentTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetProjectileMaterials").ReturnsCollection<EnumDto>();
            productColl.Function("GetProjectileProfiles").ReturnsCollection<EnumDto>();
            productColl.Function("GetSuppressorAttachmentTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetSuppressorMaterials").ReturnsCollection<EnumDto>();         

            switch (apiVersion.MajorVersion)
            {
                case 1:
                    {
                        var product = builder.EntityType<Product>();
                        product.Property(p => p.ProductType).MaxLength = 32;
                        product.Property(p => p.Name).IsRequired();
                        product.Property(p => p.Name).MaxLength = 100;
                        product.Property(p => p.Description).MaxLength = 500;
                        product.Property(p => p.PartNumber).IsRequired();
                        product.Property(p => p.PartNumber).MaxLength = 100;
                        product.Property(p => p.Sku).MaxLength = 50;
                        product.Property(p => p.WebPageUrl).MaxLength = 2048;
                        product.Property(p => p.CoverImageId);
                        product.Ignore(p => p.CoverImage);
                        break;
                    }
            }
        }
    }
}
