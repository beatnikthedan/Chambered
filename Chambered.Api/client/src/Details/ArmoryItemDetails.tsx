import React from "react";
import { ARMORY_STATIC_KEYS } from "../types/formModels";
import type { ExtendedArmoryItem } from "../Cards/ArmoryItemCard";
import AuditFooter from "../components/AuditFooter";
import MarkdownRenderer from "../components/MarkdownRenderer";

export interface ArmoryItemDetailsProps {
  item: ExtendedArmoryItem | null;
  onEdit: () => void;
  onDelete: () => void;
  onAddNew: () => void;
  onDetachAccessory?: (accessoryId: number) => void;
  onAttachAccessory?: () => void;
}

const extractSpecifications = (item: any): Record<string, any> => {
  if (!item) return {};
  const specs: Record<string, any> = {};
  if (item.specifications && typeof item.specifications === "object") {
    Object.assign(specs, item.specifications);
  }
  Object.keys(item).forEach((key) => {
    if (
      !ARMORY_STATIC_KEYS.has(key) &&
      key !== "specifications" &&
      ![
        "product",
        "vault",
        "arsenal",
        "owner",
        "beneficiary",
        "parentItem",
        "accessories",
        "armoryItemDocuments",
        "coverImage",
        "manufacturer",
        "model",
        "caliber",
        "actionType",
        "storageLocation",
        "itemType",
        "isNfaItem",
        "arsenalName",
        "vaultName",
        "productName",
        "manufacturerName",
      ].includes(key) &&
      !key.startsWith("@odata.") &&
      !key.startsWith("odata.")
    ) {
      specs[key] = item[key];
    }
  });
  return specs;
};

