using Chambered.Data.Models;
using Chambered.Data.Utility;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Reflection;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core configuration for the Product TPH base class and derived entities.
    /// </summary>
    public class ProductConfiguration : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder.ToTable("Products");

            builder.HasKey(c => c.Id);

            builder.Property(v => v.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(v => v.Description)
                .HasMaxLength(500);

            builder.Property(p => p.PartNumber).IsRequired().HasMaxLength(100);
            builder.Property(p => p.Sku).HasMaxLength(50);
            builder.Property(p => p.WebPageUrl).HasMaxLength(2048);

            #region Cover Image Relationship

            builder.HasOne(p => p.CoverImage)
                .WithMany()
                .HasForeignKey(p => p.CoverImageId)
                .OnDelete(DeleteBehavior.SetNull);

            #endregion

            #region Dynamic Specifications (JSON Mapping)

            builder.Property(e => e.Specifications)
                .HasMaxLength(1024)
                .HasConversion<DictionaryToJsonValueConverter<string, object>>(new DictionaryValueComparer<string, object>());

            #endregion

            #region Reflection Discriminator Setup

            builder.Property(p => p.ProductType)
                .HasMaxLength(32);

            var discriminatorBuilder = builder.HasDiscriminator(d => d.ProductType);

            var productSubtypes = Assembly.GetAssembly(typeof(Product))!
                .GetTypes()
                .Where(t => t.IsClass
                         && !t.IsAbstract
                         && t.IsSubclassOf(typeof(Product)));

            discriminatorBuilder.HasValue<Product>(nameof(Product));

            foreach (var subtype in productSubtypes)
            {
                discriminatorBuilder.HasValue(subtype, subtype.Name);
            }

            #endregion
        }
    }

    public class OpticConfiguration : IEntityTypeConfiguration<Optic>
    {
        public void Configure(EntityTypeBuilder<Optic> builder)
        {
            builder.Property(x => x.MinMagnification).HasPrecision(5, 2);
            builder.Property(x => x.MaxMagnification).HasPrecision(5, 2);
            builder.Ignore(x => x.IsVariablePower);
            builder.Ignore(x => x.MagnificationDisplay);
        }
    }

    public class SuppressorConfiguration : IEntityTypeConfiguration<Suppressor>
    {
        public void Configure(EntityTypeBuilder<Suppressor> builder)
        {
            builder.Property(s => s.ThreadPitch).HasMaxLength(50);
        }
    }
}
