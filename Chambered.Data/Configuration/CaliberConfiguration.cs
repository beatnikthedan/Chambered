using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="Caliber"/> entity.
    /// </summary>
    public class CaliberConfiguration : IEntityTypeConfiguration<Caliber>
    {
        public void Configure(EntityTypeBuilder<Caliber> builder)
        {
            builder.ToTable("Calibers");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(c => c.AlternateNames)
                .HasMaxLength(250);

            builder.HasData(
                new Caliber { Id = 1, Name = "9x19mm Parabellum", AlternateNames = "9mm Luger, 9x19, 9mm NATO" },
                new Caliber { Id = 2, Name = ".45 ACP", AlternateNames = ".45 Auto" },
                new Caliber { Id = 3, Name = ".40 S&W", AlternateNames = ".40 Auto" },
                new Caliber { Id = 4, Name = ".380 ACP", AlternateNames = "9mm Short, .380 Auto" },
                new Caliber { Id = 5, Name = ".357 Magnum", AlternateNames = ".357 Mag" },
                new Caliber { Id = 6, Name = ".38 Special", AlternateNames = ".38 Spl" },
                new Caliber { Id = 7, Name = "5.56x45mm NATO", AlternateNames = "5.56 NATO, .223 Remington" },
                new Caliber { Id = 8, Name = ".308 Winchester", AlternateNames = "7.62x51mm NATO, .308 Win" },
                new Caliber { Id = 9, Name = "7.62x39mm", AlternateNames = "7.62 Soviet, 7.62 Russian" },
                new Caliber { Id = 10, Name = "6.5 Creedmoor", AlternateNames = "6.5 CM" },
                new Caliber { Id = 11, Name = ".22 LR", AlternateNames = ".22 Long Rifle" },
                new Caliber { Id = 12, Name = "12 Gauge", AlternateNames = "12ga, 12 GA" },
                new Caliber { Id = 13, Name = "20 Gauge", AlternateNames = "20ga, 20 GA" }
            );
        }
    }
}