export default function ArmoryItemDetails({
  item,
  onEdit,
  onDelete,
  onAddNew,
  onDetachAccessory,
  onAttachAccessory,
}: ArmoryItemDetailsProps) {
  const conditionName =
    typeof item?.condition === "object" && item?.condition
      ? (item.condition as any).name || "Good"
      : typeof item?.condition === "string"
        ? item.condition
        : "Good";

  const accessories = (item?.accessories || []) as ExtendedArmoryItem[];

  const formatCurrency = (val?: number | string | null) => {
    if (val === null || val === undefined || val === "") return "—";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (val?: string | null) => {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleDateString();
    } catch {
      return val;
    }
  };

  const itemType = item?.itemType || "ArmoryItem";
  const displayType = itemType.replace("ArmoryItem", "").replace("Item", "") || item?.product?.productType || "Armory Item";

  return (
    <div className="right-pane-column">
      {/* TOP PANEL: PRIMARY SELECTED ARMORY ITEM DETAILS */}
      <div className="detail-panel">
        {!item ? (
          <div className="empty-detail-state">
            <h3>No Armory Item Selected</h3>
            <p>
              Select an item from the armory list on the left, or register a new
              firearm or accessory.
            </p>
            <button className="add-master-btn" onClick={onAddNew} type="button">
              + Add Armory Item
            </button>
          </div>
        ) : (
          <div className="detail-view-container">
            <div className="detail-panel-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span className="type-badge-pill">{displayType}</span>
                {item.arsenal && (
                  <span
                    className="type-badge-pill"
                    style={{
                      backgroundColor: `${item.arsenal.colorHex || "var(--color-primary)"}22`,
                      color: item.arsenal.colorHex || "var(--color-primary)",
                      borderColor: `${item.arsenal.colorHex || "var(--color-primary)"}55`,
                    }}
                  >
                    {item.arsenal.name}
                  </span>
                )}
                <span className="type-badge-pill" style={{ fontSize: "11px" }}>
                  {conditionName}
                </span>
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
              {/* Product Hero Info */}
              <div className="detail-hero">
                <h2 className="detail-title">{item.name || item.product?.name || "Untitled Item"}</h2>
                <div className="detail-subtitle">
                  {item.product?.manufacturer?.name && (
                    <span className="manufacturer-name">{item.product.manufacturer.name}</span>
                  )}
                  {item.product?.model && <span className="model-name">{item.product.model}</span>}
                  {item.serialNumber && (
                    <span className="serial-number text-mono">SN: {item.serialNumber}</span>
                  )}
                </div>
              </div>

              {/* Cover Image / Image Carousel */}
              {item.coverImage && (
                <div className="detail-image-box">
                  <img
                    src={item.coverImage}
                    alt={item.name || "Item image"}
                    className="detail-main-img"
                  />
                </div>
              )}

              {/* Core Attributes Grid */}
              <div className="detail-section">
                <h4>General Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">{item.status || "Active"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Vault</span>
                    <span className="detail-value">{item.vault?.name || "Unassigned"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Storage Location</span>
                    <span className="detail-value">{item.storageLocation || "—"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Acquisition Date</span>
                    <span className="detail-value">{formatDate(item.acquiredDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Purchase Price</span>
                    <span className="detail-value text-mono">{formatCurrency(item.acquiredPrice)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Current Value</span>
                    <span className="detail-value text-mono">{formatCurrency(item.currentValue)}</span>
                  </div>
                </div>
              </div>

              {/* Specific Subclass Details */}
              {(itemType === "PewArmoryItem" ||
                itemType === "SuppressorArmoryItem" ||
                itemType === "OpticArmoryItem" ||
                itemType === "LightArmoryItem") && (
                <div className="detail-section">
                  <h4>Technical Specifications</h4>
                  <div className="detail-grid">
                    {itemType === "PewArmoryItem" && (
                      <>
                        <div className="detail-item">
                          <span className="detail-label">Round Count</span>
                          <span className="detail-value text-mono">{item.roundCount || 0} rounds</span>
                        </div>
                        {item.barrelLengthInches && (
                          <div className="detail-item">
                            <span className="detail-label">Barrel Length</span>
                            <span className="detail-value">{item.barrelLengthInches}"</span>
                          </div>
                        )}
                        {item.twistRate && (
                          <div className="detail-item">
                            <span className="detail-label">Twist Rate</span>
                            <span className="detail-value">{item.twistRate}</span>
                          </div>
                        )}
                        {item.threadPitch && (
                          <div className="detail-item">
                            <span className="detail-label">Thread Pitch</span>
                            <span className="detail-value">{item.threadPitch}</span>
                          </div>
                        )}
                      </>
                    )}

                    {(itemType === "PewArmoryItem" || itemType === "SuppressorArmoryItem") &&
                      Boolean(item.product?.isNfaItem || (item as any).isNfaItem) &&
                      item.nfaFormType &&
                      item.nfaFormType !== "Unknown" && (
                        <>
                          <div className="detail-item">
                            <span className="detail-label">NFA Form</span>
                            <span className="detail-value">{item.nfaFormType}</span>
                          </div>
                          {item.stampApprovalDate && (
                            <div className="detail-item">
                              <span className="detail-label">Stamp Approval</span>
                              <span className="detail-value">{formatDate(item.stampApprovalDate)}</span>
                            </div>
                          )}
                        </>
                      )}

                    {(itemType === "OpticArmoryItem" || itemType === "LightArmoryItem") &&
                      Boolean(item.product?.hasBattery || (item as any).hasBattery) && (
                        <>
                          {item.batteryLastChangedDate && (
                            <div className="detail-item">
                              <span className="detail-label">Battery Changed</span>
                              <span className="detail-value">{formatDate(item.batteryLastChangedDate)}</span>
                            </div>
                          )}
                          {item.batteryExpirationDate && (
                            <div className="detail-item">
                              <span className="detail-label">Battery Expires</span>
                              <span className="detail-value">{formatDate(item.batteryExpirationDate)}</span>
                            </div>
                          )}
                        </>
                      )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {item.notesMarkdown && (
                <div className="detail-section" style={{ marginTop: "16px" }}>
                  <h4>Notes & Build Log</h4>
                  <div
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    <MarkdownRenderer content={item.notesMarkdown} />
                  </div>
                </div>
              )}

              {/* Dynamic Specifications Key-Value */}
              {(() => {
                const specs = extractSpecifications(item);
                return (
                  Object.keys(specs).length > 0 && (
                    <div className="details-specs-block" style={{ marginTop: "16px" }}>
                      <h3>Custom Specifications</h3>
                      <div className="specs-table">
                        {Object.entries(specs).map(([key, value]) => (
                          <div key={key} className="specs-table-row">
                            <span className="key-col">{key}</span>
                            <span className="val-col">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Audit Properties */}
              <AuditFooter
                created={item.created}
                createdBy={item.createdBy}
                modified={item.modified}
                modifiedBy={item.modifiedBy}
              />
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM PANEL: MOUNTED ACCESSORIES */}
      <div className="detail-panel">
        {!item ? (
          <div className="empty-detail-state">
            <h3>No Item Selected</h3>
            <p>Select an armory item to inspect mounted optics, suppressors, and accessories.</p>
          </div>
        ) : (
          <div className="detail-view-container">
            <div className="detail-panel-header">
              <h3>Mounted Accessories ({accessories.length})</h3>
              {onAttachAccessory && (
                <button
                  type="button"
                  className="btn btn-secondary btn-tiny"
                  onClick={onAttachAccessory}
                >
                  + Attach Accessory
                </button>
              )}
            </div>
            <div className="detail-view-body" style={{ padding: 0 }}>
              {accessories.length === 0 ? (
                <div className="empty-detail-state" style={{ padding: "30px 16px" }}>
                  <p style={{ margin: 0 }}>No accessories currently mounted to this item.</p>
                </div>
              ) : (
                <div style={{ overflowY: "auto", maxHeight: "100%" }}>
                  <table className="app-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-input)", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "8px 10px" }}>Accessory</th>
                        <th style={{ padding: "8px 10px" }}>Type</th>
                        <th style={{ padding: "8px 10px" }}>Serial Number</th>
                        <th style={{ padding: "8px 10px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessories.map((acc) => {
                        const accType = acc.itemType?.replace("ArmoryItem", "") || acc.product?.productType || "Accessory";
                        return (
                          <tr key={acc.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "6px 10px", fontWeight: 600 }}>
                              {acc.name || acc.product?.name || `Accessory #${acc.id}`}
                            </td>
                            <td style={{ padding: "6px 10px" }}>
                              <span className="type-badge-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>
                                {accType}
                              </span>
                            </td>
                            <td style={{ padding: "6px 10px", fontFamily: "monospace", color: "var(--color-primary)" }}>
                              {acc.serialNumber || "—"}
                            </td>
                            <td style={{ padding: "6px 10px", textAlign: "right" }}>
                              {onDetachAccessory && (
                                <button
                                  type="button"
                                  className="btn-tiny btn-secondary"
                                  style={{ color: "#ff5252", fontSize: "11px" }}
                                  onClick={() => onDetachAccessory(acc.id!)}
                                >
                                  Detach
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
