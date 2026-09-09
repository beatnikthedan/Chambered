import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import "./Armory.css";
import "./Vaults.css";
import ArmoryItemCard, { ExtendedArmoryItem } from "../Cards/ArmoryItemCard";
import ArmoryItemDetails from "../Details/ArmoryItemDetails";
import ArmoryItemForm from "../ModelForms/ArmoryItemForm";
import ArmoryItemHierarchyTree from "../components/ArmoryItemHierarchyTree";
import MasterActionBar from "../components/common/MasterActionBar";
import SortableTable, { ColumnDef } from "../components/common/SortableTable";
import SubmitButton from "../components/SubmitButton";
import SecureImage from "../components/SecureImage";
import ManufacturerFavicon from "../components/ManufacturerFavicon";
import {
  useMasterView,
  FilterGroupConfig,
} from "../components/common/useMasterView";

import {
  useGetArmoryItems,
  useGetProducts,
  useGetVaults,
  useDeleteArmoryItemsFromKey,
  usePatchArmoryItemsFromKey,
  usePostArmoryItems,
  useGetArmoryItemsArmoryItemTypes,
  getGetArmoryItemsQueryKey,
} from "../api/endpoints";
import type { Product } from "../api/models/product";
import type { Vault } from "../api/models/vault";

export type { ExtendedArmoryItem };

