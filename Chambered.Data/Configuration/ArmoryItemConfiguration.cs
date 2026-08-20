using Chambered.Data.Models;
using Chambered.Data.Utility;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Reflection;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="ArmoryItem"/> entity.
    /// </summary>
    public class ArmoryItemConfiguration : IEntityTypeConfiguration<ArmoryItem>
    {
        public void Configure(EntityTypeBuilder<ArmoryItem> builder)
        {
            builder.ToTable("ArmoryItems");

            builder.HasKey(c => c.Id);

            builder.Property(v => v.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(v => v.Description)
                .HasMaxLength(500);

            builder.Property(a => a.PurchasePrice)
               .HasPrecision(18, 2);

            builder.Property(a => a.EstimatedValue)
                .HasPrecision(18, 2);

            builder.Property(a => a.ImageUrl)
                .HasMaxLength(2048);

            builder.Property(a => a.NotesMarkdown)
                .HasMaxLength(2048);

            #region Dynamic Specifications (JSON Mapping)

            builder.Property(e => e.Specifications)
                .HasMaxLength(1024)
                .HasConversion<DictionaryToJsonValueConverter<string, object>>(new DictionaryValueComparer<string, object>());

            #endregion

            #region Reflection Discriminator Setup
            builder.Property(p => p.ItemType)
                .HasMaxLength(32);

            var discriminatorBuilder = builder.HasDiscriminator(d => d.ItemType);

            var productSubtypes = Assembly.GetAssembly(typeof(ArmoryItem))!
                .GetTypes()
                .Where(t => t.IsClass
                         && !t.IsAbstract
                         && t.IsSubclassOf(typeof(ArmoryItem)));

            discriminatorBuilder.HasValue<ArmoryItem>(nameof(ArmoryItem));

            foreach (var subtype in productSubtypes)
            {
                discriminatorBuilder.HasValue(subtype, subtype.Name);
            }

            #endregion

            builder.HasOne(a => a.Owner)
                .WithMany(u => u.OwnedItems)
                .HasForeignKey(a => a.OwnerId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(a => a.Beneficiary)
                .WithMany(u => u.BenificiaryItems)
                .HasForeignKey(a => a.BeneficiaryId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(a => a.ParentItem)
                .WithMany(a => a.MountedAccessories)
                .HasForeignKey(a => a.ParentItemId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class PewArmoryItemConfiguration : IEntityTypeConfiguration<PewArmoryItem>
    {
        public void Configure(EntityTypeBuilder<PewArmoryItem> builder)
        {
            builder.Property(a => a.RoundCount)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(a => a.BarrelLengthInches)
                .HasPrecision(5, 2);

            builder.Property(a => a.TwistRate)
                .HasMaxLength(20);

            builder.Property(a => a.ThreadPitch)
                .HasMaxLength(30);

            builder.Property(a => a.SerialNumber)
                .IsRequired()
                .HasConversion<SymmetricEncryptionConverter>()
                .HasMaxLength(512);

            builder.Property(a => a.TaxStampDocumentUrl)
                .HasMaxLength(2048);
        }
    }

    public class SuppressorArmoryItemConfiguration : IEntityTypeConfiguration<SuppressorArmoryItem>
    {
        public void Configure(EntityTypeBuilder<SuppressorArmoryItem> builder)
        {
            builder.Property(a => a.SerialNumber)
                .IsRequired()
                .HasConversion<SymmetricEncryptionConverter>()
                .HasMaxLength(512);

            builder.Property(a => a.TaxStampDocumentUrl)
                .HasMaxLength(2048);
        }
    }

    public class SuppressOpticArmoryItemConfiguration : IEntityTypeConfiguration<OpticArmoryItem>
    {
        public void Configure(EntityTypeBuilder<OpticArmoryItem> builder)
        {
            builder.Property(a => a.SerialNumber)
                .IsRequired()
                .HasConversion<SymmetricEncryptionConverter>()
                .HasMaxLength(512);
        }
    }
}
