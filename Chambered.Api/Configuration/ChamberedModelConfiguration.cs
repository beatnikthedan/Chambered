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

        #region EDM Constraints (Matching EF Configurations)

        // 1. Product & Subclasses
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

        // 2. ArmoryItem & Subclasses
        var armoryItem = builder.EntityType<ArmoryItem>();
        armoryItem.Property(a => a.ItemType).MaxLength = 32;
        armoryItem.Property(a => a.Name).IsRequired();
        armoryItem.Property(a => a.Name).MaxLength = 100;
        armoryItem.Property(a => a.Description).MaxLength = 500;
        armoryItem.Property(a => a.ImageUrl).MaxLength = 2048;
        armoryItem.Property(a => a.NotesMarkdown).MaxLength = 2048;

        var pewArmory = builder.EntityType<PewArmoryItem>();
        pewArmory.Property(a => a.RoundCount).IsRequired();
        pewArmory.Property(a => a.TwistRate).MaxLength = 20;
        pewArmory.Property(a => a.ThreadPitch).MaxLength = 30;
        pewArmory.Property(a => a.SerialNumber).IsRequired();
        pewArmory.Property(a => a.SerialNumber).MaxLength = 512;
        pewArmory.Property(a => a.TaxStampDocumentUrl).MaxLength = 2048;

        var suppressorArmory = builder.EntityType<SuppressorArmoryItem>();
        suppressorArmory.Property(a => a.SerialNumber).IsRequired();
        suppressorArmory.Property(a => a.SerialNumber).MaxLength = 512;
        suppressorArmory.Property(a => a.TaxStampDocumentUrl).MaxLength = 2048;

        var opticArmory = builder.EntityType<OpticArmoryItem>();
        opticArmory.Property(a => a.SerialNumber).IsRequired();
        opticArmory.Property(a => a.SerialNumber).MaxLength = 512;

        // 3. Arsenal
        var arsenal = builder.EntityType<Arsenal>();
        arsenal.Property(a => a.Name).IsRequired();
        arsenal.Property(a => a.Name).MaxLength = 100;
        arsenal.Property(a => a.Description).MaxLength = 500;
        arsenal.Property(a => a.IconName).MaxLength = 50;
        arsenal.Property(a => a.ColorHex).MaxLength = 9;

        // 4. Caliber
        var caliber = builder.EntityType<Caliber>();
        caliber.Property(c => c.Name).IsRequired();
        caliber.Property(c => c.Name).MaxLength = 100;
        caliber.Property(c => c.AlternateNames).MaxLength = 250;

        // 5. Document
        var document = builder.EntityType<Document>();
        document.Property(d => d.Title).IsRequired();
        document.Property(d => d.Title).MaxLength = 150;
        //document.Property(d => d.Type).IsRequired();
        document.Property(d => d.FileData).IsRequired();
        document.Property(d => d.FileName).IsRequired();
        document.Property(d => d.FileName).MaxLength = 255;
        document.Property(d => d.ContentType).IsRequired();
        document.Property(d => d.ContentType).MaxLength = 100;
        document.Property(d => d.FileSizeBytes).IsRequired();

        // 6. Manufacturer
        var manufacturer = builder.EntityType<Manufacturer>();
        manufacturer.Property(m => m.Name).IsRequired();
        manufacturer.Property(m => m.Name).MaxLength = 100;
        manufacturer.Property(m => m.WebPageUrl).MaxLength = 2048;
        manufacturer.Property(m => m.PhoneNumber).MaxLength = 30;
        manufacturer.Property(m => m.StreetAddress).MaxLength = 200;
        manufacturer.Property(m => m.City).MaxLength = 100;
        manufacturer.Property(m => m.StateOrProvince).MaxLength = 100;
        manufacturer.Property(m => m.PostalCode).MaxLength = 20;
        manufacturer.Property(m => m.Country).MaxLength = 100;

        // 7. Vault
        var vault = builder.EntityType<Vault>();
        vault.Property(v => v.Name).IsRequired();
        vault.Property(v => v.Name).MaxLength = 100;
        vault.Property(v => v.Description).MaxLength = 500;
        vault.Property(v => v.EncryptedPasscode).MaxLength = 512;
        vault.Property(v => v.EncryptionIv).MaxLength = 128;
        vault.Property(v => v.PasscodeHint).MaxLength = 250;
        vault.Property(v => v.BackupKeyLocation).MaxLength = 250;

        #endregion
    }
}
