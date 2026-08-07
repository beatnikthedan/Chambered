using Chambered.Data.Models;
using Chambered.Data.Utility;
using Chambered.Data.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="Vault"/> entity.
    /// </summary>
    public class VaultConfiguration : IEntityTypeConfiguration<Vault>
    {
        public void Configure(EntityTypeBuilder<Vault> builder)
        {
            builder.ToTable("Vaults");

            builder.HasKey(v => v.Id);

            builder.Property(v => v.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(v => v.Description)
                .HasMaxLength(500);

            builder.Property(v => v.LockType)
                .IsRequired();

            builder.Property(v => v.EncryptedPasscode)
                .HasConversion<SymmetricEncryptionConverter>()
                .HasMaxLength(512);

            builder.Property(v => v.EncryptionIv)
                .HasMaxLength(128);

            builder.Property(v => v.PasscodeHint)
                .HasMaxLength(250);

            builder.Property(v => v.BackupKeyLocation)
                .HasMaxLength(250);

            builder.Property(v => v.HasDehumidifier)
                .IsRequired()
                .HasDefaultValue(false);

            builder.HasOne(v => v.ParentVault)
                .WithMany(v => v.ChildVaults)
                .HasForeignKey(v => v.ParentVaultId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasData(new Vault
            {
                Id = 1,
                Name = "Main Vault",
                Description = "Secure storage vault",
                ArsenalId = 1,
                VaultCategoryId = 1,
                LockType = LockType.ElectronicKeypad,
                HasDehumidifier = false
            });
        }
    }
}
