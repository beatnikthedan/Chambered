using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Services.FileStorageRepositories;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text;

namespace Chambered.Tests.Services
{
    /// <summary>
    /// Direct repository unit tests validating physical stream storage, transparent encryption, and traversal boundary protection.
    /// </summary>
    public class FileStorageRepositoryTests
    {
        private readonly string _tempDirectory;
        private readonly Mock<ILogger<LocalFileStorageRepository>> _loggerMock;

        public FileStorageRepositoryTests()
        {
            _tempDirectory = Path.Combine(Path.GetTempPath(), "Chambered_FileStorageTests_" + Guid.NewGuid().ToString().Substring(0, 8));
            _loggerMock = new Mock<ILogger<LocalFileStorageRepository>>();
        }

        [Fact]
        public async Task Save_And_Open_WithoutEncryption_ShouldSucceedAndMatchContent()
        {
            // Arrange
            var config = new FileStorageConfiguration
            {
                LocalRootPath = _tempDirectory,
                EnableEncryption = false
            };
            var repository = new LocalFileStorageRepository(config, _loggerMock.Object);
            var contentString = "Chambered raw material checklist blueprint.";
            var originalBytes = Encoding.UTF8.GetBytes(contentString);
            using var uploadStream = new MemoryStream(originalBytes);
            var storageKey = "tests/test_plain.txt";

            // Act
            var metadata = await repository.SaveStreamAsync(storageKey, uploadStream, "text/plain");

            // Assert
            Assert.Equal(storageKey, metadata.StorageKey);
            Assert.Equal("text/plain", metadata.ContentType);
            Assert.Equal(originalBytes.Length, metadata.SizeInBytes);

            using (var downloadStream = await repository.OpenStreamAsync(storageKey))
            {
                using var readerStream = new MemoryStream();
                await downloadStream.CopyToAsync(readerStream);
                var downloadedBytes = readerStream.ToArray();
                var downloadedString = Encoding.UTF8.GetString(downloadedBytes);

                Assert.Equal(contentString, downloadedString);
            }

            Assert.True(await repository.ExistsAsync(storageKey));

            // Cleanup
            await repository.DeleteStreamAsync(storageKey);
            Assert.False(await repository.ExistsAsync(storageKey));
            Directory.Delete(_tempDirectory, recursive: true);
        }

        [Fact]
        public async Task Save_And_Open_WithEncryption_ShouldSucceedAndBeEncryptedOnDisk()
        {
            // Arrange
            var config = new FileStorageConfiguration
            {
                LocalRootPath = _tempDirectory,
                EnableEncryption = true,
                EncryptionKey = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=" // 32-byte Base64 key
            };
            var repository = new LocalFileStorageRepository(config, _loggerMock.Object);
            var contentString = "Confidential Armory Receipts and Private Documents.";
            var originalBytes = Encoding.UTF8.GetBytes(contentString);
            using var uploadStream = new MemoryStream(originalBytes);
            var storageKey = "secure/secret_receipt.txt";

            // Act
            var metadata = await repository.SaveStreamAsync(storageKey, uploadStream, "text/plain");

            // Verify content on disk is encrypted
            var physicalPath = Path.Combine(_tempDirectory, "secure", "secret_receipt.txt");
            var diskBytes = await File.ReadAllBytesAsync(physicalPath);

            // 1. First 4 bytes must be magic "CENC" header [0x43, 0x45, 0x4E, 0x43]
            Assert.Equal(0x43, diskBytes[0]);
            Assert.Equal(0x45, diskBytes[1]);
            Assert.Equal(0x4E, diskBytes[2]);
            Assert.Equal(0x43, diskBytes[3]);

            // 2. The data following the 16-byte IV is ciphertext (must not contain plain text string)
            var diskContentString = Encoding.UTF8.GetString(diskBytes);
            Assert.DoesNotContain(contentString, diskContentString);

            // Download and decrypt
            using (var downloadStream = await repository.OpenStreamAsync(storageKey))
            {
                using var readerStream = new MemoryStream();
                await downloadStream.CopyToAsync(readerStream);
                var decryptedBytes = readerStream.ToArray();
                var decryptedString = Encoding.UTF8.GetString(decryptedBytes);

                // Assert decrypted content matches original
                Assert.Equal(contentString, decryptedString);
            }

            Assert.Equal(originalBytes.Length + 20, metadata.SizeInBytes);

            // Cleanup
            await repository.DeleteStreamAsync(storageKey);
            Directory.Delete(_tempDirectory, recursive: true);
        }

        [Fact]
        public async Task Repository_ShouldPreventDirectoryTraversal()
        {
            // Arrange
            var config = new FileStorageConfiguration
            {
                LocalRootPath = _tempDirectory,
                EnableEncryption = false
            };
            var repository = new LocalFileStorageRepository(config, _loggerMock.Object);
            using var emptyStream = new MemoryStream();

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                repository.SaveStreamAsync("../../etc/passwd", emptyStream, "text/plain"));

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                repository.OpenStreamAsync("../illegal.txt"));
        }
    }
}
