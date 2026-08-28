using Chambered.Core.Services;
using Chambered.Core.Services.Models;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.LogMessages;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Chambered.Infrastructure.Services.FileStorageRepositories
{
    /// <summary>
    /// Local disk implementation of <see cref="IFileStorageRepository"/> with optional AES-256 transparent CBC stream encryption.
    /// </summary>
    public class LocalFileStorageRepository : IFileStorageRepository
    {
        private readonly FileStorageConfiguration _config;
        private readonly ILogger<LocalFileStorageRepository> _logger;
        private readonly byte[] _encryptionKey;

        // Magic 4-byte header: "CENC" (Chambered Encrypted)
        private static readonly byte[] EncryptionMagicHeader = [0x43, 0x45, 0x4E, 0x43];

        public LocalFileStorageRepository(FileStorageConfiguration config, ILogger<LocalFileStorageRepository> logger)
        {
            _config = config;
            _logger = logger;

            if (_config.EnableEncryption)
            {
                if (string.IsNullOrWhiteSpace(_config.EncryptionKey))
                {
                    throw new InvalidOperationException("Encryption is enabled but no EncryptionKey was configured.");
                }

                // If key is base64, decode it; otherwise fallback to SHA-256 hash
                try
                {
                    _encryptionKey = Convert.FromBase64String(_config.EncryptionKey);
                }
                catch (FormatException)
                {
                    _encryptionKey = SHA256.HashData(Encoding.UTF8.GetBytes(_config.EncryptionKey));
                }

                if (_encryptionKey.Length != 32)
                {
                    throw new InvalidOperationException("EncryptionKey must resolve to exactly 256 bits (32 bytes).");
                }
            }
            else
            {
                _encryptionKey = Array.Empty<byte>();
            }
        }

        public async Task<FileMetadata> SaveStreamAsync(string storageKey, Stream stream, string contentType, CancellationToken cancellationToken = default)
        {
            var physicalPath = GetSafeFullPath(storageKey);
            var directory = Path.GetDirectoryName(physicalPath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            _logger.LogSavingFile(storageKey, contentType);

            long totalBytes = 0;
            string hash;

            using (var sha256 = SHA256.Create())
            {
                if (_config.EnableEncryption)
                {
                    using (var aes = Aes.Create())
                    {
                        aes.Key = _encryptionKey;
                        aes.GenerateIV();

                        using (var fileStream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true))
                        {
                            // Write magic header and IV first
                            await fileStream.WriteAsync(EncryptionMagicHeader, cancellationToken);
                            await fileStream.WriteAsync(aes.IV, cancellationToken);
                            totalBytes += EncryptionMagicHeader.Length + aes.IV.Length;

                            using (var encryptor = aes.CreateEncryptor())
                            using (var cryptoStream = new CryptoStream(fileStream, encryptor, CryptoStreamMode.Write))
                            {
                                var buffer = new byte[8192];
                                int bytesRead;

                                while ((bytesRead = await stream.ReadAsync(buffer, cancellationToken)) > 0)
                                {
                                    sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
                                    await cryptoStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
                                    totalBytes += bytesRead;
                                }

                                sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
                            }
                        }
                    }
                }
                else
                {
                    using (var fileStream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true))
                    {
                        var buffer = new byte[8192];
                        int bytesRead;

                        while ((bytesRead = await stream.ReadAsync(buffer, cancellationToken)) > 0)
                        {
                            sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
                            await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
                            totalBytes += bytesRead;
                        }

                        sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
                    }
                }

                hash = BitConverter.ToString(sha256.Hash!).Replace("-", "").ToLower();
            }

            _logger.LogSavedFile(storageKey, totalBytes, hash);
            return new FileMetadata(storageKey, contentType, totalBytes, hash);
        }

        public async Task<Stream> OpenStreamAsync(string storageKey, CancellationToken cancellationToken = default)
        {
            var physicalPath = GetSafeFullPath(storageKey);
            if (!File.Exists(physicalPath))
            {
                throw new FileNotFoundException("The physical file was not found.", physicalPath);
            }

            _logger.LogOpeningFile(storageKey);

            var fileStream = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true);

            // Read first 4 bytes to check for magic header
            var headerBuffer = new byte[EncryptionMagicHeader.Length];
            int read = await fileStream.ReadAsync(headerBuffer, cancellationToken);

            if (read == EncryptionMagicHeader.Length &&
                headerBuffer[0] == EncryptionMagicHeader[0] &&
                headerBuffer[1] == EncryptionMagicHeader[1] &&
                headerBuffer[2] == EncryptionMagicHeader[2] &&
                headerBuffer[3] == EncryptionMagicHeader[3])
            {
                if (!_config.EnableEncryption)
                {
                    throw new InvalidOperationException("The requested file is encrypted but encryption is currently disabled globally.");
                }

                _logger.LogDecryptingStream(storageKey);

                // Read the 16-byte IV
                var ivBuffer = new byte[16];
                int ivRead = await fileStream.ReadAsync(ivBuffer, cancellationToken);
                if (ivRead != 16)
                {
                    fileStream.Dispose();
                    throw new InvalidDataException("Invalid encryption payload: truncated IV header.");
                }

                var aes = Aes.Create();
                aes.Key = _encryptionKey;
                aes.IV = ivBuffer;

                var decryptor = aes.CreateDecryptor();
                // Return a Decryptor CryptoStream that takes ownership of fileStream and disposes Aes
                return new CryptoStream(fileStream, decryptor, CryptoStreamMode.Read, leaveOpen: false);
            }

            // Fallback: This is legacy unencrypted data. Rewind stream to 0 and serve plain stream
            _logger.LogLegacyRawStream(storageKey);
            fileStream.Seek(0, SeekOrigin.Begin);
            return fileStream;
        }

        public Task DeleteStreamAsync(string storageKey, CancellationToken cancellationToken = default)
        {
            var physicalPath = GetSafeFullPath(storageKey);
            _logger.LogDeletingFile(storageKey);

            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }

            return Task.CompletedTask;
        }

        public Task<bool> ExistsAsync(string storageKey, CancellationToken cancellationToken = default)
        {
            var physicalPath = GetSafeFullPath(storageKey);
            return Task.FromResult(File.Exists(physicalPath));
        }

        private string GetSafeFullPath(string storageKey)
        {
            if (string.IsNullOrWhiteSpace(storageKey))
            {
                throw new ArgumentException("Storage key cannot be empty.", nameof(storageKey));
            }

            // Normalize slashes
            var normalizedKey = storageKey.Replace('\\', '/');

            // Block directory traversal attempts
            if (normalizedKey.Contains("../") || normalizedKey.Contains(".."))
            {
                throw new InvalidOperationException("Directory traversal attempt detected in storage key.");
            }

            var root = Path.GetFullPath(_config.LocalRootPath);
            var combined = Path.Combine(root, normalizedKey);
            var fullPath = Path.GetFullPath(combined);

            if (!fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Storage key resolves outside of the configured root storage directory.");
            }

            return fullPath;
        }
    }
}
