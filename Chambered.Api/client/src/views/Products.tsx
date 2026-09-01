import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../StoreContext";
import { useQueryClient } from "@tanstack/react-query";
import "./Products.css";
import SubmitButton from "../components/SubmitButton";
import ProductCard from "../Cards/ProductCard";
import ProductDetails, { ExtendedProduct } from "../Details/ProductDetails";
import ProductForm from "../ModelForms/ProductForm";
import MasterActionBar from "../components/common/MasterActionBar";
import SortableTable, { ColumnDef } from "../components/common/SortableTable";
import {
  useMasterView,
  FilterGroupConfig,
} from "../components/common/useMasterView";

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
import SecureImage from "../components/SecureImage";
import ManufacturerFavicon from "../components/ManufacturerFavicon";

export default function Products() {
  const queryClient = useQueryClient();
  const store = useStore();

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

  // Interaction State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

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

  // Quick Add state
  const [quickAddType, setQuickAddType] = useState<string>("Product");
  const [quickAddMfgId, setQuickAddMfgId] = useState<string>("");
  const [quickAddModel, setQuickAddModel] = useState<string>("");
  const [quickAddPartNo, setQuickAddPartNo] = useState<string>("");
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);
  const [quickSaveSuccess, setQuickSaveSuccess] = useState<boolean>(false);

  // Process raw products with manufacturer and caliber names
  const rawProcessedProducts = useMemo(() => {
    return productsList.map((p) => {
      let type = p.productType;
      if (!type && p["@odata.type"]) {
        const parts = p["@odata.type"].split(".");
        type = parts[parts.length - 1];
      }
      if (!type) type = "Product";

      const mfg =
        p.manufacturer ||
        manufacturersList.find((m) => m.id === p.manufacturerId);
      const mfgName = mfg ? mfg.name || "Unknown" : "Unknown";

      let calName = "";
      const pAny = p as any;
      if (pAny.caliber) {
        calName = pAny.caliber.name || "";
      } else if (pAny.caliberId) {
        const cal = calibersList.find((c) => c.id === pAny.caliberId);
        calName = cal ? cal.name || "" : "";
      }

      return {
        ...p,
        productType: type,
        manufacturerName: mfgName,
        caliberName: calName,
      } as ExtendedProduct;
    });
  }, [productsList, manufacturersList, calibersList]);

  // Filter group definitions for MasterActionBar
  const filterGroups: FilterGroupConfig[] = useMemo(() => {
    const groups: FilterGroupConfig[] = [];
    if (productTypes.length > 0) {
      groups.push({
        id: "productType",
        label: "Product Type",
        options: productTypes.map((t) => ({ label: t, value: t })),
      });
    }
    if (manufacturersList.length > 0) {
      groups.push({
        id: "manufacturer",
        label: "Manufacturer",
        options: manufacturersList.map((m) => ({
          label: m.name,
          value: String(m.id),
        })),
      });
    }
    return groups;
  }, [productTypes, manufacturersList]);

  // Universal Master View Hook
  const {
    searchTerm,
    setSearchTerm,
    selectedFilters,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    sortState,
    handleSort,
    viewMode,
    setViewMode,
    processedItems: processedProducts,
  } = useMasterView<ExtendedProduct>({
    data: rawProcessedProducts,
    searchFields: [
      "name",
      "partNumber",
      "sku",
      "manufacturerName",
      "productType",
    ],
    defaultSortColumn: "name",
    defaultSortDirection: "asc",
    customFilter: (item, filters) => {
      if (filters.productType && filters.productType.length > 0) {
        if (!filters.productType.includes(item.productType)) {
          return false;
        }
      }
      if (filters.manufacturer && filters.manufacturer.length > 0) {
        if (!filters.manufacturer.includes(String(item.manufacturerId))) {
          return false;
        }
      }
      return true;
    },
  });

  // Table Column Definitions: 1. Cover Image, 2. Type, 3. Manufacturer, 4. Model Name, 5. Part Number, 6. SKU
  const productColumns: ColumnDef<ExtendedProduct>[] = useMemo(
    () => [
      {
        key: "coverImage",
        header: "",
        sortable: false,
        width: "44px",
        align: "center",
        render: (p) =>
          p.coverImageId ? (
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
                display: "block",
                margin: "0 auto",
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
                margin: "0 auto",
              }}
            />
          ),
      },
      {
        key: "productType",
        header: "Type",
        width: "120px",
        align: "left",
        render: (p) => (
          <span className={`type-badge ${p.productType.toLowerCase()}`}>
            {p.productType}
          </span>
        ),
      },
      {
        key: "manufacturerName",
        header: "Manufacturer",
        render: (p) => (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ManufacturerFavicon mfgId={p.manufacturerId} size={20} />
            <span>{p.manufacturerName}</span>
          </div>
        ),
      },
      {
        key: "name",
        header: "Model Name",
        render: (p) => <span className="bold-name-cell">{p.name}</span>,
      },
      {
        key: "partNumber",
        header: "Part Number",
        render: (p) => (
          <span className="text-muted text-mono">
            {p.partNumber || "N/A"}
          </span>
        ),
      },
      {
        key: "sku",
        header: "SKU",
        render: (p) => (
          <span className="text-muted text-mono">{p.sku || "N/A"}</span>
        ),
      },
    ],
    [],
  );

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
      if (freshProduct && freshProduct !== selectedProduct) {
        setSelectedProduct(freshProduct);
      } else if (!freshProduct) {
        setSelectedProduct(processedProducts[0] || null);
      }
    }
  }, [processedProducts, selectedProduct]);

  // Mutations
  const createProductMutation = usePostProducts({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        if (res?.data) {
          const newProd = res.data as any;
          setSelectedProduct(newProd);
        }
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
        alert(
          "Failed to delete product: " + (err?.message || "Unknown error"),
        ),
    },
  });

  const startAddProduct = () => {
    setIsEditMode(false);
    setShowModal(true);
  };

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
        <MasterActionBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search model, SKU, or manufacturer..."
          filterGroups={filterGroups}
          selectedFilters={selectedFilters}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddNew={startAddProduct}
          addNewLabel="Add Product"
        />

        {/* MASTER LIST CONTENT CONTAINER */}
        <div className="master-list-scroller">
          {viewMode === "table" ? (
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

              <SortableTable<ExtendedProduct>
                columns={productColumns}
                data={processedProducts}
                totalCount={productsList.length}
                selectedItem={selectedProduct}
                onSelectItem={(p) => setSelectedProduct(p)}
                sortState={sortState}
                onSort={handleSort}
                emptyMessage="No matching catalog products found."
                entityName="products"
                onImport={() => alert("GRT import functionality is a stub.")}
                onExport={() => {
                  const headers = [
                    "Type",
                    "Manufacturer",
                    "Model Name",
                    "Part Number",
                    "SKU",
                  ];
                  const rows = processedProducts.map((p) => [
                    p.productType,
                    p.manufacturerName,
                    p.name,
                    p.partNumber || "N/A",
                    p.sku || "N/A",
                  ]);
                  const csvContent = [
                    headers.join(","),
                    ...rows.map((e) =>
                      e.map((val) => `"${val.replace(/"/g, '""')}"`).join(","),
                    ),
                  ].join("\n");
                  const blob = new Blob([csvContent], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute(
                    "download",
                    `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
                  );
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              />
            </>
          ) : (
            <div className="split-view-cards-grid">
              {processedProducts.length === 0 ? (
                <div className="empty-state">
                  No matching catalog products found.
                </div>
              ) : (
                processedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    item={p as any}
                    isSelected={selectedProduct?.id === p.id}
                    onClick={() => setSelectedProduct(p)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT 1/3: DETAILS COLUMN VIA DEDICATED PRODUCTDETAILS COMPONENT */}
      <ProductDetails
        product={selectedProduct}
        onEdit={startEditProduct}
        onDelete={handleDeleteProduct}
        onAddNew={startAddProduct}
      />

      {/* Catalog Modal */}
      {showModal && (
        <ProductForm
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          productId={isEditMode ? selectedProduct?.id || null : null}
          onSaved={(savedProduct) => {
            if (savedProduct) {
              setSelectedProduct(savedProduct as any);
            }
          }}
        />
      )}
    </div>
  );
}
