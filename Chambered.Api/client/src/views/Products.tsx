import React, { useState, useEffect, useMemo, useRef } from "react";
import { useStore } from "../StoreContext";
import { useQueryClient } from "@tanstack/react-query";
import "./Products.css";
import SubmitButton from "../components/SubmitButton";
import ProductCard from "../Cards/ProductCard";
import ProductForm from "../ModelForms/ProductForm";

import {
  useGetProducts,
  usePostProducts,
  useDeleteProductsFromKey,
  useGetManufacturers,
  useGetCalibers,
  useGetProductsProductTypes,
} from "../api/endpoints";
import type { Product } from "../api/models/product";
import type { Manufacturer } from "../api/models/manufacturer";
import type { Caliber } from "../api/models/caliber";
import SecureImage, { useSecureImage } from "../components/SecureImage";

interface ExtendedProduct extends Omit<Product, "productType"> {
  productType: string;
  manufacturerName: string;
  caliberName: string;
  [key: string]: any;
}

const extractSpecifications = (product: any): Record<string, any> => {
  if (!product) return {};
  const staticKeys = new Set([
    "id",
    "name",
    "partNumber",
    "sku",
    "manufacturerId",
    "description",
    "webPageUrl",
    "productType",
    "created",
    "modified",
    "createdBy",
    "modifiedBy",
    "manufacturer",
    "productDocuments",
    "armoryItems",
    "coverImageId",
    "coverImage",
    "caliberId",
    "pewPewCategory",
    "actionType",
    "isNfaItem",
    "caliber",
    "minMagnification",
    "maxMagnification",
    "objectiveDiameterMm",
    "opticType",
    "reticle",
    "adjustmentUnits",
    "tubeDiameter",
    "isIlluminated",
    "hasBattery",
    "batteryType",
    "threadPitch",
    "attachmentType",
    "material",
    "soundReductionDb",
    "isFullAutoRated",
    "isUserServiceable",
    "lumens",
    "candela",
    "mountType",
    "laserColor",
    "hasRemoteSwitchPort",
    "isInfraredCapable",
    "lockType",
    "manufacturerName",
    "caliberName",
    "@odata.type",
    "@odata.context",
  ]);

  const specs: Record<string, any> = {};
  Object.keys(product).forEach((key) => {
    if (!staticKeys.has(key)) {
      specs[key] = product[key];
    }
  });
  return specs;
};

