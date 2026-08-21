using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="ApiKey"/> entity.
    /// </summary>
    public class ApiKeyConfiguration : IEntityTypeConfiguration<ApiKey>
    {
        public void Configure(EntityTypeBuilder<ApiKey> builder)
        {
            builder.ToTable("ApiKeys");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.Name)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(a => a.KeyHash)
                .IsRequired()
                .HasMaxLength(250);

            builder.Property(a => a.OwnerId)
                .IsRequired()
                .HasMaxLength(450); // Matches default ASP.NET Identity User ID length

            builder.HasMany(a => a.Claims)
                .WithOne()
                .HasForeignKey(c => c.ApiKeyId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
