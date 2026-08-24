using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Models;
using Chambered.Data.Models;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData configuration for physical armory items and subclasses.
    /// </summary>
    public class ArmoryOdataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            builder.EntitySet<ArmoryItem>("ArmoryItems");

            builder.EntityType<PewArmoryItem>().DerivesFrom<ArmoryItem>();
            builder.EntityType<SuppressorArmoryItem>().DerivesFrom<ArmoryItem>();
            builder.EntityType<OpticArmoryItem>().DerivesFrom<ArmoryItem>();
            builder.EntityType<LightArmoryItem>().DerivesFrom<ArmoryItem>();

            var armoryColl = builder.EntityType<ArmoryItem>().Collection;
            armoryColl.Function("GetItemConditions").ReturnsCollection<EnumDto>();
            armoryColl.Function("GetNfaFormTypes").ReturnsCollection<EnumDto>();

            switch (apiVersion.MajorVersion)
            {
                case 1:
                    {
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
                        break;
                    }
            }
        }
    }
}
