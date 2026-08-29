import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import SubmitButton from "../components/SubmitButton";
import ProductDocumentsTable from "../components/ProductDocumentsTable";

import {
  useGetProductsFromKey,
  usePostProducts,
  usePatchProductsFromKey,
  useGetManufacturers,
  useGetCalibers,
  useGetProductsProductDocumentsFromKey,
  useGetProductsProductTypes,
} from "../api/endpoints";

import type { Manufacturer } from "../api/models/manufacturer";
import type { Caliber } from "../api/models/caliber";

export interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null; // null for "Add New", number for "Edit"
  onSaved?: (savedProduct: any) => void;
}

// ---------------------------------------------------------------------------
// Single Source of Truth for Form State Defaults
// ---------------------------------------------------------------------------
const INITIAL_FORM_STATE = {
  // audit
  created: new Date(),
  modified: new Date(),
  createdBy: "",
  modifiedBy: "",

  // product
  id: 0,
  name: "",
  description: "",
  manufacturerId: "" as string | number,
  productType: "PewPew",
  partNumber: "",
  sku: "",
  webPageUrl: "",
  coverImageId: null as number | null,
  specifications: {} as Record<string, any>,

  // pewpew
  pewPewCategory: "",
  caliberId: "" as string | number,
  actionType: "",
  isNfaItem: false,

  // optic
  minMagnification: "" as string | number,
  maxMagnification: "" as string | number,
  objectiveDiameterMm: "" as string | number,
  opticType: "",
  reticle: "",
  adjustmentUnits: "",
  tubeDiameter: "",
  isIlluminated: false,

  // suppressor
  threadPitch: "",
  attachmentType: "",
  material: "",
  soundReductionDb: "" as string | number,
  isFullAutoRated: false,
  isUserServiceable: false,

  // light
  lumens: "" as string | number,
  candela: "" as string | number,
  mountType: "",
  laserColor: "",
  hasRemoteSwitchPort: false,
  isInfraredCapable: false,

  // security
  lockType: "",

  // power
  powderType: "",
  shape: "",
  burnRate: "",
  containerWeightLbs: 0,

  // primer
  primerSize: "",
  primerType: "",
  isMagnum: false,
  isMatch: false,

  // projectile
  BcG1: null as number | null,
  BcG7: null as number | null,
  isBoatTail: false,
  hasCannelure: false,

  // casing
  primerPocketSize: "",
  isPrimed: false,
  isAnnealed: false,
  isVirgin: false,

  // ammunition
  muzzleVelocityFps: 0,
  muzzleEnergyFtLbs: 0,
  isPlusP: false,
  isSubsonic: false,

  // ammo box/battery/capacity
  hasBattery: false,
  batteryType: "",
  isCapcityLimited: false,
  maxCapcity: 0,
  quantity: 0,

  // iprojectile
  projectileProfile: "",
  projectileMaterial: "",
  isLeadFree: false,
  weightGrains: 0,

  // icasing
  caseMaterial: "",
  headStamp: "",
};

// Derived Type
export type FormState = typeof INITIAL_FORM_STATE;

// Derived Runtime Static Keys for Spec Filtering
const STATIC_KEYS = new Set(Object.keys(INITIAL_FORM_STATE));

const extractSpecifications = (product: any): Record<string, any> => {
  if (!product) return {};
  const specs: Record<string, any> = {};
  Object.keys(product).forEach((key) => {
    if (!STATIC_KEYS.has(key)) {
      specs[key] = product[key];
    }
  });
  return specs;
};