export default function Products() {
  const queryClient = useQueryClient();
  const store = useStore();
  const { enums } = store || {};

  const { data: productTypesData } = useGetProductsProductTypes();
  const productTypes = useMemo(() => {
    return productTypesData?.data?.value || [];
  }, [productTypesData]);

  // Fetch collections via Orval
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProducts({
    expand:
      "manufacturer,Chambered.Data.Models.PewPew/caliber,Chambered.Data.Models.Suppressor/caliber",
  });

  const { data: manufacturersData, isLoading: mfgsLoading } =
    useGetManufacturers();
  const { data: calibersData, isLoading: calibersLoading } = useGetCalibers();

  // Selected records
  const [selectedProduct, setSelectedProduct] =
    useState<ExtendedProduct | null>(null);

  // Layout View Modes ("table" or "card")
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Interaction State (Modal overlays replace inline isEditing)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Search & Sorting popovers active states
  const [showFilterPopover, setShowFilterPopover] = useState<boolean>(false);
  const [showSortPopover, setShowSortPopover] = useState<boolean>(false);

  // Base Data arrays
  const productsList = useMemo(
    () => (productsData?.data?.value || []) as Product[],
    [productsData],
  );
  const manufacturersList = useMemo(
    () => (manufacturersData?.data?.value || []) as Manufacturer[],
    [manufacturersData],
  );
  const calibersList = useMemo(
    () => (calibersData?.data?.value || []) as Caliber[],
    [calibersData],
  );

  // References for clicks outside popovers
  const filterRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  // Search, Sorters & Filters state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([]);
  const [selectedMfgFilters, setSelectedMfgFilters] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Quick Add state
  const [quickAddType, setQuickAddType] = useState<string>("Product");
  const [quickAddMfgId, setQuickAddMfgId] = useState<string>("");
  const [quickAddModel, setQuickAddModel] = useState<string>("");
  const [quickAddPartNo, setQuickAddPartNo] = useState<string>("");
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);
  const [quickSaveSuccess, setQuickSaveSuccess] = useState<boolean>(false);

  const handleHeaderSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Mutation for Quick Add
  const createProductMutation = usePostProducts({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        if (res?.data) {
          const newProd = res.data as any;
          setSelectedProduct(newProd);
        }
      },
      onError: (err: any) => {
        alert("Failed to create product: " + (err?.message || "Unknown error"));
      },
    },
  });

  const deleteProductMutation = useDeleteProductsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSelectedProduct(null);
      },
      onError: (err: any) =>
        alert("Failed to delete product: " + (err?.message || "Unknown error")),
    },
  });

  // Handle outside clicks for popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPopover(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortPopover(false);
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
      } as ExtendedProduct;
    });

    // Search filter
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name!.toLowerCase().includes(search) ||
          (p.partNumber && p.partNumber.toLowerCase().includes(search)) ||
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
      result = result.filter(
        (p) =>
          p.manufacturerId !== undefined &&
          selectedMfgFilters.includes(p.manufacturerId),
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortKey === "name") {
        valA = a.name!.toLowerCase();
        valB = b.name!.toLowerCase();
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

  // Automatically select first item if none is selected
  useEffect(() => {
    if (!selectedProduct && processedProducts.length > 0) {
      setSelectedProduct(processedProducts[0]);
    }
  }, [processedProducts, selectedProduct]);

  // Sync selectedProduct with the fresh data from the list
  useEffect(() => {
    if (selectedProduct && processedProducts.length > 0) {
      const freshProduct = processedProducts.find(
        (p) => p.id === selectedProduct.id,
      );
      if (freshProduct) {
        if (freshProduct !== selectedProduct) {
          setSelectedProduct(freshProduct);
        }
      } else {
        setSelectedProduct(processedProducts[0] || null);
      }
    }
  }, [processedProducts, selectedProduct]);

  // Switch right panel to editing mode with a blank product
  const startAddProduct = () => {
    setIsEditMode(false);
    setShowModal(true);
  };

  // Switch right panel to editing mode with selected product
  const startEditProduct = () => {
    if (!selectedProduct) return;
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleQuickAddSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddModel.trim() || !quickAddMfgId) return;

    setIsQuickSaving(true);

    const type = quickAddType || "Product";
    const payload: any = {};
    if (type !== "Product") {
      payload["@odata.type"] = `#Chambered.Data.Models.${type}`;
    }
    payload.id = 0;
    payload.name = quickAddModel.trim();
    payload.partNumber = quickAddPartNo.trim();
    payload.manufacturerId = parseInt(quickAddMfgId, 10) || 0;

    try {
      await createProductMutation.mutateAsync({ data: payload });
      setQuickSaveSuccess(true);
      setTimeout(() => setQuickSaveSuccess(false), 2000);
      setQuickAddModel("");
      setQuickAddPartNo("");
    } catch (err) {
      console.error("Failed to quick add product:", err);
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct?.id) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${selectedProduct.name}"?`,
      )
    ) {
      deleteProductMutation.mutate({ key: selectedProduct.id });
    }
  };

  // Helper labels & display
  const renderSubAttributesText = (p: ExtendedProduct) => {
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
      return `Lumens: ${p.lumens || 0}lm | Candela: ${p.candela || 0}cd | Mount: ${p.mountType || "N/A"}`;
    }
    if (p.productType === "Security") {
      return `Locking: ${p.lockType || "N/A"}`;
    }
    return "";
  };

  const getConditionClass = (cond?: string | null) => {
    if (!cond) return "badge-success";
    const c = cond.toLowerCase();
    if (c.includes("unfired") || c.includes("excel") || c.includes("very"))
      return "badge-success";
    if (c.includes("good") || c.includes("fair")) return "badge-warning";
    return "badge-danger";
  };

  if (productsLoading || mfgsLoading || calibersLoading) {
    return <div className="loading-state">Loading catalog data...</div>;
  }

  if (productsError) {
    return (
      <div className="error-alert">
        Error loading catalog: {(productsError as any)?.message}
      </div>
    );
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
              placeholder="Search model, SKU, or manufacturer..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* ADVANCED FILTER BUTTON */}
            <div className="popover-wrapper" ref={filterRef}>
              <button
                className={`control-popover-btn ${selectedTypeFilters.length > 0 || selectedMfgFilters.length > 0 ? "active-filters" : ""}`}
                onClick={() => setShowFilterPopover(!showFilterPopover)}
              >
                Filter
                {selectedTypeFilters.length + selectedMfgFilters.length > 0 && (
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
                            onChange={() => {
                              setSelectedTypeFilters((prev) =>
                                prev.includes(type)
                                  ? prev.filter((t) => t !== type)
                                  : [...prev, type],
                              );
                            }}
                          />
                          <span>{type === "Product" ? "General" : type}</span>
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
                            checked={selectedMfgFilters.includes(m.id!)}
                            onChange={() => {
                              setSelectedMfgFilters((prev) =>
                                prev.includes(m.id!)
                                  ? prev.filter((id) => id !== m.id)
                                  : [...prev, m.id!],
                              );
                            }}
                          />
                          <span>{m.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="popover-actions">
                    <button
                      className="clear-btn"
                      onClick={() => {
                        setSelectedTypeFilters([]);
                        setSelectedMfgFilters([]);
                        setSearchTerm("");
                      }}
                    >
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
          </div>

          {/* VIEW SWITCHER & ADD BUTTONS */}
          <div className="actions-right-group">
            <div className="view-mode-toggle">
              <button
                className={`toggle-icon-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                List
              </button>
              <button
                className={`toggle-icon-btn ${viewMode === "card" ? "active" : ""}`}
                onClick={() => setViewMode("card")}
                title="Card View"
              >
                Cards
              </button>
            </div>

            <button className="add-master-btn" onClick={startAddProduct}>
              Add Product
            </button>
          </div>
        </div>

        {/* MASTER LIST CONTENT CONTAINER */}
        <div className="master-list-scroller">
          {processedProducts.length === 0 ? (
            <div className="empty-state">
              No matching catalog products found.
            </div>
          ) : viewMode === "table" ? (
            <>
              {/* QUICK ADD ROW */}
              <div className="quick-add-container">
                <span className="quick-add-label">QUICK ADD</span>
                <form className="quick-add-form" onSubmit={handleQuickAddSave}>
                  <select
                    className="quick-add-select"
                    value={quickAddType}
                    onChange={(e) => setQuickAddType(e.target.value)}
                  >
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    className="quick-add-select"
                    value={quickAddMfgId}
                    onChange={(e) => setQuickAddMfgId(e.target.value)}
                  >
                    <option value="">-- Select Manufacturer --</option>
                    {manufacturersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    className="quick-add-input"
                    placeholder="Model Name"
                    value={quickAddModel}
                    onChange={(e) => setQuickAddModel(e.target.value)}
                  />

                  <input
                    type="text"
                    className="quick-add-input"
                    placeholder="Part Number"
                    value={quickAddPartNo}
                    onChange={(e) => setQuickAddPartNo(e.target.value)}
                  />

                  <SubmitButton
                    isSaving={isQuickSaving}
                    saveSuccess={quickSaveSuccess}
                    isEditMode={false}
                    createLabel="Save"
                    style={{ height: "38px" }}
                  />
                </form>
              </div>

              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}></th>
                    <th
                      onClick={() => handleHeaderSort("type")}
                      style={{
                        cursor: "pointer",
                        userSelect: "none",
                        textAlign: "center",
                      }}
                    >
                      Type{" "}
                      {sortKey === "type" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleHeaderSort("manufacturer")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Manufacturer{" "}
                      {sortKey === "manufacturer" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleHeaderSort("name")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Model Name{" "}
                      {sortKey === "name" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleHeaderSort("partNumber")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Part Number{" "}
                      {sortKey === "partNumber" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleHeaderSort("sku")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      SKU{" "}
                      {sortKey === "sku" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className={`table-row-item ${selectedProduct?.id === p.id ? "selected" : ""}`}
                      onClick={() => setSelectedProduct(p)}
                    >
                      <td
                        style={{
                          width: "40px",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        {p.coverImageId ? (
                          <SecureImage
                            src={`/api/v1/ProductDocuments/${p.coverImageId}/Download`}
                            alt={p.name}
                            style={{
                              width: "28px",
                              height: "28px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid var(--border-color)",
                              backgroundColor: "var(--bg-input)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "4px",
                              border: "1px solid var(--border-color)",
                              backgroundColor: "transparent",
                              boxSizing: "border-box",
                            }}
                          />
                        )}
                      </td>
                      <td
                        className="type-badge-cell"
                        style={{
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        <span
                          className={`type-badge ${p.productType.toLowerCase()}`}
                        >
                          {p.productType}
                        </span>
                      </td>
                      <td>{p.manufacturerName}</td>
                      <td className="bold-name-cell">{p.name}</td>
                      <td className="text-muted text-mono">
                        {p.partNumber || "N/A"}
                      </td>
                      <td className="text-muted text-mono">{p.sku || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            /* CARD VIEW MODE */
            <div className="split-view-cards-grid">
              {processedProducts.map((p) => (
                <ProductCard
                  item={p}
                  isSelected={selectedProduct?.id === p.id}
                  onClick={() => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* TABLE FOOTER ROW */}
        {viewMode === "table" && productsList.length > 0 && (
          <div className="table-footer-row">
            <div>
              {processedProducts.length} of {productsList.length} products
            </div>
            <div className="footer-actions">
              <button
                type="button"
                className="footer-btn"
                onClick={() => alert("GRT import functionality is a stub.")}
              >
                Import
              </button>
              <button
                type="button"
                className="footer-btn"
                // onClick={() => {
                //   const headers = [
                //     "Type",
                //     "Manufacturer",
                //     "Model Name",
                //     "Part Number",
                //     "SKU",
                //   ];
                //   const rows = processedProducts.map((p) => [
                //     p.productType,
                //     p.manufacturerName,
                //     p.name,
                //     p.partNumber || "N/A",
                //     p.sku || "N/A",
                //   ]);
                //   const csvContent = [
                //     headers.join(","),
                //     ...rows.map((e) =>
                //       e.map((val) => `"${val.replace(/"/g, '""')}"`).join(","),
                //     ),
                //   ].join("\n");
                //   const blob = new Blob([csvContent], {
                //     type: "text/csv;charset=utf-8;",
                //   });
                //   const url = URL.createObjectURL(blob);
                //   const link = document.createElement("a");
                //   link.setAttribute("href", url);
                //   link.setAttribute(
                //     "download",
                //     `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
                //   );
                //   link.style.visibility = "hidden";
                //   document.body.appendChild(link);
                //   link.click();
                //   document.body.removeChild(link);
                // }}
              >
                Export
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT 1/3: DETAILS COLUMN WITH DUAL TILED MASTER-DETAIL VIEW */}
      <div className="right-pane-column">
        {/* TOP PANEL: PRIMARY SELECTED META DETAILS */}
        <div className="detail-panel">
          {!selectedProduct ? (
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
          ) : (
            <div className="detail-view-container">
              <div className="detail-panel-header">
                <span className="type-badge-pill">
                  {selectedProduct.productType}
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
                {/* {saveSuccess && (
                  <div className="detail-save-toast">
                    ✓ Product updated successfully
                  </div>
                )} */}
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
                {(() => {
                  const specs = extractSpecifications(selectedProduct);
                  return (
                    Object.keys(specs).length > 0 && (
                      <div className="details-specs-block">
                        <h3>Manual Specifications</h3>
                        <div className="specs-table">
                          {Object.entries(specs).map(([key, value]) => (
                            <div key={key} className="specs-table-row">
                              <span className="key-col">{key}</span>
                              <span className="val-col">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM PANEL: RELATED PHYSICAL INVENTORY ITEMS */}
        <div className="detail-panel">
          {!selectedProduct ? (
            <div className="empty-detail-state">
              <span className="icon">🛡️</span>
              <h3>No Product Selected</h3>
              <p>
                Select a product model to inspect physical armory inventory.
              </p>
            </div>
          ) : (
            <div className="detail-view-container">
              <div className="detail-panel-header">
                <h3>Related Physical Items</h3>
              </div>
              {/* {relatedArmoryItemsLoading ? (
                <div className="loading-state" style={{ padding: "20px 0" }}>
                  Loading physical armory inventory...
                </div>
              ) : !relatedArmoryItemsData?.data?.value ||
                relatedArmoryItemsData.data.value.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 0" }}>
                  No physical instances registered in your armory for this
                  model.
                </div>
              ) : (
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Serial Number</th>
                      <th>Name / Nickname</th>
                      <th>Condition</th>
                      <th>Round Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(relatedArmoryItemsData.data.value || []).map(
                      (item: any) => (
                        <tr
                          key={item.id}
                          className="table-row-item"
                          style={{ cursor: "default" }}
                        >
                          <td className="bold-name-cell">
                            {item.serialNumber || "N/A"}
                          </td>
                          <td>{item.name || "N/A"}</td>
                          <td>
                            <span
                              className={`badge item-badge-condition ${getConditionClass(item.condition)}`}
                            >
                              {item.condition}
                            </span>
                          </td>
                          <td className="text-mono">
                            {item.roundCount !== undefined
                              ? item.roundCount
                              : "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              )} */}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Modal */}
      {showModal && (
        <ProductForm
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          productId={isEditMode ? selectedProduct?.id || null : null}
          onSaved={(savedProduct) => {
            setSelectedProduct(savedProduct);
            //setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
