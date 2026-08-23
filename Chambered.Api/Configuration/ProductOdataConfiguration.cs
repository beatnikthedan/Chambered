using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Dto.Versioning;
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

            builder.EntityType<PewPew>().DerivesFrom<Product>();
            builder.EntityType<Optic>().DerivesFrom<Product>();
            builder.EntityType<Suppressor>().DerivesFrom<Product>();
            builder.EntityType<PewPewLight>().DerivesFrom<Product>();
            builder.EntityType<Security>().DerivesFrom<Product>();

            var productColl = builder.EntityType<Product>().Collection;
            productColl.Function("GetActionTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetBatteryTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetLaserColors").ReturnsCollection<EnumDto>();
            productColl.Function("GetLightMountTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetOpticAdjustmentUnits").ReturnsCollection<EnumDto>();
            productColl.Function("GetOpticReticles").ReturnsCollection<EnumDto>();
            productColl.Function("GetOpticTypes").ReturnsCollection<EnumDto>();
            productColl.Function("GetPewPewCategories").ReturnsCollection<EnumDto>();
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
                        product.Property(p => p.ImageContentType).MaxLength = 100;

                        var optic = builder.EntityType<Optic>();
                        optic.Property(o => o.MinMagnification).Precision = 2;
                        optic.Property(o => o.MaxMagnification).Precision = 2;

                        var suppressor = builder.EntityType<Suppressor>();
                        suppressor.Property(s => s.ThreadPitch).MaxLength = 50;
                        break;
                    }
            }
        }
    }
}
