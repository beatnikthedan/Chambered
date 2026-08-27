using Chambered.Core.Services;
using Chambered.Data.Models;
using System.Security.Cryptography;

namespace Chambered.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _basePath;
        private readonly string _baseUrl;

        /// <param name="basePath">Root directory on disk (e.g., "C:/Storage/Uploads" or "/var/app/uploads")</param>
        /// <param name="baseUrl">Base URL for public static files if applicable (e.g., "https://api.myapp.com/files/")</param>
        public LocalFileStorageService(string basePath, string baseUrl = "http://localhost:5000/files/")
        {
            _basePath = Path.GetFullPath(basePath);
            _baseUrl = baseUrl.EndsWith('/') ? baseUrl : $"{baseUrl}/";

            if (!Directory.Exists(_basePath))
            {
                Directory.CreateDirectory(_basePath);
            }
        }

        public async Task<FileMetadata> UploadAsync(
            string storageKey,
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            var targetPath = GetSafeFullPath(storageKey);

            // Ensure target directory exists (e.g., /invoices/2026/)
            var directory = Path.GetDirectoryName(targetPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // Write stream to disk while calculating SHA-256 hash simultaneously
            using var destinationStream = new FileStream(
                targetPath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);

            using var sha256 = SHA256.Create();

            // Write content to destination while updating hash
            var buffer = new byte[81920];
            int bytesRead;
            long totalBytes = 0;

            while ((bytesRead = await content.ReadAsync(buffer, cancellationToken)) > 0)
            {
                await destinationStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
                sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
                totalBytes += bytesRead;
            }

            sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
            var hash = Convert.ToHexString(sha256.Hash ?? Array.Empty<byte>());

            return new FileMetadata(storageKey, contentType, totalBytes, hash);
        }

        public Task<Stream> DownloadAsync(string storageKey, CancellationToken cancellationToken = default)
        {
            var targetPath = GetSafeFullPath(storageKey);

            if (!File.Exists(targetPath))
            {
                throw new FileNotFoundException($"Storage key '{storageKey}' was not found on disk.", targetPath);
            }

            // Open read stream with FileShare.Read so other processes can read concurrently
            Stream stream = new FileStream(
                targetPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 81920,
                useAsync: true);

            return Task.FromResult(stream);
        }

        public Task<bool> ExistsAsync(string storageKey, CancellationToken cancellationToken = default)
        {
            var targetPath = GetSafeFullPath(storageKey);
            return Task.FromResult(File.Exists(targetPath));
        }

        public Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
        {
            var targetPath = GetSafeFullPath(storageKey);

            if (File.Exists(targetPath))
            {
                File.Delete(targetPath);
            }

            return Task.CompletedTask;
        }

        public Task<string> GetAccessUrlAsync(
            string storageKey,
            TimeSpan? expiresIn = null,
            CancellationToken cancellationToken = default)
        {
            // For local disk, this formats a static relative path or local endpoint URL.
            // If serving via a ASP.NET Static Files middleware endpoint:
            var cleanKey = storageKey.TrimStart('/').Replace('\\', '/');
            var fullUrl = $"{_baseUrl}{cleanKey}";

            return Task.FromResult(fullUrl);
        }

        /// <summary>
        /// Security check: Ensures storage key cannot exploit path traversal attacks (e.g., "../../etc/passwd")
        /// </summary>
        private string GetSafeFullPath(string storageKey)
        {
            if (string.IsNullOrWhiteSpace(storageKey))
            {
                throw new ArgumentException("Storage key cannot be null or empty.", nameof(storageKey));
            }

            // Normalize separators
            var normalizedKey = storageKey.Replace('\\', '/').TrimStart('/');
            var fullPath = Path.GetFullPath(Path.Combine(_basePath, normalizedKey));

            // Prevent directory traversal escape outside of base path
            if (!fullPath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Invalid storage key path traversal attempt: {storageKey}");
            }

            return fullPath;
        }
    }
}
