import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../StoreContext";
import "./Catalog.css";
import SubmitButton from "../components/SubmitButton";
import buildQuery from "odata-query";

export default function Catalog() {
  const store = useStore();
  const { enums } = store || {};

  // State collections
  const [products, setProducts] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [calibers, setCalibers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Memoize OData metadata enums globally loaded by StoreContext
  const suppressorMaterials = useMemo(
    () => enums?.suppressorMaterials || [],
    [enums],
  );
  const suppressorAttachmentTypes = useMemo(
    () => enums?.suppressorAttachmentTypes || [],
    [enums],
  );
  const opticReticles = useMemo(() => enums?.opticReticles || [], [enums]);
  const opticAdjustmentUnits = useMemo(
    () => enums?.opticAdjustmentUnits || [],
    [enums],
  );
  const batteryTypes = useMemo(() => enums?.batteryTypes || [], [enums]);
  const actionTypes = useMemo(() => enums?.actionTypes || [], [enums]);
  const pewPewCategories = useMemo(
    () => enums?.pewPewCategories || [],
    [enums],
  );
  const opticTypes = useMemo(() => enums?.opticTypes || [], [enums]);
  const laserColors = useMemo(() => enums?.laserColors || [], [enums]);
  const lightMountTypes = useMemo(() => enums?.lightMountTypes || [], [enums]);
  const lockTypes = useMemo(() => enums?.lockTypes || [], [enums]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Modal & editing states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'subclass' | 'specifications'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Specifications key-value editor local state
  const [customSpecs, setCustomSpecs] = useState([]); // Array of { key: '', value: '' }

  // Form state with blank strings instead of dummy values
  const [form, setForm] = useState({
    id: 0,
    productType: "PewPew", // Default to PewPew
    name: "",
    description: "",
    partNumber: "",
    sku: "",
    manufacturerId: "",
    webPageUrl: "",
    specifications: {},

    // PewPew fields
    caliberId: "",
    pewPewCategory: "",
    actionType: "",
    isNfaItem: false,

    // Optic fields
    minMagnification: "",
    maxMagnification: "",
    objectiveDiameterMm: "",
    opticType: "",
    reticle: "",
    adjustmentUnits: "",
    tubeDiameter: "",
    isIlluminated: false,
    hasBattery: false,
    batteryType: "",

    // Suppressor fields
    threadPitch: "",
    attachmentType: "",
    material: "",
    soundReductionDb: "",
    isFullAutoRated: false,
    isUserServiceable: false,

    // PewPewLight fields
    lumens: "",
    candela: "",
    mountType: "",
    laserColor: "",
    hasRemoteSwitchPort: false,
    isInfraredCapable: false,

    // Security fields
    lockType: "",
  });

  // Fetch initial data
  const fetchCatalogData = async () => {
    setLoading(true);
    setError("");
    try {
      const [productsRes, mfgRes, calRes] = await Promise.all([
        fetch(
          "/api/v1/Products?$expand=manufacturer,Chambered.Data.Models.PewPew/caliber,Chambered.Data.Models.Suppressor/caliber",
        ),
        fetch("/api/v1/Manufacturers"),
        fetch("/api/v1/Calibers"),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.value || []);
      }
      if (mfgRes.ok) {
        const data = await mfgRes.json();
        setManufacturers(data.value || []);
      }
      if (calRes.ok) {
        const data = await calRes.json();
        setCalibers(data.value || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve catalog assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Processed products with unified helper keys
  const processedProducts = useMemo(() => {
    return products.map((p) => {
      const manufacturer =
        p.manufacturer || manufacturers.find((m) => m.id === p.manufacturerId);
      const caliber = p.caliber || calibers.find((c) => c.id === p.caliberId);

      let type = p.productType;
      if (!type && p["@odata.type"]) {
        const parts = p["@odata.type"].split(".");
        type = parts[parts.length - 1];
      }
      if (!type) type = "Product";

      return {
        ...p,
        productType: type,
        manufacturerName: manufacturer?.name || "",
        caliberName: caliber?.name || "",
      };
    });
  }, [products, manufacturers, calibers]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return processedProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.manufacturerName &&
          p.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === "All" || p.productType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [processedProducts, searchTerm, typeFilter]);

  // Synchronize specifications dictionary to customSpecs array
  useEffect(() => {
    if (form.specifications) {
      const pairs = Object.entries(form.specifications).map(([key, value]) => ({
        key,
        value,
      }));
      setCustomSpecs(pairs);
    } else {
      setCustomSpecs([]);
    }
  }, [form.specifications]);

  // Sync customSpecs array back to form specifications dictionary
  const updateSpecsDictionary = (updatedPairs) => {
    const dictionary = {};
    updatedPairs.forEach((p) => {
      if (p.key.trim()) {
        dictionary[p.key.trim()] = p.value;
      }
    });
    setForm((prev) => ({ ...prev, specifications: dictionary }));
  };

  // Modal helpers
  const openAddModal = () => {
    setIsEditMode(false);
    setActiveTab("general");
    setSaveSuccess(false);
    setForm({
      id: 0,
      productType: "PewPew", // Default to PewPew
      name: "",
      description: "",
      partNumber: "",
      sku: "",
      manufacturerId: manufacturers[0]?.id || "",
      webPageUrl: "",
      specifications: {},

      // PewPew fields
      caliberId: calibers[0]?.id || "",
      pewPewCategory: "",
      actionType: "",
      isNfaItem: false,

      // Optic fields
      minMagnification: "",
      maxMagnification: "",
      objectiveDiameterMm: "",
      opticType: "",
      reticle: "",
      adjustmentUnits: "",
      tubeDiameter: "",
      isIlluminated: false,
      hasBattery: false,
      batteryType: "",

      // Suppressor fields
      threadPitch: "",
      attachmentType: "",
      material: "",
      soundReductionDb: "",
      isFullAutoRated: false,
      isUserServiceable: false,

      // PewPewLight fields
      lumens: "",
      candela: "",
      mountType: "",
      laserColor: "",
      hasRemoteSwitchPort: false,
      isInfraredCapable: false,

      // Security fields
      lockType: "",
    });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setIsEditMode(true);
    setActiveTab("general");
    setSaveSuccess(false);

    // Map types safely
    setForm({
      ...p,
      specifications: p.specifications || {},
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const isNew = !isEditMode;
      const url = isNew ? "/api/v1/Products" : `/api/v1/Products/${form.id}`;
      const method = isNew ? "POST" : "PUT";

      // Sanitize payload integers and types to avoid invalid JSON types (like NaN) causing model binding failure.
      const payload = { ...form };
      payload.manufacturerId = parseInt(payload.manufacturerId, 10) || 0;

      // Prune fields based on type to ensure the specific DTO is perfectly formed
      if (payload.productType === "PewPew") {
        payload.caliberId = parseInt(payload.caliberId, 10) || 0;
        if (!payload.pewPewCategory) delete payload.pewPewCategory;
        if (!payload.actionType) delete payload.actionType;
      } else {
        delete payload.pewPewCategory;
        delete payload.actionType;
      }

      if (payload.productType === "Optic") {
        payload.minMagnification = parseFloat(payload.minMagnification) || 0;
        payload.maxMagnification = parseFloat(payload.maxMagnification) || 0;
        payload.objectiveDiameterMm = parseInt(payload.objectiveDiameterMm, 10) || 0;
        payload.tubeDiameter = parseInt(payload.tubeDiameter, 10) || 0;
        payload.isIlluminated = !!payload.isIlluminated;
        if (!payload.opticType) delete payload.opticType;
        if (!payload.reticle) delete payload.reticle;
        if (!payload.adjustmentUnits) delete payload.adjustmentUnits;
      } else {
        delete payload.minMagnification;
        delete payload.maxMagnification;
        delete payload.objectiveDiameterMm;
        delete payload.opticType;
        delete payload.reticle;
        delete payload.adjustmentUnits;
        delete payload.tubeDiameter;
        delete payload.isIlluminated;
      }

      if (payload.productType === "Suppressor") {
        payload.caliberId = parseInt(payload.caliberId, 10) || 0;
        payload.soundReductionDb = parseInt(payload.soundReductionDb, 10) || 0;
        payload.isFullAutoRated = !!payload.isFullAutoRated;
        payload.isUserServiceable = !!payload.isUserServiceable;
        if (!payload.attachmentType) delete payload.attachmentType;
        if (!payload.material) delete payload.material;
      } else {
        delete payload.threadPitch;
        delete payload.attachmentType;
        delete payload.material;
        delete payload.soundReductionDb;
        delete payload.isFullAutoRated;
        delete payload.isUserServiceable;
      }

      if (payload.productType === "PewPewLight") {
        payload.lumens = parseInt(payload.lumens, 10) || 0;
        payload.candela = parseInt(payload.candela, 10) || 0;
        payload.hasRemoteSwitchPort = !!payload.hasRemoteSwitchPort;
        payload.isInfraredCapable = !!payload.isInfraredCapable;
        if (!payload.mountType) delete payload.mountType;
        if (!payload.laserColor) delete payload.laserColor;
      } else {
        delete payload.lumens;
        delete payload.candela;
        delete payload.mountType;
        delete payload.laserColor;
        delete payload.hasRemoteSwitchPort;
        delete payload.isInfraredCapable;
      }

      if (payload.productType === "Security") {
        if (!payload.lockType) delete payload.lockType;
      } else {
        delete payload.lockType;
      }

      // If neither PewPew nor Suppressor, delete caliberId and isNfaItem
      if (payload.productType !== "PewPew" && payload.productType !== "Suppressor") {
        delete payload.caliberId;
        delete payload.isNfaItem;
      }

      // Handle battery fields for INeedsBattery subclasses
      const needsBattery = ["Optic", "PewPewLight", "Security"].includes(payload.productType);
      if (needsBattery) {
        payload.hasBattery = !!payload.hasBattery;
        if (!payload.batteryType) delete payload.batteryType;
      } else {
        delete payload.hasBattery;
        delete payload.batteryType;
      }

      // Prune navigation property objects and arrays (e.g. manufacturer, caliber) to prevent OData deserialization failure
      Object.keys(payload).forEach((key) => {
        const val = payload[key];
        if (val !== null && typeof val === "object") {
          delete payload[key];
        }
      });



      // Inject @odata.type so OData knows which derived subclass type to instantiate on creation/update
      if (payload.productType) {
        payload["@odata.type"] =
          `#Chambered.Data.Models.${payload.productType}`;
      }

      // Set required Name field (ensuring fallback to empty string if missing)
      payload.name = payload.name || "";

      delete payload.productType;
      delete payload.manufacturerName;
      delete payload.caliberName;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        fetchCatalogData();
      } else {
        let errorMsg = "Failed to save product information.";
        try {
          const data = await res.json();
          if (data.message) {
            errorMsg = data.message;
          } else if (data.errors) {
            const errorLines = [];
            Object.keys(data.errors).forEach((key) => {
              const messages = data.errors[key];
              errorLines.push(`${key}: ${messages.join(", ")}`);
            });
            errorMsg = errorLines.join(" | ");
          } else if (data.title) {
            errorMsg = data.title;
          }
        } catch (jsonErr) {
          errorMsg = `Server error ${res.status}: ${res.statusText}`;
        }
        setError(errorMsg);
      }
    } catch (err) {
      setError("API call failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product catalog entry?",
      )
    )
      return;

    try {
      const res = await fetch(`/api/v1/Products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCatalogData();
      } else {
        let errorMsg = "Failed to delete catalog item.";
        try {
          const data = await res.json();
          errorMsg = data.message || data.title || errorMsg;
        } catch (jsonErr) {
          errorMsg = `Server error ${res.status}: ${res.statusText}`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      alert("API deletion error.");
    }
  };

  // Dynamic specs editor helpers
  const addCustomSpec = () => {
    const updated = [...customSpecs, { key: "", value: "" }];
    setCustomSpecs(updated);
  };

  const removeCustomSpec = (index) => {
    const updated = customSpecs.filter((_, i) => i !== index);
    setCustomSpecs(updated);
    updateSpecsDictionary(updated);
  };

  const handleCustomSpecChange = (index, field, val) => {
    const updated = customSpecs.map((spec, i) => {
      if (i === index) {
        return { ...spec, [field]: val };
      }
      return spec;
    });
    setCustomSpecs(updated);
    updateSpecsDictionary(updated);
  };

  // Get friendly display text for item sub-attributes
  const renderSubAttributes = (p) => {
    if (p.productType === "PewPew") {
      return `Category: ${p.pewPewCategory} | Caliber: ${p.caliberName || "Unknown"} | Action: ${p.actionType}`;
    }
    if (p.productType === "Optic") {
      return `Type: ${p.opticType} | Mag: ${p.magnificationDisplay || `${p.minMagnification}-${p.maxMagnification}x`} | Reticle: ${p.reticle || "None"}`;
    }
    if (p.productType === "Suppressor") {
      return `Material: ${p.material || "Metal"} | Sound: -${p.soundReductionDb}dB`;
    }
    if (p.productType === "PewPewLight") {
      return `Output: ${p.lumens} LM / ${p.candela} CD | Battery: ${p.batteryType}`;
    }
    return "Standard Catalog Product";
  };

  // Dynamic type labels helper
  const getProductTypeLabel = (type) => {
    switch (type) {
      case "PewPew":
        return "🏷️ PewPew";
      case "Optic":
        return "🔭 Optic / Scope";
      case "Suppressor":
        return "🤫 Suppressor";
      case "PewPewLight":
        return "🔦 PewPew Light";
      case "Security":
        return "Security";
      default:
        return "📦 General";
    }
  };

  // Reusable control that renders BOTH the checkbox and the battery dropdown
  const renderBatteryControl = (checkboxLabel = "Requires Battery") => {
    return (
      <>
        <div
          className="form-item checkbox-row full-row"
          style={{ marginBottom: "14px" }}
        >
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={form.hasBattery || false}
              onChange={(e) =>
                setForm({ ...form, hasBattery: e.target.checked })
              }
            />
            <span className="checkmark"></span>
            <span>{checkboxLabel}</span>
          </label>
        </div>

        {form.hasBattery && (
          <div className="form-item">
            <label>Battery Type</label>
            <select
              value={form.batteryType}
              onChange={(e) =>
                setForm({ ...form, batteryType: e.target.value })
              }
            >
              {batteryTypes.map((bat) => (
                <option key={bat.id} value={bat.id}>
                  {bat.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="catalog-view">
      <div className="view-actions">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search model, SKU, or manufacturer..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="type-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="PewPew">PewPews</option>
            <option value="Optic">Optics</option>
            <option value="Suppressor">Suppressors</option>
            <option value="PewPewLight">PewPew Lights</option>
            <option value="Security">Security / Vaults</option>
            <option value="Product">General</option>
          </select>
        </div>
        <button className="add-btn" onClick={openAddModal}>
          + Add Product to Catalog
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading product catalog...</div>
      ) : error ? (
        <div className="error-alert">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">No matching catalog items found.</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="product-card"
              onClick={() => openEditModal(p)}
            >
              <div className="card-badge">
                {getProductTypeLabel(p.productType)}
              </div>
              <div className="card-content">
                <span className="manufacturer-tag">{p.manufacturerName}</span>
                <h3 className="model-header">{p.name}</h3>
                <div className="sku-part-info">
                  {p.partNumber && <span>Part: {p.partNumber}</span>}
                  {p.sku && <span>SKU: {p.sku}</span>}
                </div>
                <p className="attributes-text">{renderSubAttributes(p)}</p>

                {Object.keys(p.specifications || {}).length > 0 && (
                  <div className="specifications-preview">
                    <h4>Custom Specifications</h4>
                    <div className="specs-list">
                      {Object.entries(p.specifications)
                        .slice(0, 3)
                        .map(([key, val]) => (
                          <div key={key} className="spec-item">
                            <span className="spec-key">{key}:</span>
                            <span className="spec-val">{val}</span>
                          </div>
                        ))}
                      {Object.keys(p.specifications).length > 3 && (
                        <span className="more-specs-tag">
                          +{Object.keys(p.specifications).length - 3} more
                          specifications
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-danger btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Catalog Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="armory-center-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title-bar">
              <div className="title-left">
                <span className="modal-title-icon">🏷️</span>
                <h3>
                  {isEditMode
                    ? "Modify Product Reference"
                    : "Add New Catalog Reference"}
                </h3>
              </div>
              <button
                className="modal-close-x-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            {/* Modal navigation tabs with conditionally visible subclass-specific tab */}
            <div className="modal-tabs-header-row">
              <button
                className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
                onClick={() => setActiveTab("general")}
                type="button"
              >
                General Details
              </button>

              {/* Subclass-specific conditional tab showing/hiding dynamically */}
              {form.productType !== "Product" && (
                <button
                  className={`tab-btn ${activeTab === "subclass" ? "active" : ""}`}
                  onClick={() => setActiveTab("subclass")}
                  type="button"
                >
                  {form.productType === "PewPew" && "📐 PewPew Specs"}
                  {form.productType === "Optic" && "🔭 Optical Specs"}
                  {form.productType === "Suppressor" && "🤫 Suppressor Specs"}
                  {form.productType === "PewPewLight" && "🔦 Light Specs"}
                  {form.productType === "Security" && "🛡️ Security Specs"}
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
              <div className="modal-tabs-body-content">
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
                        <option value="Product">General</option>
                        <option value="PewPew">PewPew</option>
                        <option value="Optic">Optic / Scope</option>
                        <option value="Suppressor">Suppressor</option>
                        <option value="PewPewLight">PewPew Light</option>
                        <option value="Security">Security</option>
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Manufacturer</label>
                      <select
                        value={form.manufacturerId}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            manufacturerId: parseInt(e.target.value),
                          })
                        }
                        required
                      >
                        <option value="">-- Select Manufacturer --</option>
                        {manufacturers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item full-row">
                      <label>Product Model Name<span className="req">*</span></label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="e.g. 19 Gen 5"
                        required
                      />
                    </div>

                    <div className="form-item">
                      <label>Manufacturer Part Number (MPN)<span className="req">*</span></label>
                      <input
                        type="text"
                        value={form.partNumber}
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
                        rows="3"
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

                    
                  </div>
                )}

                {/* TAB: SUBCLASS SPECIFIC (Dynamically adapts and binds depending on selection) */}
                {activeTab === "subclass" && (
                  <div className="form-grid">
                    {/* PewPew Subclass Form Controls */}
                    {form.productType === "PewPew" && (
                      <>
                        <div className="form-item">
                          <label>Caliber</label>
                          <select
                            value={form.caliberId}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                caliberId: parseInt(e.target.value),
                              })
                            }
                            required
                          >
                            <option value="">-- Select Caliber --</option>
                            {calibers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>PewPew Category</label>
                          <select
                            value={form.pewPewCategory}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                pewPewCategory: e.target.value,
                              })
                            }
                          >
                            {pewPewCategories.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Action Type</label>
                          <select
                            value={form.actionType}
                            onChange={(e) =>
                              setForm({ ...form, actionType: e.target.value })
                            }
                          >
                            {actionTypes.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item checkbox-row">
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
                              value={form.opticType}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  opticType: e.target.value,
                                })
                              }
                            >
                              {opticTypes.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-item">
                            <label>Reticle Type</label>
                            <select
                              value={form.reticle}
                              onChange={(e) =>
                                setForm({ ...form, reticle: e.target.value })
                              }
                            >
                              {opticReticles.map((opt) => (
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
                              value={form.minMagnification}
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
                              value={form.maxMagnification}
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
                              value={form.objectiveDiameterMm}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  objectiveDiameterMm: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div className="form-item">
                          <label>Tube / Body Diameter</label>
                          <input
                            type="text"
                            value={form.tubeDiameter}
                            placeholder="e.g. 30mm, 34mm, 1-inch"
                            onChange={(e) =>
                              setForm({ ...form, tubeDiameter: e.target.value })
                            }
                          />
                        </div>

                        <div
                          className="form-item form-item-full"
                          style={{ gridColumn: "span 2" }}
                        >
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
                              .filter((opt) => opt.name !== "None")
                              .map((opt) => {
                                const isChecked = form.adjustmentUnits
                                  ? form.adjustmentUnits
                                      .split(",")
                                      .map((s) => s.trim())
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
                                              .map((s) => s.trim())
                                              .filter(Boolean)
                                          : [];
                                        if (current.includes(opt.label)) {
                                          current = current.filter(
                                            (u) => u !== opt.label,
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
                              checked={form.isIlluminated}
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
                            value={form.caliberId}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                caliberId: parseInt(e.target.value),
                              })
                            }
                            required
                          >
                            <option value="">-- Select Caliber --</option>
                            {calibers.map((c) => (
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
                            value={form.threadPitch}
                            placeholder="e.g. 1/2x28, 5/8x24"
                            onChange={(e) =>
                              setForm({ ...form, threadPitch: e.target.value })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Attachment Type</label>
                          <select
                            value={form.attachmentType}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                attachmentType: e.target.value,
                              })
                            }
                          >
                            {suppressorAttachmentTypes.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Material</label>
                          <select
                            value={form.material}
                            onChange={(e) =>
                              setForm({ ...form, material: e.target.value })
                            }
                          >
                            {suppressorMaterials.map((opt) => (
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
                            value={form.soundReductionDb}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                soundReductionDb: parseInt(e.target.value, 10) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="form-item checkbox-row full-row">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={form.isFullAutoRated}
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
                              checked={form.isUserServiceable}
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

                        <div className="form-item checkbox-row">
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
                            value={form.lumens}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                lumens: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Peak Beam Intensity (Candela)</label>
                          <input
                            type="number"
                            value={form.candela}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                candela: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Mount Base Interface</label>
                          <select
                            value={form.mountType}
                            onChange={(e) =>
                              setForm({ ...form, mountType: e.target.value })
                            }
                          >
                            <option value="">-- Select Mount Type --</option>
                            {lightMountTypes.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Laser Designator Spectrum</label>
                          <select
                            value={form.laserColor}
                            onChange={(e) =>
                              setForm({ ...form, laserColor: e.target.value })
                            }
                          >
                            {laserColors.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item checkbox-row full-row">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={form.hasRemoteSwitchPort}
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
                              checked={form.isInfraredCapable}
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
                                value={form.lockType}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    lockType: e.target.value,
                                  })
                                }
                              >
                                <option value="">-- Select Lock Type --</option>
                                {lockTypes.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {renderBatteryControl(
                              "Requires Battery Power (For locking nechanisms or electronic keypads)",
                            )}
                          </>
                        )}
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
              </div>{" "}
              {/* closes .modal-tabs-body-content */}
              {/* Form footer actions */}
              {/* Modal Footer Controls */}
              <div className="modal-footer-row-container">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}
