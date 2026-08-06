using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="VaultCategory"/> entity.
    /// </summary>
    public class VaultCategoryConfiguration : IEntityTypeConfiguration<VaultCategory>
    {
        public void Configure(EntityTypeBuilder<VaultCategory> builder)
        {
            builder.ToTable("VaultCategories");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(c => c.Description)
                .HasMaxLength(250);

            builder.HasData(
                new VaultCategory { Id = 1, Name = "Heavy Safe", Description = "Fire-rated standup safe or residential security container." },
                new VaultCategory { Id = 2, Name = "Lockbox", Description = "Portable or rapid-access key/biometric lockbox." },
                new VaultCategory { Id = 3, Name = "Vehicle Storage", Description = "Console vault, trunk lockbox, or dedicated vehicle mount." },
                new VaultCategory { Id = 4, Name = "Display / Cabinet", Description = "Glass display case, gun rack, or wooden cabinet." },
                new VaultCategory { Id = 5, Name = "Secure Room", Description = "Dedicated walk-in armory, reinforced closet, or vault room." },
                new VaultCategory { Id = 6, Name = "Soft Case / Range Bag", Description = "Temporary mobile transport storage." },
                new VaultCategory { Id = 7, Name = "Hard Travel Case", Description = "Flight-approved heavy-duty protective travel case." }
            );
        }
    }
}
