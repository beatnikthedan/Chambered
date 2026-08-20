import React, { useState } from "react";

export default function BackupSettings() {
  // Configuration State
  const [backupPath, setBackupPath] = useState("/metadata/backups");
  const [autoBackups, setAutoBackups] = useState(true);
  const [schedule, setSchedule] = useState("Run every Sunday at 1:30");
  const [nextBackupDate] = useState("08/23/2026 01:30");
  const [backupsToKeep, setBackupsToKeep] = useState(3);
  const [maxBackupSize, setMaxBackupSize] = useState(1);

  // Table Data State
  const [backupsList, setBackupsList] = useState([
    {
      id: "b1",
      file: "/backups/2026-08-16T0130.arsenalbackup",
      datetime: "08/15/2026 19:30",
      size: "125.65 MB",
    },
    {
      id: "b2",
      file: "/backups/2026-08-09T0130.arsenalbackup",
      datetime: "08/08/2026 19:30",
      size: "125.65 MB",
    },
    {
      id: "b3",
      file: "/backups/2026-08-02T0130.arsenalbackup",
      datetime: "08/01/2026 19:30",
      size: "125.65 MB",
    },
  ]);

  // Action Handlers
  const handleCreateBackup = () => {
    const now = new Date();
    const formattedDate = now.toISOString().replace(/[:.]/g, "-").slice(0, 16);
    const newEntry = {
      id: `b_${Date.now()}`,
      file: `/backups/${formattedDate}.arsenalbackup`,
      datetime: now.toLocaleString(),
      size: "128.10 MB",
    };
    setBackupsList([newEntry, ...backupsList]);
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

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Backups</h3>
      </div>
      <p className="sec-subtitle">
        Backups include users, user progress, item details, server settings, and
        stored images in{" "}
        <code
          className="text-mono"
          style={{
            background: "rgba(255,255,255,0.08)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          /metadata/items
        </code>
        . Backups <strong>do not</strong> include files stored in your library
        folders.
      </p>

      {/* Configuration Box */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          margin: "1.5rem 0",
          background: "rgba(255,255,255,0.02)",
          padding: "1.25rem",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Backup Location */}
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: "700",
              color: "#5e6673",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.25rem",
            }}
          >
            BACKUP LOCATION:
            <span className="text-mono" style={{ fontSize: "0.75rem" }}>
              {" "}
              {backupPath}
            </span>
          </div>
        </div>

        {/* Automatic Backups Switch */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            id="autoBackupsToggle"
            checked={autoBackups}
            onChange={(e) => setAutoBackups(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <label
            htmlFor="autoBackupsToggle"
            style={{
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Automatic backups{" "}
            <span
              title="Runs automated scheduled snapshots"
              style={{ color: "#5e6673", cursor: "help" }}
            >
              ⓘ
            </span>
          </label>
        </div>

        {/* Schedule Info */}
        {autoBackups && (
          <div
            style={{
              paddingLeft: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#5e6673",
                  width: "140px",
                }}
              >
                SCHEDULE:
              </span>
              <span>{schedule}</span>
              {/* <button
                className="btn btn-secondary btn-mini"
                onClick={() => {
                  const newSched = prompt(
                    "Enter cron text descriptor:",
                    schedule,
                  );
                  if (newSched) setSchedule(newSched);
                }}
                style={{ padding: "2px 6px", fontSize: "10px" }}
              >
                ✏️
              </button> */}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#5e6673",
                  width: "140px",
                }}
              >
                NEXT BACKUP DATE:
              </span>
              <span className="text-mono">{nextBackupDate}</span>
            </div>
          </div>
        )}

        {/* Numeric Limits */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="number"
              value={backupsToKeep}
              onChange={(e) => setBackupsToKeep(Number(e.target.value))}
              style={{
                width: "60px",
                padding: "6px",
                textAlign: "center",
                borderRadius: "4px",
                background: "#1d2028",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
              }}
              min="1"
            />
            <label style={{ fontSize: "0.9rem" }}>
              Number of backups to keep{" "}
              <span
                title="Oldest backups are removed when exceeded"
                style={{ color: "#5e6673", cursor: "help" }}
              >
                ⓘ
              </span>
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="number"
              value={maxBackupSize}
              onChange={(e) => setMaxBackupSize(Number(e.target.value))}
              style={{
                width: "60px",
                padding: "6px",
                textAlign: "center",
                borderRadius: "4px",
                background: "#1d2028",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
              }}
              min="0"
            />
            <label style={{ fontSize: "0.9rem" }}>
              Maximum backup size (in GB) (0 for unlimited){" "}
              <span
                title="Limits total disk allocation for backups"
                style={{ color: "#5e6673", cursor: "help" }}
              >
                ⓘ
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "1.5rem 0",
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={() => alert("Select a backup file to upload")}
        >
          Upload Backup
        </button>
        <button className="btn btn-primary" onClick={handleCreateBackup}>
          Create Backup
        </button>
      </div>

      {/* Backups Table */}
      <div className="table-container">
        <table className="settings-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Datetime</th>
              <th>Size</th>
              <th style={{ width: "160px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backupsList.map((b) => (
              <tr key={b.id}>
                <td className="text-mono" style={{ fontSize: "0.85rem" }}>
                  {b.file}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{b.datetime}</td>
                <td style={{ whiteSpace: "nowrap" }}>{b.size}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
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
                      className="btn btn-secondary btn-mini"
                      title="Download backup archive"
                      onClick={() => alert(`Downloading ${b.file}`)}
                    >
                      ⬇
                    </button>
                    <button
                      className="btn btn-danger btn-mini"
                      title="Delete backup"
                      onClick={() => handleDeleteBackup(b.id)}
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
