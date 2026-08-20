import React, { useState, useEffect } from "react";

export default function BackupSettings() {
  const [loading, setLoading] = useState(true);

  // Configuration State
  const [backupPath] = useState("/metadata/backups");
  const [autoBackups, setAutoBackups] = useState(true);
  const [schedule] = useState("Run every Sunday at 1:30");
  const [nextBackupDate] = useState("08/23/2026 01:30");
  const [backupsToKeep, setBackupsToKeep] = useState(3);
  const [maxBackupSize, setMaxBackupSize] = useState(1);

  // Table Data State
  const [backupsList, setBackupsList] = useState([
    {
      id: "b1",
      file: "2026-08-16T0130.arsenalbackup",
      datetime: "08/15/2026",
      size: "125 MB",
    },
    {
      id: "b2",
      file: "2026-08-09T0130.arsenalbackup",
      datetime: "08/08/2026",
      size: "125 MB",
    },
    {
      id: "b3",
      file: "2026-08-02T0130.arsenalbackup",
      datetime: "08/01/2026",
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
        <button className="btn btn-primary" onClick={handleCreateBackup}>
          Create Backup
        </button>
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
        .
      </p>

      {/* Configuration Inputs */}
      <div className="form-grid" style={{ margin: "1.5rem 0" }}>
        <div className="form-group">
          <label>Backup Location</label>
          <input
            type="text"
            readOnly
            value={backupPath}
            className="text-mono readonly-input"
          />
        </div>

        <div className="form-group">
          <label>Schedule</label>
          <input
            type="text"
            readOnly
            value={schedule}
            className="readonly-input"
          />
        </div>
      </div>

      {/* EXACT TABLE STRUCTURE FROM APIKEYS */}
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
                <th style={{ width: "100px" }}>Actions</th>
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
                    <button
                      className="btn btn-danger btn-mini"
                      onClick={() => handleDeleteBackup(b.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
