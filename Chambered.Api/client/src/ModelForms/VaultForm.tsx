import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../StoreContext";
import { useQueryClient } from "@tanstack/react-query";
import SubmitButton from "../components/SubmitButton";
import BatteryTracker from "../components/BatteryTracker";

import {
  useGetVaultsFromKey,
  useGetVaults,
  useGetProducts,
  usePostVaults,
  usePatchVaultsFromKey,
  getGetVaultsQueryKey,
} from "../api/endpoints";
import type { Product } from "../api/models/product";
import type { Vault } from "../api/models/vault";

export interface VaultFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentId: number | null; // null for "Add New", number for "Edit"
  onSaved?: (savedVault: any) => void;
}

interface VaultFormState {
  id: number;
  name: string;
  description: string;
  arsenalId: number;
  parentVaultId: number | null;
  productId: number | null;
  encryptedPasscode: string;
  passcodeHint: string;
  backupKeyLocation: string;
  batteryLastChangedDate: string | null;
  batteryExpirationDate: string | null;
  hasDehumidifier: boolean;
  dehumidifierLastServiced: string | null;
  targetMaxHumidityPercent: number | null;
  product?: Product;
  armoryItems?: any[];
}

const INITIAL_FORM_STATE: VaultFormState = {
  id: 0,
  name: "",
  description: "",
  arsenalId: 1,
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
};

