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

using Chambered.Infrastructure.Configuration;

namespace Chambered.Infrastructure.Services
{
    /// <summary>
    /// Armory Item concrete business service implementing generic document orchestration.
    /// </summary>
    public class ArmoryItemDocumentService : DocumentServiceBase<ArmoryItemDocument, PewArmoryItem, ArmoryItemDocumentType>
    {
        public ArmoryItemDocumentService(
            ChamberedDbContext db,
            IFileStorageRepository repository,
            FileStorageConfiguration config,
            ILogger<ArmoryItemDocumentService> logger)
            : base(db, repository, config, logger)
        {
        }

        protected override string ParentFolderName => "armory";

        protected override async Task VerifyParentExistsAsync(int parentId, CancellationToken cancellationToken)
        {
            var exists = await Db.ArmoryItems.AnyAsync(a => a.Id == parentId, cancellationToken);
            if (!exists)
            {
                throw new KeyNotFoundException($"Armory Item with ID {parentId} was not found.");
            }
        }

        protected override void SetParentRelation(ArmoryItemDocument document, int parentId)
        {
            document.ArmoryItemId = parentId;
        }

        protected override void SetDocumentType(ArmoryItemDocument document, ArmoryItemDocumentType type)
        {
            document.Type = type;
        }

        protected override async Task<IEnumerable<ArmoryItemDocument>> QueryDocumentsByParentIdAsync(int parentId, CancellationToken cancellationToken)
        {
            return await Db.ArmoryItemDocuments
                .Where(d => d.ArmoryItemId == parentId)
                .ToListAsync(cancellationToken);
        }
    }
}
