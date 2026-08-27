import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useGetBackupsBackupSettings,
  useGetBackupsBackups,
  usePostBackupsCreateBackup,
  usePostBackupsUploadBackup,
  usePostBackupsRestoreBackupFromFileName,
  useDeleteBackupsBackupFromFileName,
  getGetBackupsBackupsQueryKey,
} from "../api/endpoints";
import type { BackupFileInfo } from "../api/models/backupFileInfo";

export default function BackupSettings() {
  const queryClient = useQueryClient();
  const formatBytes = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const {
    data: backupSettingsData,
    isLoading: backupSettingsLoading,
    error: backupSettingsError,
  } = useGetBackupsBackupSettings();

  const backupSettings = backupSettingsData?.data;

  const [backups, setBackups] = useState<BackupFileInfo[]>([]);

  const {
    data: backupsData,
    isLoading: backupsLoading,
  } = useGetBackupsBackups();

  useEffect(() => {
    if (backupsData?.data) {
      setBackups(backupsData.data);
    }
  }, [backupsData]);

  const refreshBackupsList = () => {
    queryClient.invalidateQueries({
      queryKey: getGetBackupsBackupsQueryKey(),
    });
  };

  /// <summary>
  /// Mutation to trigger the immediate manual creation of a database backup artifact.
  /// </summary>
  const { mutate: createBackup } =
    usePostBackupsCreateBackup({
      mutation: {
        onSuccess: () => {
          alert("Backup artifact created successfully!");
          refreshBackupsList();
        },
        onError: (err: any) => {
          alert(
            `Failed to create backup: ${err?.message || "Internal server error"}`,
          );
        },
      },
    });
  /// <summary>
  /// Mutation to upload a database backup artifact file to the storage server.
  /// </summary>
  const { mutate: uploadBackup } =
    usePostBackupsUploadBackup({
      mutation: {
        onSuccess: () => {
          alert("Backup artifact uploaded successfully!");
          refreshBackupsList();
        },
        onError: (err: any) => {
          alert(`Upload failed: ${err?.message || "Internal server error"}`);
        },
      },
    });
  /// <summary>
  /// Mutation to restore the database system using a specified backup file.
  /// </summary>
  const { mutate: restoreBackup } =
    usePostBackupsRestoreBackupFromFileName({
      mutation: {
        onSuccess: (res: any) => {
          alert(res?.message || "System database restored successfully!");
          refreshBackupsList();
        },
        onError: (err: any) => {
          alert(
            `Restore action failed: ${err?.message || "Internal server error"}`,
          );
        },
      },
    });
  /// <summary>
  /// Mutation to permanently delete a specified backup file from storage.
  /// </summary>
  const { mutate: deleteBackup } =
    useDeleteBackupsBackupFromFileName({
      mutation: {
        onSuccess: () => {
          alert("Backup file permanently deleted.");
          refreshBackupsList();
        },
        onError: (err: any) => {
          alert(
            `Failed to delete backup file: ${err?.message || "Internal server error"}`,
          );
        },
      },
    });
  /// <summary>
  /// Handlers to execute from React UI onClick/onChange event triggers.
  /// </summary>
  const handleCreateBackup = () => {
    createBackup();
  };
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadBackup({ data: { file } });
    }
  };
  const handleRestoreBackup = (fileName: string) => {
    if (
      window.confirm(
        `Are you sure you want to restore the system database from ${fileName}? All current unsaved changes will be overwritten.`,
      )
    ) {
      restoreBackup({ fileName });
    }
  };
  const handleDeleteBackup = (fileName: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete the backup file ${fileName}?`,
      )
    ) {
      deleteBackup({ fileName });
    }
  };
  /// <summary>
  /// Authenticated binary file download wrapper.
  /// Downloads backup programmatically via fetch relying on automatically attached session cookies.
  /// </summary>
  const handleDownloadBackup = async (fileName: string) => {
    try {
      const response = await fetch(`/api/v1/backups/${fileName}/download`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Convert stream payload to clean blob reference
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      // Programmatically click temporary link to initiate client file download
      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;
      tempLink.setAttribute("download", fileName);
      document.body.appendChild(tempLink);
      tempLink.click();

      // Cleanup temporary window resources
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <section className="settings-sec">
      {/* HEADER: CHECKBOX & BUTTONS ALIGNED HORIZONTALLY */}
      <div
        className="sec-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            id="autoBackupsHeader"
            checked={backupSettings?.enabled || false}
            onChange={() => {}}
            style={{
              width: "20px",
              height: "20px",
              cursor: "pointer",
              margin: 0,
            }}
          />
          <label
            htmlFor="autoBackupsHeader"
            style={{
              cursor: "pointer",
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: "bold",
            }}
          >
            {backupSettings?.enabled
              ? "Automatic Backups Enabled"
              : "Enable Automatic Backups"}
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label
            className="btn btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              margin: 0,
              cursor: "pointer",
            }}
          >
            Upload Backup
            <input
              type="file"
              accept=".db,.sql,.gz,.tar,.bak,application/x-sqlite3,application/gzip,application/sql"
              onChange={handleUploadBackup}
              style={{ display: "none" }}
            />
          </label>
          <button className="btn btn-primary" onClick={handleCreateBackup}>
            Create Backup
          </button>
        </div>
      </div>

      {/* DESCRIPTION BELOW HEADER */}
      <p
        className="sec-subtitle"
        style={{
          margin: "0.75rem 0 1.5rem 0",
          opacity: backupSettings?.enabled ? 1 : 0.4,
          transition: "opacity 0.2s ease-in-out",
        }}
      >
        Backups are a copy of the database and currently, can only be set
        through external configuration.
      </p>

      {/* FORM INPUTS & TABLE (GRAYED OUT WHEN AUTOMATIC BACKUPS ARE DISABLED) */}
      <div
        style={{
          opacity: backupSettings ? 1 : 0.4,
          pointerEvents: backupSettings ? "auto" : "none",
          transition: "opacity 0.2s ease-in-out",
        }}
      >
        {/* STACKED FORM CONFIGURATION */}

        {backupSettingsLoading ? (
          <div className="loading-spinner-box">
            <div className="spinner"></div>
            <p>Analyzing vaults...</p>
          </div>
        ) : backupSettingsError ? (
          <div className="vaults-error-card">
            <span className="err-icon">⚠️</span>
            <p>{(backupSettingsError as any)?.message || "Failed to load backup settings"}</p>
          </div>
        ) : backupSettings === null ? (
          <div className="empty-state panel">
            <h3>You have no items in your Vaults.</h3>
            <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
              Click 'Add Item' above to add your first item.
            </p>
          </div>
        ) : (
          <div
            className="form-stacked"
            style={{
              margin: "0 0 1.5rem 0",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div className="form-group">
              <label>BACKUP LOCATION</label>
              <input
                type="text"
                readOnly
                value={backupSettings?.backupPath || ""}
                className="text-mono readonly-input"
              />
            </div>

            <div className="form-group">
              <label>SCHEDULE</label>
              <input
                type="text"
                readOnly
                value={backupSettings?.cronSchedule || ""}
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label>NUMBER OF BACKUPS TO KEEP</label>
              <input
                type="number"
                min="1"
                readOnly
                value={backupSettings?.retentionCount || 0}
                className="readonly-input"
              />
            </div>
          </div>
        )}

        {/* TABLE DATA */}
        {backupsLoading ? (
          <div className="loading-inline">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Backup File</th>
                  <th>Date</th>
                  <th>Size</th>
                  <th style={{ width: "160px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => {
                  const filename = b.fileName || "unknown-backup";
                  return (
                    <tr key={filename}>
                      <td
                        className="text-bold text-mono"
                        style={{ wordBreak: "break-all" }}
                      >
                        {filename}
                      </td>
                      <td>{b.date}</td>
                      <td>{formatBytes(b.sizeInBytes)}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            justifyContent: "flex-end",
                            alignItems: "center",
                          }}
                        >
                          <button
                            className="btn btn-secondary btn-mini"
                            onClick={() => handleRestoreBackup(filename)}
                          >
                            Restore
                          </button>

                          <button
                            className="btn-icon"
                            title="Download Backup"
                            onClick={() => handleDownloadBackup(filename)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "inherit",
                              padding: 0,
                            }}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>

                          <button
                            className="btn-icon"
                            title="Delete Backup"
                            onClick={() => handleDeleteBackup(filename)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#e53e3e",
                              padding: 0,
                            }}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