export default function VaultForm({
  isOpen,
  onClose,
  currentId,
  onSaved,
}: VaultFormProps) {
  const queryClient = useQueryClient();
  const store = useStore();
  const isEditMode = currentId !== null && currentId > 0;

  const [form, setForm] = useState<VaultFormState>(INITIAL_FORM_STATE);
  const [activeTab, setActiveTab] = useState<"general" | "security" | "inventory">("general");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Fetch security-only products with manufacturer
  const { data: productsData } = useGetProducts(
    {
      filter: "productType eq 'Security'",
      expand: "manufacturer",
    },
    {
      query: {
        enabled: isOpen,
      },
    },
  );
  const securityProducts = useMemo(
    () => (productsData?.data?.value || []) as Product[],
    [productsData],
  );

  // Fetch all vaults for parent dropdown
  const { data: allVaultsData } = useGetVaults(
    undefined,
    {
      query: {
        enabled: isOpen,
      },
    },
  );
  const allVaults = useMemo(
    () => (allVaultsData?.data?.value || []) as Vault[],
    [allVaultsData],
  );

  // Filter eligible parent vaults to prevent circular references
  const eligibleParentVaults = useMemo(() => {
    if (!isEditMode || !currentId) return allVaults;

    const getDescendantIds = (vaultId: number): number[] => {
      const ids: number[] = [];
      const children = allVaults.filter((v) => v.parentVaultId === vaultId);
      children.forEach((c) => {
        if (c.id !== undefined) {
          ids.push(c.id);
          ids.push(...getDescendantIds(c.id));
        }
      });
      return ids;
    };

    const forbiddenIds = [currentId, ...getDescendantIds(currentId)];
    return allVaults.filter(
      (v) => v.id !== undefined && !forbiddenIds.includes(v.id),
    );
  }, [allVaults, isEditMode, currentId]);

  // Fetch existing vault details if editing
  const { data, isLoading } = useGetVaultsFromKey(
    currentId || 0,
    {
      expand: "product($expand=manufacturer),armoryItems,arsenal",
    },
    {
      query: {
        enabled: isOpen && isEditMode && !!currentId,
      },
    },
  );

  // Populate or reset form state
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && data?.data) {
      const item = data.data as any;
      setForm({
        id: item.id || 0,
        name: item.name || "",
        description: item.description || "",
        arsenalId: item.arsenalId || store.activeArsenalId || 1,
        parentVaultId: item.parentVaultId ?? null,
        productId: item.productId ?? null,
        encryptedPasscode: item.encryptedPasscode || "",
        passcodeHint: item.passcodeHint || "",
        backupKeyLocation: item.backupKeyLocation || "",
        batteryLastChangedDate: item.batteryLastChangedDate
          ? item.batteryLastChangedDate.slice(0, 10)
          : null,
        batteryExpirationDate: item.batteryExpirationDate
          ? item.batteryExpirationDate.slice(0, 10)
          : null,
        hasDehumidifier: !!item.hasDehumidifier,
        dehumidifierLastServiced: item.dehumidifierLastServiced
          ? item.dehumidifierLastServiced.slice(0, 10)
          : null,
        targetMaxHumidityPercent: item.targetMaxHumidityPercent ?? 45,
        product: item.product,
        armoryItems: item.armoryItems || [],
      });
      setActiveTab("general");
      setShowPassword(false);
    } else if (!isEditMode) {
      setForm({
        ...INITIAL_FORM_STATE,
        arsenalId: store.activeArsenalId || store.arsenals[0]?.id || 1,
      });
      setActiveTab("general");
      setShowPassword(false);
    }
  }, [isOpen, isEditMode, data, store.activeArsenalId, store.arsenals]);

  // Mutations
  const createMutation = usePostVaults({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({
          queryKey: getGetVaultsQueryKey(),
        });
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsSaving(false);
          onClose();
        }, 800);
        if (res?.data && onSaved) {
          onSaved(res.data);
        }
      },
      onError: (err: any) => {
        alert("Failed to create vault: " + (err?.message || "Unknown error"));
        setIsSaving(false);
      },
    },
  });

  const updateMutation = usePatchVaultsFromKey({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({
          queryKey: getGetVaultsQueryKey(),
        });
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsSaving(false);
        }, 1200);
        if (onSaved) {
          onSaved(res?.data || { ...form });
        }
      },
      onError: (err: any) => {
        alert("Failed to save vault: " + (err?.message || "Unknown error"));
        setIsSaving(false);
      },
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    const payload: any = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      arsenalId: form.arsenalId || store.activeArsenalId || 1,
      parentVaultId: form.parentVaultId ? Number(form.parentVaultId) : null,
      productId: form.productId ? Number(form.productId) : null,
      encryptedPasscode: form.encryptedPasscode || null,
      passcodeHint: form.passcodeHint || null,
      backupKeyLocation: form.backupKeyLocation || null,
      batteryLastChangedDate: form.batteryLastChangedDate
        ? new Date(form.batteryLastChangedDate).toISOString()
        : null,
      batteryExpirationDate: form.batteryExpirationDate
        ? new Date(form.batteryExpirationDate).toISOString()
        : null,
      hasDehumidifier: !!form.hasDehumidifier,
      dehumidifierLastServiced: form.dehumidifierLastServiced
        ? new Date(form.dehumidifierLastServiced).toISOString()
        : null,
      targetMaxHumidityPercent: form.hasDehumidifier && form.targetMaxHumidityPercent !== null
        ? Number(form.targetMaxHumidityPercent)
        : null,
    };

    if (isEditMode && currentId) {
      payload.id = currentId;
      updateMutation.mutate({
        key: currentId,
        data: payload,
      });
    } else {
      createMutation.mutate({
        data: payload,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="armory-center-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-title-bar">
          <div className="title-left">
            <h3>{isEditMode ? `Edit Vault: ${form.name}` : "Add New Vault"}</h3>
          </div>
          <button
            type="button"
            className="modal-close-x-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Tabs Row */}
        <div className="modal-tabs-header-row">
          <button
            type="button"
            className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            Security & Climate
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
            disabled={!isEditMode}
            title={!isEditMode ? "Save vault first to view stored inventory." : ""}
          >
            Inventory ({form.armoryItems?.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading vault details...
          </div>
        ) : (
          <form onSubmit={handleSave} className="modal-tabs-body-content">
            {activeTab === "general" && (
              <div className="tab-pane">
                <div className="form-grid-columns">
                  <div className="form-item full-row">
                    <label>Catalog Security Product Link</label>
                    <select
                      value={form.productId || ""}
                      onChange={(e) => {
                        const pId = e.target.value ? Number(e.target.value) : null;
                        const prod = securityProducts.find((p) => p.id === pId);
                        setForm((prev) => ({
                          ...prev,
                          productId: pId,
                          product: prod,
                        }));
                      }}
                    >
                      <option value="">-- No Linked Security Product --</option>
                      {securityProducts.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.manufacturer?.name} {prod.name} ({prod.partNumber || "No PN"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item full-row">
                    <label>
                      Vault Name<span className="req">*</span>
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
                      rows={3}
                      placeholder="Location, physical characteristics, or storage notes..."
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-item">
                    <label>Arsenal<span className="req">*</span></label>
                    <select
                      value={form.arsenalId || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          arsenalId: Number(e.target.value),
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
                      value={form.parentVaultId || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          parentVaultId: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                    >
                      <option value="">None (Top-Level Container)</option>
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
                    <label>Passcode / Combination</label>
                    <div className="passcode-input-wrapper" style={{ display: "flex", gap: "8px" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Passcode or combination..."
                        value={form.encryptedPasscode}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            encryptedPasscode: e.target.value,
                          }))
                        }
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{ padding: "0 12px" }}
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

                  <div className="form-item full-row">
                    <label>Backup Key Location</label>
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

                  <div className="form-item">
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.hasDehumidifier}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            hasDehumidifier: e.target.checked,
                          }))
                        }
                      />
                      <span>Dehumidifier Installed</span>
                    </label>
                  </div>

                  {form.hasDehumidifier && (
                    <div className="form-item">
                      <label>Target Max Humidity (%)</label>
                      <input
                        type="number"
                        min="10"
                        max="90"
                        value={form.targetMaxHumidityPercent ?? 45}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            targetMaxHumidityPercent: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                      />
                    </div>
                  )}

                  <BatteryTracker
                    hasBattery={form.product?.hasBattery || false}
                    form={form}
                    setForm={setForm as any}
                  />
                </div>
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="tab-pane">
                <div className="vault-inventory-wrapper">
                  <h4 style={{ marginBottom: "12px" }}>Assigned Armory Items</h4>
                  {form.armoryItems && form.armoryItems.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "var(--bg-input)", textAlign: "left" }}>
                          <th style={{ padding: "8px" }}>Serial Number</th>
                          <th style={{ padding: "8px" }}>Name</th>
                          <th style={{ padding: "8px" }}>Model</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.armoryItems.map((item: any) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "8px", fontFamily: "monospace", color: "var(--color-primary)" }}>
                              {item.serialNumber || "—"}
                            </td>
                            <td style={{ padding: "8px" }}>{item.name || "—"}</td>
                            <td style={{ padding: "8px", color: "var(--text-muted)" }}>{item.model || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                      No items currently assigned to this vault.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="modal-footer-row-container" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <SubmitButton
                type="submit"
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                isEditMode={isEditMode}
                createLabel="Create Vault"
                editLabel="Save Changes"
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
