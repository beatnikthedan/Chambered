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
  usePutArsenalsFromKey,
  useDeleteArsenalsFromKey,
  useGetUsersUsers,
} from "../api/endpoints";

export default function ArsenalSettings() {
  const store = useStore();
  const queryClient = useQueryClient();
  const [arsenals, setArsenals] = useState([]);
  const [selectedArsenal, setSelectedArsenal] = useState(null);
  const [showArsenalForm, setShowArsenalForm] = useState(false);
  const [isEditArsenalMode, setIsEditArsenalMode] = useState(false);
  const [arsenalSaveSuccess, setArsenalSaveSuccess] = useState(false);

  const {
    data: usersData,
    isLoading: loadingUsers,
    error: usersError,
    refetch: refetchUsersList,
  } = useGetUsersUsers();

  const users = usersData?.data ?? [];

  const updateArsenalMutation = usePutArsenalsFromKey({
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
      ChamberedUsers: selectedUserIds.map((uid) => ({ id: uid })),
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
  } = useGetArsenals({
    expand: "ChamberedUsers",
  });

  useEffect(() => {
    if (arsenalsData?.data?.value) {
      setArsenals(arsenalsData.data.value);
    }
  }, [arsenalsData]);

  const openCreateModal = () => {
    setIsEditArsenalMode(false);
    setSelectedUserIds([]);
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
    const usersList = arsenal.ChamberedUsers || arsenal.chamberedUsers || [];
    setSelectedUserIds(usersList.map((u) => u.id));
    setSelectedArsenal({ ...arsenal });
    setShowArsenalForm(true);
  };

  const savingArsenal =
    createArsenalMutation.isPending || updateArsenalMutation.isPending;

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const filteredUsers = users.filter((u) =>
    u?.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "calc(100vh - 80px)", // Adjust height to account for top navbar
            backgroundColor: "#0b0d14",
            color: "#d1d6e3",
            boxSizing: "border-box",
          }}
        >
          {/* MODAL OVERLAY (Darkened background behind popup) */}
          <div className="dialog-overlay">
            {/* MODAL CONTAINER (Wider container to fit two panes side-by-side) */}
            <div className="dialog-overlay">
              <div
                className="dialog-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "500px",
                  maxWidth: "95vw",
                  maxHeight: "85vh",
                  overflowY: "auto",
                  padding: "24px",
                  backgroundColor: "#13151f",
                  boxSizing: "border-box",
                }}
              >
                <h4 className="dialog-title" style={{ margin: "0 0 16px 0" }}>
                  {isEditArsenalMode ? "Edit Arsenal" : "Create New Arsenal"}
                </h4>

                <form
                  onSubmit={handleSaveArsenal}
                  className="dialog-form"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {/* 1. Arsenal Name */}
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

                  {/* 2. Description */}
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

                  {/* 3. User Access Permissions (Placed under Description) */}
                  <div
                    className="form-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#9ca3af",
                          textTransform: "uppercase",
                        }}
                      >
                        User Access Permissions
                      </label>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        {selectedUserIds.length} Selected
                      </span>
                    </div>

                    {/* Search Filter */}
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        backgroundColor: "#1c1f2e",
                        border: "1px solid #292c39",
                        borderRadius: "6px",
                        color: "#d1d6e3",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />

                    {/* User Selection Container */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        maxHeight: "140px",
                        overflowY: "auto",
                        padding: "8px",
                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                        border: "1px solid #292c39",
                        borderRadius: "6px",
                        minHeight: "42px",
                        alignItems: "center",
                      }}
                    >
                      {/* Handling API States */}
                      {loadingUsers && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            padding: "4px",
                          }}
                        >
                          Loading users...
                        </span>
                      )}

                      {usersError && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#ef4444",
                            padding: "4px",
                          }}
                        >
                          Failed to load users.
                        </span>
                      )}

                      {!loadingUsers &&
                        !usersError &&
                        filteredUsers.length === 0 && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              padding: "4px",
                            }}
                          >
                            No users found.
                          </span>
                        )}

                      {/* Map over filtered users */}
                      {!loadingUsers &&
                        !usersError &&
                        filteredUsers.map((user) => {
                          const userId = user.id;
                          const isSelected = selectedUserIds.includes(user.id);
                          const displayName =
                            user.username ?? user.name ?? "Unknown User";

                          return (
                            <button
                              key={userId}
                              type="button"
                              onClick={() => toggleUser(userId)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 10px",
                                borderRadius: "16px",
                                fontSize: "12px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                border: isSelected
                                  ? "1px solid #3b82f6"
                                  : "1px solid #292c39",
                                backgroundColor: isSelected
                                  ? "rgba(59, 130, 246, 0.15)"
                                  : "#13151f",
                                color: isSelected ? "#60a5fa" : "#9ca3af",
                              }}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{displayName}</span>
                            </button>
                          );
                        })}
                    </div>

                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      Click users to grant or revoke access to this arsenal.
                    </span>
                  </div>

                  {/* 4. Color Accent Picker */}
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

                  {/* 5. Icon Selector */}
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
                        maxHeight: "140px",
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

                  {/* Form Actions */}
                  <div
                    className="dialog-actions"
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                    }}
                  >
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
          </div>
        </div>
      )}
    </section>
  );
}
