using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Configures base database constraints and column options for <see cref="ExternalDocument"/> and derived entities.
    /// </summary>
    /// <typeparam name="TEntity">The concrete document entity type.</typeparam>
    public abstract class ExternalDocumentConfiguration<TEntity> : IEntityTypeConfiguration<TEntity>
        where TEntity : ExternalDocument
    {
        /// <inheritdoc/>
        public virtual void Configure(EntityTypeBuilder<TEntity> builder)
        {
            builder.HasKey(d => d.Id);

            builder.Property(d => d.FileName)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(d => d.ContentType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(d => d.StorageKey)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(d => d.FileSizeBytes)
                .IsRequired();

            builder.Property(d => d.UploadedAt)
                .IsRequired();

            builder.Property(d => d.IsEncrypted)
                .IsRequired();
        }
    }
}
