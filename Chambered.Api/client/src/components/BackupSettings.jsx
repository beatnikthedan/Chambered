import React, { useState, useEffect } from "react";

export default function BackupSettings() {
  const [loading, setLoading] = useState(true);

  // Configuration State
  const [backupPath] = useState("/metadata/backups");
  const [autoBackups, setAutoBackups] = useState(true);
  const [schedule] = useState("Run every Sunday at 1:30");
  const [backupsToKeep, setBackupsToKeep] = useState(3);

  // Table Data State
  const [backupsList, setBackupsList] = useState([
    {
      id: "b1",
      file: "2026-08-16T0130.arsenalbackup",
      datetime: "08/15/2026 19:30",
      size: "125 MB",
    },
    {
      id: "b2",
      file: "2026-08-09T0130.arsenalbackup",
      datetime: "08/08/2026 19:30",
      size: "125 MB",
    },
    {
      id: "b3",
      file: "2026-08-02T0130.arsenalbackup",
      datetime: "08/01/2026 19:30",
      size: "125 MB",
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateBackup = () => {
    const now = new Date();
    const formattedDate = now.toISOString().replace(/[:.]/g, "-").slice(0, 16);
    const newEntry = {
      id: `b_${Date.now()}`,
      file: `${formattedDate}.arsenalbackup`,
      datetime: now.toLocaleDateString(),
      size: "128 MB",
    };
    setBackupsList([newEntry, ...backupsList]);
  };

  const handleUploadBackup = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newEntry = {
        id: `b_${Date.now()}`,
        file: file.name,
        datetime: new Date().toLocaleDateString(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      };
      setBackupsList([newEntry, ...backupsList]);
    }
  };

  const handleDeleteBackup = (id) => {
    if (window.confirm("Are you sure you want to delete this backup file?")) {
      setBackupsList((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleRestoreBackup = (file) => {
    if (
      window.confirm(
        `Restore database from ${file}? Current unsaved changes will be overwritten.`,
      )
    ) {
      alert("System restored successfully!");
    }
  };

  const handleDownloadBackup = (file) => {
    alert(`Downloading ${file}...`);
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
            checked={autoBackups}
            onChange={(e) => setAutoBackups(e.target.checked)}
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
            {autoBackups
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
              accept=".arsenalbackup"
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
          opacity: autoBackups ? 1 : 0.4,
          transition: "opacity 0.2s ease-in-out",
        }}
      >
        Backups are copy of the database and currently, backups can only be
        configured through secrets.
      </p>

      {/* FORM INPUTS & TABLE (GRAYED OUT WHEN AUTOMATIC BACKUPS ARE DISABLED) */}
      <div
        style={{
          opacity: autoBackups ? 1 : 0.4,
          pointerEvents: autoBackups ? "auto" : "none",
          transition: "opacity 0.2s ease-in-out",
        }}
      >
        {/* STACKED FORM CONFIGURATION */}
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
              value={backupPath}
              className="text-mono readonly-input"
            />
          </div>

          <div className="form-group">
            <label>SCHEDULE</label>
            <input
              type="text"
              readOnly
              value={schedule}
              className="readonly-input"
            />
          </div>

          <div className="form-group">
            <label>NUMBER OF BACKUPS TO KEEP</label>
            <input
              type="number"
              min="1"
              value={backupsToKeep}
              onChange={(e) => setBackupsToKeep(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        {/* TABLE DATA */}
        {loading ? (
          <div className="loading-inline">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="settings-table">
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
                {backupsList.map((b) => (
                  <tr key={b.id}>
                    <td
                      className="text-bold text-mono"
                      style={{ wordBreak: "break-all" }}
                    >
                      {b.file}
                    </td>
                    <td>{b.datetime}</td>
                    <td>{b.size}</td>
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
                          onClick={() => handleRestoreBackup(b.file)}
                        >
                          Restore
                        </button>

                        <button
                          className="btn-icon"
                          title="Download Backup"
                          onClick={() => handleDownloadBackup(b.file)}
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
                          onClick={() => handleDeleteBackup(b.id)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