export default function Armory() {
  const queryClient = useQueryClient();
  const store = useStore();

  // Selected State
  const [selectedItem, setSelectedItem] = useState<ExtendedArmoryItem | null>(null);

  // Interaction State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Quick Add State
  const [quickAddArmoryType, setQuickAddArmoryType] = useState<string>("PewArmoryItem");
  const [quickAddProductId, setQuickAddProductId] = useState<string>("");
  const [quickAddName, setQuickAddName] = useState<string>("");
  const [quickAddVaultId, setQuickAddVaultId] = useState<string>("");
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);
  const [quickSaveSuccess, setQuickSaveSuccess] = useState<boolean>(false);

  // Queries
  const {
    data: armoryData,
    isLoading: armoryLoading,
    error: armoryError,
  } = useGetArmoryItems({
    filter: store.activeArsenalId
      ? `arsenalId eq ${store.activeArsenalId}`
      : undefined,
    expand:
      "product($expand=manufacturer),parentItem($expand=product),accessories($expand=product),vault,arsenal,owner,beneficiary",
  });

  const { data: productsData, isLoading: productsLoading } = useGetProducts({
    expand: "manufacturer",
  });

  const { data: vaultsData, isLoading: vaultsLoading } = useGetVaults();

  // Base Data arrays
  const rawArmoryList = useMemo(
    () => (armoryData?.data?.value || []) as ExtendedArmoryItem[],
    [armoryData],
  );

  const productsList = useMemo(
    () => (productsData?.data?.value || []) as Product[],
    [productsData],
  );

  const vaultsList = useMemo(
    () => (vaultsData?.data?.value || []) as Vault[],
    [vaultsData],
  );

  // Enriched Armory items
  const armoryList = useMemo(() => {
    return rawArmoryList.map((item) => {
      const linkedProduct = productsList.find((p) => p.id === item.productId);
      const linkedVault = vaultsList.find((v) => v.id === item.vaultId);
      const manufacturerName =
        linkedProduct?.manufacturer?.name ||
        item.product?.manufacturer?.name ||
        (item as any).manufacturer ||
        "";

      return {
        ...item,
        product: linkedProduct || item.product,
        vault: linkedVault || item.vault,
        manufacturer: manufacturerName,
        model: item.model || linkedProduct?.model || linkedProduct?.name || "",
        caliber: item.caliber || (linkedProduct as any)?.caliber || (item as any).caliber || "",
      } as ExtendedArmoryItem;
    });
  }, [rawArmoryList, productsList, vaultsList]);

  const { data: armoryTypesData } = useGetArmoryItemsArmoryItemTypes();
  const armoryTypes = useMemo(() => {
    return (armoryTypesData?.data?.value || []) as string[];
  }, [armoryTypesData]);

  const quickAddFilteredProducts = useMemo(() => {
    if (!productsList || productsList.length === 0) return [];
    if (!quickAddArmoryType || quickAddArmoryType === "ArmoryItem") return productsList;
    if (quickAddArmoryType === "PewArmoryItem") {
      return productsList.filter(
        (p) => p.productType === "PewPew" || p.productType === "Pew",
      );
    }
    if (quickAddArmoryType === "OpticArmoryItem") {
      return productsList.filter((p) => p.productType === "Optic");
    }
    if (quickAddArmoryType === "SuppressorArmoryItem") {
      return productsList.filter((p) => p.productType === "Suppressor");
    }
    if (quickAddArmoryType === "LightArmoryItem") {
      return productsList.filter(
        (p) => p.productType === "Light" || p.productType === "PewPewLight",
      );
    }
    return productsList;
  }, [productsList, quickAddArmoryType]);

  const postArmoryItemMutation = usePostArmoryItems({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetArmoryItemsQueryKey(),
        });
        setQuickAddName("");
        setQuickAddProductId("");
        setQuickAddVaultId("");
        setIsQuickSaving(false);
        setQuickSaveSuccess(true);
        setTimeout(() => setQuickSaveSuccess(false), 2000);
      },
      onError: (err: any) => {
        setIsQuickSaving(false);
        alert("Failed to quick-add armory item: " + (err?.message || "Unknown error"));
      },
    },
  });

  const handleQuickAddSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) {
      alert("Please enter an Armory Item Name.");
      return;
    }

    setIsQuickSaving(true);
    const itemType = quickAddArmoryType || "PewArmoryItem";
    const payload: any = {
      "@odata.type": `#Chambered.Data.Models.${itemType}`,
      name: quickAddName.trim(),
      productId: quickAddProductId ? Number(quickAddProductId) : null,
      vaultId: quickAddVaultId ? Number(quickAddVaultId) : null,
      arsenalId: store.activeArsenalId ? Number(store.activeArsenalId) : null,
      itemType: itemType,
    };

    if (itemType === "PewArmoryItem") {
      payload.serialNumber = "";
      payload.roundCount = 0;
    } else if (itemType === "SuppressorArmoryItem" || itemType === "OpticArmoryItem") {
      payload.serialNumber = "";
    }

    postArmoryItemMutation.mutate({ data: payload });
  };

  // Filter groups
  const filterGroups: FilterGroupConfig[] = useMemo(() => {
    const groups: FilterGroupConfig[] = [];

    if (armoryTypes.length > 0) {
      groups.push({
        id: "itemType",
        label: "Item Type",
        options: armoryTypes.map((t) => ({
          label: t,
          value: t,
        })),
      });
    }

    if (store.arsenals.length > 0) {
      groups.push({
        id: "arsenalId",
        label: "Arsenal",
        options: store.arsenals.map((a) => ({
          label: a.name,
          value: String(a.id),
        })),
      });
    }

    if (vaultsList.length > 0) {
      groups.push({
        id: "vaultId",
        label: "Vault Location",
        options: vaultsList.map((v) => ({
          label: v.name,
          value: String(v.id),
        })),
      });
    }

    return groups;
  }, [armoryTypes, store.arsenals, vaultsList]);

  // Master view hook
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
    processedItems: processedArmoryItems,
  } = useMasterView<ExtendedArmoryItem>({
    data: armoryList,
    searchFields: ["name", "model", "notes", "manufacturer", "caliber"],
    defaultSortColumn: "name",
    defaultSortDirection: "asc",
    customFilter: (item, filters) => {
      if (filters.itemType && filters.itemType.length > 0) {
        const itemType = item.itemType || "ArmoryItem";
        if (!filters.itemType.includes(itemType)) return false;
      }

      if (filters.arsenalId && filters.arsenalId.length > 0) {
        if (!filters.arsenalId.includes(String(item.arsenalId))) {
          return false;
        }
      }

      if (filters.vaultId && filters.vaultId.length > 0) {
        if (!item.vaultId || !filters.vaultId.includes(String(item.vaultId))) {
          return false;
        }
      }

      return true;
    },
  });

  // Table Columns: 1. Cover Image, 2. Type, 3. Manufacturer, 4. Model, 5. Name, 6. Vault, 7. Est. Value
  const armoryColumns: ColumnDef<ExtendedArmoryItem>[] = useMemo(
    () => [
      {
        key: "coverImage",
        header: "",
        sortable: false,
        width: "44px",
        align: "center",
        render: (item) => {
          const coverImageId =
            item.product?.coverImageId || (item as any).coverImageId;
          return coverImageId ? (
            <SecureImage
              src={`/api/v1/ProductDocuments/${coverImageId}/Download`}
              alt={item.name || item.model || "Armory Item"}
              style={{
                width: "28px",
                height: "28px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                display: "block",
                margin: "0px 0px 0px 4px",
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
          );
        },
      },
      {
        key: "itemType",
        header: "Type",
        width: "140px",
        align: "center",
        render: (item) => (
          <span className="type-badge">{item.itemType || "ArmoryItem"}</span>
        ),
      },
      {
        key: "manufacturer",
        header: "Manufacturer",
        render: (item) => {
          const mfgId = item.product?.manufacturerId || (item.product?.manufacturer as any)?.id;
          const mfgName = item.manufacturer || item.product?.manufacturer?.name || "—";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {mfgId ? <ManufacturerFavicon mfgId={mfgId} size={20} /> : null}
              <span>{mfgName}</span>
            </div>
          );
        },
      },
      {
        key: "model",
        header: "Model",
        render: (item) => (
          <span>{item.model || item.product?.model || item.product?.name || "—"}</span>
        ),
      },
      {
        key: "name",
        header: "Name",
        render: (item) => (
          <span className="bold-name-cell">{item.name || "—"}</span>
        ),
      },
      {
        key: "vault",
        header: "Vault",
        render: (item) => (
          <span className="text-muted">
            {item.vault?.name || (item.vaultId ? `Vault #${item.vaultId}` : "Unassigned")}
          </span>
        ),
      },
      {
        key: "estimatedValue",
        header: "Est. Value",
        align: "right",
        render: (item) => (
          <span className="text-mono">
            {item.estimatedValue != null
              ? `$${Number(item.estimatedValue).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "—"}
          </span>
        ),
      },
    ],
    [],
  );

  // Keep selected item synchronized when processed data updates
  useEffect(() => {
    if (processedArmoryItems.length > 0) {
      if (!selectedItem) {
        setSelectedItem(processedArmoryItems[0]);
      } else {
        const fresh = processedArmoryItems.find((i) => i.id === selectedItem.id);
        if (fresh && fresh !== selectedItem) {
          setSelectedItem(fresh);
        } else if (!fresh) {
          setSelectedItem(processedArmoryItems[0] || null);
        }
      }
    } else {
      setSelectedItem(null);
    }
  }, [processedArmoryItems, selectedItem]);

  // Delete Mutation
  const deleteMutation = useDeleteArmoryItemsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetArmoryItemsQueryKey(),
        });
        setSelectedItem(null);
      },
      onError: (err: any) => {
        alert("Failed to delete armory item: " + (err?.message || "Unknown error"));
      },
    },
  });

  // Reparent / Patch Mutation
  const patchMutation = usePatchArmoryItemsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetArmoryItemsQueryKey(),
        });
      },
      onError: (err: any) => {
        alert("Failed to update armory item: " + (err?.message || "Unknown error"));
      },
    },
  });

  const handleReparentItem = async (itemId: number, targetParentId: number | null) => {
    try {
      await patchMutation.mutateAsync({
        key: itemId,
        data: { parentItemId: targetParentId },
      });
    } catch (err) {
      console.error("Reparent error:", err);
    }
  };

  const handleDetachAccessory = (accessoryId: number) => {
    if (window.confirm("Detach this accessory from its parent item?")) {
      patchMutation.mutate({
        key: accessoryId,
        data: { parentItemId: null },
      });
    }
  };

  const startAddItem = () => {
    setIsEditMode(false);
    setShowModal(true);
  };

  const startEditItem = () => {
    if (!selectedItem) return;
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDeleteItem = () => {
    if (!selectedItem?.id) return;
    const name =
      selectedItem.name ||
      selectedItem.model ||
      `Item #${selectedItem.id}`;
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${name}" from your armory?`,
      )
    ) {
      deleteMutation.mutate({ key: selectedItem.id });
    }
  };

  if (armoryLoading || productsLoading || vaultsLoading) {
    return <div className="loading-state">Loading armory inventory...</div>;
  }

  if (armoryError) {
    return (
      <div className="error-alert">
        Error loading armory items: {(armoryError as any)?.message}
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
          searchPlaceholder="Search armory by name, model, serial #, caliber..."
          filterGroups={filterGroups}
          selectedFilters={selectedFilters}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showTreeToggle={true}
          onAddNew={startAddItem}
          addNewLabel="Add Armory Item"
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
                    value={quickAddArmoryType}
                    onChange={(e) => {
                      setQuickAddArmoryType(e.target.value);
                      setQuickAddProductId("");
                    }}
                  >
                    {armoryTypes.length > 0 ? (
                      armoryTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="PewArmoryItem">PewArmoryItem</option>
                        <option value="OpticArmoryItem">OpticArmoryItem</option>
                        <option value="SuppressorArmoryItem">SuppressorArmoryItem</option>
                        <option value="LightArmoryItem">LightArmoryItem</option>
                        <option value="ArmoryItem">ArmoryItem</option>
                      </>
                    )}
                  </select>

                  <select
                    className="quick-add-select"
                    value={quickAddProductId}
                    onChange={(e) => setQuickAddProductId(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {quickAddFilteredProducts.map((p) => {
                      const mfg = p.manufacturer?.name ? `${p.manufacturer.name} - ` : "";
                      return (
                        <option key={p.id} value={p.id}>
                          {mfg}{p.name || p.model}
                        </option>
                      );
                    })}
                  </select>

                  <input
                    type="text"
                    className="quick-add-input"
                    placeholder="Armory Item Name"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    required
                  />

                  <select
                    className="quick-add-select"
                    value={quickAddVaultId}
                    onChange={(e) => setQuickAddVaultId(e.target.value)}
                  >
                    <option value="">-- Vault Location --</option>
                    {vaultsList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>

                  <SubmitButton
                    isSaving={isQuickSaving}
                    saveSuccess={quickSaveSuccess}
                    isEditMode={false}
                    createLabel="Save"
                    style={{ height: "38px" }}
                  />
                </form>
              </div>

              <SortableTable<ExtendedArmoryItem>
                columns={armoryColumns}
                data={processedArmoryItems}
                totalCount={armoryList.length}
                selectedItem={selectedItem}
                onSelectItem={(item) => setSelectedItem(item)}
                sortState={sortState}
                onSort={handleSort}
                emptyMessage="No matching armory items found."
                entityName="armory items"
                onImport={() => alert("Armory import functionality is coming soon.")}
                onExport={() => {
                  const headers = [
                    "Item Name",
                    "Type",
                    "Manufacturer",
                    "Vault Location",
                    "Estimated Value",
                  ];
                  const rows = processedArmoryItems.map((i) => [
                    i.name || "N/A",
                    i.itemType || "ArmoryItem",
                    i.manufacturer || i.product?.manufacturer?.name || "N/A",
                    i.vault?.name || "Unassigned",
                    i.estimatedValue != null ? String(i.estimatedValue) : "N/A",
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
                    `armory_export_${new Date().toISOString().slice(0, 10)}.csv`,
                  );
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              />
            </>
          ) : viewMode === "card" ? (
            <div className="cards-grid">
              {processedArmoryItems.length === 0 ? (
                <div className="empty-state">No matching armory items found.</div>
              ) : (
                processedArmoryItems.map((item) => (
                  <ArmoryItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    onClick={() => setSelectedItem(item)}
                  />
                ))
              )}
            </div>
          ) : (
            <ArmoryItemHierarchyTree
              items={processedArmoryItems}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              onReparentItem={handleReparentItem}
            />
          )}
        </div>
      </div>

      {/* RIGHT 1/3: DETAILS COLUMN */}
      <ArmoryItemDetails
        item={selectedItem}
        onEdit={startEditItem}
        onDelete={handleDeleteItem}
        onAddNew={startAddItem}
        onDetachAccessory={handleDetachAccessory}
      />

      {/* Armory Item Modal */}
      {showModal && (
        <ArmoryItemForm
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          armoryItemId={isEditMode && selectedItem ? selectedItem.id : null}
          onSaved={(savedItem) => {
            if (savedItem) {
              setSelectedItem(savedItem as any);
            }
          }}
        />
      )}
    </div>
  );
}
