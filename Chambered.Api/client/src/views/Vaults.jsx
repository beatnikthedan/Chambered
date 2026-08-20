import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import "./Vaults.css";
import BatteryTracker from "../components/BatteryTracker";
import SubmitButton from "../components/SubmitButton";
import VaultCard from "../components/VaultCard";

import {
  useGetVaults,
  useGetProducts,
  usePostVaults,
  usePatchVaultsFromKey,
  useDeleteVaultsFromKey,
} from "../api/endpoints";

export default function Vaults() {
  const queryClient = useQueryClient();

  //global state store
  const store = useStore();
  const { enums } = store;
  const activeArsenal = store.arsenals.find(
    (a) => a.id === store.activeArsenalId,
  );

  // Local state
  const [vaults, setVaults] = useState([]);

  // UI state
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "tree"
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // "general", "security", "inventory"
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});

  const [selectedVault, setSelectedVault] = useState(null);

  const updateVaultMutation = usePatchVaultsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Vaults"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      },
      onError: (err) => {
        alert("Failed to save changes: " + (err?.message || "Unknown error"));
      },
    },
  });

  const createVaultMutation = usePostVaults({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Vaults"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      },
      onError: (err) => {
        alert("Failed to create vault: " + (err?.message || "Unknown error"));
      },
    },
  });

  const deleteVaultMutation = useDeleteVaultsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Vaults"] });
        setDeleteConfirmId(null);
        setShowModal(false);
      },
      onError: (err) => {
        alert(
          "Failed to delete vault. Make sure no items or sub-vaults depend on it.",
        );
      },
    },
  });

  const handleDelete = async () => {
    if (selectedVault?.id) {
      try {
        await deleteVaultMutation.mutateAsync({ key: selectedVault.id });
      } catch (err) {
        console.error("Error deleting vault", err);
      }
    }
  };

  const {
    data: vaultsData,
    isLoading: vaultsAreLoading,
    error: vaultsError,
  } = useGetVaults({
    filter: store.activeArsenalId
      ? `arsenalId eq ${store.activeArsenalId}`
      : undefined,
    expand: "product($expand=manufacturer),armoryItems,arsenal",
  });

  useEffect(() => {
    if (vaultsData?.data?.value) {
      setVaults(vaultsData.data.value);
    }
  }, [vaultsData]);

  const {
    data: productData,
    isLoading: productsAreLoading,
    error: productsError,
  } = useGetProducts({
    filter: "productType eq 'Security'",
    expand: "manufacturer",
  });

  const products = productData?.data?.value || [];
  const error = vaultsError?.message || productsError?.message || "";

  const vaultTree = useMemo(() => {
    const map = {};
    vaults.forEach((v) => {
      map[v.id] = { ...v, children: [] };
    });

    const roots = [];
    vaults.forEach((v) => {
      const node = map[v.id];
      if (v.parentVaultId && map[v.parentVaultId]) {
        map[v.parentVaultId].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [vaults]);

  // Filter out current vault and its descendants from the parent vault options list to prevent circular reference loops
  const eligibleParentVaults = useMemo(() => {
    if (!isEditMode || !selectedVault) return vaults;

    const getDescendantIds = (vaultId) => {
      const ids = [];
      const children = vaults.filter((v) => v.parentVaultId === vaultId);
      children.forEach((c) => {
        ids.push(c.id);
        ids.push(...getDescendantIds(c.id));
      });
      return ids;
    };

    const forbiddenIds = [
      selectedVault.id,
      ...getDescendantIds(selectedVault.id),
    ];
    return vaults.filter((v) => !forbiddenIds.includes(v.id));
  }, [vaults, isEditMode, selectedVault?.id]);

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setActiveTab("general");
    setShowPassword(false);
    setSelectedVault({
      id: 0,
      name: "",
      description: "",
      arsenalId: store.activeArsenalId || store.arsenals[0]?.id || 1,
      parentVaultId: null,
      productId: null,
      encryptedPasscode: "",
      passcodeHint: "",
      backupKeyLocation: "",
      batteryLastChangedDate: null,
      batteryExpirationDate: null,
      hasDehumidifier: false,
      dehumidifierLastServiced: null,
      targetMaxHumidityPercent: 45,
    });
    setShowModal(true);
  };

  const openEditModal = (vault) => {
    setIsEditMode(true);
    setActiveTab("general");
    setShowPassword(false);
    setSelectedVault(vault);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedVault?.name?.trim()) return;

    setIsSaving(true);
    const targetArsenalId =
      parseInt(selectedVault.arsenalId) || store.activeArsenalId || 1;

    const {
      product,
      arsenal,
      parentVault,
      childVaults,
      armoryItem,
      ...cleanVault
    } = selectedVault;

    const payload = {
      ...cleanVault,
      description: cleanVault.description || null,
      parentVaultId: cleanVault.parentVaultId
        ? parseInt(cleanVault.parentVaultId)
        : null,
      encryptedPasscode: cleanVault.encryptedPasscode || null,
      passcodeHint: cleanVault.passcodeHint || null,
      backupKeyLocation: cleanVault.backupKeyLocation || null,
      productId: cleanVault.productId ? parseInt(cleanVault.productId) : null,
      arsenalId: targetArsenalId,
      batteryLastChangedDate:
        cleanVault.batteryLastChangedDate &&
        String(cleanVault.batteryLastChangedDate).trim()
          ? new Date(cleanVault.batteryLastChangedDate).toISOString()
          : null,
      batteryExpirationDate:
        cleanVault.batteryExpirationDate &&
        String(cleanVault.batteryExpirationDate).trim()
          ? new Date(cleanVault.batteryExpirationDate).toISOString()
          : null,
      hasDehumidifier: !!cleanVault.hasDehumidifier,
      dehumidifierLastServiced:
        cleanVault.dehumidifierLastServiced &&
        String(cleanVault.dehumidifierLastServiced).trim()
          ? new Date(cleanVault.dehumidifierLastServiced).toISOString()
          : null,
      targetMaxHumidityPercent: cleanVault.hasDehumidifier
        ? parseInt(cleanVault.targetMaxHumidityPercent)
        : null,
    };

    try {
      if (isEditMode) {
        payload.id = parseInt(selectedVault.id);
        await updateVaultMutation.mutateAsync({
          key: payload.id,
          data: payload,
        });
      } else {
        await createVaultMutation.mutateAsync({ data: payload });
      }
    } catch (err) {
      console.error("Error saving vault", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      try {
        await deleteVaultMutation.mutateAsync({ key: deleteConfirmId });
      } catch (err) {
        console.error("Error deleting vault", err);
      }
    }
  };

  return (
    <div className="vaults-container">
      {/* View Header */}

      <header className="vaults-header">
        <div className="header-left">
          <h2>Vaults</h2>
        </div>
        <div className="header-actions">
          <div className="view-toggle-buttons">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              Grid
            </button>
            <button
              className={`view-btn ${viewMode === "tree" ? "active" : ""}`}
              onClick={() => setViewMode("tree")}
              title="Hierarchy Tree View"
            >
              Tree View
            </button>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            Add Item
          </button>
        </div>
      </header>

      {/* Main Content Area */}

      {vaultsAreLoading ? (
        <div className="loading-spinner-box">
          <div className="spinner"></div>
          <p>Analyzing vaults...</p>
        </div>
      ) : error ? (
        <div className="vaults-error-card">
          <span className="err-icon">⚠️</span>
          <p>{error}</p>
          <button
            className="btn btn-secondary btn-small"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["/api/v1/Vaults"] })
            }
          >
            Retry
          </button>
        </div>
      ) : vaults.length === 0 ? (
        <div className="empty-state panel">
          <h3>You have no items in your Vaults.</h3>
          <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
            Click 'Add Item' above to add your first item.
          </p>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <section
              className="vaults-grid-layout"
              style={{
                display: "flex",
                flexDirection: "column", // STACKS CARDS VERTICALLY
                alignItems: "flex-start",
                gap: "20px",
              }}
            >
              {vaults.map((vault, index) => {
                const isSelected = vault.id === selectedVault?.id ?? 1;

                return (
                  <VaultCard
                    key={vault.id || vault.key || vault.name || index}
                    title={vault.name}
                    subtitle={vault.description}
                    currentCount={vault.armoryItems?.length ?? 0}
                    totalCount={isSelected ? (vault.capacity ?? 12) : 4}
                    unit={"items"}
                    temp={vault.temperature ?? (isSelected ? 68 : 74)}
                    humidity={vault.humidity ?? (isSelected ? 44 : 63)}
                    value={
                      Array.isArray(vault.armoryItems)
                        ? vault.armoryItems.reduce(
                            (sum, item) =>
                              sum +
                              (Number(
                                item.estimatedValue ?? item.purchasePrice,
                              ) || 0),
                            0, // CRITICAL: Starting accumulator value
                          )
                        : 0
                    }
                    // Status & Alerts Filler
                    statusText={isSelected ? "NORMAL" : "RH HIGH"}
                    statusColor={isSelected ? "#10B981" : "#F97316"}
                    // Selection & Outline Colors
                    selected={isSelected}
                    onClick={() => openEditModal(vault)}
                    arsenalColor={vault.arsenal?.colorHex ?? "#ffffff"}
                    // Metrics Colors
                    tempColor={isSelected ? "#10B981" : "#F87171"}
                    humidityColor={isSelected ? "#10B981" : "#F97316"}
                    // Warning Banner
                    warningText={
                      isSelected
                        ? null
                        : "Above 60% for 6 days — add a dehumidifier rod"
                    }
                  />
                );
              })}
            </section>
          )}

          {/* TREE VIEW (Hierarchy) */}

          {viewMode === "tree" && (
            <div className="vaults-tree-sheet">
              <div className="tree-sheet-header">
                <h3>Nested Storage Topology</h3>
                <p>
                  Visual mapping of safe rooms, steel containers, and modular
                  lockboxes.
                </p>
              </div>
              <div className="tree-topology-container">
                {vaultTree.map((root) => renderTreeNode(root, 0))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODULAR FORM DIALOG */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="armory-center-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-title-bar">
              <div className="title-left">
                <h3>
                  {isEditMode ? `${selectedVault.name}` : "Add New Vault"}
                </h3>
              </div>
              <button
                className="modal-close-x-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            {/* Tabs Row */}
            <div className="modal-tabs-header-row">
              <button
                className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
                onClick={() => setActiveTab("general")}
              >
                General
              </button>
              <button
                className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                Security & Climate
              </button>
              <button
                className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
                onClick={() => setActiveTab("inventory")}
                disabled={!isEditMode}
                title={!isEditMode ? "Save vault to view inventory list." : ""}
              >
                Inventory ({selectedVault.armoryItems?.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="modal-tabs-body-content">
              {activeTab === "general" && (
                <div className="tab-pane">
                  <div className="form-grid-columns">
                    <div className="form-item full-row">
                      <label>Catalog Product Link</label>
                      <select
                        value={selectedVault.productId || ""}
                        onChange={(e) => {
                          const pId = e.target.value
                            ? parseInt(e.target.value)
                            : null;
                          const p =
                            products.find((prod) => prod.id === pId) || null;
                          setSelectedVault((prev) => ({
                            ...prev,
                            productId: pId,
                            product: p,
                          }));
                        }}
                      >
                        <option value="">
                          -- No Linked Catalog Product --
                        </option>
                        {products.map((prod) => (
                          <option
                            key={prod.id}
                            value={prod.id}
                            title={
                              prod.description || "No description available"
                            }
                          >
                            {prod.manufacturer?.name} {prod.name} (
                            {prod.partNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item full-row">
                      <label>
                        Name<span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bedside Gun Box, Basement Safe, Truck Vault"
                        value={selectedVault.name}
                        onChange={(e) =>
                          setSelectedVault((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="form-item full-row">
                      <label>Description</label>
                      <textarea
                        rows="3"
                        placeholder="Describe where it is hidden or physical details..."
                        value={selectedVault.description}
                        onChange={(e) =>
                          setSelectedVault((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="form-item">
                      <label>Arsenal</label>
                      <select
                        value={selectedVault.arsenalId}
                        onChange={(e) =>
                          setSelectedVault((prev) => ({
                            ...prev,
                            arsenalId: e.target.value,
                          }))
                        }
                        required
                      >
                        {store.arsenals.map((ars) => (
                          <option key={ars.id} value={ars.id}>
                            {ars.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Parent Vault</label>
                      <select
                        value={selectedVault.parentVaultId}
                        onChange={(e) =>
                          setSelectedVault((prev) => ({
                            ...prev,
                            parentVaultId: e.target.value,
                          }))
                        }
                      >
                        <option value="">None</option>
                        {eligibleParentVaults.map((v) => (
                          <option key={v.id} value={v.id}>
                            🔗 {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="tab-pane">
                  <div className="form-grid-columns">
                    <div className="form-item">
                      <label>
                        Combination/Passcode{" "}
                        <span style={{ color: "green" }}>
                          (256-AES Encryption)
                        </span>
                      </label>
                      <div className="passcode-input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="passcode-field"
                          placeholder="Decrypted key preview..."
                          value={selectedVault.encryptedPasscode}
                          onChange={(e) =>
                            setSelectedVault((prev) => ({
                              ...prev,
                              encryptedPasscode: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-secondary passcode-reveal-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "Hide 🔒" : "Show 👁️"}
                        </button>
                      </div>
                    </div>

                    <div className="form-item">
                      <label>Passcode Reminder Hint</label>
                      <input
                        type="text"
                        placeholder="e.g. Anniversary or zip..."
                        value={selectedVault.passcodeHint}
                        onChange={(e) =>
                          setSelectedVault((prev) => ({
                            ...prev,
                            passcodeHint: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="form-item">
                      <label>Backup Keys Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Safe deposit box, hidden hook..."
                        value={selectedVault.backupKeyLocation}
                        onChange={(e) =>
                          setSelectedVault((prev) => ({
                            ...prev,
                            backupKeyLocation: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <BatteryTracker
                      hasBattery={selectedVault.product?.hasBattery || false}
                      form={selectedVault}
                      setForm={setSelectedVault}
                    />

                    {/* ENVIRONMENT / DEHUMIDIFIER
                    <div className="form-item full-row env-boundary-decorator">
                      <div className="checkbox-toggle-switch-row">
                        <input
                          type="checkbox"
                          id="hasDehumidifier"
                          checked={selectedVault.hasDehumidifier}
                          onChange={(e) =>
                            setSelectedVault((prev) => ({
                              ...prev,
                              hasDehumidifier: e.target.checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="hasDehumidifier"
                          className="checkbox-switch-label"
                        >
                          <strong>Active Environment Control</strong> (Has
                          active dehumidifier or silica desiccant packs)
                        </label>
                      </div>
                    </div>

                    {selectedVault.hasDehumidifier && (
                      <>
                        <div className="form-item">
                          <label>Desiccant Last Replaced / Serviced</label>
                          <input
                            type="date"
                            value={selectedVault.dehumidifierLastServiced}
                            onChange={(e) =>
                              setSelectedVault((prev) => ({
                                ...prev,
                                dehumidifierLastServiced: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>
                            Alert Max Humidity:{" "}
                            <strong className="gold-text">
                              {selectedVault.targetMaxHumidityPercent}%
                            </strong>
                          </label>
                          <input
                            type="range"
                            min="25"
                            max="65"
                            className="form-range-slider"
                            value={selectedVault.targetMaxHumidityPercent}
                            onChange={(e) =>
                              setSelectedVault((prev) => ({
                                ...prev,
                                targetMaxHumidityPercent: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </>
                    )} */}
                  </div>
                </div>
              )}

              {activeTab === "inventory" && (
                <div className="tab-pane">
                  <div className="vault-inventory-wrapper">
                    <h4 className="inventory-subheading">Inventory</h4>
                    {selectedVault.armoryItems &&
                    selectedVault.armoryItems.length > 0 ? (
                      <div className="inventory-grid-table">
                        <div className="table-header-row">
                          <span>Serial Number</span>
                          <span>Name</span>
                          <span>Manufacturer</span>
                          <span>Model</span>
                        </div>
                        {selectedVault.armoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="table-body-row"
                            title={item.description || "N/A"}
                          >
                            <strong className="table-mono font-mono">
                              {item.serialNumber}
                            </strong>
                            <span className="table-mono font-mono">
                              {item.name || "N/A"}
                            </span>
                            <span className="table-mono font-mono">
                              {item.description || "N/A"}
                            </span>
                            <span className="table-mono font-mono">
                              {item.name || "N/A"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-inventory-box">
                        <span className="empty-box-symbol">🛡️</span>
                        <h5>No Stored Items</h5>
                        <p>
                          To inventory an item here, select this safe as the
                          "Vault" on the item's armory card form.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer-row-container">
              <SubmitButton
                type="button"
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                isEditMode={isEditMode}
                onClick={handleSave}
              />
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: "400px" }}
          >
            <h3 style={{ marginBottom: "12px" }}>Delete Vault?</h3>
            <p
              style={{
                marginBottom: "20px",
                color: "var(--text-muted)",
                fontSize: "0.95rem",
                lineHeight: "1.4",
              }}
            >
              This action will permanently delete this vault. Any items assigned
              here will be homeless.
            </p>
            <div
              className="modal-footer-row-container"
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderTreeNode(node, depth = 0) {
    const isExpanded = expandedNodes[node.id] !== false; // default to expanded
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div
        key={node.id}
        className="tree-node-wrapper"
        style={{
          marginLeft: `${depth * 24}px`,
          borderLeft: depth > 0 ? "1px dashed var(--border-color)" : "none",
        }}
      >
        <div className="tree-node-strip" onClick={() => openEditModal(node)}>
          <div className="tree-node-toggle-col">
            {hasChildren ? (
              <button
                type="button"
                className="btn-toggle-tree"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? "▼" : "►"}
              </button>
            ) : (
              <span className="leaf-bullet">•</span>
            )}
          </div>

          <div className="tree-node-info-col">
            <span className="tree-hub-icon">
              {node.securityLevel === "High"
                ? "🛡️"
                : node.securityLevel === "Medium"
                  ? "🔒"
                  : "📂"}
            </span>
            <span className="tree-hub-name">{node.name}</span>
            {node.securityLevel && (
              <span className="tree-hub-cat">({node.securityLevel})</span>
            )}
            <span className="tree-hub-inventory-count">
              {node.storedItems ? node.storedItems.length : 0} items
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="tree-node-children-subgroup">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }
}
