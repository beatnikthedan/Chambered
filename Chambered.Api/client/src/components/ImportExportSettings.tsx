import React, { useState } from "react";

export default function ImportExportSettings({
  store = {
    arsenals: [
      { id: "a1", name: "Hunting Vault", count: 12 },
      { id: "a2", name: "Tactical Locker", count: 8 },
    ],
  },
}) {
  const [exportingId, setExportingId] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [importingType, setImportingType] = useState(null);

  // Individual Arsenal Export Handler
  const handleExportArsenal = (arsenalId, arsenalName) => {
    setExportingId(arsenalId);
    setTimeout(() => {
      setExportingId(null);
      alert(`Exported "${arsenalName}" data archive (.json) successfully!`);
    }, 500);
  };

  // Full System Export Handler
  const handleExportAll = () => {
    setExportingAll(true);
    setTimeout(() => {
      setExportingAll(false);
      alert("Full system backup package (.json) downloaded!");
    }, 800);
  };

  // File Import Simulator
  const handleFileImport = (type) => {
    setImportingType(type);
    setTimeout(() => {
      setImportingType(null);
      alert(`Imported ${type} catalog records successfully!`);
    }, 600);
  };

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Data Import & Export</h3>
        <button
          className="btn btn-primary"
          onClick={handleExportAll}
          disabled={exportingAll}
        >
          {exportingAll
            ? "Generating Export..."
            : "Export Complete System (.JSON)"}
        </button>
      </div>
      <p className="sec-subtitle">
        Export isolated arsenal inventories, bulk migrate open-source
        manufacturer catalog standards, or import pre-built product database
        definitions.
      </p>

      {/* SECTION 1: ARSENAL EXPORTS */}
      <div style={{ margin: "1.5rem 0" }}>
        <h4
          style={{
            fontSize: "0.9rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.75rem",
          }}
        >
          Selective Arsenal Exports
        </h4>
        <div className="table-container">
          <table
            className="settings-table"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <thead>
              <tr>
                <th style={{ width: "auto" }}>Arsenal Name</th>
                <th style={{ width: "auto" }}>Description</th>
                <th style={{ width: "15%" }}>Total Tracked Items</th>
                <th style={{ width: "30%", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.arsenals.map((ars) => (
                <tr key={ars.id}>
                  <td
                    className="text-bold"
                    style={{ color: ars.colorHex || "#ffffff" }}
                  >
                    {ars.name}
                  </td>
                  <td className="text-normal">{ars.description}</td>
                  <td>{ars.count || 0} Items</td>
                  {/* Group both buttons inside ONE <td> with Flexbox */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-secondary btn-mini"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => handleExportJson(ars.id)}
                      >
                        Export JSON
                      </button>
                      <button
                        className="btn btn-secondary btn-mini"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={() => handleExportCsv(ars.id)}
                      >
                        Export CSV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: CATALOG DATA IMPORTS */}
      <div style={{ marginTop: "2rem" }}>
        <h4
          style={{
            fontSize: "0.9rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.75rem",
          }}
        >
          Reference Catalog Imports
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          {/* Manufacturers Import Box */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              padding: "1.25rem",
              borderRadius: "8px",
            }}
          >
            <h5 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
              Import Manufacturer Data
            </h5>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#5e6673",
                marginBottom: "1rem",
              }}
            >
              Import community-maintained manufacturer registries, calibers, and
              factory brand definitions.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => handleFileImport("Manufacturers")}
              disabled={importingType === "Manufacturers"}
            >
              {importingType === "Manufacturers"
                ? "Importing..."
                : "Import Manufacturers (.CSV / .JSON)"}
            </button>
          </div>

          {/* Products Import Box */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              padding: "1.25rem",
              borderRadius: "8px",
            }}
          >
            <h5 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
              Import Product Catalog
            </h5>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#5e6673",
                marginBottom: "1rem",
              }}
            >
              Bulk load pre-configured bullet weights, optic specs, cartridge
              dimensions, and factory SKUs.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => handleFileImport("Products")}
              disabled={importingType === "Products"}
            >
              {importingType === "Products"
                ? "Importing..."
                : "Import Products (.CSV / .JSON)"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
