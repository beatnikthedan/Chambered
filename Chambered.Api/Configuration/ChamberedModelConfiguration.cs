using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Models;
using Chambered.Data.Models;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration;

public class ChamberedModelConfiguration : IModelConfiguration
{
    public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
    {
        if (builder is ODataConventionModelBuilder conventionBuilder)
        {
            conventionBuilder.EnableLowerCamelCase();
        }

        builder.EntitySet<Product>("Products");
        builder.EntitySet<ArmoryItem>("Armory");
        builder.EntitySet<Vault>("Vaults");
        builder.EntitySet<Arsenal>("Arsenals");
        builder.EntitySet<Caliber>("Calibers");
        builder.EntitySet<Manufacturer>("Manufacturers");
        builder.EntitySet<Document>("Documents");

        // Product Subclasses
        builder.EntityType<PewPew>().DerivesFrom<Product>();
        builder.EntityType<Optic>().DerivesFrom<Product>();
        builder.EntityType<Suppressor>().DerivesFrom<Product>();
        builder.EntityType<PewPewLight>().DerivesFrom<Product>();
        builder.EntityType<Security>().DerivesFrom<Product>();

        // ArmoryItem Subclasses
        builder.EntityType<PewArmoryItem>().DerivesFrom<ArmoryItem>();
        builder.EntityType<SuppressorArmoryItem>().DerivesFrom<ArmoryItem>();
        builder.EntityType<OpticArmoryItem>().DerivesFrom<ArmoryItem>();
        builder.EntityType<LightArmoryItem>().DerivesFrom<ArmoryItem>();

        builder.ComplexType<EnumDto>();

        // Products Collection Bound Functions
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

        // Armory Collection Bound Functions
        var armoryColl = builder.EntityType<ArmoryItem>().Collection;
        armoryColl.Function("GetItemConditions").ReturnsCollection<EnumDto>();
        armoryColl.Function("GetNfaFormTypes").ReturnsCollection<EnumDto>();

        // Vaults Collection Bound Functions
        var vaultsColl = builder.EntityType<Vault>().Collection;
        vaultsColl.Function("GetLockTypes").ReturnsCollection<EnumDto>();
        vaultsColl.Function("GetVaultCategories").ReturnsCollection<EnumDto>();

        // Documents Collection Bound Functions
        var documentsColl = builder.EntityType<Document>().Collection;
        documentsColl.Function("GetDocumentTypes").ReturnsCollection<EnumDto>();
    }
}
