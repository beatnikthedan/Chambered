import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import "./Manufacturers.css";
import ManufacturerForm from "../ModelForms/ManufacturerForm";

import {
  useGetManufacturers,
  useDeleteManufacturersFromKey,
  useGetManufacturersFaviconFromKey,
  useGetProducts,
} from "../api/endpoints";
import type { Manufacturer } from "../api/models/manufacturer";
import type { Product } from "../api/models/product";

interface ExtendedProduct extends Omit<Product, "productType"> {
  productType: string;
  manufacturerName: string;
  caliberName: string;
  [key: string]: any;
}

const ManufacturerFavicon = ({ mfgId }: { mfgId?: number }) => {
  const { data, isLoading, isError } = useGetManufacturersFaviconFromKey(
    mfgId || 0,
    undefined,
    {
      query: {
        retry: false,
        staleTime: 24 * 60 * 60 * 1000,
        enabled: !!mfgId,
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

export default function Manufacturers() {
  const queryClient = useQueryClient();
  const store = useStore();

  const {
    data: manufacturersData,
    isLoading: mfgsLoading,
    error: mfgsError,
  } = useGetManufacturers();

  const {
    data: productsData,
    isLoading: productsLoading,
  } = useGetProducts({
    expand: "manufacturer",
  });

  // Selected records
  const [selectedMfg, setSelectedMfg] = useState<Manufacturer | null>(null);

  // Layout View Modes ("table" or "card")
  const [mfgViewMode, setMfgViewMode] = useState<"table" | "card">("table");

  // Interaction State (Modal overlays replace inline isEditing)
  const [showMfgModal, setShowMfgModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Search & Sorting popovers active states
  const [showMfgSortPopover, setShowMfgSortPopover] = useState<boolean>(false);

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

  // References for clicks outside popovers
  const mfgSortRef = useRef<HTMLDivElement | null>(null);

  // Manufacturers search/sort
  const [mfgSearchTerm, setMfgSearchTerm] = useState<string>("");
  const [mfgSortKey, setMfgSortKey] = useState<string>("name");
  const [mfgSortDirection, setMfgSortDirection] = useState<"asc" | "desc">("asc");

  // Handle outside clicks for popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        mfgSortRef.current &&
        !mfgSortRef.current.contains(e.target as Node)
      ) {
        setShowMfgSortPopover(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Process and sort manufacturers list
  const processedManufacturers = useMemo(() => {
    let result = [...manufacturersList];

    // Search filter
    if (mfgSearchTerm.trim() !== "") {
      const search = mfgSearchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.name!.toLowerCase().includes(search) ||
          (m.city && m.city.toLowerCase().includes(search)) ||
          (m.country && m.country.toLowerCase().includes(search)),
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (mfgSortKey === "name") {
        valA = a.name!.toLowerCase();
        valB = b.name!.toLowerCase();
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
    if (!selectedMfg && processedManufacturers.length > 0) {
      setSelectedMfg(processedManufacturers[0]);
    }
  }, [processedManufacturers, selectedMfg]);

  // Sync selectedMfg with the fresh data from the list
  useEffect(() => {
    if (selectedMfg && processedManufacturers.length > 0) {
      const freshMfg = processedManufacturers.find(
        (m) => m.id === selectedMfg.id,
      );
      if (freshMfg) {
        if (freshMfg !== selectedMfg) {
          setSelectedMfg(freshMfg);
        }
      } else {
        setSelectedMfg(processedManufacturers[0] || null);
      }
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

  // Switch right panel to editing mode with a blank manufacturer
  const startAddMfg = () => {
    setIsEditMode(false);
    setShowMfgModal(true);
  };

  // Switch right panel to editing mode with selected manufacturer
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
        <div className="view-actions-row">
          {/* SEARCH BAR */}
          <div className="search-filters-group">
            <input
              type="text"
              placeholder="Search by manufacturer name, city or country..."
              className="search-input"
              value={mfgSearchTerm}
              onChange={(e) => setMfgSearchTerm(e.target.value)}
            />
          </div>

          {/* VIEW SWITCHER & ADD BUTTONS */}
          <div className="actions-right-group">
            <div className="view-mode-toggle">
              <button
                className={`toggle-icon-btn ${mfgViewMode === "table" ? "active" : ""}`}
                onClick={() => setMfgViewMode("table")}
                title="Table View"
              >
                List
              </button>
              <button
                className={`toggle-icon-btn ${mfgViewMode === "card" ? "active" : ""}`}
                onClick={() => setMfgViewMode("card")}
                title="Card View"
              >
                Cards
              </button>
            </div>

            <button className="add-master-btn" onClick={startAddMfg}>
              Add Manufacturer
            </button>
          </div>
        </div>

        {/* MASTER LIST CONTENT CONTAINER */}
        <div className="master-list-scroller">
          {processedManufacturers.length === 0 ? (
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

      {/* RIGHT 1/3: DETAILS COLUMN WITH DUAL TILED MASTER-DETAIL VIEW */}
      <div className="right-pane-column">
        {/* TOP PANEL: MANUFACTURERS DETAIL PANEL */}
        <div className="detail-panel">
          {!selectedMfg ? (
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
          ) : (
            <div className="detail-view-container">
              <div className="detail-panel-header">
                <h3>Manufacturer Details</h3>
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <ManufacturerFavicon mfgId={selectedMfg.id} />
                  <h2 style={{ margin: 0 }}>{selectedMfg.name}</h2>
                </div>

                <div
                  className="mfg-contact-details"
                  style={{ fontSize: "14px", lineHeight: "1.6" }}
                >
                  {selectedMfg.webPageUrl && (
                    <p style={{ margin: "6px 0" }}>
                      <strong>Website:</strong>{" "}
                      <a
                        href={selectedMfg.webPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "var(--primary-color)",
                          textDecoration: "none",
                        }}
                      >
                        {selectedMfg.webPageUrl}
                      </a>
                    </p>
                  )}
                  {selectedMfg.phoneNumber && (
                    <p style={{ margin: "6px 0" }}>
                      <strong>Phone:</strong> {selectedMfg.phoneNumber}
                    </p>
                  )}
                  {(selectedMfg.streetAddress ||
                    selectedMfg.city ||
                    selectedMfg.stateOrProvince ||
                    selectedMfg.postalCode ||
                    selectedMfg.country) && (
                    <p style={{ margin: "12px 0 6px 0" }}>
                      <strong>Corporate Headquarters:</strong>
                      <br />
                      <span style={{ color: "var(--text-muted)" }}>
                        {selectedMfg.streetAddress && (
                          <>
                            {selectedMfg.streetAddress}
                            <br />
                          </>
                        )}
                        {selectedMfg.city}
                        {selectedMfg.stateOrProvince
                          ? `, ${selectedMfg.stateOrProvince}`
                          : ""}{" "}
                        {selectedMfg.postalCode}
                        {selectedMfg.country && (
                          <>
                            <br />
                            {selectedMfg.country}
                          </>
                        )}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM PANEL: RELATED PRODUCTS BY MANUFACTURER */}
        <div className="detail-panel">
          {!selectedMfg ? (
            <div className="empty-detail-state">
              <span className="icon">📦</span>
              <h3>No Manufacturer Selected</h3>
              <p>Select a manufacturer to inspect registered product models.</p>
            </div>
          ) : (
            <div className="detail-view-container">
              <div className="detail-panel-header">
                <h3>Products by {selectedMfg.name}</h3>
              </div>

              {relatedProducts.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 0" }}>
                  No products registered for this manufacturer.
                </div>
              ) : (
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Model Name</th>
                      <th>Part Number</th>
                      <th>Class Type</th>
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
                        <td className="bold-name-cell">
                          {p.partNumber || "—"}
                        </td>
                        <td>
                          <span
                            className={`type-badge ${p.productType.toLowerCase()}`}
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
          )}
        </div>
      </div>

      {/* Manufacturer Modal */}
      <ManufacturerForm
        isOpen={showMfgModal}
        onClose={() => setShowMfgModal(false)}
        currentId={isEditMode && selectedMfg ? selectedMfg.id : null}
        onSaved={(saved) => {
          setSelectedMfg(saved);
          setShowMfgModal(false);
        }}
      />
    </div>
  );
}
