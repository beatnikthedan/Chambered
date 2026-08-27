using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    public abstract class ArmoryItemDocumentConfiguration : IEntityTypeConfiguration<ArmoryItemDocument>
    {
        public void Configure(EntityTypeBuilder<ArmoryItemDocument> builder)
        {
            builder.HasKey(d => d.Id);;

            builder.Property(d => d.Type)
                .IsRequired()
                .HasConversion<int>();

            builder.Property(d => d.FileName)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(d => d.ContentType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(d => d.FileSizeBytes)
                .IsRequired();
        }
    }
}
