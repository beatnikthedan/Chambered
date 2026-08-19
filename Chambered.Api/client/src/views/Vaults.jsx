import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../StoreContext";
import "./Vaults.css";
import BatteryTracker from "../components/BatteryTracker";
import SubmitButton from "../components/SubmitButton";
import buildQuery from "odata-query";

export default function Vaults() {
  const store = useStore();
  const { enums } = store;
  const activeArsenal = store.arsenals.find(
    (a) => a.id === store.activeArsenalId,
  );
  const activeArsenalColor = activeArsenal?.colorHex || "#2563eb";

  const [vaults, setVaults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVaults = async () => {
    setLoading(true);
    setError("");
    try {
      const query = buildQuery({
        filter: store.activeArsenalId
          ? { arsenalId: store.activeArsenalId }
          : undefined,
        expand: ["product", "armoryItem"],
      });
      const url = `/api/v1/Vaults${query}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVaults(data.value || []);
      } else {
        setError(`Failed to load vaults: ${res.status}`);
      }
    } catch (err) {
      setError("Failed to fetch vaults.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/v1/Vaults/GetVaultCategories()");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.value || []);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    fetchVaults();
    fetchCategories();
  }, [store.activeArsenalId]);

  const processedVaults = useMemo(() => {
    return vaults.map((vault) => {
      const product = products.find((p) => p.id === vault.productId);
      const arsenal = store.arsenals.find((a) => a.id === vault.arsenalId);
      const parentVault = vaults.find((v) => v.id === vault.parentVaultId);

      return {
        ...vault,
        storedItems: vault.armoryItem || [],
        productManufacturerName: product?.manufacturer?.name || "",
        productModel: product?.model || "",
        arsenalName: arsenal?.name || "",
        parentVaultName: parentVault?.name || "",
      };
    });
  }, [vaults, products, store.arsenals, categories]);

  const vaultTree = useMemo(() => {
    const map = {};
    processedVaults.forEach((v) => {
      map[v.id] = { ...v, children: [] };
    });

    const roots = [];
    processedVaults.forEach((v) => {
      const node = map[v.id];
      if (v.parentVaultId && map[v.parentVaultId]) {
        map[v.parentVaultId].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [processedVaults]);

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setActiveTab("general");
    setShowPassword(false);
    setForm({
      id: 0,
      name: "",
      description: "",
      arsenalId: store.activeArsenalId || store.arsenals[0]?.id || 1,
      securityLevel: "Electronic Keypad",
      parentVaultId: "",
      encryptedPasscode: "",
      passcodeHint: "",
      backupKeyLocation: "",
      productId: "",
      batteryLastChangedDate: "",
      batteryExpirationDate: "",
      batteryType: "Unknown",
      hasDehumidifier: false,
      dehumidifierLastServiced: "",
      targetMaxHumidityPercent: 45,
      storedItems: [],
    });
    setShowModal(true);
  };

  const openEditModal = (vault) => {
    setIsEditMode(true);
    setActiveTab("general");
    setShowPassword(false);

    let batteryDate = "";
    if (vault.batteryLastChangedDate) {
      batteryDate = vault.batteryLastChangedDate.split("T")[0];
    }

    let batteryExpDate = "";
    if (vault.batteryExpirationDate) {
      batteryExpDate = vault.batteryExpirationDate.split("T")[0];
    }

    let dehumidifierDate = "";
    if (vault.dehumidifierLastServiced) {
      dehumidifierDate = vault.dehumidifierLastServiced.split("T")[0];
    }

    setForm({
      id: vault.id,
      name: vault.name,
      description: vault.description || "",
      arsenalId: vault.arsenalId,
      securityLevel: vault.securityLevel || "Standard",
      parentVaultId: vault.parentVaultId || "",
      encryptedPasscode: vault.encryptedPasscode || "",
      passcodeHint: vault.passcodeHint || "",
      backupKeyLocation: vault.backupKeyLocation || "",
      productId: vault.productId || "",
      batteryLastChangedDate: batteryDate,
      batteryExpirationDate: batteryExpDate,
      batteryType: vault.batteryType || "Unknown",
      hasDehumidifier: vault.hasDehumidifier || false,
      dehumidifierLastServiced: dehumidifierDate,
      targetMaxHumidityPercent: vault.targetMaxHumidityPercent || 45,
      storedItems: vault.armoryItem || [],
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    const targetArsenalId =
      parseInt(form.arsenalId) || store.activeArsenalId || 1;
    const payload = {
      name: form.name,
      description: form.description || null,
      parentVaultId: form.parentVaultId ? parseInt(form.parentVaultId) : null,
      encryptedPasscode: form.encryptedPasscode || null,
      passcodeHint: form.passcodeHint || null,
      backupKeyLocation: form.backupKeyLocation || null,
      productId: form.productId ? parseInt(form.productId) : null,
      arsenalId: targetArsenalId,
      batteryLastChangedDate:
        form.batteryLastChangedDate && form.batteryLastChangedDate.trim()
          ? new Date(form.batteryLastChangedDate).toISOString()
          : null,
      batteryExpirationDate:
        form.batteryExpirationDate && form.batteryExpirationDate.trim()
          ? new Date(form.batteryExpirationDate).toISOString()
          : null,
      hasDehumidifier: !!form.hasDehumidifier,
      dehumidifierLastServiced:
        form.dehumidifierLastServiced && form.dehumidifierLastServiced.trim()
          ? new Date(form.dehumidifierLastServiced).toISOString()
          : null,
      targetMaxHumidityPercent: form.hasDehumidifier
        ? parseInt(form.targetMaxHumidityPercent)
        : null,
    };

    if (isEditMode) {
      payload.id = parseInt(form.id);
    }

    try {
      const url = isEditMode ? `/api/v1/Vaults/${form.id}` : "/api/v1/Vaults";
      const method = isEditMode ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchVaults();
        let savedItem = null;
        if (res.status !== 204) {
          try {
            savedItem = await res.json();
          } catch (e) {
            console.error("No JSON response body", e);
          }
        }

        if (savedItem) {
          setIsEditMode(true);
          let batteryDate = "";
          if (savedItem.batteryLastChangedDate) {
            batteryDate = savedItem.batteryLastChangedDate.split("T")[0];
          }

          let batteryExpDate = "";
          if (savedItem.batteryExpirationDate) {
            batteryExpDate = savedItem.batteryExpirationDate.split("T")[0];
          }

          let dehumidifierDate = "";
          if (savedItem.dehumidifierLastServiced) {
            dehumidifierDate = savedItem.dehumidifierLastServiced.split("T")[0];
          }

          setForm({
            id: savedItem.id,
            name: savedItem.name,
            description: savedItem.description || "",
            arsenalId: savedItem.arsenalId,
            securityLevel: savedItem.securityLevel || "Standard",
            parentVaultId: savedItem.parentVaultId || "",
            encryptedPasscode: savedItem.encryptedPasscode || "",
            passcodeHint: savedItem.passcodeHint || "",
            backupKeyLocation: savedItem.backupKeyLocation || "",
            productId: savedItem.productId || "",
            batteryLastChangedDate: batteryDate,
            batteryExpirationDate: batteryExpDate,
            batteryType: savedItem.batteryType || "Unknown",
            hasDehumidifier: savedItem.hasDehumidifier || false,
            dehumidifierLastServiced: dehumidifierDate,
            targetMaxHumidityPercent: savedItem.targetMaxHumidityPercent || 45,
            storedItems: savedItem.armoryItem || [],
          });
        } else {
          // Transition/stay in edit mode on 204 No Content update responses
          setIsEditMode(true);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        const txt = await res.text();
        alert(`Save failed: ${txt}`);
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
    try {
      const res = await fetch(`/api/v1/Vaults/${deleteConfirmId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchVaults();
        setDeleteConfirmId(null);
      } else {
        alert(
          "Failed to delete vault. Make sure no items or other sub-vaults depend on it.",
        );
      }
    } catch (err) {
      console.error("Error deleting vault", err);
    }
  };

  const selectedProduct = products.find(
    (p) => p.id === parseInt(form.productId),
  );
  const needsBattery = selectedProduct?.hasBattery || false;

  return (
    <div className="vaults-container">
      {/* View Header */}

      <header className="vaults-header">
        <div className="header-left">
          <span className="section-title-icon">🔒</span>
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

      {loading ? (
        <div className="loading-spinner-box">
          <div className="spinner"></div>
          <p>Analyzing vaults...</p>
        </div>
      ) : error ? (
        <div className="vaults-error-card">
          <span className="err-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn btn-secondary btn-small" onClick={fetchVaults}>
            Retry
          </button>
        </div>
      ) : processedVaults.length === 0 ? (
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
            <section className="vaults-grid-layout">
              {processedVaults.map((vault) => {
                return (
                  <div
                    key={vault.id}
                    className="vault-card-node"
                    onClick={() => openEditModal(vault)}
                  >
                    {/* Colored Top Accent Bar based on Arsenal context color */}
                    <div
                      className="card-top-accent"
                      style={{
                        height: "4px",
                        width: "100%",
                        backgroundColor: activeArsenalColor,
                        boxShadow: `0 2px 8px ${activeArsenalColor}80`,
                      }}
                    />

                    <div className="vault-card-contents">
                      <h4 className="vault-name">
                        <span className="v-symbol">📂</span> {vault.name}
                      </h4>
                      <p className="vault-desc">{vault.description || ""}</p>
                      {vault.productManufacturerName || vault.productModel ? (
                        <div
                          className="vault-make-model"
                          style={{
                            fontSize: "16px",
                            fontFamily: "var(--font-heading)",
                            fontWeight: "700",
                            marginTop: "4px",
                            marginBottom: "16px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ color: "#ffffff" }}>
                            {vault.productManufacturerName || ""}
                          </span>
                          <span
                            style={{ color: "var(--color-primary, #d4af37)" }}
                          >
                            {vault.productModel || ""}
                          </span>
                        </div>
                      ) : (
                        <p
                          className="vault-make-model"
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                            marginBottom: "16px",
                            fontStyle: "italic",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          No Model Linked
                        </p>
                      )}

                      <div className="vault-meta-metrics">
                        {vault.parentVaultName && (
                          <div className="metric-row">
                            <span className="met-lbl">Parent Vault</span>
                            <span className="met-val text-muted">
                              🔗 {vault.parentVaultName}
                            </span>
                          </div>
                        )}
                        <div className="metric-row">
                          <span className="met-lbl">Access Type</span>
                          <span className="met-val">{vault.securityLevel}</span>
                        </div>
                        <div className="metric-row">
                          <span className="met-lbl">Secured Items</span>
                          <span className="met-val gold-text font-bold">
                            {vault.storedItems?.length || 0} items
                          </span>
                        </div>
                        {vault.hasDehumidifier && (
                          <div className="metric-row">
                            <span className="met-lbl">Desiccant</span>
                            <span className="met-val active-green">
                              Active (Max {vault.targetMaxHumidityPercent}%)
                            </span>
                          </div>
                        )}
                        <div
                          className="metric-row"
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                            paddingTop: "6px",
                            marginTop: "4px",
                          }}
                        >
                          <span className="met-lbl">Arsenal</span>
                          <span
                            className="met-val"
                            style={{
                              color: "var(--accent-color)",
                              fontWeight: "bold",
                            }}
                          >
                            {" "}
                            {vault.arsenalName || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Warnings Banner */}
                      {vault.hasDehumidifier &&
                        !vault.dehumidifierLastServiced && (
                          <div className="vault-card-alerts">
                            <div className="v-alert info">
                              💨 Dehumidifier needs service log check!
                            </div>
                          </div>
                        )}
                      <div className="vault-card-actions">
                        <button
                          className="btn btn-danger btn-small"
                          onClick={(e) => handleDeleteClick(vault.id, e)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
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
                <h3>{isEditMode ? `${form.name}` : "Add New Vault"}</h3>
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
                Inventory ({form.storedItems?.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="modal-tabs-body-content">
              {activeTab === "general" && (
                <div className="tab-pane">
                  <div className="form-grid-columns">
                    <div className="form-item full-row">
                      <label>
                        Name<span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bedside Gun Box, Basement Safe, Truck Vault"
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="form-item full-row">
                      <label>Description</label>
                      <textarea
                        rows="3"
                        placeholder="Describe where it is hidden or physical details..."
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="form-item">
                      <label>Arsenal</label>
                      <select
                        value={form.arsenalId}
                        onChange={(e) =>
                          setForm((prev) => ({
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
                        value={form.parentVaultId}
                        onChange={(e) =>
                          setForm((prev) => ({
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
                    <div className="form-item full-row">
                      <label>Catalog Product Link</label>
                      <select
                        value={form.productId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const p = products.find(
                            (prod) => prod.id === parseInt(pId),
                          );
                          setForm((prev) => ({
                            ...prev,
                            productId: pId,
                            batteryType: p?.batteryType || "Unknown",
                          }));
                        }}
                      >
                        <option value="">
                          -- No Linked Catalog Product --
                        </option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            [{prod.productType}] {prod.manufacturerName} -{" "}
                            {prod.name}
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
                          value={form.encryptedPasscode}
                          onChange={(e) =>
                            setForm((prev) => ({
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
                        value={form.passcodeHint}
                        onChange={(e) =>
                          setForm((prev) => ({
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
                        value={form.backupKeyLocation}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            backupKeyLocation: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <BatteryTracker
                      hasBattery={needsBattery}
                      form={form}
                      setForm={setForm}
                    />

                    {/* ENVIRONMENT / DEHUMIDIFIER */}
                    <div className="form-item full-row env-boundary-decorator">
                      <div className="checkbox-toggle-switch-row">
                        <input
                          type="checkbox"
                          id="hasDehumidifier"
                          checked={form.hasDehumidifier}
                          onChange={(e) =>
                            setForm((prev) => ({
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

                    {form.hasDehumidifier && (
                      <>
                        <div className="form-item">
                          <label>Desiccant Last Replaced / Serviced</label>
                          <input
                            type="date"
                            value={form.dehumidifierLastServiced}
                            onChange={(e) =>
                              setForm((prev) => ({
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
                              {form.targetMaxHumidityPercent}%
                            </strong>
                          </label>
                          <input
                            type="range"
                            min="25"
                            max="65"
                            className="form-range-slider"
                            value={form.targetMaxHumidityPercent}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                targetMaxHumidityPercent: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "inventory" && (
                <div className="tab-pane">
                  <div className="vault-inventory-wrapper">
                    <h4 className="inventory-subheading">Inventory</h4>
                    {form.storedItems && form.storedItems.length > 0 ? (
                      <div className="inventory-grid-table">
                        <div className="table-header-row">
                          <span>Item ID</span>
                          <span>Serial Number</span>
                        </div>
                        {form.storedItems.map((item) => (
                          <div key={item.id} className="table-body-row">
                            <strong>Armory Item #{item.id}</strong>
                            <span className="serial-mono font-mono">
                              {item.serialNumber || "N/A"}
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
