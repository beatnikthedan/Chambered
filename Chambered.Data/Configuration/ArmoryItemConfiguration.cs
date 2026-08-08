using Chambered.Data.Models;
using Chambered.Data.Utility;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

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

            builder.HasKey(a => a.Id);

            builder.Property(a => a.SerialNumber)
                .IsRequired()
                .HasConversion<SymmetricEncryptionConverter>()
                .HasMaxLength(512);

            #region TPH Discriminator Setup

            var discriminatorBuilder = builder.HasDiscriminator<string>("ItemType");

            var armorySubtypes = System.Reflection.Assembly.GetAssembly(typeof(ArmoryItem))!
                .GetTypes()
                .Where(t => t.IsClass
                         && !t.IsAbstract
                         && t.IsSubclassOf(typeof(ArmoryItem)));

            foreach (var subtype in armorySubtypes)
            {
                discriminatorBuilder.HasValue(subtype, subtype.Name);
            }

            #endregion

            builder.Property(a => a.PurchasePrice)
                .HasPrecision(18, 2);

            builder.Property(a => a.EstimatedValue)
                .HasPrecision(18, 2);

            builder.Property(a => a.Condition)
                .IsRequired(false);

            builder.Property(a => a.RoundCount)
                .IsRequired()
                .HasDefaultValue(0);

            builder.HasOne(a => a.Owner)
                .WithMany(u => u.OwnedItems)
                .HasForeignKey(a => a.OwnerId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(a => a.Beneficiary)
                .WithMany(u => u.BenificiaryItems)
                .HasForeignKey(a => a.BeneficiaryId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Property(a => a.ImageUrl)
                .HasMaxLength(2048);

            builder.HasOne(a => a.ParentItem)
                .WithMany(a => a.MountedAccessories)
                .HasForeignKey(a => a.ParentItemId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class NfaArmoryItemConfiguration : IEntityTypeConfiguration<NfaArmoryItem>
    {
        public void Configure(EntityTypeBuilder<NfaArmoryItem> builder)
        {
            builder.Property(a => a.IsNfaItem)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(a => a.NfaFormType)
                .IsRequired(false);

            builder.Property(a => a.TaxStampDocumentUrl)
                .HasMaxLength(2048);
        }
    }

    public class PewArmoryItemConfiguration : IEntityTypeConfiguration<PewArmoryItem>
    {
        public void Configure(EntityTypeBuilder<PewArmoryItem> builder)
        {
            builder.Property(a => a.BarrelLengthInches)
                .HasPrecision(5, 2);

            builder.Property(a => a.TwistRate)
                .HasMaxLength(20);

            builder.Property(a => a.ThreadPitch)
                .HasMaxLength(30);
        }
    }
}
