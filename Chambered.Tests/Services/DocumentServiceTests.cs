using Chambered.Core.Services;
using Chambered.Core.Services.Models;
using Chambered.Data;
using Chambered.Data.Enums;
using Chambered.Data.Models;
using Chambered.Infrastructure.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Chambered.Tests.Services
{
    /// <summary>
    /// Business service orchestrator unit tests validating parent entity existences, database saving, and compensation rollback policies on exceptions.
    /// </summary>
    public class DocumentServiceTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ChamberedDbContext _db;
        private readonly Mock<IFileStorageRepository> _repoMock;
        private readonly Mock<ILogger<ProductDocumentService>> _loggerMock;

        public DocumentServiceTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ChamberedDbContext>()
                .UseSqlite(_connection)
                .Options;

            _db = new ChamberedDbContext(options);
            _db.Database.EnsureCreated();

            _repoMock = new Mock<IFileStorageRepository>();
            _loggerMock = new Mock<ILogger<ProductDocumentService>>();
        }

        [Fact]
        public async Task Upload_WithNonExistentParentId_ShouldThrowKeyNotFoundException()
        {
            // Arrange
            var service = new ProductDocumentService(_db, _repoMock.Object, _loggerMock.Object);
            using var fileStream = new MemoryStream(new byte[100]);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                service.UploadDocumentAsync(
                    parentId: 999, // Non-existent parent ID
                    fileStream: fileStream,
                    fileName: "receipt.pdf",
                    contentType: "application/pdf",
                    type: ProductDocumentType.SpecSheet,
                    cancellationToken: CancellationToken.None));
        }

        [Fact]
        public async Task Upload_WhenDatabaseCommitFails_ShouldTriggerCompensationRollbackAndPurgePhysicalFile()
        {
            // Arrange
            // 1. Seed a valid manufacturer and product
            var manufacturer = new Manufacturer { Name = "Seeded Manufacturer" };
            _db.Manufacturers.Add(manufacturer);
            await _db.SaveChangesAsync();

            var product = new Product
            {
                Sku = "TEST-BLUEPRINT-1",
                Name = "Test Blueprint Product",
                Description = "A product used for transactional service assertions.",
                ManufacturerId = manufacturer.Id,
                ProductType = "Product"
            };
            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            // Mock the repository to return dummy metadata
            _repoMock.Setup(r => r.SaveStreamAsync(
                It.IsAny<string>(),
                It.IsAny<Stream>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new FileMetadata("products/1/test.pdf", "application/pdf", 100, "abc123hash"));

            // 2. We want SaveChangesAsync to fail. To do this with SQLite in-memory without corrupting the DbContext,
            // we can detach the product or cause a foreign key constraint, or trigger a custom exception by utilizing a derived service
            // that crashes inside SaveChanges, or simply use Moq to spy on the rollback call.
            // Let's make an explicitly failing subclass of ChamberedDbContext or simply cause a database constraint error!
            // Wait, an easy database constraint error is setting a non-existent foreign key, but we already validated product existence.
            // Wait, we can write a tiny wrapper DbContext that overrides SaveChangesAsync and throws a custom exception!
            var options = new DbContextOptionsBuilder<ChamberedDbContext>()
                .UseSqlite(_connection)
                .Options;

            using (var failingDb = new FailingChamberedDbContext(options))
            {
                // Re-seed product
                var p = new Product
                {
                    Sku = "CRASH-SKU-1",
                    Name = "Crash Product",
                    ManufacturerId = manufacturer.Id,
                    ProductType = "Product"
                };
                failingDb.Products.Add(p);
                await failingDb.SaveChangesAsync();

                var service = new ProductDocumentService(failingDb, _repoMock.Object, _loggerMock.Object);
                using var fileStream = new MemoryStream(new byte[100]);

                // Act & Assert
                // Attempting to upload should throw the DbUpdateException triggered by our failing DbContext
                await Assert.ThrowsAsync<DbUpdateException>(() =>
                    service.UploadDocumentAsync(
                        parentId: p.Id,
                        fileStream: fileStream,
                        fileName: "receipt.pdf",
                        contentType: "application/pdf",
                        type: ProductDocumentType.SpecSheet,
                        cancellationToken: CancellationToken.None));

                // Verify that compensation rollback was indeed executed on the repository:
                // IFileStorageRepository.DeleteStreamAsync must have been called exactly once with any storage key
                _repoMock.Verify(r => r.DeleteStreamAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
            }
        }

        [Fact]
        public async Task Upload_And_Download_And_Delete_UnderNormalFlow_ShouldOrchestrateBothDBAndStorage()
        {
            // Arrange
            var manufacturer = new Manufacturer { Name = "Success Manufacturer" };
            _db.Manufacturers.Add(manufacturer);
            await _db.SaveChangesAsync();

            var product = new Product
            {
                Sku = "SUCCESS-SKU",
                Name = "Success Product",
                ManufacturerId = manufacturer.Id,
                ProductType = "Product"
            };
            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            var storageKey = $"products/{product.Id}/blueprint.pdf";

            _repoMock.Setup(r => r.SaveStreamAsync(
                It.IsAny<string>(),
                It.IsAny<Stream>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new FileMetadata(storageKey, "application/pdf", 100, "hash123"));

            var service = new ProductDocumentService(_db, _repoMock.Object, _loggerMock.Object);
            using var fileStream = new MemoryStream(new byte[100]);

            // Act - Upload
            var result = await service.UploadDocumentAsync(
                parentId: product.Id,
                fileStream: fileStream,
                fileName: "blueprint.pdf",
                contentType: "application/pdf",
                type: ProductDocumentType.OwnerManual,
                cancellationToken: CancellationToken.None);

            // Assert - DB contains record and repository was called
            Assert.NotNull(result);
            Assert.Equal("blueprint.pdf", result.FileName);
            Assert.True(await _db.ProductDocuments.AnyAsync(d => d.Id == result.Id));
            _repoMock.Verify(r => r.SaveStreamAsync(It.IsAny<string>(), It.IsAny<Stream>(), "application/pdf", It.IsAny<CancellationToken>()), Times.Once);

            // Act - Download
            _repoMock.Setup(r => r.OpenStreamAsync(storageKey, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new MemoryStream(new byte[100]));

            var downloadResult = await service.DownloadDocumentAsync(result.Id, CancellationToken.None);

            // Assert - Stream is successfully retrieved
            Assert.NotNull(downloadResult);
            Assert.Equal("blueprint.pdf", downloadResult.FileName);
            _repoMock.Verify(r => r.OpenStreamAsync(storageKey, It.IsAny<CancellationToken>()), Times.Once);

            // Act - Delete
            await service.DeleteDocumentAsync(result.Id, CancellationToken.None);

            // Assert - DB record and physical storage file are cleanly deleted
            Assert.False(await _db.ProductDocuments.AnyAsync(d => d.Id == result.Id));
            _repoMock.Verify(r => r.DeleteStreamAsync(storageKey, It.IsAny<CancellationToken>()), Times.Once);
        }

        public void Dispose()
        {
            _db.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        /// <summary>
        /// A test helper class that forces SaveChangesAsync to crash.
        /// </summary>
        private class FailingChamberedDbContext : ChamberedDbContext
        {
            private bool _shouldCrash;

            public FailingChamberedDbContext(DbContextOptions<ChamberedDbContext> options) : base(options)
            {
            }

            public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            {
                // Only crash when trying to write product documents
                if (ChangeTracker.HasChanges() && ChangeTracker.Entries<ProductDocument>().GetEnumerator().MoveNext())
                {
                    throw new DbUpdateException("Database connection terminated abruptly (Forced Unit Test Exception).");
                }
                return base.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
