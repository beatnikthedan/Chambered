using Chambered.Data.Models;
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
            #region Table & Primary Key Setup

            builder.ToTable("Products");
            builder.HasKey(p => p.Id);

            #endregion

            #region Base Product Property Configurations

            builder.Property(p => p.Model).IsRequired().HasMaxLength(100);
            builder.Property(p => p.PartNumber).IsRequired().HasMaxLength(100);
            builder.Property(p => p.Sku).HasMaxLength(50);
            builder.Property(p => p.WebPageUrl).HasMaxLength(2048);
            builder.Property(p => p.ImageContentType).HasMaxLength(100);
            builder.Property(p => p.ReferenceNotes).HasMaxLength(2000);

            #endregion

            #region Dynamic Specifications (JSON Mapping)

            builder.Property(p => p.Specifications)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions)null) ?? new Dictionary<string, string>()
                );

            #endregion

            #region Reflection Discriminator Setup

            var discriminatorBuilder = builder.HasDiscriminator<string>("ProductType");

            var productSubtypes = Assembly.GetAssembly(typeof(Product))!
                .GetTypes()
                .Where(t => t.IsClass
                         && !t.IsAbstract
                         && t.IsSubclassOf(typeof(Product)));

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
            builder.Property(x => x.MinMagnification)
                .HasPrecision(5, 2);

            builder.Property(x => x.MaxMagnification)
                .HasPrecision(5, 2);



            builder.Property(x => x.TubeDiameter)
                .HasMaxLength(20);

            builder.Property(x => x.Footprint)
                .HasMaxLength(50);

            builder.Ignore(x => x.IsVariablePower);
            builder.Ignore(x => x.MagnificationDisplay);
        }
    }

    public class SuppressorConfiguration : IEntityTypeConfiguration<Suppressor>
    {
        public void Configure(EntityTypeBuilder<Suppressor> builder)
        {
            #region Property Constraints

            builder.HasOne(s => s.MaxCaliber)
                .WithMany()
                .HasForeignKey(s => s.MaxCaliberId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(s => s.ThreadPitch)
                .HasMaxLength(50);

            builder.Property(s => s.SoundReductionDb)
                .HasPrecision(5, 2);

            #endregion
        }
    }
}
