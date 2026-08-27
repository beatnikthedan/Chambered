using Microsoft.Extensions.Logging;

namespace Chambered.Infrastructure.LogMessages
{
    /// <summary>
    /// High-performance source-generated logger definitions for the external storage repository layer.
    /// </summary>
    public static partial class FileStorageRepositoryLogMessages
    {
        [LoggerMessage(EventId = 301, EventName = "SavingFile", Level = LogLevel.Information, Message = "Saving file stream to key: '{StorageKey}', ContentType: '{ContentType}'.")]
        public static partial void LogSavingFile(this ILogger logger, string storageKey, string contentType);

        [LoggerMessage(EventId = 302, EventName = "SavedFile", Level = LogLevel.Information, Message = "Saved file successfully. Key: '{StorageKey}', Size: {Size} bytes, Hash: '{Hash}'.")]
        public static partial void LogSavedFile(this ILogger logger, string storageKey, long size, string hash);

        [LoggerMessage(EventId = 303, EventName = "OpeningFile", Level = LogLevel.Information, Message = "Opening file download stream for key: '{StorageKey}'.")]
        public static partial void LogOpeningFile(this ILogger logger, string storageKey);

        [LoggerMessage(EventId = 304, EventName = "DeletingFile", Level = LogLevel.Information, Message = "Deleting physical file from key: '{StorageKey}'.")]
        public static partial void LogDeletingFile(this ILogger logger, string storageKey);

        [LoggerMessage(EventId = 305, EventName = "DecryptingStream", Level = LogLevel.Debug, Message = "Transparent decryption enabled for key: '{StorageKey}'. Decrypting cipher stream.")]
        public static partial void LogDecryptingStream(this ILogger logger, string storageKey);

        [LoggerMessage(EventId = 306, EventName = "LegacyRawStream", Level = LogLevel.Debug, Message = "No encryption signature found for key: '{StorageKey}'. Serving as unencrypted raw stream.")]
        public static partial void LogLegacyRawStream(this ILogger logger, string storageKey);
    }
}
