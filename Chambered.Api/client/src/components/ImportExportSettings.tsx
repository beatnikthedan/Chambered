import React, { useState, useEffect } from "react";

export default function ImportExportSettings({ usersList = [], store = {} }) {
  // 1. Loading state (matches ApiKeysSettings)
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [importingType, setImportingType] = useState(null);

  // 2. Simulate initial mount load cycle (matches ApiKeysSettings behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const arsenals = store?.arsenals || [];

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Data Import & Export</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            setExportingAll(true);
            setTimeout(() => setExportingAll(false), 500);
          }}
          disabled={exportingAll}
        >
          {exportingAll ? "Exporting..." : "Export Complete System"}
        </button>
      </div>
      <p className="sec-subtitle">
        Export isolated arsenal inventories, bulk migrate open-source
        manufacturer catalog standards, or import pre-built product database
        definitions.
      </p>

      {/* MATCHES APIKEYS CONDITIONAL LOADING RENDER BLOCK */}
      {loading ? (
        <div className="loading-inline">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Arsenal Name</th>
                <th>Description</th>
                <th>Tracked Items</th>
                <th style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {arsenals.map((key) => (
                <tr key={key.id}>
                  <td className="text-bold">{key.name}</td>
                  <td>{key.description || "N/A"}</td>
                  <td className="text-mono">{key.count || 0} Items</td>
                  <td>
                    <button
                      className="btn btn-danger btn-mini"
                      disabled={exportingId === key.id}
                      onClick={() => {
                        setExportingId(key.id);
                        setTimeout(() => setExportingId(null), 500);
                      }}
                    >
                      Export
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
