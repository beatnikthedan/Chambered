using Microsoft.Extensions.Logging;
using System;

namespace Chambered.Infrastructure.LogMessages
{
    /// <summary>
    /// High-performance source-generated logger definitions for the transactional generic document service layer.
    /// </summary>
    public static partial class DocumentServiceLogMessages
    {
        [LoggerMessage(EventId = 401, EventName = "InitiatingUpload", Level = LogLevel.Information, Message = "Initiating document upload. ParentFolderName: '{ParentFolder}', ParentID: {ParentId}, FileName: '{FileName}', ContentType: '{ContentType}'.")]
        public static partial void LogInitiatingUpload(this ILogger logger, string parentFolder, int parentId, string fileName, string contentType);

        [LoggerMessage(EventId = 402, EventName = "DocumentSaved", Level = LogLevel.Information, Message = "Document saved successfully. DocumentID: {DocumentId}, ParentID: {ParentId}, Key: '{StorageKey}'.")]
        public static partial void LogDocumentSaved(this ILogger logger, int documentId, int parentId, string storageKey);

        [LoggerMessage(EventId = 403, EventName = "UploadRollbackTriggered", Level = LogLevel.Warning, Message = "Database write failed during document attachment. Triggering compensation rollback on storage file: '{StorageKey}'.")]
        public static partial void LogUploadRollbackTriggered(this ILogger logger, string storageKey, Exception exception);

        [LoggerMessage(EventId = 404, EventName = "InitiatingDownload", Level = LogLevel.Information, Message = "Initiating document download. DocumentID: {DocumentId}.")]
        public static partial void LogInitiatingDownload(this ILogger logger, int documentId);

        [LoggerMessage(EventId = 405, EventName = "InitiatingDeletion", Level = LogLevel.Information, Message = "Initiating document deletion. DocumentID: {DocumentId}, Key: '{StorageKey}'.")]
        public static partial void LogInitiatingDeletion(this ILogger logger, int documentId, string storageKey);
    }
}
