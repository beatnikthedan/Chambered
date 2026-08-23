import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";

import {
  ARSENAL_ICONS,
  ARSENAL_PRESET_COLORS,
} from "../components/ArsenalIcons";
import SubmitButton from "../components/SubmitButton";

import {
  useGetArsenals,
  usePostArsenals,
  usePatchArsenalsFromKey,
  useDeleteArsenalsFromKey,
} from "../api/endpoints";

export default function ArsenalSettings() {
  const store = useStore();
  const queryClient = useQueryClient();
  const [arsenals, setArsenals] = useState([]);
  const [selectedArsenal, setSelectedArsenal] = useState(null);
  const [showArsenalForm, setShowArsenalForm] = useState(false);
  const [isEditArsenalMode, setIsEditArsenalMode] = useState(false);
  const [arsenalSaveSuccess, setArsenalSaveSuccess] = useState(false);

  const updateArsenalMutation = usePatchArsenalsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Arsenals"] });
        setArsenalSaveSuccess(true);
        setTimeout(() => setArsenalSaveSuccess(false), 2000);
      },
      onError: (err) => {
        alert("Failed to save changes: " + (err?.message || "Unknown error"));
      },
    },
  });

  const createArsenalMutation = usePostArsenals({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Arsenals"] });
        setArsenalSaveSuccess(true);
        setTimeout(() => setArsenalSaveSuccess(false), 2000);
      },
      onError: (err) => {
        alert("Failed to create arsenal: " + (err?.message || "Unknown error"));
      },
    },
  });

  const deleteArsenalMutation = useDeleteArsenalsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Arsenals"] });
      },
      onError: (err) => {
        alert(
          "Failed to delete arsenal. Make sure no items or sub-arsenals depend on it.",
        );
      },
    },
  });

  const handleDelete = async (arsenalId) => {
    if (arsenalId > 0) {
      try {
        await deleteArsenalMutation.mutateAsync({ key: arsenalId });
      } catch (err) {
        console.error("Error deleting arsenal", err);
      }
    }
  };

  const handleSaveArsenal = async (e) => {
    e.preventDefault();
    if (!selectedArsenal || !selectedArsenal.name.trim()) return;

    const payload = {
      id: selectedArsenal.id || 0,
      name: selectedArsenal.name || "",
      description: selectedArsenal.description || null,
      colorHex: selectedArsenal.colorHex || "#2563eb",
      iconName: selectedArsenal.iconName || "shield",
    };

    try {
      if (isEditArsenalMode) {
        await updateArsenalMutation.mutateAsync({
          key: selectedArsenal.id,
          data: payload,
        });
      } else {
        await createArsenalMutation.mutateAsync({
          data: payload,
        });
      }
      setShowArsenalForm(false);
    } catch (err) {
      console.error("Error saving arsenal", err);
    }
  };

  const {
    data: arsenalsData,
    isLoading: arsenalsAreLoading,
    error: arsenalsError,
  } = useGetArsenals();

  useEffect(() => {
    if (arsenalsData?.data?.value) {
      setArsenals(arsenalsData.data.value);
    }
  }, [arsenalsData]);

  const openCreateModal = () => {
    setIsEditArsenalMode(false);
    setSelectedArsenal({
      id: 0,
      name: "",
      description: "",
      colorHex: "#2563eb",
      iconName: "shield",
    });
    setShowArsenalForm(true);
  };

  const openEditModal = (arsenal) => {
    setIsEditArsenalMode(true);
    setSelectedArsenal({ ...arsenal });
    setShowArsenalForm(true);
  };

  const savingArsenal =
    createArsenalMutation.isPending || updateArsenalMutation.isPending;

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Manage Arsenals</h3>
        <button className="btn btn-primary" onClick={() => openCreateModal()}>
          Create New Arsenal
        </button>
      </div>
      <p className="sec-subtitle">
        Create and organize isolated Arsenals. Each Arsenal contains its own
        independent armory items and ammunition lots.
      </p>
      {arsenalsAreLoading ? (
        <div className="loading-spinner-box">
          <div className="spinner"></div>
          <p>Analyzing arsenals...</p>
        </div>
      ) : arsenalsError ? (
        <div className="arsenals-error-card">
          <span className="err-icon">⚠️</span>
          <p>{arsenalsError?.message || "Failed to load arsenals"}</p>
          <button
            className="btn btn-secondary btn-small"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["/api/v1/Arsenals"] })
            }
          >
            Retry
          </button>
        </div>
      ) : arsenals.length === 0 ? (
        <div className="empty-state panel">
          <h3>You have no items in your Arsenals.</h3>
          <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
            Click 'Add Item' above to add your first item.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Arsenal Name</th>
                <th>Description</th>
                <th>Status</th>
                <th align="center" style={{ width: "120px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {arsenals.map((arsenal) => (
                <tr key={arsenal.id}>
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
                        background: `${arsenal.colorHex || "#000000"}ff`,
                      }}
                    >
                      {ARSENAL_ICONS[arsenal.iconName || "shield"]?.(
                        arsenal.colorHex || "#2563eb",
                      )}
                    </span>
                    {arsenal.name}
                  </td>
                  <td>{arsenal.description || "No description provided"}</td>
                  <td>
                    {arsenal.id === store.activeArsenalId ? (
                      <span className="badge badge-success">
                        Active Arsenal
                      </span>
                    ) : (
                      <span
                        className="badge badge-secondary"
                        style={{ cursor: "pointer" }}
                        onClick={() => store.selectArsenal(arsenal.id)}
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
                        className="btn-action-edit"
                        onClick={() => openEditModal(arsenal)}
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
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          className="pencil-icon"
                        >
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="btn-action-delete"
                        disabled={store.arsenals.length <= 1}
                        onClick={() => handleDelete(arsenal.id)}
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
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          className="trash-icon"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

      {/* Create/Edit collection modal form */}
      {showArsenalForm && selectedArsenal && (
        <div className="dialog-overlay">
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <h4 className="dialog-title">
              {isEditArsenalMode ? "Edit Arsenal" : "Create New Arsenal"}
            </h4>
            <form onSubmit={handleSaveArsenal} className="dialog-form">
              <div className="form-group">
                <label>Arsenal Name</label>
                <input
                  type="text"
                  value={selectedArsenal.name}
                  onChange={(e) =>
                    setSelectedArsenal({
                      ...selectedArsenal,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Hunting Arsenal, Tactical Arsenal"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={selectedArsenal.description || ""}
                  onChange={(e) =>
                    setSelectedArsenal({
                      ...selectedArsenal,
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
                        setSelectedArsenal({
                          ...selectedArsenal,
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
                          selectedArsenal.colorHex === col
                            ? "3px solid var(--text-primary)"
                            : "2px solid rgba(255,255,255,0.1)",
                        boxShadow:
                          selectedArsenal.colorHex === col
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
                      value={selectedArsenal.colorHex || "#2563eb"}
                      onChange={(e) =>
                        setSelectedArsenal({
                          ...selectedArsenal,
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
                        setSelectedArsenal({
                          ...selectedArsenal,
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
                          selectedArsenal.iconName === iconKey
                            ? "rgba(255, 255, 255, 0.05)"
                            : "transparent",
                        border:
                          selectedArsenal.iconName === iconKey
                            ? `1px solid ${selectedArsenal.colorHex}`
                            : "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        color:
                          selectedArsenal.iconName === iconKey
                            ? selectedArsenal.colorHex
                            : "var(--text-muted)",
                        transition: "all 0.2s",
                      }}
                    >
                      {ARSENAL_ICONS[iconKey](
                        selectedArsenal.iconName === iconKey
                          ? selectedArsenal.colorHex
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
                  onClick={() => setShowArsenalForm(false)}
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
