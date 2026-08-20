import React, { useState } from "react";

// Fallback constants if not imported externally
const DEFAULT_PRESET_COLORS = [
  "#2563EB",
  "#DC2626",
  "#16A34A",
  "#D97706",
  "#9333EA",
  "#06B6D4",
];

const DEFAULT_ICONS = {
  shield: (color, size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  ),
  vault: (color, size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
    </svg>
  ),
};

// Fallback SubmitButton if not defined elsewhere
const FallbackSubmitButton = ({ isSaving, saveSuccess, isEditMode }) => (
  <button type="submit" className="btn btn-primary" disabled={isSaving}>
    {isSaving
      ? "Saving..."
      : saveSuccess
        ? "Saved!"
        : isEditMode
          ? "Update"
          : "Create"}
  </button>
);

export default function ArsenalSettings({
  store = { arsenals: [], activeArsenalId: null, selectArsenal: () => {} },
  ARSENAL_ICONS = DEFAULT_ICONS,
  ARSENAL_PRESET_COLORS = DEFAULT_PRESET_COLORS,
  SubmitButton = FallbackSubmitButton,
}) {
  // Modal & Form States
  const [showArsenalForm, setShowArsenalForm] = useState(false);
  const [isEditArsenalMode, setIsEditArsenalMode] = useState(false);
  const [editingArsenalId, setEditingArsenalId] = useState(null);
  const [savingArsenal, setSavingArsenal] = useState(false);
  const [arsenalSaveSuccess, setArsenalSaveSuccess] = useState(false);

  const [arsenalForm, setArsenalForm] = useState({
    name: "",
    description: "",
    iconName: "shield",
    colorHex: "#2563EB",
  });

  // Modal Reset Handler
  const resetForm = () => {
    setShowArsenalForm(false);
    setIsEditArsenalMode(false);
    setEditingArsenalId(null);
    setArsenalForm({
      name: "",
      description: "",
      iconName: "shield",
      colorHex: "#2563EB",
    });
  };

  // Open Edit Mode
  const openEditArsenalModal = (arsenal) => {
    setEditingArsenalId(arsenal.id);
    setIsEditArsenalMode(true);
    setArsenalForm({
      name: arsenal.name || "",
      description: arsenal.description || "",
      iconName: arsenal.iconName || "shield",
      colorHex: arsenal.colorHex || "#2563EB",
    });
    setShowArsenalForm(true);
  };

  // Action Placeholders
  const handleDeleteArsenal = (id) => {
    if (window.confirm("Are you sure you want to delete this arsenal?")) {
      store.deleteArsenal?.(id);
    }
  };

  const handleSaveArsenal = (e) => {
    e.preventDefault();
    setSavingArsenal(true);

    // Mock API Save Execution
    setTimeout(() => {
      if (isEditArsenalMode) {
        store.updateArsenal?.(editingArsenalId, arsenalForm);
      } else {
        store.createArsenal?.(arsenalForm);
      }
      setSavingArsenal(false);
      setArsenalSaveSuccess(true);
      setTimeout(() => {
        setArsenalSaveSuccess(false);
        resetForm();
      }, 500);
    }, 400);
  };

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Manage Arsenals</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowArsenalForm(true)}
        >
          Create New Arsenal
        </button>
      </div>
      <p className="sec-subtitle">
        Create and organize isolated Arsenals. Each Arsenal contains its own
        independent armory items and ammunition lots.
      </p>

      {store.arsenals.length === 0 ? (
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
                <th>Status / Context</th>
                <th style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.arsenals.map((ars) => (
                <tr key={ars.id}>
                  <td
                    className="text-bold"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: `${ars.colorHex || "#2563eb"}1A`,
                      }}
                    >
                      {ARSENAL_ICONS[ars.iconName || "shield"]?.(
                        ars.colorHex || "#2563eb",
                      )}
                    </span>
                    {ars.name}
                  </td>
                  <td>{ars.description || "No description provided"}</td>
                  <td>
                    {ars.id === store.activeArsenalId ? (
                      <span className="badge badge-success">
                        Active Arsenal
                      </span>
                    ) : (
                      <span
                        className="badge badge-secondary"
                        style={{ cursor: "pointer" }}
                        onClick={() => store.selectArsenal(ars.id)}
                      >
                        Click to Switch
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-secondary"
                        onClick={() => openEditArsenalModal(ars)}
                        style={{
                          width: "74px",
                          height: "32px",
                          padding: "0",
                          fontSize: "12px",
                          fontWeight: "500",
                          justifyContent: "center",
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={store.arsenals.length <= 1}
                        onClick={() => handleDeleteArsenal(ars.id)}
                        title="Remove arsenal and all its items"
                        style={{
                          width: "74px",
                          height: "32px",
                          padding: "0",
                          fontSize: "12px",
                          fontWeight: "500",
                          justifyContent: "center",
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit collection modal form */}
      {showArsenalForm && (
        <div className="dialog-overlay" onClick={resetForm}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <h4 className="dialog-title">
              {isEditArsenalMode ? "Edit Arsenal" : "Create New Arsenal"}
            </h4>
            <form onSubmit={handleSaveArsenal} className="dialog-form">
              <div className="form-group">
                <label>Arsenal Name</label>
                <input
                  type="text"
                  value={arsenalForm.name}
                  onChange={(e) =>
                    setArsenalForm({
                      ...arsenalForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Hunting Vault, Tactical Vault"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={arsenalForm.description}
                  onChange={(e) =>
                    setArsenalForm({
                      ...arsenalForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe this arsenal..."
                  rows="3"
                  className="form-textarea-abs"
                />
              </div>

              <div className="form-group">
                <label>Color Accent</label>
                <div
                  className="color-picker-grid"
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "8px",
                  }}
                >
                  {ARSENAL_PRESET_COLORS.map((col) => (
                    <div
                      key={col}
                      onClick={() =>
                        setArsenalForm({
                          ...arsenalForm,
                          colorHex: col,
                        })
                      }
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: col,
                        cursor: "pointer",
                        border:
                          arsenalForm.colorHex === col
                            ? "3px solid var(--text-primary)"
                            : "2px solid rgba(255,255,255,0.1)",
                        boxShadow:
                          arsenalForm.colorHex === col
                            ? "0 0 8px " + col
                            : "none",
                        transition: "all 0.2s ease",
                      }}
                    />
                  ))}
                  <div
                    style={{
                      position: "relative",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <input
                      type="color"
                      value={arsenalForm.colorHex}
                      onChange={(e) =>
                        setArsenalForm({
                          ...arsenalForm,
                          colorHex: e.target.value,
                        })
                      }
                      style={{
                        position: "absolute",
                        top: "-8px",
                        left: "-8px",
                        width: "48px",
                        height: "48px",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Icon Identifier
                </label>
                <div
                  className="icon-selector-scroll-container"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "10px",
                    maxHeight: "160px",
                    overflowY: "auto",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-solid)",
                    background: "rgba(0,0,0,0.15)",
                  }}
                >
                  {Object.keys(ARSENAL_ICONS).map((iconKey) => (
                    <div
                      key={iconKey}
                      onClick={() =>
                        setArsenalForm({
                          ...arsenalForm,
                          iconName: iconKey,
                        })
                      }
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px",
                        borderRadius: "var(--radius-sm)",
                        background:
                          arsenalForm.iconName === iconKey
                            ? "rgba(255, 255, 255, 0.05)"
                            : "transparent",
                        border:
                          arsenalForm.iconName === iconKey
                            ? `1px solid ${arsenalForm.colorHex}`
                            : "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        color:
                          arsenalForm.iconName === iconKey
                            ? arsenalForm.colorHex
                            : "var(--text-muted)",
                        transition: "all 0.2s",
                      }}
                    >
                      {ARSENAL_ICONS[iconKey](
                        arsenalForm.iconName === iconKey
                          ? arsenalForm.colorHex
                          : "var(--text-muted)",
                        20,
                      )}
                      <span
                        style={{
                          fontSize: "10px",
                          marginTop: "4px",
                          textTransform: "capitalize",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        {iconKey}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dialog-actions" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <SubmitButton
                  isSaving={savingArsenal}
                  saveSuccess={arsenalSaveSuccess}
                  isEditMode={isEditArsenalMode}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
