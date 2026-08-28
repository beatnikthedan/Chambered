using BeatnikToolKit.Attributes;

namespace Chambered.Infrastructure.Configuration
{
    /// <summary>
    /// Specifies the supported backend storage engines.
    /// </summary>
    public enum StorageProviderType
    {
        /// <summary>
        /// Store files on local disk or docker volume.
        /// </summary>
        Local,

        /// <summary>
        /// Store files in an external S3-compatible blob storage container.
        /// </summary>
        S3
    }

    /// <summary>
    /// Represents configuration settings for file storage and on-the-fly encryption.
    /// </summary>
    [ConfigurationSection(nameof(FileStorageConfiguration), null)]
    public class FileStorageConfiguration
    {
        /// <summary>
        /// Gets or sets the storage engine provider.
        /// </summary>
        public StorageProviderType Provider { get; set; } = StorageProviderType.Local;

        /// <summary>
        /// Gets or sets the local root directory path (for local disk storage).
        /// </summary>
        public string LocalRootPath { get; set; } = "./data/attachments";

        /// <summary>
        /// Gets or sets the base access URL (for generating file links).
        /// </summary>
        public string BaseUrl { get; set; } = "http://localhost:5000/files/";

        /// <summary>
        /// Gets or sets a value indicating whether stream-based AES-256 encryption is enabled.
        /// </summary>
        public bool EnableEncryption { get; set; }

        /// <summary>
        /// Gets or sets the base64-encoded or plain text symmetric encryption key. Must be 256-bit (32 bytes) when encoded.
        /// </summary>
        public string EncryptionKey { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the S3-compatible service URL (e.g. MinIO or Garage).
        /// </summary>
        public string S3ServiceUrl { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the S3 access key.
        /// </summary>
        public string S3AccessKey { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the S3 secret key.
        /// </summary>
        public string S3SecretKey { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the S3 target bucket name.
        /// </summary>
        public string S3BucketName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets a value indicating whether to use S3 path-style routing (required for Garage/MinIO).
        /// </summary>
        public bool S3ForcePathStyle { get; set; } = true;
    }
}
