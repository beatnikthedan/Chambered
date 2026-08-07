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

            builder.Property(a => a.BarrelLengthInches)
                .HasPrecision(5, 2);

            builder.Property(a => a.TwistRate)
                .HasMaxLength(20);

            builder.Property(a => a.ThreadPitch)
                .HasMaxLength(30);

            builder.Property(a => a.IsNfaItem)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(a => a.NfaFormType)
                .HasMaxLength(20);

            builder.Property(a => a.TaxStampDocumentUrl)
                .HasMaxLength(2048);

            builder.Property(a => a.PurchasePrice)
                .HasPrecision(18, 2);

            builder.Property(a => a.EstimatedValue)
                .HasPrecision(18, 2);

            builder.Property(a => a.Condition)
                .HasMaxLength(50);

            builder.Property(a => a.RoundCount)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(a => a.Beneficiary)
                .HasMaxLength(150);

            builder.Property(a => a.ImageUrl)
                .HasMaxLength(2048);
        }
    }
}
