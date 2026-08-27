using Chambered.Core.Services;
using Chambered.Data;
using Chambered.Data.Enums;
using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Chambered.Infrastructure.Services
{
    /// <summary>
    /// Product concrete business service implementing generic document orchestration.
    /// </summary>
    public class ProductDocumentService : DocumentServiceBase<ProductDocument, Product, ProductDocumentType>
    {
        public ProductDocumentService(
            ChamberedDbContext db,
            IFileStorageRepository repository,
            ILogger<ProductDocumentService> logger)
            : base(db, repository, logger)
        {
        }

        protected override string ParentFolderName => "products";

        protected override async Task VerifyParentExistsAsync(int parentId, CancellationToken cancellationToken)
        {
            var exists = await Db.Products.AnyAsync(p => p.Id == parentId, cancellationToken);
            if (!exists)
            {
                throw new KeyNotFoundException($"Product with ID {parentId} was not found.");
            }
        }

        protected override void SetParentRelation(ProductDocument document, int parentId)
        {
            document.ProductId = parentId;
        }

        protected override void SetDocumentType(ProductDocument document, ProductDocumentType type)
        {
            document.Type = type;
        }

        protected override async Task<IEnumerable<ProductDocument>> QueryDocumentsByParentIdAsync(int parentId, CancellationToken cancellationToken)
        {
            return await Db.ProductDocuments
                .Where(d => d.ProductId == parentId)
                .ToListAsync(cancellationToken);
        }
    }
}
