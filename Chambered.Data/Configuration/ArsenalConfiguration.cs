using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="Arsenal"/> entity.
    /// </summary>
    public class ArsenalConfiguration : IEntityTypeConfiguration<Arsenal>
    {
        public void Configure(EntityTypeBuilder<Arsenal> builder)
        {
            builder.ToTable("Arsenals");

            builder.HasKey(a => a.Id);

            builder.Property(v => v.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(v => v.Description)
                .HasMaxLength(500);

            builder.Property(a => a.IconName)
                .HasMaxLength(50);

            builder.Property(a => a.ColorHex)
                .HasMaxLength(9);

            builder.HasData(new Arsenal
            {
                Id = 1,
                Name = "Primary Arsenal",
                Description = "Default system owner arsenal",
                IconName = "Shield",
                ColorHex = "#2563EB"
            });
        }
    }
}
