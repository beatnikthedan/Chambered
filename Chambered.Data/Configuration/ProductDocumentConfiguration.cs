using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Configures constraints, relationship mapping, and database keys for <see cref="ProductDocument"/>.
    /// </summary>
    public class ProductDocumentConfiguration : ExternalDocumentConfiguration<ProductDocument>
    {
        /// <inheritdoc/>
        public override void Configure(EntityTypeBuilder<ProductDocument> builder)
        {
            base.Configure(builder);

            builder.Property(d => d.Type)
                .IsRequired()
                .HasConversion<int>();

            builder.HasOne(d => d.Product)
                .WithMany(p => p.ProductDocuments)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
