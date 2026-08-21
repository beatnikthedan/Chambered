using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="ApiKeyClaim"/> entity.
    /// </summary>
    public class ApiKeyClaimConfiguration : IEntityTypeConfiguration<ApiKeyClaim>
    {
        public void Configure(EntityTypeBuilder<ApiKeyClaim> builder)
        {
            builder.ToTable("ApiKeyClaims");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Type)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(c => c.Value)
                .IsRequired()
                .HasMaxLength(150);
        }
    }
}
