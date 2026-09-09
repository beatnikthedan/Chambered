import React, { useState } from "react";
import type { Vault } from "../api/models/vault";
import AuditFooter from "../components/AuditFooter";

export interface ExtendedVault extends Vault {
  temperature?: number;
  humidity?: number;
  capacity?: number;
  securityLevel?: string;
  storedItems?: any[];
  children?: ExtendedVault[];
  [key: string]: any;
}

export interface VaultDetailsProps {
  vault: ExtendedVault | null;
  onEdit: () => void;
  onDelete: () => void;
  onAddNew: () => void;
}

export default function VaultDetails({
  vault,
  onEdit,
  onDelete,
  onAddNew,
}: VaultDetailsProps) {
  const [showPasscode, setShowPasscode] = useState(false);

  const linkedProduct = vault?.product;
  const arsenal = vault?.arsenal;
  const items = vault?.armoryItems || [];

  return (
    <div className="right-pane-column">
      {/* TOP PANEL: PRIMARY VAULT DETAILS */}
      <div className="detail-panel">
        {!vault ? (
          <div className="empty-detail-state">
            <h3>No Vault Selected</h3>
            <p>Select a vault on the left to inspect its details.</p>
            <button
              type="button"
              className="add-master-btn"
              onClick={onAddNew}
            >
              + Add Vault
            </button>
          </div>
        ) : (
          <div className="detail-view-container">
            <div className="detail-panel-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="type-badge-pill">Vault #{vault.id}</span>
                {arsenal && (
                  <span
                    className="type-badge-pill"
                    style={{
                      backgroundColor: `${arsenal.colorHex || "var(--color-primary)"}22`,
                      color: arsenal.colorHex || "var(--color-primary)",
                      borderColor: `${arsenal.colorHex || "var(--color-primary)"}55`,
                    }}
                  >
                    {arsenal.name}
                  </span>
                )}
              </div>
              <div className="header-actions">
                <button
                  type="button"
                  className="btn btn-secondary edit-btn"
                  onClick={onEdit}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn delete-btn"
                  onClick={onDelete}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="detail-view-body">
              <div style={{ marginBottom: "8px" }}>
                <h2 style={{ margin: 0 }}>{vault.name}</h2>
              </div>

              {vault.description && (
                <p className="detail-desc">{vault.description}</p>
              )}

              <div className="detail-section" style={{ marginTop: "16px" }}>
                <h4>Security & Location Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Parent Vault</span>
                    <span className="detail-value">
                      {vault.parentVault?.name || (vault.parentVaultId ? `Vault #${vault.parentVaultId}` : "None (Root)")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Passcode Hint</span>
                    <span className="detail-value">{vault.passcodeHint || "—"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Passcode</span>
                    <span className="detail-value">
                      {vault.encryptedPasscode ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <span>{showPasscode ? vault.encryptedPasscode : "••••••••"}</span>
                          <button
                            type="button"
                            className="btn-tiny"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: "0 4px",
                              color: "var(--color-primary)",
                              textDecoration: "underline",
                            }}
                            onClick={() => setShowPasscode((prev) => !prev)}
                          >
                            {showPasscode ? "Hide" : "Show"}
                          </button>
                        </span>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Backup Key Location</span>
                    <span className="detail-value">{vault.backupKeyLocation || "—"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Max Target Humidity</span>
                    <span className="detail-value">
                      {vault.targetMaxHumidityPercent ? `${vault.targetMaxHumidityPercent}%` : "—"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Dehumidifier</span>
                    <span className="detail-value">
                      {vault.hasDehumidifier ? "Installed" : "None"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Security Product Section */}
              {linkedProduct && (
                <div className="detail-section" style={{ marginTop: "16px" }}>
                  <h4>Linked Security Model</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Manufacturer</span>
                      <span className="detail-value">{linkedProduct.manufacturer?.name || "Unknown"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Model</span>
                      <span className="detail-value">{linkedProduct.name}</span>
                    </div>
                    {linkedProduct.partNumber && (
                      <div className="detail-item">
                        <span className="detail-label">Part Number</span>
                        <span className="detail-value font-mono">{linkedProduct.partNumber}</span>
                      </div>
                    )}
                    {(linkedProduct as any).lockType && (
                      <div className="detail-item">
                        <span className="detail-label">Lock Type</span>
                        <span className="detail-value">{(linkedProduct as any).lockType}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Properties */}
              <AuditFooter
                created={vault.created}
                createdBy={vault.createdBy}
                modified={vault.modified}
                modifiedBy={vault.modifiedBy}
              />
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM PANEL: RELATED ARMORY ITEMS */}
      <div className="detail-panel">
        {!vault ? (
          <div className="empty-detail-state">
            <h3>No Vault Selected</h3>
            <p>Select a vault to inspect associated armory items.</p>
          </div>
        ) : (
          <div className="detail-view-container">
            <div className="detail-panel-header">
              <h3>Armory Items ({items.length})</h3>
            </div>
            <div className="detail-view-body" style={{ padding: 0 }}>
              {items.length === 0 ? (
                <div className="empty-detail-state" style={{ padding: "30px 16px" }}>
                  <p style={{ margin: 0 }}>No armory items stored in this vault.</p>
                </div>
              ) : (
                <div
                  style={{
                    overflowY: "auto",
                    maxHeight: "100%",
                  }}
                >
                  <table className="app-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-input)", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "8px 10px" }}>Serial Number</th>
                        <th style={{ padding: "8px 10px" }}>Name</th>
                        <th style={{ padding: "8px 10px" }}>Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "6px 10px", fontFamily: "monospace", color: "var(--color-primary)" }}>
                            {item.serialNumber || "—"}
                          </td>
                          <td style={{ padding: "6px 10px" }}>{item.name || "—"}</td>
                          <td style={{ padding: "6px 10px", color: "var(--text-muted)" }}>{item.model || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
