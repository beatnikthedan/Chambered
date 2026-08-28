using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Configures constraints, relationship mapping, and database keys for <see cref="ArmoryItemDocument"/>.
    /// </summary>
    public class ArmoryItemDocumentConfiguration : ExternalDocumentConfiguration<ArmoryItemDocument>
    {
        /// <inheritdoc/>
        public override void Configure(EntityTypeBuilder<ArmoryItemDocument> builder)
        {
            base.Configure(builder);

            builder.Property(d => d.Type)
                .IsRequired()
                .HasConversion<int>();

            builder.HasOne(d => d.ArmoryItem)
                .WithMany(a => a.ArmoryItemDocuments)
                .HasForeignKey(d => d.ArmoryItemId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
