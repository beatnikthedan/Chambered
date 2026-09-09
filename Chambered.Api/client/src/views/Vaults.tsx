import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import "./Vaults.css";
import VaultCard from "../Cards/VaultCard";
import VaultDetails, { ExtendedVault } from "../Details/VaultDetails";
import VaultForm from "../ModelForms/VaultForm";
import VaultSpatialTree from "../components/VaultSpatialTree";
import MasterActionBar from "../components/common/MasterActionBar";
import SortableTable, { ColumnDef } from "../components/common/SortableTable";
import SubmitButton from "../components/SubmitButton";
import {
  useMasterView,
  FilterGroupConfig,
} from "../components/common/useMasterView";

import {
  useGetVaults,
  usePostVaults,
  usePatchVaultsFromKey,
  useDeleteVaultsFromKey,
  useGetProducts,
  getGetVaultsQueryKey,
} from "../api/endpoints";
import type { Product } from "../api/models/product";

export default function Vaults() {
  const queryClient = useQueryClient();
  const store = useStore();

  // Queries
  const {
    data: vaultsData,
    isLoading: vaultsLoading,
    error: vaultsError,
  } = useGetVaults({
    filter: store.activeArsenalId
      ? `arsenalId eq ${store.activeArsenalId}`
      : undefined,
    expand: "product($expand=manufacturer),armoryItems,arsenal",
  });

  const { data: securityProductsData, isLoading: productsLoading } =
    useGetProducts({
      filter: "productType eq 'Security'",
      expand: "manufacturer",
    });

  // Selected state
  const [selectedVault, setSelectedVault] = useState<ExtendedVault | null>(null);

  // Interaction State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Quick Add State
  const [quickAddName, setQuickAddName] = useState<string>("");
  const [quickAddArsenalId, setQuickAddArsenalId] = useState<string>("");
  const [quickAddProductId, setQuickAddProductId] = useState<string>("");
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);
  const [quickSaveSuccess, setQuickSaveSuccess] = useState<boolean>(false);

  // Base Data arrays
  const rawVaultsList = useMemo(
    () => (vaultsData?.data?.value || []) as ExtendedVault[],
    [vaultsData],
  );

  const securityProductsList = useMemo(
    () => (securityProductsData?.data?.value || []) as Product[],
    [securityProductsData],
  );

  const vaultsList = useMemo(() => {
    return rawVaultsList.map((vault) => {
      const fullSecurityProduct = securityProductsList.find(
        (p) => p.id === vault.productId,
      );
      const prod = fullSecurityProduct || vault.product;
      const makeName = prod?.manufacturer?.name || "";
      const modelName = prod?.name || "";
      const arsenalName = vault.arsenal?.name || "";
      const parentVaultName =
        vault.parentVault?.name ||
        (vault.parentVaultId ? `Vault #${vault.parentVaultId}` : "None (Root)");
      const itemsCount = vault.armoryItems?.length || 0;

      return {
        ...vault,
        product: prod,
        make: makeName,
        model: modelName,
        arsenalName: arsenalName,
        parentVaultName: parentVaultName,
        itemsCount: itemsCount,
      };
    });
  }, [rawVaultsList, securityProductsList]);

  // Setup default arsenal in quick add
  useEffect(() => {
    if (store.activeArsenalId) {
      setQuickAddArsenalId(String(store.activeArsenalId));
    } else if (store.arsenals.length > 0 && !quickAddArsenalId) {
      setQuickAddArsenalId(String(store.arsenals[0].id));
    }
  }, [store.activeArsenalId, store.arsenals, quickAddArsenalId]);

  // Filter groups
  const filterGroups: FilterGroupConfig[] = useMemo(() => {
    const groups: FilterGroupConfig[] = [];
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

    const uniqueMakes = Array.from(
      new Set(
        securityProductsList
          .map((p) => p.manufacturer?.name)
          .filter(Boolean) as string[],
      ),
    ).sort();
    if (uniqueMakes.length > 0) {
      groups.push({
        id: "make",
        label: "Make",
        options: uniqueMakes.map((m) => ({
          label: m,
          value: m,
        })),
      });
    }

    if (securityProductsList.length > 0) {
      groups.push({
        id: "model",
        label: "Model",
        options: securityProductsList.map((p) => ({
          label: p.name || "",
          value: p.name || "",
        })),
      });
    }

    groups.push({
      id: "parentVault",
      label: "Parent Vault",
      options: [
        { label: "Root Vaults", value: "__ROOT__" },
        { label: "Sub-Vaults", value: "__SUB__" },
      ],
    });

    groups.push({
      id: "storedItems",
      label: "Stored Items",
      options: [
        { label: "Contains Items", value: "has_items" },
        { label: "Empty (0 items)", value: "empty" },
      ],
    });

    return groups;
  }, [store.arsenals, securityProductsList]);

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
    processedItems: processedVaults,
  } = useMasterView<ExtendedVault>({
    data: vaultsList,
    searchFields: [
      "name",
      "description",
      "make",
      "model",
      "arsenalName",
      "parentVaultName",
    ],
    defaultSortColumn: "name",
    defaultSortDirection: "asc",
    customFilter: (item: any, filters) => {
      if (filters.arsenalId && filters.arsenalId.length > 0) {
        if (!filters.arsenalId.includes(String(item.arsenalId))) {
          return false;
        }
      }
      if (filters.make && filters.make.length > 0) {
        const itemMake = item.product?.manufacturer?.name || item.make;
        if (!itemMake || !filters.make.includes(itemMake)) {
          return false;
        }
      }
      if (filters.model && filters.model.length > 0) {
        const itemModel = item.product?.name || item.model;
        if (!itemModel || !filters.model.includes(itemModel)) {
          return false;
        }
      }
      if (filters.parentVault && filters.parentVault.length > 0) {
        if (filters.parentVault.includes("__ROOT__") && item.parentVaultId) {
          if (!filters.parentVault.includes("__SUB__")) return false;
        }
        if (filters.parentVault.includes("__SUB__") && !item.parentVaultId) {
          if (!filters.parentVault.includes("__ROOT__")) return false;
        }
      }
      if (filters.storedItems && filters.storedItems.length > 0) {
        const count = item.armoryItems?.length || 0;
        if (
          filters.storedItems.includes("has_items") &&
          count === 0 &&
          !filters.storedItems.includes("empty")
        ) {
          return false;
        }
        if (
          filters.storedItems.includes("empty") &&
          count > 0 &&
          !filters.storedItems.includes("has_items")
        ) {
          return false;
        }
      }
      return true;
    },
  });

  // Table Columns
  const vaultColumns: ColumnDef<ExtendedVault>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Vault Name",
        render: (v) => <span className="bold-name-cell">{v.name}</span>,
      },
      {
        key: "arsenal",
        header: "Arsenal",
        render: (v) => {
          const color = v.arsenal?.colorHex || "var(--color-primary)";
          return (
            <span
              className="type-badge"
              style={{
                backgroundColor: `${color}22`,
                color: color,
                border: `1px solid ${color}55`,
              }}
            >
              {v.arsenal?.name || `Arsenal #${v.arsenalId}`}
            </span>
          );
        },
      },
      {
        key: "make",
        header: "Make",
        render: (v) => (
          <span>{v.product?.manufacturer?.name || "—"}</span>
        ),
      },
      {
        key: "model",
        header: "Model",
        render: (v) => (
          <span>{v.product?.name || "—"}</span>
        ),
      },
      {
        key: "itemsCount",
        header: "Stored Items",
        align: "center",
        render: (v) => {
          const count = v.armoryItems?.length || 0;
          return (
            <span className="text-mono">
              {count} {count === 1 ? "item" : "items"}
            </span>
          );
        },
      },
      {
        key: "parentVault",
        header: "Parent Vault",
        render: (v) => (
          <span className="text-muted">
            {v.parentVault?.name ||
              (v.parentVaultId ? `Vault #${v.parentVaultId}` : "None (Root)")}
          </span>
        ),
      },
    ],
    [],
  );

  // Keep selected vault updated when data updates
  useEffect(() => {
    if (processedVaults.length > 0) {
      if (!selectedVault) {
        setSelectedVault(processedVaults[0]);
      } else {
        const fresh = processedVaults.find((v) => v.id === selectedVault.id);
        if (fresh && fresh !== selectedVault) {
          setSelectedVault(fresh);
        } else if (!fresh) {
          setSelectedVault(processedVaults[0] || null);
        }
      }
    } else {
      setSelectedVault(null);
    }
  }, [processedVaults, selectedVault]);

  // Delete Mutation
  const deleteVaultMutation = useDeleteVaultsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetVaultsQueryKey(),
        });
        setSelectedVault(null);
      },
      onError: (err: any) =>
        alert(
          "Failed to delete vault: " + (err?.message || "Unknown error"),
        ),
    },
  });

  // Quick Add Mutation
  const createVaultMutation = usePostVaults({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetVaultsQueryKey(),
        });
        setIsQuickSaving(false);
        setQuickSaveSuccess(true);
        setQuickAddName("");
        setTimeout(() => {
          setQuickSaveSuccess(false);
        }, 1500);
      },
      onError: (err: any) => {
        alert("Failed to quick add vault: " + (err?.message || "Unknown error"));
        setIsQuickSaving(false);
      },
    },
  });

  // Reparent drag-and-drop mutation
  const patchVaultMutation = usePatchVaultsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetVaultsQueryKey(),
        });
      },
      onError: (err: any) => {
        alert("Failed to update vault hierarchy: " + (err?.message || "Unknown error"));
      },
    },
  });

  const handleReparentVault = async (vaultId: number, targetParentId: number | null) => {
    try {
      await patchVaultMutation.mutateAsync({
        key: vaultId,
        data: { parentVaultId: targetParentId },
      });
    } catch (err) {
      console.error("Reparent error:", err);
    }
  };

  const handleQuickAddSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) return;

    setIsQuickSaving(true);
    const arsenalId = quickAddArsenalId
      ? Number(quickAddArsenalId)
      : store.activeArsenalId || store.arsenals[0]?.id || 1;
    const productId = quickAddProductId ? Number(quickAddProductId) : null;

    createVaultMutation.mutate({
      data: {
        name: quickAddName.trim(),
        arsenalId,
        productId,
        hasDehumidifier: false,
        targetMaxHumidityPercent: 45,
      },
    });
  };

  const startAddVault = () => {
    setIsEditMode(false);
    setShowModal(true);
  };

  const startEditVault = () => {
    if (!selectedVault) return;
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDeleteVault = () => {
    if (!selectedVault?.id) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete vault "${selectedVault.name}"?`,
      )
    ) {
      deleteVaultMutation.mutate({ key: selectedVault.id });
    }
  };

  if (vaultsLoading || productsLoading) {
    return <div className="loading-state">Loading vaults data...</div>;
  }

  if (vaultsError) {
    return (
      <div className="error-alert">
        Error loading vaults: {(vaultsError as any)?.message}
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
          searchPlaceholder="Search vaults by name or description..."
          filterGroups={filterGroups}
          selectedFilters={selectedFilters}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showTreeToggle={true}
          onAddNew={startAddVault}
          addNewLabel="Add Vault"
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
                    value={quickAddArsenalId}
                    onChange={(e) => setQuickAddArsenalId(e.target.value)}
                    required
                  >
                    {store.arsenals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="quick-add-select"
                    value={quickAddProductId}
                    onChange={(e) => setQuickAddProductId(e.target.value)}
                  >
                    <option value="">-- No Linked Product --</option>
                    {securityProductsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.manufacturer?.name ? `${p.manufacturer.name} ` : ""}
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    className="quick-add-input"
                    placeholder="Vault Name (e.g. Master Bedroom Safe)"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    required
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

              <SortableTable<ExtendedVault>
                columns={vaultColumns}
                data={processedVaults}
                totalCount={vaultsList.length}
                selectedItem={selectedVault}
                onSelectItem={(v) => setSelectedVault(v)}
                sortState={sortState}
                onSort={handleSort}
                emptyMessage="No matching vaults found."
                entityName="vaults"
                onImport={() => alert("Vault import functionality is a stub.")}
                onExport={() => {
                  const headers = [
                    "Vault Name",
                    "Arsenal",
                    "Security Model",
                    "Stored Items Count",
                    "Parent Vault",
                    "Description",
                  ];
                  const rows = processedVaults.map((v) => [
                    v.name,
                    v.arsenal?.name || String(v.arsenalId),
                    v.product?.name || "N/A",
                    String(v.armoryItems?.length || 0),
                    v.parentVault?.name || "None",
                    v.description || "N/A",
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
                    `vaults_export_${new Date().toISOString().slice(0, 10)}.csv`,
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
              {processedVaults.length === 0 ? (
                <div className="empty-state">No matching vaults found.</div>
              ) : (
                processedVaults.map((v) => (
                  <VaultCard
                    key={v.id}
                    item={v}
                    isSelected={selectedVault?.id === v.id}
                    onClick={() => setSelectedVault(v)}
                  />
                ))
              )}
            </div>
          ) : (
            <VaultSpatialTree
              vaults={processedVaults}
              selectedVault={selectedVault}
              onSelectVault={setSelectedVault}
              onReparentVault={handleReparentVault}
            />
          )}
        </div>
      </div>

      {/* RIGHT 1/3: DETAILS COLUMN VIA DEDICATED VAULTDETAILS COMPONENT */}
      <VaultDetails
        vault={selectedVault}
        onEdit={startEditVault}
        onDelete={handleDeleteVault}
        onAddNew={startAddVault}
      />

      {/* Vault Modal */}
      {showModal && (
        <VaultForm
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          currentId={isEditMode && selectedVault ? selectedVault.id : null}
          onSaved={(savedVault) => {
            if (savedVault) {
              setSelectedVault(savedVault as any);
            }
          }}
        />
      )}
    </div>
  );
}
