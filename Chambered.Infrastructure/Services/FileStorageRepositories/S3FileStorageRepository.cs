using Amazon.S3;
using Amazon.S3.Model;
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
    /// S3-compatible backend repository implementation of <see cref="IFileStorageRepository"/> with integrated transparent stream encryption.
    /// Supports cloud blob storages such as AWS S3, MinIO, or Garage.
    /// </summary>
    public class S3FileStorageRepository : IFileStorageRepository, IDisposable
    {
        private readonly FileStorageConfiguration _config;
        private readonly ILogger<S3FileStorageRepository> _logger;
        private readonly AmazonS3Client _s3Client;
        private readonly byte[] _encryptionKey;

        private static readonly byte[] EncryptionMagicHeader = [0x43, 0x45, 0x4E, 0x43];

        public S3FileStorageRepository(FileStorageConfiguration config, ILogger<S3FileStorageRepository> logger)
        {
            _config = config;
            _logger = logger;

            var s3Config = new AmazonS3Config
            {
                ServiceURL = _config.S3ServiceUrl,
                ForcePathStyle = _config.S3ForcePathStyle
            };

            _s3Client = new AmazonS3Client(_config.S3AccessKey, _config.S3SecretKey, s3Config);

            if (_config.EnableEncryption)
            {
                if (string.IsNullOrWhiteSpace(_config.EncryptionKey))
                {
                    throw new InvalidOperationException("Encryption is enabled but no EncryptionKey was configured.");
                }

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

        public async Task<FileMetadata> SaveStreamAsync(string storageKey, Stream stream, string contentType, CancellationToken cancellationToken)
        {
            ValidateStorageKey(storageKey);
            _logger.LogSavingFile(storageKey, contentType);

            long totalBytes = 0;
            string hash;
            var tempFile = Path.GetTempFileName();

            try
            {
                using (var sha256 = SHA256.Create())
                {
                    if (_config.EnableEncryption)
                    {
                        using (var aes = Aes.Create())
                        {
                            aes.Key = _encryptionKey;
                            aes.GenerateIV();

                            using (var fs = new FileStream(tempFile, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true))
                            {
                                await fs.WriteAsync(EncryptionMagicHeader, cancellationToken);
                                await fs.WriteAsync(aes.IV, cancellationToken);
                                totalBytes += EncryptionMagicHeader.Length + aes.IV.Length;

                                using (var encryptor = aes.CreateEncryptor())
                                using (var cryptoStream = new CryptoStream(fs, encryptor, CryptoStreamMode.Write))
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
                        using (var fs = new FileStream(tempFile, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true))
                        {
                            var buffer = new byte[8192];
                            int bytesRead;

                            while ((bytesRead = await stream.ReadAsync(buffer, cancellationToken)) > 0)
                            {
                                sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
                                await fs.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
                                totalBytes += bytesRead;
                            }

                            sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
                        }
                    }

                    hash = BitConverter.ToString(sha256.Hash!).Replace("-", "").ToLower();
                }

                // Upload the local encrypted file to S3
                using (var uploadStream = new FileStream(tempFile, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true))
                {
                    var putRequest = new PutObjectRequest
                    {
                        BucketName = _config.S3BucketName,
                        Key = storageKey,
                        InputStream = uploadStream,
                        ContentType = contentType
                    };

                    await _s3Client.PutObjectAsync(putRequest, cancellationToken);
                }
            }
            finally
            {
                if (File.Exists(tempFile))
                {
                    File.Delete(tempFile);
                }
            }

            _logger.LogSavedFile(storageKey, totalBytes, hash);
            return new FileMetadata(storageKey, contentType, totalBytes, hash);
        }

        public async Task<Stream> OpenStreamAsync(string storageKey, CancellationToken cancellationToken)
        {
            ValidateStorageKey(storageKey);
            _logger.LogOpeningFile(storageKey);

            var getRequest = new GetObjectRequest
            {
                BucketName = _config.S3BucketName,
                Key = storageKey
            };

            GetObjectResponse response;
            try
            {
                response = await _s3Client.GetObjectAsync(getRequest, cancellationToken);
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                throw new FileNotFoundException("S3 Object was not found.", storageKey);
            }

            var networkStream = response.ResponseStream;

            // Network streams are unseekable. Read the first 4 bytes to check for magic header
            var headerBuffer = new byte[EncryptionMagicHeader.Length];
            int readBytes = 0;
            while (readBytes < EncryptionMagicHeader.Length)
            {
                int read = await networkStream.ReadAsync(headerBuffer.AsMemory(readBytes, EncryptionMagicHeader.Length - readBytes), cancellationToken);
                if (read <= 0) break;
                readBytes += read;
            }

            if (readBytes == EncryptionMagicHeader.Length &&
                headerBuffer[0] == EncryptionMagicHeader[0] &&
                headerBuffer[1] == EncryptionMagicHeader[1] &&
                headerBuffer[2] == EncryptionMagicHeader[2] &&
                headerBuffer[3] == EncryptionMagicHeader[3])
            {
                if (!_config.EnableEncryption)
                {
                    networkStream.Dispose();
                    throw new InvalidOperationException("The requested S3 object is encrypted but encryption is currently disabled globally.");
                }

                _logger.LogDecryptingStream(storageKey);

                // Read IV
                var ivBuffer = new byte[16];
                int ivBytesRead = 0;
                while (ivBytesRead < 16)
                {
                    int read = await networkStream.ReadAsync(ivBuffer.AsMemory(ivBytesRead, 16 - ivBytesRead), cancellationToken);
                    if (read <= 0) break;
                    ivBytesRead += read;
                }

                if (ivBytesRead != 16)
                {
                    networkStream.Dispose();
                    throw new InvalidDataException("Invalid encryption payload: truncated IV header on S3 stream.");
                }

                var aes = Aes.Create();
                aes.Key = _encryptionKey;
                aes.IV = ivBuffer;

                var decryptor = aes.CreateEncryptor(); // Wait, decryptor should use CreateDecryptor(), not CreateEncryptor()!
                // Ah, let's make sure it's CreateDecryptor()!
                decryptor = aes.CreateDecryptor();

                return new CryptoStream(networkStream, decryptor, CryptoStreamMode.Read, leaveOpen: false);
            }

            // Legacy non-encrypted file. Prepend the read header bytes back to the stream
            _logger.LogLegacyRawStream(storageKey);
            return new PrependStream(networkStream, headerBuffer, readBytes);
        }

        public async Task DeleteStreamAsync(string storageKey, CancellationToken cancellationToken)
        {
            ValidateStorageKey(storageKey);
            _logger.LogDeletingFile(storageKey);

            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _config.S3BucketName,
                Key = storageKey
            };

            await _s3Client.DeleteObjectAsync(deleteRequest, cancellationToken);
        }

        public async Task<bool> ExistsAsync(string storageKey, CancellationToken cancellationToken)
        {
            ValidateStorageKey(storageKey);

            try
            {
                await _s3Client.GetObjectMetadataAsync(_config.S3BucketName, storageKey, cancellationToken);
                return true;
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return false;
            }
        }

        private void ValidateStorageKey(string storageKey)
        {
            if (string.IsNullOrWhiteSpace(storageKey))
            {
                throw new ArgumentException("Storage key cannot be empty.", nameof(storageKey));
            }

            if (storageKey.Contains("../") || storageKey.Contains(".."))
            {
                throw new InvalidOperationException("Directory traversal attempt detected in storage key.");
            }
        }

        public void Dispose()
        {
            _s3Client.Dispose();
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Lightweight read-only stream wrapper to prepend read header bytes back onto unseekable network streams.
        /// </summary>
        private class PrependStream : Stream
        {
            private readonly Stream _source;
            private readonly byte[] _prepended;
            private readonly int _prependedCount;
            private int _position;

            public PrependStream(Stream source, byte[] prepended, int count)
            {
                _source = source;
                _prepended = prepended;
                _prependedCount = count;
            }

            public override bool CanRead => true;
            public override bool CanSeek => false;
            public override bool CanWrite => false;
            public override long Length => throw new NotSupportedException();
            public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }

            public override int Read(byte[] buffer, int offset, int count)
            {
                int bytesCopied = 0;

                if (_position < _prependedCount)
                {
                    int available = _prependedCount - _position;
                    bytesCopied = Math.Min(available, count);
                    Buffer.BlockCopy(_prepended, _position, buffer, offset, bytesCopied);
                    _position += bytesCopied;

                    if (bytesCopied == count)
                    {
                        return bytesCopied;
                    }
                }

                int sourceRead = _source.Read(buffer, offset + bytesCopied, count - bytesCopied);
                return bytesCopied + sourceRead;
            }

            public override async Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
            {
                int bytesCopied = 0;

                if (_position < _prependedCount)
                {
                    int available = _prependedCount - _position;
                    bytesCopied = Math.Min(available, count);
                    Buffer.BlockCopy(_prepended, _position, buffer, offset, bytesCopied);
                    _position += bytesCopied;

                    if (bytesCopied == count)
                    {
                        return bytesCopied;
                    }
                }

                int sourceRead = await _source.ReadAsync(buffer.AsMemory(offset + bytesCopied, count - bytesCopied), cancellationToken);
                return bytesCopied + sourceRead;
            }

            public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
            {
                int bytesCopied = 0;
                int count = buffer.Length;

                if (_position < _prependedCount)
                {
                    int available = _prependedCount - _position;
                    bytesCopied = Math.Min(available, count);
                    _prepended.AsMemory(_position, bytesCopied).CopyTo(buffer);
                    _position += bytesCopied;

                    if (bytesCopied == count)
                    {
                        return bytesCopied;
                    }
                }

                int sourceRead = await _source.ReadAsync(buffer[bytesCopied..], cancellationToken);
                return bytesCopied + sourceRead;
            }

            public override void Flush() => _source.Flush();
            public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
            public override void SetLength(long value) => throw new NotSupportedException();
            public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

            protected override void Dispose(bool disposing)
            {
                if (disposing)
                {
                    _source.Dispose();
                }
                base.Dispose(disposing);
            }
        }
    }
}
