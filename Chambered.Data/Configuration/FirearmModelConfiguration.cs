using Chambered.Data.Enums;
using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="FirearmModel"/> entity.
    /// </summary>
    public class FirearmModelConfiguration : IEntityTypeConfiguration<FirearmModel>
    {
        public void Configure(EntityTypeBuilder<FirearmModel> builder)
        {
            builder.ToTable("FirearmModels");

            builder.HasKey(fm => fm.Id);

            builder.Property(fm => fm.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(fm => fm.Sku)
                .HasMaxLength(50);

            builder.Property(fm => fm.Category)
                .IsRequired()
                .HasConversion<int>();

            builder.Property(fm => fm.WebPageUrl)
                .HasMaxLength(2048);

            builder.Property(fm => fm.ImageContentType)
                .HasMaxLength(100);

            builder.Property(fm => fm.ReferenceNotes)
                .HasMaxLength(2000);

            builder.HasOne(fm => fm.Caliber)
                .WithMany(c => c.Models)
                .HasForeignKey(fm => fm.CaliberId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasData(
                new FirearmModel
                {
                    Id = 1,
                    ManufacturerId = 2,
                    CaliberId = 11,
                    Name = "10/22 Carbine",
                    Sku = "1103",
                    Category = FirearmCategory.Rimfire,
                    WebPageUrl = "https://ruger.com/products/1022Carbine/models.html",
                    ReferenceNotes = "Compatible with all standard BX series magazines."
                },
                new FirearmModel
                {
                    Id = 2,
                    ManufacturerId = 1,
                    CaliberId = 1,
                    Name = "19 Gen 5",
                    Sku = "PA1950203",
                    Category = FirearmCategory.Handgun,
                    WebPageUrl = "https://us.glock.com/en/pistols/g19-gen5"
                }
            );
        }
    }
}
