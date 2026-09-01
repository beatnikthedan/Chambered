import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import "./Manufacturers.css";
import ManufacturerCard from "../Cards/ManufacturerCard";
import ManufacturerDetails from "../Details/ManufacturerDetails";
import { ExtendedProduct } from "../Details/ProductDetails";
import ManufacturerForm from "../ModelForms/ManufacturerForm";
import MasterActionBar from "../components/common/MasterActionBar";
import SortableTable, { ColumnDef } from "../components/common/SortableTable";
import {
  useMasterView,
  FilterGroupConfig,
} from "../components/common/useMasterView";

import {
  useGetManufacturers,
  useDeleteManufacturersFromKey,
  useGetProducts,
} from "../api/endpoints";
import type { Manufacturer } from "../api/models/manufacturer";
import type { Product } from "../api/models/product";

export default function Manufacturers() {
  const queryClient = useQueryClient();
  const store = useStore();

  const {
    data: manufacturersData,
    isLoading: mfgsLoading,
    error: mfgsError,
  } = useGetManufacturers();

  const { data: productsData, isLoading: productsLoading } = useGetProducts({
    expand: "manufacturer",
  });

  // Selected records
  const [selectedMfg, setSelectedMfg] = useState<Manufacturer | null>(null);

  // Interaction State
  const [showMfgModal, setShowMfgModal] = useState<boolean>(false);
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

  const relatedProducts = useMemo(() => {
    if (!selectedMfg) return [];
    return productsList
      .filter((p) => p.manufacturerId === selectedMfg.id)
      .map((p) => {
        let type = p.productType;
        if (!type && p["@odata.type"]) {
          const parts = p["@odata.type"].split(".");
          type = parts[parts.length - 1];
        }
        if (!type) type = "Product";
        return {
          ...p,
          productType: type,
        } as ExtendedProduct;
      });
  }, [productsList, selectedMfg]);

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    manufacturersList.forEach((m) => {
      if (m.country && m.country.trim()) set.add(m.country.trim());
    });
    return Array.from(set).sort();
  }, [manufacturersList]);

  const availableStates = useMemo(() => {
    const set = new Set<string>();
    manufacturersList.forEach((m) => {
      if (m.stateOrProvince && m.stateOrProvince.trim()) {
        set.add(m.stateOrProvince.trim());
      }
    });
    return Array.from(set).sort();
  }, [manufacturersList]);

  const filterGroups: FilterGroupConfig[] = useMemo(() => {
    const groups: FilterGroupConfig[] = [];
    if (availableCountries.length > 0) {
      groups.push({
        id: "country",
        label: "Country",
        options: availableCountries.map((c) => ({ label: c, value: c })),
      });
    }
    if (availableStates.length > 0) {
      groups.push({
        id: "stateOrProvince",
        label: "State / Province",
        options: availableStates.map((s) => ({ label: s, value: s })),
      });
    }
    return groups;
  }, [availableCountries, availableStates]);

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
    processedItems: processedManufacturers,
  } = useMasterView<Manufacturer>({
    data: manufacturersList,
    searchFields: ["name", "city", "stateOrProvince", "country"],
    defaultSortColumn: "name",
    defaultSortDirection: "asc",
    customFilter: (item, filters) => {
      if (filters.country && filters.country.length > 0) {
        if (!item.country || !filters.country.includes(item.country.trim())) {
          return false;
        }
      }
      if (filters.stateOrProvince && filters.stateOrProvince.length > 0) {
        if (
          !item.stateOrProvince ||
          !filters.stateOrProvince.includes(item.stateOrProvince.trim())
        ) {
          return false;
        }
      }
      return true;
    },
  });

  const mfgColumns: ColumnDef<Manufacturer>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (m) => (
          <span className="bold-name-cell">{m.name}</span>
        ),
      },
      { key: "city", header: "City" },
      { key: "stateOrProvince", header: "State / Province" },
      { key: "country", header: "Country" },
    ],
    [],
  );

  // Keep selected manufacturer fresh upon data refetch
  useEffect(() => {
    if (processedManufacturers.length > 0) {
      if (!selectedMfg) {
        setSelectedMfg(processedManufacturers[0]);
      } else {
        const freshMfg = processedManufacturers.find(
          (m) => m.id === selectedMfg.id,
        );
        if (freshMfg && freshMfg !== selectedMfg) {
          setSelectedMfg(freshMfg);
        } else if (!freshMfg) {
          setSelectedMfg(processedManufacturers[0] || null);
        }
      }
    } else {
      setSelectedMfg(null);
    }
  }, [processedManufacturers, selectedMfg]);

  const deleteMfgMutation = useDeleteManufacturersFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Manufacturers"] });
        setSelectedMfg(null);
      },
      onError: (err: any) =>
        alert(
          "Failed to delete manufacturer: " + (err?.message || "Unknown error"),
        ),
    },
  });

  const startAddMfg = () => {
    setIsEditMode(false);
    setShowMfgModal(true);
  };

  const startEditMfg = () => {
    if (!selectedMfg) return;
    setIsEditMode(true);
    setShowMfgModal(true);
  };

  const handleDeleteMfg = () => {
    if (!selectedMfg?.id) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete manufacturer "${selectedMfg.name}"?`,
      )
    ) {
      deleteMfgMutation.mutate({ key: selectedMfg.id });
    }
  };

  if (mfgsLoading || productsLoading) {
    return <div className="loading-state">Loading catalog data...</div>;
  }

  if (mfgsError) {
    return (
      <div className="error-alert">
        Error loading catalog: {(mfgsError as any)?.message}
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
          searchPlaceholder="Search by name, city or country..."
          filterGroups={filterGroups}
          selectedFilters={selectedFilters}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddNew={startAddMfg}
          addNewLabel="Add Manufacturer"
        />

        {/* MASTER LIST CONTENT CONTAINER */}
        <div className="master-list-scroller">
          {viewMode === "table" ? (
            <SortableTable<Manufacturer>
              columns={mfgColumns}
              data={processedManufacturers}
              totalCount={manufacturersList.length}
              selectedItem={selectedMfg}
              onSelectItem={(m) => setSelectedMfg(m)}
              sortState={sortState}
              onSort={handleSort}
              emptyMessage="No matching manufacturers found."
              entityName="manufacturers"
              onImport={() =>
                alert("Manufacturer import functionality is a stub.")
              }
              onExport={() => {
                const headers = [
                  "Name",
                  "City",
                  "State/Province",
                  "Country",
                  "Phone",
                  "Website",
                ];
                const rows = processedManufacturers.map((m) => [
                  m.name,
                  m.city || "N/A",
                  m.stateOrProvince || "N/A",
                  m.country || "N/A",
                  m.phoneNumber || "N/A",
                  m.webPageUrl || "N/A",
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
                  `manufacturers_export_${new Date().toISOString().slice(0, 10)}.csv`,
                );
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            />
          ) : (
            <div className="cards-grid">
              {processedManufacturers.length === 0 ? (
                <div className="empty-state">
                  No matching manufacturers found.
                </div>
              ) : (
                processedManufacturers.map((m) => (
                  <ManufacturerCard
                    key={m.id}
                    item={m}
                    isSelected={selectedMfg?.id === m.id}
                    onClick={() => setSelectedMfg(m)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT 1/3: DETAILS COLUMN VIA DEDICATED MANUFACTURERDETAILS COMPONENT */}
      <ManufacturerDetails
        manufacturer={selectedMfg}
        relatedProducts={relatedProducts}
        onEdit={startEditMfg}
        onDelete={handleDeleteMfg}
        onAddNew={startAddMfg}
      />

      {/* Manufacturer Modal */}
      <ManufacturerForm
        isOpen={showMfgModal}
        onClose={() => setShowMfgModal(false)}
        currentId={isEditMode && selectedMfg ? selectedMfg.id : null}
        onSaved={(saved) => {
          setSelectedMfg(saved);
        }}
      />
    </div>
  );
}
