using Chambered.Data.Enums;
using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="Product"/> entity.
    /// </summary>
    public class ProductConfiguration : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder.ToTable("Products");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Model)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(p => p.PartNumber)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(p => p.Sku)
                .HasMaxLength(50);

            builder.Property(p => p.Category)
                .IsRequired()
                .HasConversion<int>();

            builder.Property(p => p.ActionType)
                .IsRequired()
                .HasConversion<int>();

            builder.Property(p => p.WebPageUrl)
                .HasMaxLength(2048);

            builder.Property(p => p.ImageContentType)
                .HasMaxLength(100);

            builder.Property(p => p.ReferenceNotes)
                .HasMaxLength(2000);

            builder.HasData(
                new Product
                {
                    Id = 1,
                    ManufacturerId = 2,
                    CaliberId = 11,
                    Model = "10/22 Carbine",
                    Sku = "1103",
                    Category = ProductCategory.Rimfire,
                    ActionType = ActionType.SemiAutomatic,
                    WebPageUrl = "https://ruger.com/products/1022Carbine/models.html",
                    ReferenceNotes = "Compatible with all standard BX series magazines."
                },
                new Product
                {
                    Id = 2,
                    ManufacturerId = 1,
                    CaliberId = 1,
                    Model = "19 Gen 5",
                    Sku = "PA1950203",
                    Category = ProductCategory.Handgun,
                    ActionType = ActionType.SemiAutomatic,
                    WebPageUrl = "https://us.glock.com/en/pistols/g19-gen5"
                }
            );
        }
    }
}
