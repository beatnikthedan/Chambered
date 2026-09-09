import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import SubmitButton from "../components/SubmitButton";
import ArmoryItemDocumentsTable from "../components/ArmoryItemDocumentsTable";
import {
  useGetArmoryItemsFromKey,
  useGetArmoryItems,
  usePostArmoryItems,
  usePatchArmoryItemsFromKey,
  useGetProducts,
  useGetVaults,
  useGetUsersUsers,
  useGetArmoryItemsArmoryItemTypes,
} from "../api/endpoints";
import {
  createDefaultArmoryItemForm,
  ARMORY_STATIC_KEYS,
  type ArmoryItemFormData,
} from "../types/formModels";

export interface ArmoryItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  armoryItemId: number | null; // null for Add, number for Edit
  onSaved?: (savedItem: any) => void;
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
        "isNfaItem",
      ].includes(key) &&
      !key.startsWith("@odata.") &&
      !key.startsWith("odata.")
    ) {
      specs[key] = item[key];
    }
  });
  return specs;
};

export default function ArmoryItemForm({
  isOpen,
  onClose,
  armoryItemId,
  onSaved,
}: ArmoryItemFormProps) {
  const queryClient = useQueryClient();
  const store = useStore();
  const { enums, arsenals = [], activeArsenalId } = store || {};

  const isEditMode = armoryItemId !== null && armoryItemId > 0;

  const [activeTab, setActiveTab] = useState<string>("general");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [form, setForm] = useState<ArmoryItemFormData>(createDefaultArmoryItemForm());

  // Dynamic specifications state
  const [customSpecs, setCustomSpecs] = useState<
    { key: string; value: string }[]
  >([]);

  // Fetch lookups
  const { data: armoryTypesData } = useGetArmoryItemsArmoryItemTypes();
  const armoryTypes = useMemo(() => {
    return (armoryTypesData?.data?.value || []) as string[];
  }, [armoryTypesData]);

  const { data: productsData } = useGetProducts({
    expand: "manufacturer",
  });
  const productsList = useMemo(() => {
    const raw = productsData?.data;
    return (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
  }, [productsData]);

  // Filter products by selected ArmoryItem type
  const filteredProductsList = useMemo(() => {
    if (!productsList || productsList.length === 0) return [];
    if (!form.itemType || form.itemType === "ArmoryItem") return productsList;
    if (form.itemType === "PewArmoryItem") {
      return productsList.filter(
        (p) => p.productType === "PewPew" || p.productType === "Pew",
      );
    }
    if (form.itemType === "OpticArmoryItem") {
      return productsList.filter((p) => p.productType === "Optic");
    }
    if (form.itemType === "SuppressorArmoryItem") {
      return productsList.filter((p) => p.productType === "Suppressor");
    }
    if (form.itemType === "LightArmoryItem") {
      return productsList.filter(
        (p) => p.productType === "Light" || p.productType === "PewPewLight",
      );
    }
    return productsList;
  }, [productsList, form.itemType]);

  const { data: vaultsData } = useGetVaults();
  const vaultsList = useMemo(() => {
    const raw = vaultsData?.data;
    return (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
  }, [vaultsData]);

  const { data: usersData } = useGetUsersUsers();
  const usersList = useMemo(() => {
    const raw = usersData?.data;
    return (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
  }, [usersData]);

  const { data: allItemsData } = useGetArmoryItems({
    expand: "product",
  });
  const otherItemsList = useMemo(() => {
    const raw = allItemsData?.data;
    const list = (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
    return list.filter((i) => !armoryItemId || i.id !== armoryItemId);
  }, [allItemsData, armoryItemId]);

  // Fetch single item if in edit mode
  const { data: itemDetailsData, isLoading: isDetailsLoading } =
    useGetArmoryItemsFromKey(
      armoryItemId || 0,
      {
        expand: "product($expand=manufacturer),vault,arsenal,owner,beneficiary,armoryItemDocuments",
      },
      {
        query: {
          enabled: isOpen && isEditMode && !!armoryItemId,
        },
      },
    );

  const itemDocuments = useMemo(() => {
    if (!itemDetailsData?.data) return [];
    const data = itemDetailsData.data as any;
    return data.armoryItemDocuments || [];
  }, [itemDetailsData]);

  // Enums
  const itemConditions = enums?.itemConditions || [];
  const nfaFormTypes = enums?.nfaFormTypes || [];

  // Populate form on open / edit
  useEffect(() => {
    if (!isOpen) {
      setForm(createDefaultArmoryItemForm());
      setCustomSpecs([]);
      setActiveTab("general");
      setIsSaving(false);
      setSaveSuccess(false);
      return;
    }

    if (isEditMode && itemDetailsData?.data) {
      const data = itemDetailsData.data as any;
      let detectedType = "ArmoryItem";
      if (data["@odata.type"]) {
        const fullType = data["@odata.type"].replace("#", "");
        detectedType = fullType.split(".").pop() || "ArmoryItem";
      } else if (data.itemType) {
        detectedType = data.itemType;
      }

      setForm({
        ...createDefaultArmoryItemForm(),
        id: data.id || 0,
        name: data.name || "",
        description: data.description || "",
        itemType: detectedType,
        productId: data.productId || "",
        arsenalId: data.arsenalId || "",
        vaultId: data.vaultId || "",
        ownerId: data.ownerId || "",
        beneficiaryId: data.beneficiaryId || "",
        parentItemId: data.parentItemId || null,
        condition: typeof data.condition === "object" ? data.condition?.name || "Good" : data.condition || "Good",
        purchasePrice: data.purchasePrice !== null && data.purchasePrice !== undefined ? data.purchasePrice : "",
        estimatedValue: data.estimatedValue !== null && data.estimatedValue !== undefined ? data.estimatedValue : "",
        purchaseDate: data.purchaseDate ? data.purchaseDate.substring(0, 10) : "",
        coverImageId: data.coverImageId || null,
        notesMarkdown: data.notesMarkdown || "",
        specifications: data.specifications || {},
        roundCount: data.roundCount ?? 0,
        barrelLengthInches: data.barrelLengthInches ?? "",
        twistRate: data.twistRate || "",
        threadPitch: data.threadPitch || "",
        serialNumber: data.serialNumber || "",
        nfaFormType: data.nfaFormType?.name || data.nfaFormType || "Form4",
        taxStampDocumentUrl: data.taxStampDocumentUrl || "",
        stampApprovalDate: data.stampApprovalDate ? data.stampApprovalDate.substring(0, 10) : "",
        batteryLastChangedDate: data.batteryLastChangedDate ? data.batteryLastChangedDate.substring(0, 10) : "",
        batteryExpirationDate: data.batteryExpirationDate ? data.batteryExpirationDate.substring(0, 10) : "",
      });

      const extracted = extractSpecifications(data);
      const parsedSpecs = Object.entries(extracted).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setCustomSpecs(parsedSpecs);
    } else if (!isEditMode) {
      setForm({
        ...INITIAL_ARMORY_FORM_STATE,
        arsenalId: activeArsenalId || (arsenals[0]?.id ? String(arsenals[0].id) : ""),
        vaultId: vaultsList[0]?.id ? String(vaultsList[0].id) : "",
        condition: itemConditions[0]?.name || "Excellent",
        nfaFormType: nfaFormTypes[0]?.name || "Form4",
      });
      setCustomSpecs([]);
    }
  }, [isOpen, isEditMode, itemDetailsData, activeArsenalId, arsenals, vaultsList, itemConditions, nfaFormTypes]);

  // Handle Item Type Change with cascading product reset
  const handleItemTypeChange = (newItemType: string) => {
    setForm((prev) => {
      const currentProd = productsList.find(
        (p) => String(p.id) === String(prev.productId),
      );
      let shouldResetProduct = false;
      if (currentProd && newItemType !== "ArmoryItem") {
        const pType = currentProd.productType || "";
        if (newItemType === "PewArmoryItem" && pType !== "PewPew" && pType !== "Pew")
          shouldResetProduct = true;
        else if (newItemType === "OpticArmoryItem" && pType !== "Optic")
          shouldResetProduct = true;
        else if (
          newItemType === "SuppressorArmoryItem" &&
          pType !== "Suppressor"
        )
          shouldResetProduct = true;
        else if (
          newItemType === "LightArmoryItem" &&
          pType !== "Light" &&
          pType !== "PewPewLight"
        )
          shouldResetProduct = true;
      }

      return {
        ...prev,
        itemType: newItemType,
        productId: shouldResetProduct ? "" : prev.productId,
      };
    });
  };

  // Handle Product Selection
  const handleProductChange = (prodId: string) => {
    setForm((prev) => ({
      ...prev,
      productId: prodId,
    }));
  };

  // Dynamic Specs Key-Value Handlers
  const addCustomSpec = () => {
    setCustomSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeCustomSpec = (index: number) => {
    setCustomSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomSpec = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setCustomSpecs((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  // Mutations
  const { mutate: createItem } = usePostArmoryItems();
  const { mutate: patchItem } = usePatchArmoryItemsFromKey();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const dynamicSpecifications: Record<string, any> = {};
    customSpecs.forEach((s) => {
      if (s.key.trim() !== "") {
        dynamicSpecifications[s.key.trim()] = s.value;
      }
    });

    const odataType = `#Chambered.Data.Models.${form.itemType}`;

    const payload: Record<string, any> = {
      "@odata.type": odataType,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      itemType: form.itemType,
      productId: form.productId ? parseInt(String(form.productId), 10) : null,
      arsenalId: form.arsenalId ? parseInt(String(form.arsenalId), 10) : null,
      vaultId: form.vaultId ? parseInt(String(form.vaultId), 10) : null,
      ownerId: form.ownerId?.trim() || null,
      beneficiaryId: form.beneficiaryId?.trim() || null,
      parentItemId: form.parentItemId ? parseInt(String(form.parentItemId), 10) : null,
      condition: form.condition,
      purchasePrice: form.purchasePrice !== "" && form.purchasePrice !== null ? parseFloat(String(form.purchasePrice)) : null,
      estimatedValue: form.estimatedValue !== "" && form.estimatedValue !== null ? parseFloat(String(form.estimatedValue)) : null,
      purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
      coverImageId: form.coverImageId ? parseInt(String(form.coverImageId), 10) : null,
      notesMarkdown: form.notesMarkdown?.trim() || null,
      specifications: dynamicSpecifications,
    };

    if (form.itemType === "PewArmoryItem") {
      payload.roundCount = parseInt(String(form.roundCount), 10) || 0;
      payload.barrelLengthInches = form.barrelLengthInches !== "" && form.barrelLengthInches !== null ? parseFloat(String(form.barrelLengthInches)) : null;
      payload.twistRate = form.twistRate?.trim() || null;
      payload.threadPitch = form.threadPitch?.trim() || null;
      payload.serialNumber = form.serialNumber?.trim() || "";
      payload.nfaFormType = form.nfaFormType;
      payload.taxStampDocumentUrl = form.taxStampDocumentUrl?.trim() || null;
      payload.stampApprovalDate = form.stampApprovalDate ? new Date(form.stampApprovalDate).toISOString() : null;
    } else if (form.itemType === "SuppressorArmoryItem") {
      payload.serialNumber = form.serialNumber?.trim() || "";
      payload.nfaFormType = form.nfaFormType;
      payload.taxStampDocumentUrl = form.taxStampDocumentUrl?.trim() || null;
      payload.stampApprovalDate = form.stampApprovalDate ? new Date(form.stampApprovalDate).toISOString() : null;
    } else if (form.itemType === "OpticArmoryItem") {
      payload.serialNumber = form.serialNumber?.trim() || "";
      payload.batteryLastChangedDate = form.batteryLastChangedDate ? new Date(form.batteryLastChangedDate).toISOString() : null;
      payload.batteryExpirationDate = form.batteryExpirationDate ? new Date(form.batteryExpirationDate).toISOString() : null;
    } else if (form.itemType === "LightArmoryItem") {
      payload.batteryLastChangedDate = form.batteryLastChangedDate ? new Date(form.batteryLastChangedDate).toISOString() : null;
      payload.batteryExpirationDate = form.batteryExpirationDate ? new Date(form.batteryExpirationDate).toISOString() : null;
    }

    if (isEditMode && armoryItemId) {
      patchItem(
        {
          key: armoryItemId,
          data: payload,
        },
        {
          onSuccess: (res: any) => {
            setIsSaving(false);
            setSaveSuccess(true);
            queryClient.invalidateQueries();
            if (onSaved) onSaved(res?.data || payload);
            setTimeout(() => {
              setSaveSuccess(false);
              onClose();
            }, 600);
          },
          onError: (err: any) => {
            setIsSaving(false);
            const msg = err?.response?.data?.error?.message || err?.message || "Unknown error";
            alert(`Failed to update armory item: ${msg}`);
          },
        },
      );
    } else {
      createItem(
        {
          data: payload,
        },
        {
          onSuccess: (res: any) => {
            setIsSaving(false);
            setSaveSuccess(true);
            queryClient.invalidateQueries();
            if (onSaved) onSaved(res?.data || payload);
            setTimeout(() => {
              setSaveSuccess(false);
              onClose();
            }, 600);
          },
          onError: (err: any) => {
            setIsSaving(false);
            const msg = err?.response?.data?.error?.message || err?.message || "Unknown error";
            alert(`Failed to create armory item: ${msg}`);
          },
        },
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="armory-center-modal" onClick={(e) => e.stopPropagation()}>
        {/* MODAL TITLE BAR */}
        <div className="modal-title-bar">
          <div className="title-left">
            <h3>{isEditMode ? `Edit Armory Item #${armoryItemId}` : "Add New Armory Item"}</h3>
          </div>
          <button className="modal-close-x-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {/* MODAL TABS HEADER ROW */}
        <div className="modal-tabs-header-row">
          <button
            className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
            type="button"
          >
            Armory Details
          </button>

          {form.itemType !== "ArmoryItem" && (
            <button
              className={`tab-btn ${activeTab === "subclass" ? "active" : ""}`}
              onClick={() => setActiveTab("subclass")}
              type="button"
            >
              {form.itemType === "PewArmoryItem" && "Firearm Specs"}
              {form.itemType === "OpticArmoryItem" && "Optical Specs"}
              {form.itemType === "SuppressorArmoryItem" && "Suppressor Specs"}
              {form.itemType === "LightArmoryItem" && "Light Specs"}
            </button>
          )}

          {form.id > 0 && (
            <button
              className={`tab-btn ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
              type="button"
            >
              Attachments
            </button>
          )}

          <button
            className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
            onClick={() => setActiveTab("specifications")}
            type="button"
          >
            User Specs ({customSpecs.length})
          </button>
        </div>

        {isDetailsLoading && isEditMode ? (
          <div className="loading-state" style={{ padding: "40px" }}>
            Loading armory item details...
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
              margin: 0,
            }}
          >
            <div className="modal-tabs-body-content" style={{ padding: "20px" }}>
              {saveSuccess && (
                <div className="detail-save-toast">
                  ✓ Armory item saved successfully
                </div>
              )}

              {/* TAB: GENERAL */}
              {activeTab === "general" && (
                <div className="form-grid">
                  <div className="form-item">
                    <label>Armory Item Subclass Type</label>
                    <select
                      value={form.itemType}
                      onChange={(e) => handleItemTypeChange(e.target.value)}
                      disabled={isEditMode}
                    >
                      {armoryTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item">
                    <label>Catalog Product Reference</label>
                    <select
                      value={form.productId || ""}
                      onChange={(e) => handleProductChange(e.target.value)}
                      required
                    >
                      <option value="">-- Select Catalog Product --</option>
                      {filteredProductsList.map((p) => {
                        const mfg = p.manufacturer?.name ? `${p.manufacturer.name} - ` : "";
                        return (
                          <option key={p.id} value={p.id}>
                            {mfg}{p.name} [{p.productType || "Product"}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-item full-row">
                    <label>Item Name / Instance Title</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. BCM Recce-14 Custom Build"
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label>Arsenal</label>
                    <select
                      value={form.arsenalId || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          arsenalId: e.target.value ? parseInt(e.target.value, 10) : "",
                        })
                      }
                    >
                      <option value="">-- Unassigned Arsenal --</option>
                      {arsenals.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item">
                    <label>Vault Location</label>
                    <select
                      value={form.vaultId || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          vaultId: e.target.value ? parseInt(e.target.value, 10) : "",
                        })
                      }
                    >
                      <option value="">-- Unassigned Vault --</option>
                      {vaultsList.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item">
                    <label>Parent Item (Attachment Mount)</label>
                    <select
                      value={form.parentItemId || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          parentItemId: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                    >
                      <option value="">-- Standalone Item (No Parent) --</option>
                      {otherItemsList.map((it: any) => (
                        <option key={it.id} value={it.id}>
                          {it.name || it.product?.name || `Item #${it.id}`} ({it.itemType?.replace("ArmoryItem", "") || "Item"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item">
                    <label>Physical Condition</label>
                    <select
                      value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    >
                      {itemConditions.map((c: any) => (
                        <option key={c.id} value={c.name || c.id}>
                          {c.label || c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item">
                    <label>Purchase Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.purchasePrice ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          purchasePrice: e.target.value ? parseFloat(e.target.value) : "",
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-item">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      value={form.purchaseDate || ""}
                      onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    />
                  </div>

                  <div className="form-item">
                    <label>Estimated Market Value ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.estimatedValue ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          estimatedValue: e.target.value ? parseFloat(e.target.value) : "",
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-item">
                    <label>Legal Estate Beneficiary</label>
                    <select
                      value={form.beneficiaryId || ""}
                      onChange={(e) => setForm({ ...form, beneficiaryId: e.target.value })}
                    >
                      <option value="">-- Select Beneficiary --</option>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.userName || u.email || u.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.id > 0 && (
                    <div className="form-item full-row">
                      <label>Cover Image</label>
                      <select
                        value={form.coverImageId || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            coverImageId: e.target.value ? parseInt(e.target.value, 10) : null,
                          })
                        }
                      >
                        <option value="">-- Select Cover Image --</option>
                        {itemDocuments.map((doc: any) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.fileName} ({doc.contentType})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-item full-row">
                    <label>Description</label>
                    <textarea
                      rows={2}
                      value={form.description || ""}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief summary or description..."
                    />
                  </div>

                  <div className="form-item full-row">
                    <label>Detailed Markdown Notes</label>
                    <textarea
                      rows={4}
                      value={form.notesMarkdown || ""}
                      onChange={(e) => setForm({ ...form, notesMarkdown: e.target.value })}
                      placeholder="Detailed notes, maintenance logs, configuration markdown..."
                    />
                  </div>
                </div>
              )}

              {/* TAB: SUBCLASS SPECS */}
              {activeTab === "subclass" && (
                <div className="form-grid">
                  {form.itemType === "PewArmoryItem" && (
                    <>
                      <div className="form-item">
                        <label>Serial Number</label>
                        <input
                          type="text"
                          className="text-mono"
                          value={form.serialNumber || ""}
                          onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                          placeholder="e.g. SN12345678"
                          required
                        />
                      </div>
                      <div className="form-item">
                        <label>Cumulative Round Count</label>
                        <input
                          type="number"
                          step="1"
                          value={form.roundCount ?? 0}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              roundCount: e.target.value ? parseInt(e.target.value, 10) : 0,
                            })
                          }
                          placeholder="0"
                          required
                        />
                      </div>
                      <div className="form-item">
                        <label>Barrel Length (Inches)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.barrelLengthInches ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              barrelLengthInches: e.target.value ? parseFloat(e.target.value) : "",
                            })
                          }
                          placeholder="16.0"
                        />
                      </div>
                      <div className="form-item">
                        <label>Rifling Twist Rate</label>
                        <input
                          type="text"
                          value={form.twistRate || ""}
                          onChange={(e) => setForm({ ...form, twistRate: e.target.value })}
                          placeholder="e.g. 1:7, 1:10"
                        />
                      </div>
                      <div className="form-item">
                        <label>Muzzle Thread Pitch</label>
                        <input
                          type="text"
                          value={form.threadPitch || ""}
                          onChange={(e) => setForm({ ...form, threadPitch: e.target.value })}
                          placeholder="e.g. 1/2x28, 5/8x24"
                        />
                      </div>
                      <div className="form-item">
                        <label>NFA Form Type</label>
                        <select
                          value={form.nfaFormType}
                          onChange={(e) => setForm({ ...form, nfaFormType: e.target.value })}
                        >
                          {nfaFormTypes.map((n: any) => (
                            <option key={n.id} value={n.name || n.id}>
                              {n.label || n.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-item">
                        <label>Tax Stamp Approval Date</label>
                        <input
                          type="date"
                          value={form.stampApprovalDate || ""}
                          onChange={(e) => setForm({ ...form, stampApprovalDate: e.target.value })}
                        />
                      </div>
                      <div className="form-item full-row">
                        <label>Tax Stamp Document URL</label>
                        <input
                          type="text"
                          value={form.taxStampDocumentUrl || ""}
                          onChange={(e) => setForm({ ...form, taxStampDocumentUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </>
                  )}

                  {form.itemType === "SuppressorArmoryItem" && (
                    <>
                      <div className="form-item">
                        <label>Serial Number</label>
                        <input
                          type="text"
                          className="text-mono"
                          value={form.serialNumber || ""}
                          onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                          placeholder="e.g. SUP-987654"
                          required
                        />
                      </div>
                      <div className="form-item">
                        <label>NFA Form Type</label>
                        <select
                          value={form.nfaFormType}
                          onChange={(e) => setForm({ ...form, nfaFormType: e.target.value })}
                        >
                          {nfaFormTypes.map((n: any) => (
                            <option key={n.id} value={n.name || n.id}>
                              {n.label || n.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-item">
                        <label>Tax Stamp Approval Date</label>
                        <input
                          type="date"
                          value={form.stampApprovalDate || ""}
                          onChange={(e) => setForm({ ...form, stampApprovalDate: e.target.value })}
                        />
                      </div>
                      <div className="form-item full-row">
                        <label>Tax Stamp Document URL</label>
                        <input
                          type="text"
                          value={form.taxStampDocumentUrl || ""}
                          onChange={(e) => setForm({ ...form, taxStampDocumentUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </>
                  )}

                  {form.itemType === "OpticArmoryItem" && (
                    <>
                      <div className="form-item">
                        <label>Serial Number</label>
                        <input
                          type="text"
                          className="text-mono"
                          value={form.serialNumber || ""}
                          onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                          placeholder="e.g. OPT-112233"
                          required
                        />
                      </div>
                      <div className="form-item">
                        <label>Battery Last Changed Date</label>
                        <input
                          type="date"
                          value={form.batteryLastChangedDate || ""}
                          onChange={(e) => setForm({ ...form, batteryLastChangedDate: e.target.value })}
                        />
                      </div>
                      <div className="form-item">
                        <label>Battery Expiration Date</label>
                        <input
                          type="date"
                          value={form.batteryExpirationDate || ""}
                          onChange={(e) => setForm({ ...form, batteryExpirationDate: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {form.itemType === "LightArmoryItem" && (
                    <>
                      <div className="form-item">
                        <label>Battery Last Changed Date</label>
                        <input
                          type="date"
                          value={form.batteryLastChangedDate || ""}
                          onChange={(e) => setForm({ ...form, batteryLastChangedDate: e.target.value })}
                        />
                      </div>
                      <div className="form-item">
                        <label>Battery Expiration Date</label>
                        <input
                          type="date"
                          value={form.batteryExpirationDate || ""}
                          onChange={(e) => setForm({ ...form, batteryExpirationDate: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB: ATTACHMENTS */}
              {activeTab === "documents" && form.id > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <ArmoryItemDocumentsTable
                    armoryItemId={form.id}
                    coverImageId={form.coverImageId}
                    onCoverImageChanged={(docId) => {
                      setForm((prev) => ({ ...prev, coverImageId: docId }));
                    }}
                  />
                </div>
              )}

              {/* TAB: USER SPECS */}
              {activeTab === "specifications" && (
                <div className="specifications-tab-wrapper">
                  <div className="custom-specs-list">
                    {customSpecs.length === 0 ? (
                      <div className="empty-specs-message" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                        No custom specifications defined. Use the button below to add custom metadata pairs.
                      </div>
                    ) : (
                      customSpecs.map((spec, index) => (
                        <div key={index} className="custom-spec-row" style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                          <input
                            type="text"
                            placeholder="Key (e.g. Trigger Pull Weight)"
                            value={spec.key}
                            onChange={(e) => updateCustomSpec(index, "key", e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. 3.5 lbs)"
                            value={spec.value}
                            onChange={(e) => updateCustomSpec(index, "value", e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ height: "38px", padding: "0 12px" }}
                            onClick={() => removeCustomSpec(index)}
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addCustomSpec}
                    style={{ marginTop: "12px" }}
                  >
                    + Add New Specification Key
                  </button>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="modal-footer-row-container">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <SubmitButton
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                isEditMode={isEditMode}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
