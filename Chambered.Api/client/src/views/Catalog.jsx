import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import "./Catalog.css";
import SubmitButton from "../components/SubmitButton";

import {
  useGetProducts,
  usePostProducts,
  usePutProductsFromKey,
  useDeleteProductsFromKey,
  useGetManufacturers,
  usePostManufacturers,
  usePutManufacturersFromKey,
  useDeleteManufacturersFromKey,
  useGetCalibers,
  useGetManufacturersFaviconFromKey,
} from "../api/endpoints";

export default function Catalog() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const store = useStore();
  const { enums } = store || {};

  const isManufacturersPage = location.pathname.includes("/manufacturers");

  // Fetch collections via Orval
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProducts({
    expand:
      "manufacturer,Chambered.Data.Models.PewPew/caliber,Chambered.Data.Models.Suppressor/caliber",
  });

  const {
    data: manufacturersData,
    isLoading: mfgsLoading,
    error: mfgsError,
  } = useGetManufacturers();

  const { data: calibersData, isLoading: calibersLoading } = useGetCalibers();

  // Mutations
  const createProductMutation = usePostProducts({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsEditing(false);
      },
      onError: (err) =>
        alert("Failed to create product: " + (err?.message || "Unknown error")),
    },
  });

  const updateProductMutation = usePutProductsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsEditing(false);
      },
      onError: (err) =>
        alert("Failed to save product: " + (err?.message || "Unknown error")),
    },
  });

  const deleteProductMutation = useDeleteProductsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSelectedProduct(null);
        setIsEditing(false);
      },
      onError: (err) =>
        alert("Failed to delete product: " + (err?.message || "Unknown error")),
    },
  });

  const createMfgMutation = usePostManufacturers({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Manufacturers"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsEditing(false);
      },
      onError: (err) =>
        alert(
          "Failed to create manufacturer: " + (err?.message || "Unknown error"),
        ),
    },
  });

  const updateMfgMutation = usePutManufacturersFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Manufacturers"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsEditing(false);
      },
      onError: (err) =>
        alert(
          "Failed to save manufacturer: " + (err?.message || "Unknown error"),
        ),
    },
  });

  const deleteMfgMutation = useDeleteManufacturersFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Manufacturers"] });
        setSelectedMfg(null);
        setIsEditing(false);
      },
      onError: (err) =>
        alert(
          "Failed to delete manufacturer: " + (err?.message || "Unknown error"),
        ),
    },
  });

  // Selected records
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMfg, setSelectedMfg] = useState(null);

  // Layout View Modes ("table" or "card")
  const [viewMode, setViewMode] = useState("table");
  const [mfgViewMode, setMfgViewMode] = useState("table");

  // Interaction State
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'subclass' | 'specifications'

  // Dynamic specifications key-value editor local state
  const [customSpecs, setCustomSpecs] = useState([]);

  // Search & Sorting popovers active states
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [showMfgSortPopover, setShowMfgSortPopover] = useState(false);

  // Base Data arrays
  const productsList = useMemo(
    () => productsData?.data?.value || [],
    [productsData],
  );
  const manufacturersList = useMemo(
    () => manufacturersData?.data?.value || [],
    [manufacturersData],
  );

  const relatedProducts = useMemo(() => {
    if (!selectedMfg) return [];
    return productsList.filter((p) => p.manufacturerId === selectedMfg.id);
  }, [productsList, selectedMfg]);

  const calibersList = useMemo(
    () => calibersData?.data?.value || [],
    [calibersData],
  );

  // References for clicks outside popovers
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const mfgSortRef = useRef(null);

  // Search, Sorters & Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState([]);
  const [selectedMfgFilters, setSelectedMfgFilters] = useState([]);
  const [sortKey, setSortKey] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" | "desc"

  // Manufacturers search/sort
  const [mfgSearchTerm, setMfgSearchTerm] = useState("");
  const [mfgSortKey, setMfgSortKey] = useState("name");
  const [mfgSortDirection, setMfgSortDirection] = useState("asc");

  // Enums memoizations
  const suppressorMaterials = enums?.suppressorMaterials || [];
  const suppressorAttachmentTypes = enums?.suppressorAttachmentTypes || [];
  const opticReticles = enums?.opticReticles || [];
  const opticAdjustmentUnits = enums?.opticAdjustmentUnits || [];
  const batteryTypes = enums?.batteryTypes || [];
  const actionTypes = enums?.actionTypes || [];
  const pewPewCategories = enums?.pewPewCategories || [];
  const opticTypes = enums?.opticTypes || [];
  const laserColors = enums?.laserColors || [];
  const lightMountTypes = enums?.lightMountTypes || [];
  const lockTypes = enums?.lockTypes || [];

  // Edit/Create Form State
  const [form, setForm] = useState({
    id: 0,
    productType: "PewPew",
    name: "",
    description: "",
    partNumber: "",
    sku: "",
    manufacturerId: "",
    webPageUrl: "",
    specifications: {},
    caliberId: "",
    pewPewCategory: "",
    actionType: "",
    isNfaItem: false,
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
    threadPitch: "",
    attachmentType: "",
    material: "",
    soundReductionDb: "",
    isFullAutoRated: false,
    isUserServiceable: false,
    lumens: "",
    candela: "",
    mountType: "",
    laserColor: "",
    hasRemoteSwitchPort: false,
    isInfraredCapable: false,
    lockType: "",
  });

  const [mfgForm, setMfgForm] = useState({
    id: 0,
    name: "",
    webPageUrl: "",
    phoneNumber: "",
    streetAddress: "",
    city: "",
    stateOrProvince: "",
    postalCode: "",
    country: "",
  });

  const ManufacturerFavicon = ({ mfgId }) => {
    const { data, isLoading, isError } = useGetManufacturersFaviconFromKey(
      mfgId,
      undefined,
      {
        query: {
          retry: false, // Don't retry if the manufacturer webpage has no favicon
          staleTime: 24 * 60 * 60 * 1000, // Cache resolved favicons for 24 hours
        },
      },
    );

    if (isLoading) {
      return <span className="mfg-favicon-placeholder loading" />;
    }

    if (isError || !data?.data?.base64Data) {
      return <span className="mfg-favicon-placeholder text-icon">🏢</span>;
    }

    const { base64Data, contentType } = data.data;

    return (
      <img
        src={`data:${contentType};base64,${base64Data}`}
        alt="Logo"
        className="mfg-favicon-img"
      />
    );
  };

  // Handle outside clicks for popovers
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterPopover(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortPopover(false);
      }
      if (mfgSortRef.current && !mfgSortRef.current.contains(e.target)) {
        setShowMfgSortPopover(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Process and sort products list
  const processedProducts = useMemo(() => {
    let result = productsList.map((p) => {
      const manufacturer =
        p.manufacturer ||
        manufacturersList.find((m) => m.id === p.manufacturerId);
      const caliber =
        p.caliber || calibersList.find((c) => c.id === p.caliberId);

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

    // Search filter
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.partNumber.toLowerCase().includes(search) ||
          (p.sku && p.sku.toLowerCase().includes(search)) ||
          p.manufacturerName.toLowerCase().includes(search),
      );
    }

    // Type filters
    if (selectedTypeFilters.length > 0) {
      result = result.filter((p) =>
        selectedTypeFilters.includes(p.productType),
      );
    }

    // Manufacturer filters
    if (selectedMfgFilters.length > 0) {
      result = result.filter((p) =>
        selectedMfgFilters.includes(p.manufacturerId),
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortKey === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortKey === "sku") {
        valA = (a.sku || "").toLowerCase();
        valB = (b.sku || "").toLowerCase();
      } else if (sortKey === "partNumber") {
        valA = (a.partNumber || "").toLowerCase();
        valB = (b.partNumber || "").toLowerCase();
      } else if (sortKey === "manufacturer") {
        valA = a.manufacturerName.toLowerCase();
        valB = b.manufacturerName.toLowerCase();
      } else if (sortKey === "type") {
        valA = a.productType.toLowerCase();
        valB = b.productType.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    productsList,
    manufacturersList,
    calibersList,
    searchTerm,
    selectedTypeFilters,
    selectedMfgFilters,
    sortKey,
    sortDirection,
  ]);

  // Process and sort manufacturers list
  const processedManufacturers = useMemo(() => {
    let result = [...manufacturersList];

    // Search filter
    if (mfgSearchTerm.trim() !== "") {
      const search = mfgSearchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          (m.city && m.city.toLowerCase().includes(search)) ||
          (m.country && m.country.toLowerCase().includes(search)),
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (mfgSortKey === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (mfgSortKey === "city") {
        valA = (a.city || "").toLowerCase();
        valB = (b.city || "").toLowerCase();
      } else if (mfgSortKey === "country") {
        valA = (a.country || "").toLowerCase();
        valB = (b.country || "").toLowerCase();
      }

      if (valA < valB) return mfgSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return mfgSortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [manufacturersList, mfgSearchTerm, mfgSortKey, mfgSortDirection]);

  // Automatically select first item if none is selected
  useEffect(() => {
    if (
      !selectedProduct &&
      processedProducts.length > 0 &&
      !isManufacturersPage
    ) {
      setSelectedProduct(processedProducts[0]);
    }
  }, [processedProducts, selectedProduct, isManufacturersPage]);

  useEffect(() => {
    if (
      !selectedMfg &&
      processedManufacturers.length > 0 &&
      isManufacturersPage
    ) {
      setSelectedMfg(processedManufacturers[0]);
    }
  }, [processedManufacturers, selectedMfg, isManufacturersPage]);

  // Sync custom specifications editor
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

  const updateSpecsDictionary = (updatedPairs) => {
    const dictionary = {};
    updatedPairs.forEach((p) => {
      if (p.key.trim()) {
        dictionary[p.key.trim()] = p.value;
      }
    });
    setForm((f) => ({ ...f, specifications: dictionary }));
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

  const addCustomSpec = () => {
    const updated = [...customSpecs, { key: "", value: "" }];
    setCustomSpecs(updated);
  };

  const removeCustomSpec = (index) => {
    const updated = customSpecs.filter((_, i) => i !== index);
    setCustomSpecs(updated);
    updateSpecsDictionary(updated);
  };

  // Switch right panel to editing mode with a blank product
  const startAddProduct = () => {
    setIsEditing(true);
    setActiveTab("general");
    setForm({
      id: 0,
      productType: "PewPew",
      name: "",
      description: "",
      partNumber: "",
      sku: "",
      manufacturerId: manufacturersList[0]?.id || "",
      webPageUrl: "",
      specifications: {},
      caliberId: calibersList[0]?.id || "",
      pewPewCategory: pewPewCategories[0]?.id || "",
      actionType: actionTypes[0]?.id || "",
      isNfaItem: false,
      minMagnification: "",
      maxMagnification: "",
      objectiveDiameterMm: "",
      opticType: opticTypes[0]?.id || "",
      reticle: opticReticles[0]?.id || "",
      adjustmentUnits: opticAdjustmentUnits[0]?.id || "",
      tubeDiameter: "",
      isIlluminated: false,
      hasBattery: false,
      batteryType: batteryTypes[0]?.id || "",
      threadPitch: "",
      attachmentType: suppressorAttachmentTypes[0]?.id || "",
      material: suppressorMaterials[0]?.id || "",
      soundReductionDb: "",
      isFullAutoRated: false,
      isUserServiceable: false,
      lumens: "",
      candela: "",
      mountType: lightMountTypes[0]?.id || "",
      laserColor: laserColors[0]?.id || "",
      hasRemoteSwitchPort: false,
      isInfraredCapable: false,
      lockType: lockTypes[0]?.id || "",
    });
    // Set a placeholder selected product to keep layout clean
    setSelectedProduct({ id: 0 });
  };

  // Switch right panel to editing mode with selected product
  const startEditProduct = () => {
    setIsEditing(true);
    setActiveTab("general");
    setForm({
      ...selectedProduct,
      manufacturerId: selectedProduct.manufacturerId || "",
      caliberId: selectedProduct.caliberId || "",
    });
  };

  // Switch right panel to editing mode with a blank manufacturer
  const startAddMfg = () => {
    setIsEditing(true);
    setMfgForm({
      id: 0,
      name: "",
      webPageUrl: "",
      phoneNumber: "",
      streetAddress: "",
      city: "",
      stateOrProvince: "",
      postalCode: "",
      country: "",
    });
    setSelectedMfg({ id: 0 });
  };

  // Switch right panel to editing mode with selected manufacturer
  const startEditMfg = () => {
    setIsEditing(true);
    setMfgForm({ ...selectedMfg });
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setIsEditing(false);
    if (selectedProduct?.id === 0) {
      setSelectedProduct(processedProducts[0] || null);
    }
    if (selectedMfg?.id === 0) {
      setSelectedMfg(processedManufacturers[0] || null);
    }
  };

  // Form Saves
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const type = form.productType || "Product";
    const payload = {};
    if (type !== "Product") {
      payload["@odata.type"] = `#Chambered.Data.Models.${type}`;
    }

    payload.id = form.id || 0;
    payload.name = form.name || "";
    payload.partNumber = form.partNumber || "";
    payload.sku = form.sku || "";
    payload.manufacturerId = parseInt(form.manufacturerId, 10) || 0;
    payload.description = form.description || null;
    payload.webPageUrl = form.webPageUrl || null;
    // payload.specifications = form.specifications || {};

    if (type === "PewPew") {
      payload.caliberId = parseInt(form.caliberId, 10) || null;
      payload.pewPewCategory = form.pewPewCategory || null;
      payload.actionType = form.actionType || null;
      payload.isNfaItem = !!form.isNfaItem;
    } else if (type === "Optic") {
      payload.minMagnification = parseFloat(form.minMagnification) || 1.0;
      payload.maxMagnification = parseFloat(form.maxMagnification) || 1.0;
      payload.objectiveDiameterMm = parseInt(form.objectiveDiameterMm, 10) || 0;
      payload.opticType = form.opticType || null;
      payload.reticle = form.reticle || null;
      payload.adjustmentUnits = form.adjustmentUnits || null;
      payload.tubeDiameter = form.tubeDiameter || null;
      payload.isIlluminated = !!form.isIlluminated;
      payload.hasBattery = !!form.hasBattery;
      payload.batteryType = form.hasBattery ? form.batteryType : null;
    } else if (type === "Suppressor") {
      payload.caliberId = parseInt(form.caliberId, 10) || null;
      payload.threadPitch = form.threadPitch || null;
      payload.attachmentType = form.attachmentType || null;
      payload.material = form.material || null;
      payload.soundReductionDb = parseInt(form.soundReductionDb, 10) || null;
      payload.isFullAutoRated = !!form.isFullAutoRated;
      payload.isUserServiceable = !!form.isUserServiceable;
    } else if (type === "PewPewLight") {
      payload.lumens = parseInt(form.lumens, 10) || 0;
      payload.candela = parseInt(form.candela, 10) || 0;
      payload.mountType = form.mountType || null;
      payload.laserColor = form.laserColor || null;
      payload.hasRemoteSwitchPort = !!form.hasRemoteSwitchPort;
      payload.isInfraredCapable = !!form.isInfraredCapable;
    } else if (type === "Security") {
      payload.lockType = form.lockType || null;
    }

    try {
      if (form.id > 0) {
        await updateProductMutation.mutateAsync({
          key: form.id,
          data: payload,
        });
        setSelectedProduct({
          ...selectedProduct,
          ...payload,
          productType: type,
        });
      } else {
        const res = await createProductMutation.mutateAsync({ data: payload });
        setSelectedProduct(res?.data || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMfg = async (e) => {
    e.preventDefault();
    if (!mfgForm.name.trim()) return;

    const payload = {
      id: mfgForm.id || 0,
      name: mfgForm.name || "",
      webPageUrl: mfgForm.webPageUrl || null,
      phoneNumber: mfgForm.phoneNumber || null,
      streetAddress: mfgForm.streetAddress || null,
      city: mfgForm.city || null,
      stateOrProvince: mfgForm.stateOrProvince || null,
      postalCode: mfgForm.postalCode || null,
      country: mfgForm.country || null,
    };

    try {
      if (mfgForm.id > 0) {
        await updateMfgMutation.mutateAsync({ key: mfgForm.id, data: payload });
        setSelectedMfg(payload);
      } else {
        const res = await createMfgMutation.mutateAsync({ data: payload });
        setSelectedMfg(res?.data || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct?.id) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${selectedProduct.name}"?`,
      )
    ) {
      await deleteProductMutation.mutateAsync({ key: selectedProduct.id });
    }
  };

  const handleDeleteMfg = async () => {
    if (!selectedMfg?.id) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete manufacturer "${selectedMfg.name}"?`,
      )
    ) {
      await deleteMfgMutation.mutateAsync({ key: selectedMfg.id });
    }
  };

  // Helper labels & display
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
        return "🛡️ Security / Vault";
      default:
        return "📦 General";
    }
  };

  const renderSubAttributesText = (p) => {
    if (p.productType === "PewPew") {
      return `Category: ${p.pewPewCategory || "N/A"} | Caliber: ${p.caliberName || "Unknown"} | Action: ${p.actionType || "N/A"}`;
    }
    if (p.productType === "Optic") {
      return `Type: ${p.opticType || "N/A"} | Magnification: ${p.minMagnification}-${p.maxMagnification}x | Reticle: ${p.reticle || "N/A"}`;
    }
    if (p.productType === "Suppressor") {
      return `Material: ${p.material || "N/A"} | Pitch: ${p.threadPitch || "N/A"} | Sound: -${p.soundReductionDb || 0}dB`;
    }
    if (p.productType === "PewPewLight") {
      return `Output: ${p.lumens || 0} LM / ${p.candela || 0} CD | Mount: ${p.mountType || "N/A"}`;
    }
    if (p.productType === "Security") {
      return `Lock Type: ${p.lockType || "N/A"}`;
    }
    return "Standard Catalog Product Model";
  };

  // Toggle helpers for popovers
  const toggleTypeFilter = (type) => {
    setSelectedTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleMfgFilter = (id) => {
    setSelectedMfgFilters((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const clearAllFilters = () => {
    setSelectedTypeFilters([]);
    setSelectedMfgFilters([]);
    setSearchTerm("");
  };

  // LOADING STATES
  if (productsLoading || mfgsLoading || calibersLoading) {
    return <div className="loading-state">Loading catalog data...</div>;
  }

  return (
    <div className="catalog-split-view">
      {/* LEFT 2/3: MASTER LIST PANEL */}
      <div className="master-panel">
        <div className="view-actions-row">
          {/* SEARCH BAR */}
          <div className="search-filters-group">
            <input
              type="text"
              placeholder={
                isManufacturersPage
                  ? "Search manufacturers by name or location..."
                  : "Search model, SKU, or manufacturer..."
              }
              className="search-input"
              value={isManufacturersPage ? mfgSearchTerm : searchTerm}
              onChange={(e) =>
                isManufacturersPage
                  ? setMfgSearchTerm(e.target.value)
                  : setSearchTerm(e.target.value)
              }
            />

            {!isManufacturersPage ? (
              <>
                {/* ADVANCED FILTER BUTTON (AudioBookShelf Style) */}
                <div className="popover-wrapper" ref={filterRef}>
                  <button
                    className={`control-popover-btn ${selectedTypeFilters.length > 0 || selectedMfgFilters.length > 0 ? "active-filters" : ""}`}
                    onClick={() => setShowFilterPopover(!showFilterPopover)}
                  >
                    🔍 Filter
                    {selectedTypeFilters.length + selectedMfgFilters.length >
                      0 && (
                      <span className="filter-badge">
                        {selectedTypeFilters.length + selectedMfgFilters.length}
                      </span>
                    )}
                  </button>
                  {showFilterPopover && (
                    <div className="abs-popover-panel filter-popover">
                      <div className="popover-sec">
                        <h5>Product Types</h5>
                        <div className="options-grid">
                          {[
                            "PewPew",
                            "Optic",
                            "Suppressor",
                            "PewPewLight",
                            "Security",
                            "Product",
                          ].map((type) => (
                            <label key={type} className="popover-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedTypeFilters.includes(type)}
                                onChange={() => toggleTypeFilter(type)}
                              />
                              <span>
                                {type === "Product" ? "General" : type}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="popover-sec">
                        <h5>Manufacturers</h5>
                        <div className="options-grid scrollable-options">
                          {manufacturersList.map((m) => (
                            <label key={m.id} className="popover-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedMfgFilters.includes(m.id)}
                                onChange={() => toggleMfgFilter(m.id)}
                              />
                              <span>{m.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="popover-actions">
                        <button className="clear-btn" onClick={clearAllFilters}>
                          Clear All
                        </button>
                        <button
                          className="close-btn"
                          onClick={() => setShowFilterPopover(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ADVANCED SORT BUTTON */}
                <div className="popover-wrapper" ref={sortRef}>
                  <button
                    className="control-popover-btn"
                    onClick={() => setShowSortPopover(!showSortPopover)}
                  >
                    ⇅ Sort ({sortKey})
                  </button>
                  {showSortPopover && (
                    <div className="abs-popover-panel sort-popover">
                      <div className="popover-sec">
                        <h5>Sort By</h5>
                        {[
                          "name",
                          "sku",
                          "partNumber",
                          "manufacturer",
                          "type",
                        ].map((key) => (
                          <button
                            key={key}
                            className={`sort-option-btn ${sortKey === key ? "active" : ""}`}
                            onClick={() => setSortKey(key)}
                          >
                            {key.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div className="popover-divider"></div>
                      <div className="popover-sec">
                        <h5>Direction</h5>
                        <div className="btn-group-toggle">
                          <button
                            className={`direction-btn ${sortDirection === "asc" ? "active" : ""}`}
                            onClick={() => setSortDirection("asc")}
                          >
                            Ascending (A-Z)
                          </button>
                          <button
                            className={`direction-btn ${sortDirection === "desc" ? "active" : ""}`}
                            onClick={() => setSortDirection("desc")}
                          >
                            Descending (Z-A)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* MANUFACTURERS SORT BUTTON */
              <div className="popover-wrapper" ref={mfgSortRef}>
                <button
                  className="control-popover-btn"
                  onClick={() => setShowMfgSortPopover(!showMfgSortPopover)}
                >
                  ⇅ Sort ({mfgSortKey})
                </button>
                {showMfgSortPopover && (
                  <div className="abs-popover-panel sort-popover">
                    <div className="popover-sec">
                      <h5>Sort By</h5>
                      {["name", "city", "country"].map((key) => (
                        <button
                          key={key}
                          className={`sort-option-btn ${mfgSortKey === key ? "active" : ""}`}
                          onClick={() => setMfgSortKey(key)}
                        >
                          {key.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="popover-divider"></div>
                    <div className="popover-sec">
                      <h5>Direction</h5>
                      <div className="btn-group-toggle">
                        <button
                          className={`direction-btn ${mfgSortDirection === "asc" ? "active" : ""}`}
                          onClick={() => setMfgSortDirection("asc")}
                        >
                          Ascending (A-Z)
                        </button>
                        <button
                          className={`direction-btn ${mfgSortDirection === "desc" ? "active" : ""}`}
                          onClick={() => setMfgSortDirection("desc")}
                        >
                          Descending (Z-A)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VIEW SWITCHER & ADD BUTTONS */}
          <div className="actions-right-group">
            <div className="view-mode-toggle">
              <button
                className={`toggle-icon-btn ${(isManufacturersPage ? mfgViewMode : viewMode) === "table" ? "active" : ""}`}
                onClick={() =>
                  isManufacturersPage
                    ? setMfgViewMode("table")
                    : setViewMode("table")
                }
                title="Table View"
              >
                📊 List
              </button>
              <button
                className={`toggle-icon-btn ${(isManufacturersPage ? mfgViewMode : viewMode) === "card" ? "active" : ""}`}
                onClick={() =>
                  isManufacturersPage
                    ? setMfgViewMode("card")
                    : setViewMode("card")
                }
                title="Card View"
              >
                🎴 Cards
              </button>
            </div>

            <button
              className="add-master-btn"
              onClick={isManufacturersPage ? startAddMfg : startAddProduct}
            >
              + Add {isManufacturersPage ? "Manufacturer" : "Product"}
            </button>
          </div>
        </div>

        {/* MASTER LIST CONTENT CONTAINER */}
        <div className="master-list-scroller">
          {!isManufacturersPage ? (
            /* PRODUCTS SUBPAGE */
            processedProducts.length === 0 ? (
              <div className="empty-state">
                No matching catalog products found.
              </div>
            ) : viewMode === "table" ? (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Model Name</th>
                    <th>Manufacturer</th>
                    <th>Part Number / SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {processedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className={`table-row-item ${selectedProduct?.id === p.id ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedProduct(p);
                        setIsEditing(false);
                      }}
                    >
                      <td className="type-badge-cell">
                        <span
                          className={`type-badge ${p.productType.toLowerCase()}`}
                        >
                          {p.productType}
                        </span>
                      </td>
                      <td className="bold-name-cell">{p.name}</td>
                      <td>{p.manufacturerName}</td>
                      <td className="text-muted text-mono">
                        {p.partNumber || "N/A"} / {p.sku || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* CARD VIEW MODE */
              <div className="split-view-cards-grid">
                {processedProducts.map((p) => (
                  <div
                    key={p.id}
                    className={`catalog-list-card ${selectedProduct?.id === p.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedProduct(p);
                      setIsEditing(false);
                    }}
                  >
                    <span className="card-badge">{p.productType}</span>
                    <span className="mfg-tag">{p.manufacturerName}</span>
                    <h4>{p.name}</h4>
                    <span className="sku-part-info">
                      PN: {p.partNumber || "None"} | SKU: {p.sku || "None"}
                    </span>
                    <p className="card-desc-preview">
                      {p.description || "No model description loaded."}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : /* MANUFACTURERS SUBPAGE */
          processedManufacturers.length === 0 ? (
            <div className="empty-state">No matching manufacturers found.</div>
          ) : mfgViewMode === "table" ? (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City / State</th>
                  <th>Country</th>
                  <th>Contact Phone</th>
                </tr>
              </thead>
              <tbody>
                {processedManufacturers.map((m) => (
                  <tr
                    key={m.id}
                    className={`table-row-item ${selectedMfg?.id === m.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedMfg(m);
                      setIsEditing(false);
                    }}
                  >
                    <td className="bold-name-cell">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <ManufacturerFavicon mfgId={m.id} />
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td>
                      {m.city || "N/A"}
                      {m.stateOrProvince ? `, ${m.stateOrProvince}` : ""}
                    </td>
                    <td>{m.country || "N/A"}</td>
                    <td className="text-mono">{m.phoneNumber || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* MANUFACTURERS CARD VIEW */
            <div className="split-view-cards-grid">
              {processedManufacturers.map((m) => (
                <div
                  key={m.id}
                  className={`catalog-list-card ${selectedMfg?.id === m.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedMfg(m);
                    setIsEditing(false);
                  }}
                >
                  <h4>{m.name}</h4>
                  <p className="mfg-details-meta">
                    📍 {m.city || "Unknown City"}
                    {m.country ? `, ${m.country}` : ""}
                  </p>
                  {m.phoneNumber && (
                    <p className="mfg-details-meta">📞 {m.phoneNumber}</p>
                  )}
                  {m.webPageUrl && (
                    <a
                      href={m.webPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="card-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Official Site →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT 1/3: DETAIL / EDITING PANEL */}

      <div className="right-pane-column">
        <div className="detail-panel">
          {!isManufacturersPage ? (
            /* ==================== PRODUCTS PANEL ==================== */
            !selectedProduct ? (
              <div className="empty-detail-state">
                <span className="icon">📦</span>
                <h3>No Product Selected</h3>
                <p>
                  Select a product from the list on the left, or add a brand-new
                  entry.
                </p>
                <button className="add-master-btn" onClick={startAddProduct}>
                  + Add Product
                </button>
              </div>
            ) : isEditing ? (
              /* PRODUCT EDIT MODE */
              <form
                className="detail-editing-form"
                onSubmit={handleSaveProduct}
              >
                <div className="detail-panel-header">
                  <h3>
                    {form.id === 0 ? "Add Product" : "Edit Product Model"}
                  </h3>
                  <div className="header-actions">
                    <button
                      type="button"
                      className="btn btn-secondary cancel-editing-btn"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                    <SubmitButton
                      isSaving={
                        createProductMutation.isPending ||
                        updateProductMutation.isPending
                      }
                      text="Save Asset"
                      className="save-editing-btn"
                    />
                  </div>
                </div>

                {/* TABS SELECTOR */}
                <div className="form-panel-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
                    onClick={() => setActiveTab("general")}
                  >
                    General
                  </button>
                  {form.productType !== "Product" && (
                    <button
                      type="button"
                      className={`tab-btn ${activeTab === "subclass" ? "active" : ""}`}
                      onClick={() => setActiveTab("subclass")}
                    >
                      Technical Specifications
                    </button>
                  )}
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
                    onClick={() => setActiveTab("specifications")}
                  >
                    Specifications Dictionary
                  </button>
                </div>

                <div className="tab-scroll-body">
                  {activeTab === "general" && (
                    <div className="form-tab-panel">
                      <div className="form-item">
                        <label>Product Class Type</label>
                        <select
                          value={form.productType}
                          onChange={(e) =>
                            setForm({ ...form, productType: e.target.value })
                          }
                          disabled={form.id > 0}
                        >
                          <option value="PewPew">PewPew (Firearm)</option>
                          <option value="Optic">Optic / Scope</option>
                          <option value="Suppressor">
                            Suppressor / Silencer
                          </option>
                          <option value="PewPewLight">
                            Tactical Weapon Light
                          </option>
                          <option value="Security">Security / Safe</option>
                          <option value="Product">General Product Model</option>
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Model Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="form-item">
                        <label>Part Number</label>
                        <input
                          type="text"
                          value={form.partNumber}
                          onChange={(e) =>
                            setForm({ ...form, partNumber: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>SKU Code</label>
                        <input
                          type="text"
                          value={form.sku}
                          onChange={(e) =>
                            setForm({ ...form, sku: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Manufacturer / Brand</label>
                        <select
                          value={form.manufacturerId}
                          onChange={(e) =>
                            setForm({ ...form, manufacturerId: e.target.value })
                          }
                          required
                        >
                          <option value="">-- Choose Manufacturer --</option>
                          {manufacturersList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Reference URL</label>
                        <input
                          type="url"
                          value={form.webPageUrl}
                          onChange={(e) =>
                            setForm({ ...form, webPageUrl: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item full-row">
                        <label>Detailed Description</label>
                        <textarea
                          rows="4"
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "subclass" && (
                    <div className="form-tab-panel">
                      {form.productType === "PewPew" && (
                        <>
                          <div className="form-item">
                            <label>Caliber Size</label>
                            <select
                              value={form.caliberId}
                              onChange={(e) =>
                                setForm({ ...form, caliberId: e.target.value })
                              }
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
                            <label>Firearm Category</label>
                            <select
                              value={form.pewPewCategory}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  pewPewCategory: e.target.value,
                                })
                              }
                            >
                              {pewPewCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Action Method</label>
                            <select
                              value={form.actionType}
                              onChange={(e) =>
                                setForm({ ...form, actionType: e.target.value })
                              }
                            >
                              {actionTypes.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.label}
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
                              <span>Is NFA Item (SBR, Suppressor, etc.)</span>
                            </label>
                          </div>
                        </>
                      )}

                      {form.productType === "Optic" && (
                        <>
                          <div className="form-item">
                            <label>Min Magnification (x)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={form.minMagnification}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  minMagnification: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Max Magnification (x)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={form.maxMagnification}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  maxMagnification: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Objective Diameter (mm)</label>
                            <input
                              type="number"
                              value={form.objectiveDiameterMm}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  objectiveDiameterMm: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Optic Class Type</label>
                            <select
                              value={form.opticType}
                              onChange={(e) =>
                                setForm({ ...form, opticType: e.target.value })
                              }
                            >
                              {opticTypes.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Reticle Pattern</label>
                            <select
                              value={form.reticle}
                              onChange={(e) =>
                                setForm({ ...form, reticle: e.target.value })
                              }
                            >
                              {opticReticles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Adjustment Increments</label>
                            <select
                              value={form.adjustmentUnits}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  adjustmentUnits: e.target.value,
                                })
                              }
                            >
                              {opticAdjustmentUnits.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Tube Size (mm / in)</label>
                            <input
                              type="text"
                              value={form.tubeDiameter}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  tubeDiameter: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>Has Illuminated Reticle</span>
                            </label>
                          </div>
                          <div className="form-item checkbox-row">
                            <label className="checkbox-container">
                              <input
                                type="checkbox"
                                checked={form.hasBattery || false}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    hasBattery: e.target.checked,
                                  })
                                }
                              />
                              <span className="checkmark"></span>
                              <span>Requires Battery Power</span>
                            </label>
                          </div>
                          {form.hasBattery && (
                            <div className="form-item">
                              <label>Battery Size</label>
                              <select
                                value={form.batteryType}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    batteryType: e.target.value,
                                  })
                                }
                              >
                                {batteryTypes.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}

                      {form.productType === "Suppressor" && (
                        <>
                          <div className="form-item">
                            <label>Compatible Caliber</label>
                            <select
                              value={form.caliberId}
                              onChange={(e) =>
                                setForm({ ...form, caliberId: e.target.value })
                              }
                            >
                              <option value="">-- Choose Caliber --</option>
                              {calibersList.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Thread Pitch Pattern</label>
                            <input
                              type="text"
                              value={form.threadPitch}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  threadPitch: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Suppressor Mounting Style</label>
                            <select
                              value={form.attachmentType}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  attachmentType: e.target.value,
                                })
                              }
                            >
                              {suppressorAttachmentTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Build Metal / Material</label>
                            <select
                              value={form.material}
                              onChange={(e) =>
                                setForm({ ...form, material: e.target.value })
                              }
                            >
                              {suppressorMaterials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Sound Suppression (dB)</label>
                            <input
                              type="number"
                              value={form.soundReductionDb}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  soundReductionDb: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>Full-Auto Rated Capacity</span>
                            </label>
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>User Serviceable / Disassemblable</span>
                            </label>
                          </div>
                        </>
                      )}

                      {form.productType === "PewPewLight" && (
                        <>
                          <div className="form-item">
                            <label>Light Output (Lumens)</label>
                            <input
                              type="number"
                              value={form.lumens}
                              onChange={(e) =>
                                setForm({ ...form, lumens: e.target.value })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Peak Beam Intensity (Candela)</label>
                            <input
                              type="number"
                              value={form.candela}
                              onChange={(e) =>
                                setForm({ ...form, candela: e.target.value })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Mount Style</label>
                            <select
                              value={form.mountType}
                              onChange={(e) =>
                                setForm({ ...form, mountType: e.target.value })
                              }
                            >
                              {lightMountTypes.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Integrated Laser Color</label>
                            <select
                              value={form.laserColor}
                              onChange={(e) =>
                                setForm({ ...form, laserColor: e.target.value })
                              }
                            >
                              {laserColors.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>Has Tape-Switch / Remote Port</span>
                            </label>
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>Is Infrared / IR Illumination Capable</span>
                            </label>
                          </div>
                        </>
                      )}

                      {form.productType === "Security" && (
                        <div className="form-item">
                          <label>Security Lock Category</label>
                          <select
                            value={form.lockType}
                            onChange={(e) =>
                              setForm({ ...form, lockType: e.target.value })
                            }
                          >
                            {lockTypes.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "specifications" && (
                    <div className="form-tab-panel">
                      <div className="specifications-editor-container">
                        <div className="spec-info-card">
                          <h4>Manual Specifications Dictionary</h4>
                          <p>
                            Store custom key-value pairs representing custom
                            structural properties of this model asset.
                          </p>
                        </div>

                        <div className="specs-editor-grid">
                          {customSpecs.length > 0 && (
                            <div className="specs-headers">
                              <span>Specification Key</span>
                              <span>Assigned Value</span>
                              <span>Actions</span>
                            </div>
                          )}

                          {customSpecs.map((spec, i) => (
                            <div key={i} className="spec-editor-row">
                              <input
                                type="text"
                                placeholder="e.g. Finish"
                                value={spec.key}
                                onChange={(e) =>
                                  handleCustomSpecChange(
                                    i,
                                    "key",
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                type="text"
                                placeholder="e.g. Matte Black"
                                value={spec.value}
                                onChange={(e) =>
                                  handleCustomSpecChange(
                                    i,
                                    "value",
                                    e.target.value,
                                  )
                                }
                              />
                              <button
                                type="button"
                                className="remove-spec-btn"
                                onClick={() => removeCustomSpec(i)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            className="add-spec-btn"
                            onClick={addCustomSpec}
                          >
                            + Add Custom Property Row
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              /* PRODUCT VIEW MODE */
              <div className="detail-view-container">
                <div className="detail-panel-header">
                  <span className="type-badge-pill">
                    {getProductTypeLabel(selectedProduct.productType)}
                  </span>
                  <div className="header-actions">
                    <button
                      className="btn btn-secondary edit-btn"
                      onClick={startEditProduct}
                    >
                      Edit
                    </button>
                    <button
                      className="btn delete-btn"
                      onClick={handleDeleteProduct}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="detail-view-body">
                  {saveSuccess && (
                    <div className="detail-save-toast">
                      ✓ Product updated successfully
                    </div>
                  )}
                  <span className="detail-mfg">
                    {selectedProduct.manufacturerName}
                  </span>
                  <h2>{selectedProduct.name}</h2>
                  <div className="text-mono detail-pn-sku">
                    <span>Part No: {selectedProduct.partNumber || "None"}</span>
                    <span>SKU: {selectedProduct.sku || "None"}</span>
                  </div>

                  <p className="detail-desc">
                    {selectedProduct.description ||
                      "No model description loaded for this product catalog asset."}
                  </p>

                  {selectedProduct.webPageUrl && (
                    <a
                      href={selectedProduct.webPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="external-site-link"
                    >
                      🌐 Open Official Website
                    </a>
                  )}

                  <hr className="detail-divider" />

                  {/* Subclass Specs Detail Block */}
                  {selectedProduct.productType !== "Product" && (
                    <div className="details-specs-block">
                      <h3>Technical Details</h3>
                      <p className="sub-specs-text">
                        {renderSubAttributesText(selectedProduct)}
                      </p>
                    </div>
                  )}

                  {/* Specifications Key-Value Details */}
                  {selectedProduct.specifications &&
                    Object.keys(selectedProduct.specifications).length > 0 && (
                      <div className="details-specs-block">
                        <h3>Manual Specifications</h3>
                        <div className="specs-table">
                          {Object.entries(selectedProduct.specifications).map(
                            ([key, value]) => (
                              <div key={key} className="specs-table-row">
                                <span className="key-col">{key}</span>
                                <span className="val-col">{String(value)}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )
          ) : /* ==================== MANUFACTURERS PANEL ==================== */
          !selectedMfg ? (
            <div className="empty-detail-state">
              <span className="icon">🏢</span>
              <h3>No Manufacturer Selected</h3>
              <p>
                Select a manufacturer from the list on the left, or add a
                brand-new corporate record.
              </p>
              <button className="add-master-btn" onClick={startAddMfg}>
                + Add Manufacturer
              </button>
            </div>
          ) : isEditing ? (
            /* MANUFACTURER EDIT MODE */
            <form className="detail-editing-form" onSubmit={handleSaveMfg}>
              <div className="detail-panel-header">
                <h3>
                  {mfgForm.id === 0
                    ? "Add Manufacturer"
                    : "Edit Corporate Record"}
                </h3>
                <div className="header-actions">
                  <button
                    type="button"
                    className="btn btn-secondary cancel-editing-btn"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isSaving={
                      createMfgMutation.isPending || updateMfgMutation.isPending
                    }
                    text="Save Record"
                    className="save-editing-btn"
                  />
                </div>
              </div>

              <div className="tab-scroll-body single-tab">
                <div className="form-tab-panel">
                  <div className="form-item">
                    <label>Official Corporate Name</label>
                    <input
                      type="text"
                      value={mfgForm.name}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label>Company Website URL</label>
                    <input
                      type="url"
                      value={mfgForm.webPageUrl}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, webPageUrl: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-item">
                    <label>Support Phone Number</label>
                    <input
                      type="tel"
                      value={mfgForm.phoneNumber}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, phoneNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-item">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={mfgForm.streetAddress}
                      onChange={(e) =>
                        setMfgForm({
                          ...mfgForm,
                          streetAddress: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-item">
                    <label>City</label>
                    <input
                      type="text"
                      value={mfgForm.city}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, city: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-item">
                    <label>State / Province</label>
                    <input
                      type="text"
                      value={mfgForm.stateOrProvince}
                      onChange={(e) =>
                        setMfgForm({
                          ...mfgForm,
                          stateOrProvince: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-item">
                    <label>Postal / ZIP Code</label>
                    <input
                      type="text"
                      value={mfgForm.postalCode}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, postalCode: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-item">
                    <label>Country of Origin</label>
                    <input
                      type="text"
                      value={mfgForm.country}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, country: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* MANUFACTURER VIEW MODE */
            <div className="detail-view-container">
              <div className="detail-panel-header">
                <span className="type-badge-pill">🏢 Manufacturer</span>
                <div className="header-actions">
                  <button
                    className="btn btn-secondary edit-btn"
                    onClick={startEditMfg}
                  >
                    Edit
                  </button>
                  <button className="btn delete-btn" onClick={handleDeleteMfg}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="detail-view-body">
                {saveSuccess && (
                  <div className="detail-save-toast">
                    ✓ Manufacturer updated successfully
                  </div>
                )}

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ManufacturerFavicon mfgId={selectedMfg.id} />
                  <h2 style={{ margin: 0 }}>{selectedMfg.name}</h2>
                </span>
                {selectedMfg.phoneNumber && (
                  <p className="mfg-meta-item">
                    <strong>📞 Phone Support:</strong>{" "}
                    <span className="text-mono">{selectedMfg.phoneNumber}</span>
                  </p>
                )}

                {selectedMfg.webPageUrl && (
                  <a
                    href={selectedMfg.webPageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="external-site-link"
                  >
                    🌐 Open Manufacturer Website
                  </a>
                )}

                <hr className="detail-divider" />

                <div className="details-specs-block">
                  <h3>Corporate Address</h3>
                  <p className="address-display">
                    {selectedMfg.streetAddress || ""}
                    <br />
                    {selectedMfg.city || ""}
                    {selectedMfg.stateOrProvince
                      ? `, ${selectedMfg.stateOrProvince}`
                      : ""}{" "}
                    {selectedMfg.postalCode || ""}
                    <br />
                    <strong>{selectedMfg.country || ""}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="detail-panel">
          {!isManufacturersPage ? (
            /* ==================== PRODUCTS PANEL ==================== */
            !selectedProduct ? (
              <div className="empty-detail-state">
                <span className="icon">📦</span>
                <h3>No Product Selected</h3>
                <p>
                  Select a product from the list on the left, or add a brand-new
                  entry.
                </p>
                <button className="add-master-btn" onClick={startAddProduct}>
                  + Add Product
                </button>
              </div>
            ) : isEditing ? (
              /* PRODUCT EDIT MODE */
              <form
                className="detail-editing-form"
                onSubmit={handleSaveProduct}
              >
                <div className="detail-panel-header">
                  <h3>
                    {form.id === 0 ? "Add Product" : "Edit Product Model"}
                  </h3>
                  <div className="header-actions">
                    <button
                      type="button"
                      className="btn btn-secondary cancel-editing-btn"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                    <SubmitButton
                      isSaving={
                        createProductMutation.isPending ||
                        updateProductMutation.isPending
                      }
                      text="Save Asset"
                      className="save-editing-btn"
                    />
                  </div>
                </div>

                {/* TABS SELECTOR */}
                <div className="form-panel-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
                    onClick={() => setActiveTab("general")}
                  >
                    General
                  </button>
                  {form.productType !== "Product" && (
                    <button
                      type="button"
                      className={`tab-btn ${activeTab === "subclass" ? "active" : ""}`}
                      onClick={() => setActiveTab("subclass")}
                    >
                      Technical Specifications
                    </button>
                  )}
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
                    onClick={() => setActiveTab("specifications")}
                  >
                    Specifications Dictionary
                  </button>
                </div>

                <div className="tab-scroll-body">
                  {activeTab === "general" && (
                    <div className="form-tab-panel">
                      <div className="form-item">
                        <label>Product Class Type</label>
                        <select
                          value={form.productType}
                          onChange={(e) =>
                            setForm({ ...form, productType: e.target.value })
                          }
                          disabled={form.id > 0}
                        >
                          <option value="PewPew">PewPew (Firearm)</option>
                          <option value="Optic">Optic / Scope</option>
                          <option value="Suppressor">
                            Suppressor / Silencer
                          </option>
                          <option value="PewPewLight">
                            Tactical Weapon Light
                          </option>
                          <option value="Security">Security / Safe</option>
                          <option value="Product">General Product Model</option>
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Model Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="form-item">
                        <label>Part Number</label>
                        <input
                          type="text"
                          value={form.partNumber}
                          onChange={(e) =>
                            setForm({ ...form, partNumber: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>SKU Code</label>
                        <input
                          type="text"
                          value={form.sku}
                          onChange={(e) =>
                            setForm({ ...form, sku: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Manufacturer / Brand</label>
                        <select
                          value={form.manufacturerId}
                          onChange={(e) =>
                            setForm({ ...form, manufacturerId: e.target.value })
                          }
                          required
                        >
                          <option value="">-- Choose Manufacturer --</option>
                          {manufacturersList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Reference URL</label>
                        <input
                          type="url"
                          value={form.webPageUrl}
                          onChange={(e) =>
                            setForm({ ...form, webPageUrl: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item full-row">
                        <label>Detailed Description</label>
                        <textarea
                          rows="4"
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "subclass" && (
                    <div className="form-tab-panel">
                      {form.productType === "PewPew" && (
                        <>
                          <div className="form-item">
                            <label>Caliber Size</label>
                            <select
                              value={form.caliberId}
                              onChange={(e) =>
                                setForm({ ...form, caliberId: e.target.value })
                              }
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
                            <label>Firearm Category</label>
                            <select
                              value={form.pewPewCategory}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  pewPewCategory: e.target.value,
                                })
                              }
                            >
                              {pewPewCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Action Method</label>
                            <select
                              value={form.actionType}
                              onChange={(e) =>
                                setForm({ ...form, actionType: e.target.value })
                              }
                            >
                              {actionTypes.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.label}
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
                              <span>Is NFA Item (SBR, Suppressor, etc.)</span>
                            </label>
                          </div>
                        </>
                      )}

                      {form.productType === "Optic" && (
                        <>
                          <div className="form-item">
                            <label>Min Magnification (x)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={form.minMagnification}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  minMagnification: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Max Magnification (x)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={form.maxMagnification}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  maxMagnification: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Objective Diameter (mm)</label>
                            <input
                              type="number"
                              value={form.objectiveDiameterMm}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  objectiveDiameterMm: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Optic Class Type</label>
                            <select
                              value={form.opticType}
                              onChange={(e) =>
                                setForm({ ...form, opticType: e.target.value })
                              }
                            >
                              {opticTypes.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Reticle Pattern</label>
                            <select
                              value={form.reticle}
                              onChange={(e) =>
                                setForm({ ...form, reticle: e.target.value })
                              }
                            >
                              {opticReticles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Adjustment Increments</label>
                            <select
                              value={form.adjustmentUnits}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  adjustmentUnits: e.target.value,
                                })
                              }
                            >
                              {opticAdjustmentUnits.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Tube Size (mm / in)</label>
                            <input
                              type="text"
                              value={form.tubeDiameter}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  tubeDiameter: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>Has Illuminated Reticle</span>
                            </label>
                          </div>
                          <div className="form-item checkbox-row">
                            <label className="checkbox-container">
                              <input
                                type="checkbox"
                                checked={form.hasBattery || false}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    hasBattery: e.target.checked,
                                  })
                                }
                              />
                              <span className="checkmark"></span>
                              <span>Requires Battery Power</span>
                            </label>
                          </div>
                          {form.hasBattery && (
                            <div className="form-item">
                              <label>Battery Size</label>
                              <select
                                value={form.batteryType}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    batteryType: e.target.value,
                                  })
                                }
                              >
                                {batteryTypes.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}

                      {form.productType === "Suppressor" && (
                        <>
                          <div className="form-item">
                            <label>Compatible Caliber</label>
                            <select
                              value={form.caliberId}
                              onChange={(e) =>
                                setForm({ ...form, caliberId: e.target.value })
                              }
                            >
                              <option value="">-- Choose Caliber --</option>
                              {calibersList.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Thread Pitch Pattern</label>
                            <input
                              type="text"
                              value={form.threadPitch}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  threadPitch: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Suppressor Mounting Style</label>
                            <select
                              value={form.attachmentType}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  attachmentType: e.target.value,
                                })
                              }
                            >
                              {suppressorAttachmentTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Build Metal / Material</label>
                            <select
                              value={form.material}
                              onChange={(e) =>
                                setForm({ ...form, material: e.target.value })
                              }
                            >
                              {suppressorMaterials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Sound Suppression (dB)</label>
                            <input
                              type="number"
                              value={form.soundReductionDb}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  soundReductionDb: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>Full-Auto Rated Capacity</span>
                            </label>
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>User Serviceable / Disassemblable</span>
                            </label>
                          </div>
                        </>
                      )}

                      {form.productType === "PewPewLight" && (
                        <>
                          <div className="form-item">
                            <label>Light Output (Lumens)</label>
                            <input
                              type="number"
                              value={form.lumens}
                              onChange={(e) =>
                                setForm({ ...form, lumens: e.target.value })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Peak Beam Intensity (Candela)</label>
                            <input
                              type="number"
                              value={form.candela}
                              onChange={(e) =>
                                setForm({ ...form, candela: e.target.value })
                              }
                            />
                          </div>
                          <div className="form-item">
                            <label>Mount Style</label>
                            <select
                              value={form.mountType}
                              onChange={(e) =>
                                setForm({ ...form, mountType: e.target.value })
                              }
                            >
                              {lightMountTypes.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label>Integrated Laser Color</label>
                            <select
                              value={form.laserColor}
                              onChange={(e) =>
                                setForm({ ...form, laserColor: e.target.value })
                              }
                            >
                              {laserColors.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>Has Tape-Switch / Remote Port</span>
                            </label>
                          </div>
                          <div className="form-item checkbox-row">
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
                              <span>Is Infrared / IR Illumination Capable</span>
                            </label>
                          </div>
                        </>
                      )}

                      {form.productType === "Security" && (
                        <div className="form-item">
                          <label>Security Lock Category</label>
                          <select
                            value={form.lockType}
                            onChange={(e) =>
                              setForm({ ...form, lockType: e.target.value })
                            }
                          >
                            {lockTypes.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "specifications" && (
                    <div className="form-tab-panel">
                      <div className="specifications-editor-container">
                        <div className="spec-info-card">
                          <h4>Manual Specifications Dictionary</h4>
                          <p>
                            Store custom key-value pairs representing custom
                            structural properties of this model asset.
                          </p>
                        </div>

                        <div className="specs-editor-grid">
                          {customSpecs.length > 0 && (
                            <div className="specs-headers">
                              <span>Specification Key</span>
                              <span>Assigned Value</span>
                              <span>Actions</span>
                            </div>
                          )}

                          {customSpecs.map((spec, i) => (
                            <div key={i} className="spec-editor-row">
                              <input
                                type="text"
                                placeholder="e.g. Finish"
                                value={spec.key}
                                onChange={(e) =>
                                  handleCustomSpecChange(
                                    i,
                                    "key",
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                type="text"
                                placeholder="e.g. Matte Black"
                                value={spec.value}
                                onChange={(e) =>
                                  handleCustomSpecChange(
                                    i,
                                    "value",
                                    e.target.value,
                                  )
                                }
                              />
                              <button
                                type="button"
                                className="remove-spec-btn"
                                onClick={() => removeCustomSpec(i)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            className="add-spec-btn"
                            onClick={addCustomSpec}
                          >
                            + Add Custom Property Row
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              /* PRODUCT VIEW MODE */
              <div className="detail-view-container">
                <div className="detail-panel-header">
                  <span className="type-badge-pill">
                    {getProductTypeLabel(selectedProduct.productType)}
                  </span>
                  <div className="header-actions">
                    <button
                      className="btn btn-secondary edit-btn"
                      onClick={startEditProduct}
                    >
                      Edit
                    </button>
                    <button
                      className="btn delete-btn"
                      onClick={handleDeleteProduct}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="detail-view-body">
                  {saveSuccess && (
                    <div className="detail-save-toast">
                      ✓ Product updated successfully
                    </div>
                  )}
                  <span className="detail-mfg">
                    {selectedProduct.manufacturerName}
                  </span>
                  <h2>{selectedProduct.name}</h2>
                  <div className="text-mono detail-pn-sku">
                    <span>Part No: {selectedProduct.partNumber || "None"}</span>
                    <span>SKU: {selectedProduct.sku || "None"}</span>
                  </div>

                  <p className="detail-desc">
                    {selectedProduct.description ||
                      "No model description loaded for this product catalog asset."}
                  </p>

                  {selectedProduct.webPageUrl && (
                    <a
                      href={selectedProduct.webPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="external-site-link"
                    >
                      🌐 Open Official Website
                    </a>
                  )}

                  <hr className="detail-divider" />

                  {/* Subclass Specs Detail Block */}
                  {selectedProduct.productType !== "Product" && (
                    <div className="details-specs-block">
                      <h3>Technical Details</h3>
                      <p className="sub-specs-text">
                        {renderSubAttributesText(selectedProduct)}
                      </p>
                    </div>
                  )}

                  {/* Specifications Key-Value Details */}
                  {selectedProduct.specifications &&
                    Object.keys(selectedProduct.specifications).length > 0 && (
                      <div className="details-specs-block">
                        <h3>Manual Specifications</h3>
                        <div className="specs-table">
                          {Object.entries(selectedProduct.specifications).map(
                            ([key, value]) => (
                              <div key={key} className="specs-table-row">
                                <span className="key-col">{key}</span>
                                <span className="val-col">{String(value)}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )
          ) : /* ==================== MANUFACTURERS PANEL ==================== */
          selectedMfg ? (
            <div className="detail-view-container">
              <div className="detail-panel-header">
                <h3> Products by {selectedMfg.name}</h3>
              </div>

              {relatedProducts.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 0" }}>
                  No products registered for this manufacturer.
                </div>
              ) : (
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Part Number</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedProducts.map((p) => (
                      <tr
                        key={p.id}
                        className="table-row-item"
                        style={{ cursor: "default" }}
                      >
                        <td className="bold-name-cell">{p.name}</td>
                        <td className="bold-name-cell">{p.partNumber}</td>
                        <td>
                          <span
                            className="type-badge-pill"
                            style={{ margin: 0 }}
                          >
                            {p.productType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