export default function ProductForm({
  isOpen,
  onClose,
  productId,
  onSaved,
}: ProductFormProps) {
  const queryClient = useQueryClient();
  const store = useStore();
  const { enums } = store || {};

  const isEditMode = productId !== null && productId > 0;

  // Active modal navigation tab
  const [activeTab, setActiveTab] = useState<string>("general");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Dynamic specifications local state
  const [customSpecs, setCustomSpecs] = useState<
    { key: string; value: string }[]
  >([]);

  // Fetch lookups
  const { data: productTypesData } = useGetProductsProductTypes();
  const productTypes = useMemo(() => {
    return productTypesData?.data?.value || [];
  }, [productTypesData]);

  const { data: manufacturersData } = useGetManufacturers();
  const manufacturersList = useMemo(() => {
    return (manufacturersData?.data?.value || []) as Manufacturer[];
  }, [manufacturersData]);

  const { data: calibersData } = useGetCalibers();
  const calibersList = useMemo(() => {
    return (calibersData?.data?.value || []) as Caliber[];
  }, [calibersData]);

  // Fetch single product details if we are in Edit Mode
  const { data: productDetailsData, isLoading: isDetailsLoading } =
    useGetProductsFromKey(productId || 0, undefined, {
      query: {
        enabled: isOpen && isEditMode && !!productId,
      },
    });

  // Fetch cover documents
  const { data: productDocsData } = useGetProductsProductDocumentsFromKey(
    productId || 0,
    undefined,
    {
      query: {
        enabled: isOpen && isEditMode && !!productId,
      },
    },
  );
  const productDocuments = useMemo(() => {
    const raw = productDocsData?.data;
    return Array.isArray(raw) ? raw : (raw as any)?.value || [];
  }, [productDocsData]);

  // Map Enums
  const actionTypes = enums?.actionTypes || [];
  const batteryTypes = enums?.batteryTypes || [];
  const caseMaterials = enums?.caseMaterials || [];
  const laserColors = enums?.laserColors || [];
  const lightMountTypes = enums?.lightMountTypes || [];
  const lockTypes = enums?.lockTypes || [];
  const opticAdjustmentUnits = enums?.opticAdjustmentUnits || [];
  const opticReticles = enums?.opticReticles || [];
  const opticTypes = enums?.opticTypes || [];
  const pewPewCategories = enums?.pewPewCategories || [];
  const powderBurnRates = enums?.powderBurnRates || [];
  const powderShapes = enums?.powderShapes || [];
  const powderTypes = enums?.powderTypes || [];
  const primerSizes = enums?.primerSizes || [];
  const primerTypes = enums?.primerTypes || [];
  const productDocumentTypes = enums?.productDocumentTypes || [];
  const projectileMaterials = enums?.projectileMaterials || [];
  const projectileProfiles = enums?.projectileProfiles || [];
  const suppressorAttachmentTypes = enums?.suppressorAttachmentTypes || [];
  const suppressorMaterials = enums?.suppressorMaterials || [];

  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);

  // Helper to build initial form combined with dropdown lookup defaults
  const getInitialFormWithLookups = () => ({
    ...INITIAL_FORM_STATE,
    manufacturerId: manufacturersList[0]?.id || "",
    caliberId: calibersList[0]?.id || "",
    pewPewCategory: pewPewCategories[0]?.id || "",
    actionType: actionTypes[0]?.id || "",
    opticType: opticTypes[0]?.id || "",
    reticle: opticReticles[0]?.id || "",
    adjustmentUnits: opticAdjustmentUnits[0]?.id || "",
    batteryType: batteryTypes[0]?.id || "",
    attachmentType: suppressorAttachmentTypes[0]?.id || "",
    material: suppressorMaterials[0]?.id || "",
    mountType: lightMountTypes[0]?.id || "",
    laserColor: laserColors[0]?.id || "",
    lockType: lockTypes[0]?.id || "",
  });

  // Effect to load initial defaults or existing details
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && productDetailsData?.data) {
      const prod = productDetailsData.data as any;
      const specs = extractSpecifications(prod);
      const specsArray = Object.entries(specs).map(([key, value]) => ({
        key,
        value: String(value),
      }));

      let type = prod.productType;
      if (!type && prod["@odata.type"]) {
        const parts = prod["@odata.type"].split(".");
        type = parts[parts.length - 1];
      }

      setCustomSpecs(specsArray);

      // Overlay server data cleanly onto form structure
      setForm({
        ...getInitialFormWithLookups(),
        ...prod,
        productType: type || "Product",
        created: prod.created ? new Date(prod.created) : new Date(),
        modified: prod.modified ? new Date(prod.modified) : new Date(),
        specifications: specs,
      });
      setActiveTab("general");
    } else if (!isEditMode) {
      setCustomSpecs([]);
      setForm(getInitialFormWithLookups());
      setActiveTab("general");
    }
  }, [
    isOpen,
    isEditMode,
    productDetailsData,
    manufacturersList,
    calibersList,
    pewPewCategories,
    actionTypes,
    opticTypes,
    opticReticles,
    opticAdjustmentUnits,
    batteryTypes,
    suppressorAttachmentTypes,
    suppressorMaterials,
    lightMountTypes,
    laserColors,
    lockTypes,
  ]);

  // Sync Specifications dictionary when customSpecs list updates
  const updateSpecsDictionary = (
    updatedPairs: { key: string; value: string }[],
  ) => {
    const dictionary: Record<string, string> = {};
    updatedPairs.forEach((p) => {
      if (p.key.trim()) {
        dictionary[p.key.trim()] = p.value;
      }
    });
    setForm((f) => ({ ...f, specifications: dictionary }));
  };

  const handleCustomSpecChange = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    const updated = customSpecs.map((spec, i) => {
      if (i === index) {
        return { ...spec, [field]: val };
      }
      return spec;
    });
    setCustomSpecs(updated);
    updateSpecsDictionary(updated);
  };

  const addCustomSpec = () => {
    const updated = [...customSpecs, { key: "", value: "" }];
    setCustomSpecs(updated);
  };

  const removeCustomSpec = (index: number) => {
    const updated = customSpecs.filter((_, i) => i !== index);
    setCustomSpecs(updated);
    updateSpecsDictionary(updated);
  };

  // Mutation Save operations
  const createProductMutation = usePostProducts({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
        if (res?.data && onSaved) {
          onSaved(res.data);
        }
      },
      onError: (err: any) => {
        alert("Failed to create product: " + (err?.message || "Unknown error"));
        setIsSaving(false);
      },
    },
  });

  const updateProductMutation = usePatchProductsFromKey({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
        if (onSaved) {
          onSaved(res?.data || { ...form });
        }
      },
      onError: (err: any) => {
        alert("Failed to save product: " + (err?.message || "Unknown error"));
        setIsSaving(false);
      },
    },
  });

  const buildProductPayload = (targetForm: FormState) => {
    const type = targetForm.productType || "Product";
    const payload: any = {};
    if (type !== "Product") {
      payload["@odata.type"] = `#Chambered.Data.Models.${type}`;
    }

    payload.id = targetForm.id || 0;
    payload.name = targetForm.name || "";
    payload.partNumber = targetForm.partNumber || "";
    payload.sku = targetForm.sku || "";
    payload.manufacturerId =
      parseInt(targetForm.manufacturerId as string, 10) || 0;
    payload.description = targetForm.description || null;
    payload.webPageUrl = targetForm.webPageUrl || null;
    payload.coverImageId = targetForm.coverImageId
      ? parseInt(targetForm.coverImageId as any, 10)
      : null;

    if (targetForm.specifications) {
      Object.entries(targetForm.specifications).forEach(([key, value]) => {
        payload[key] = value;
      });
    }

    if (type === "PewPew") {
      payload.caliberId = parseInt(targetForm.caliberId as string, 10) || null;
      payload.pewPewCategory = targetForm.pewPewCategory || null;
      payload.actionType = targetForm.actionType || null;
      payload.isNfaItem = !!targetForm.isNfaItem;
    } else if (type === "Optic") {
      payload.minMagnification =
        parseFloat(targetForm.minMagnification as string) || 1.0;
      payload.maxMagnification =
        parseFloat(targetForm.maxMagnification as string) || 1.0;
      payload.objectiveDiameterMm =
        parseInt(targetForm.objectiveDiameterMm as string, 10) || 0;
      payload.opticType = targetForm.opticType || null;
      payload.reticle = targetForm.reticle || null;
      payload.adjustmentUnits = targetForm.adjustmentUnits || null;
      payload.tubeDiameter = targetForm.tubeDiameter || null;
      payload.isIlluminated = !!targetForm.isIlluminated;
      payload.hasBattery = !!targetForm.hasBattery;
      payload.batteryType = targetForm.hasBattery
        ? targetForm.batteryType
        : null;
    } else if (type === "Suppressor") {
      payload.caliberId = parseInt(targetForm.caliberId as string, 10) || null;
      payload.threadPitch = targetForm.threadPitch || null;
      payload.attachmentType = targetForm.attachmentType || null;
      payload.material = targetForm.material || null;
      payload.soundReductionDb =
        parseInt(targetForm.soundReductionDb as string, 10) || null;
      payload.isFullAutoRated = !!targetForm.isFullAutoRated;
      payload.isUserServiceable = !!targetForm.isUserServiceable;
    } else if (type === "PewPewLight") {
      payload.lumens = parseInt(targetForm.lumens as string, 10) || 0;
      payload.candela = parseInt(targetForm.candela as string, 10) || 0;
      payload.mountType = targetForm.mountType || null;
      payload.laserColor = targetForm.laserColor || null;
      payload.hasRemoteSwitchPort = !!targetForm.hasRemoteSwitchPort;
      payload.isInfraredCapable = !!targetForm.isInfraredCapable;
      payload.hasBattery = !!targetForm.hasBattery;
      payload.batteryType = targetForm.hasBattery
        ? targetForm.batteryType
        : null;
    } else if (type === "Security") {
      payload.lockType = targetForm.lockType || null;
      payload.hasBattery = !!targetForm.hasBattery;
      payload.batteryType = targetForm.hasBattery
        ? targetForm.batteryType
        : null;
    } else if (type === "Powder") {
      payload.powderType = targetForm.powderType || null;
      payload.shape = targetForm.shape || null;
      payload.burnRate = targetForm.burnRate || null;
      payload.containerWeightLbs = targetForm.containerWeightLbs || 0;
    }

    // Clean payload of navigation objects to avoid OData mapping errors
    Object.keys(payload).forEach((key) => {
      if (
        payload[key] !== null &&
        typeof payload[key] === "object" &&
        key !== "specifications"
      ) {
        delete payload[key];
      }
    });

    return payload;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    const payload = buildProductPayload(form);

    try {
      if (form.id > 0) {
        await updateProductMutation.mutateAsync({
          key: form.id,
          data: payload,
        });
      } else {
        await createProductMutation.mutateAsync({ data: payload });
      }
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const renderBatteryControl = (label: string) => {
    return (
      <div className="form-item checkbox-row" style={{ marginTop: "8px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
          }}
        >
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={form.hasBattery || false}
              onChange={(e) =>
                setForm({
                  ...form,
                  hasBattery: e.target.checked,
                  batteryType: e.target.checked
                    ? batteryTypes[0]?.id || ""
                    : "",
                })
              }
            />
            <span className="checkmark"></span>
            <span>{label}</span>
          </label>

          {form.hasBattery && (
            <div
              className="battery-type-selector-wrapper"
              style={{ paddingLeft: "28px" }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                Required Battery Specification Model
              </label>
              <select
                value={form.batteryType || ""}
                onChange={(e) =>
                  setForm({ ...form, batteryType: e.target.value })
                }
                style={{ width: "220px", display: "inline-block" }}
              >
                {batteryTypes.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCapacityControl = (label: string) => {
    return (
      <div className="form-item checkbox-row" style={{ marginTop: "8px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
          }}
        >
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={form.isCapcityLimited || false}
              onChange={(e) =>
                setForm({
                  ...form,
                  isCapcityLimited: e.target.checked,
                })
              }
            />
            <span className="checkmark"></span>
            <span>{label}</span>
          </label>

          {form.isCapcityLimited && (
            <div className="form-item">
              <label>Minimum Magnification</label>
              <input
                type="number"
                step="1"
                value={form.maxCapcity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxCapcity: parseInt(e.target.value),
                  })
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="armory-center-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title-bar">
          <div className="title-left">
            <h3>{isEditMode ? "Edit Item" : "Add New item"}</h3>
          </div>
          <button className="modal-close-x-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {/* Modal tabs */}
        <div className="modal-tabs-header-row">
          <button
            className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
            type="button"
          >
            Product Details
          </button>

          {form.productType !== "Product" && (
            <button
              className={`tab-btn ${activeTab === "subclass" ? "active" : ""}`}
              onClick={() => setActiveTab("subclass")}
              type="button"
            >
              {form.productType === "PewPew" && "PewPew Specs"}
              {form.productType === "Optic" && "Optical Specs"}
              {form.productType === "Suppressor" && "Suppressor Specs"}
              {form.productType === "PewPewLight" && "Light Specs"}
              {form.productType === "Security" && "Security Specs"}
              {form.productType === "Magazine" && "Magazine Specs"}
              {form.productType === "Powder" && "Powder Specs"}
              {form.productType === "Primer" && "Primer Specs"}
              {form.productType === "Projectile" && "Projectile Specs"}
              {form.productType === "Casing" && "Casing Specs"}
              {form.productType === "Ammunition" && "Ammunition Specs"}
              {form.productType === "AmmoBox" && "AmmoBox Specs"}
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
            User Specs
          </button>
        </div>

        {isDetailsLoading && isEditMode ? (
          <div className="loading-state" style={{ padding: "40px" }}>
            Loading catalog details...
          </div>
        ) : (
          <form
            onSubmit={handleSaveProduct}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
              margin: 0,
            }}
          >
            <div className="modal-tabs-body-content">
              {saveSuccess && (
                <div className="detail-save-toast">
                  ✓ Product saved successfully
                </div>
              )}

              {/* TAB: GENERAL */}
              {activeTab === "general" && (
                <div className="form-grid">
                  <div className="form-item">
                    <label>Product Catalog Class Type</label>
                    <select
                      value={form.productType}
                      onChange={(e) =>
                        setForm({ ...form, productType: e.target.value })
                      }
                      disabled={isEditMode}
                    >
                      {productTypes.map((type: string) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item">
                    <label>Manufacturer</label>
                    <select
                      value={form.manufacturerId || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          manufacturerId: parseInt(e.target.value, 10),
                        })
                      }
                      required
                    >
                      <option value="">-- Select Manufacturer --</option>
                      {manufacturersList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item full-row">
                    <label>Product Model Name</label>
                    <input
                      type="text"
                      value={form.name || ""}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. 19 Gen 5"
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label>Manufacturer Part Number (MPN)</label>
                    <input
                      type="text"
                      value={form.partNumber || ""}
                      onChange={(e) =>
                        setForm({ ...form, partNumber: e.target.value })
                      }
                      placeholder="e.g. UA1950712"
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label>Universal SKU / Product Number</label>
                    <input
                      type="text"
                      value={form.sku || ""}
                      onChange={(e) =>
                        setForm({ ...form, sku: e.target.value })
                      }
                      placeholder="e.g. 764503030109"
                    />
                  </div>

                  <div className="form-item full-row">
                    <label>Description</label>
                    <textarea
                      rows={3}
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Enter product description..."
                    />
                  </div>

                  <div className="form-item full-row">
                    <label>Web Page URL</label>
                    <input
                      type="url"
                      value={form.webPageUrl || ""}
                      onChange={(e) =>
                        setForm({ ...form, webPageUrl: e.target.value })
                      }
                      placeholder="https://manufacturersite.com/product"
                    />
                  </div>

                  {form.id > 0 && (
                    <div className="form-item full-row">
                      <label>Cover Image</label>
                      <select
                        value={form.coverImageId || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            coverImageId: e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          })
                        }
                        style={{
                          backgroundColor: "var(--bg-input)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          padding: "0 12px",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                          height: "38px",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <option value="">-- select cover image --</option>
                        {productDocuments.map((img: any) => (
                          <option key={img.id} value={img.id}>
                            {img.fileName} (
                            {((img.fileSizeBytes || 0) / 1024).toFixed(1)} KB)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: SUBCLASS SPECIFIC */}
              {activeTab === "subclass" && (
                <div className="form-grid">
                  {/* PewPew Subclass Form Controls */}
                  {form.productType === "PewPew" && (
                    <>
                      <div className="form-item">
                        <label>Caliber</label>
                        <select
                          value={form.caliberId || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              caliberId: parseInt(e.target.value, 10),
                            })
                          }
                          required
                        >
                          <option value="">-- Select Caliber --</option>
                          {calibersList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>PewPew Category</label>
                        <select
                          value={form.pewPewCategory || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              pewPewCategory: e.target.value,
                            })
                          }
                        >
                          {pewPewCategories.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Action Type</label>
                        <select
                          value={form.actionType || ""}
                          onChange={(e) =>
                            setForm({ ...form, actionType: e.target.value })
                          }
                        >
                          {actionTypes.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div
                        className="form-item checkbox-row"
                        style={{ alignSelf: "center", marginTop: "14px" }}
                      >
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={form.isNfaItem || false}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                isNfaItem: e.target.checked,
                              })
                            }
                          />
                          <span className="checkmark"></span>
                          <span>Is NFA Item</span>
                        </label>
                      </div>
                    </>
                  )}

                  {/* Optic Subclass Form Controls */}
                  {form.productType === "Optic" && (
                    <>
                      <div className="form-item">
                        <label>Optic Type</label>
                        <select
                          value={form.opticType || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              opticType: e.target.value,
                            })
                          }
                        >
                          {opticTypes.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Reticle Type</label>
                        <select
                          value={form.reticle || ""}
                          onChange={(e) =>
                            setForm({ ...form, reticle: e.target.value })
                          }
                        >
                          {opticReticles.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Minimum Magnification</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.minMagnification || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              minMagnification: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Maximum Magnification</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.maxMagnification || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              maxMagnification: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Objective Lens Size (mm)</label>
                        <input
                          type="number"
                          value={form.objectiveDiameterMm || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              objectiveDiameterMm: parseInt(e.target.value, 10),
                            })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Tube / Body Diameter</label>
                        <input
                          type="text"
                          value={form.tubeDiameter || ""}
                          placeholder="e.g. 30mm, 34mm, 1-inch"
                          onChange={(e) =>
                            setForm({ ...form, tubeDiameter: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item full-row">
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "bold",
                          }}
                        >
                          Turret Adjustment Units (Select All That Apply)
                        </label>
                        <div
                          className="adjustment-units-grid"
                          style={{
                            display: "flex",
                            gap: "20px",
                            flexWrap: "wrap",
                            padding: "10px",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "6px",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {opticAdjustmentUnits
                            .filter((opt: any) => opt.name !== "None")
                            .map((opt: any) => {
                              const isChecked = form.adjustmentUnits
                                ? form.adjustmentUnits
                                    .split(",")
                                    .map((s: string) => s.trim())
                                    .includes(opt.label)
                                : false;
                              return (
                                <label
                                  key={opt.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    cursor: "pointer",
                                    userSelect: "none",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      let current = form.adjustmentUnits
                                        ? form.adjustmentUnits
                                            .split(",")
                                            .map((s: string) => s.trim())
                                            .filter(Boolean)
                                        : [];
                                      if (current.includes(opt.label)) {
                                        current = current.filter(
                                          (u: string) => u !== opt.label,
                                        );
                                      } else {
                                        current = [...current, opt.label];
                                      }
                                      setForm({
                                        ...form,
                                        adjustmentUnits: current.join(", "),
                                      });
                                    }}
                                    style={{
                                      cursor: "pointer",
                                      width: "16px",
                                      height: "16px",
                                    }}
                                  />
                                  <span style={{ fontSize: "14px" }}>
                                    {opt.label}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>

                      <div className="form-item checkbox-row full-row">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={form.isIlluminated || false}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                isIlluminated: e.target.checked,
                              })
                            }
                          />
                          <span className="checkmark"></span>
                          <span>Features Reticle Illumination</span>
                        </label>
                      </div>

                      {renderBatteryControl(
                        "Requires Battery Power (Illuminated Reticle / Dial)",
                      )}
                    </>
                  )}

                  {/* Suppressor Subclass Form Controls */}
                  {form.productType === "Suppressor" && (
                    <>
                      <div className="form-item">
                        <label>Caliber</label>
                        <select
                          value={form.caliberId || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              caliberId: parseInt(e.target.value, 10),
                            })
                          }
                          required
                        >
                          <option value="">-- Select Caliber --</option>
                          {calibersList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Muzzle Thread Pitch</label>
                        <input
                          type="text"
                          value={form.threadPitch || ""}
                          placeholder="e.g. 1/2x28, 5/8x24"
                          onChange={(e) =>
                            setForm({ ...form, threadPitch: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Attachment Type</label>
                        <select
                          value={form.attachmentType || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              attachmentType: e.target.value,
                            })
                          }
                        >
                          {suppressorAttachmentTypes.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Material</label>
                        <select
                          value={form.material || ""}
                          onChange={(e) =>
                            setForm({ ...form, material: e.target.value })
                          }
                        >
                          {suppressorMaterials.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Sound Reduction Rating (dB)</label>
                        <input
                          type="number"
                          value={form.soundReductionDb || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              soundReductionDb:
                                parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </div>

                      <div
                        className="form-item checkbox-row full-row"
                        style={{ marginTop: "14px" }}
                      >
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={form.isFullAutoRated || false}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                isFullAutoRated: e.target.checked,
                              })
                            }
                          />
                          <span className="checkmark"></span>
                          <span>Rated for Sustained Full-Automatic Fire</span>
                        </label>
                      </div>

                      <div className="form-item checkbox-row full-row">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={form.isUserServiceable || false}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                isUserServiceable: e.target.checked,
                              })
                            }
                          />
                          <span className="checkmark"></span>
                          <span>
                            User Serviceable (Disassembles for cleaning)
                          </span>
                        </label>
                      </div>

                      <div
                        className="form-item checkbox-row"
                        style={{ alignSelf: "center", marginTop: "14px" }}
                      >
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={form.isNfaItem || false}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                isNfaItem: e.target.checked,
                              })
                            }
                          />
                          <span className="checkmark"></span>
                          <span>Is NFA Item</span>
                        </label>
                      </div>
                    </>
                  )}

                  {/* PewPewLight Subclass Form Controls */}
                  {form.productType === "PewPewLight" && (
                    <>
                      <div className="form-item">
                        <label>Luminous Flux (Lumens)</label>
                        <input
                          type="number"
                          value={form.lumens || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              lumens: parseInt(e.target.value, 10),
                            })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Peak Beam Intensity (Candela)</label>
                        <input
                          type="number"
                          value={form.candela || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              candela: parseInt(e.target.value, 10),
                            })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Mount Base Interface</label>
                        <select
                          value={form.mountType || ""}
                          onChange={(e) =>
                            setForm({ ...form, mountType: e.target.value })
                          }
                        >
                          <option value="">-- Select Mount Type --</option>
                          {lightMountTypes.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Laser Designator Spectrum</label>
                        <select
                          value={form.laserColor || ""}
                          onChange={(e) =>
                            setForm({ ...form, laserColor: e.target.value })
                          }
                        >
                          {laserColors.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div
                        className="form-item checkbox-row full-row"
                        style={{ marginTop: "14px" }}
                      >
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={form.hasRemoteSwitchPort || false}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                hasRemoteSwitchPort: e.target.checked,
                              })
                            }
                          />
                          <span className="checkmark"></span>
                          <span>
                            Supports Pressure Switches (Tailcap switch port)
                          </span>
                        </label>
                      </div>

                      <div className="form-item checkbox-row full-row">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={form.isInfraredCapable || false}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                isInfraredCapable: e.target.checked,
                              })
                            }
                          />
                          <span className="checkmark"></span>
                          <span>
                            Features IR Illuminator / Night Vision Mode
                          </span>
                        </label>
                      </div>

                      {renderBatteryControl("Requires Battery Power")}
                    </>
                  )}

                  {/* Security Subclass Form Controls */}
                  {form.productType === "Security" && (
                    <>
                      <div className="form-item">
                        <label>Lock Type</label>
                        <select
                          value={form.lockType || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              lockType: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Select Lock Type --</option>
                          {lockTypes.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {renderBatteryControl(
                        "Requires Battery Power (For locking mechanisms or electronic keypads)",
                      )}

                      {renderCapacityControl(
                        "Has a maximum capacity limit for Armory Items",
                      )}
                    </>
                  )}

                  {/* Magazine Subclass Form Controls */}
                  {form.productType === "Magazine" && (
                    <>
                      {renderCapacityControl(
                        "Has a maximum capacity limit for Armory Items",
                      )}
                    </>
                  )}

                  {/* Powder Subclass Form Controls */}
                  {form.productType === "Powder" && (
                    <>
                      <div className="form-item">
                        <label>Powder Type</label>
                        <select
                          value={form.powderType || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              powderType: e.target.value,
                            })
                          }
                        >
                          <option value="">-- select --</option>
                          {powderTypes.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Powder Shape</label>
                        <select
                          value={form.shape || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              shape: e.target.value,
                            })
                          }
                        >
                          <option value="">-- select --</option>
                          {powderShapes.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Burn Rate</label>
                        <select
                          value={form.burnRate || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              burnRate: e.target.value,
                            })
                          }
                        >
                          <option value="">-- select --</option>
                          {powderBurnRates.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Container Weight(lbs)</label>
                        <input
                          type="number"
                          step=".5"
                          value={form.containerWeightLbs || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              containerWeightLbs: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB: ATTACHMENTS & DOCUMENTS */}
              {activeTab === "documents" && (
                <div
                  style={{
                    padding: "10px 0",
                    overflowY: "auto",
                    flex: 1,
                    maxHeight: "550px",
                  }}
                >
                  <ProductDocumentsTable productId={form.id} readOnly={false} />
                </div>
              )}

              {/* TAB: DYNAMIC JSON SPECIFICATIONS */}
              {activeTab === "specifications" && (
                <div className="specifications-editor-container">
                  <div className="spec-info-card">
                    <h4>💡 User Custom Specifications</h4>
                    <p>
                      You can store arbitrary metadata parameters that don't
                      belong to predefined schemas. These fields compile
                      dynamically into an offline JSON attribute dictionary on
                      save.
                    </p>
                  </div>

                  <div className="specs-editor-grid">
                    <div className="specs-headers">
                      <span>Parameter Key</span>
                      <span>Parameter Specification Value</span>
                      <span></span>
                    </div>

                    {customSpecs.length === 0 ? (
                      <div className="no-specs-text">
                        No custom parameters added yet.
                      </div>
                    ) : (
                      customSpecs.map((spec, index) => (
                        <div key={index} className="spec-editor-row">
                          <input
                            type="text"
                            placeholder="e.g. Eye Relief"
                            value={spec.key}
                            onChange={(e) =>
                              handleCustomSpecChange(
                                index,
                                "key",
                                e.target.value,
                              )
                            }
                            required
                          />
                          <input
                            type="text"
                            placeholder="e.g. 4.5 inches"
                            value={spec.value}
                            onChange={(e) =>
                              handleCustomSpecChange(
                                index,
                                "value",
                                e.target.value,
                              )
                            }
                            required
                          />
                          <button
                            type="button"
                            className="remove-spec-btn"
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
                    className="add-spec-btn"
                    onClick={addCustomSpec}
                  >
                    + Add New Specification Key
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
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
