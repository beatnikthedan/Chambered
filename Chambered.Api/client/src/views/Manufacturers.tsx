import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import "./Manufacturers.css";
import SubmitButton from "../components/SubmitButton";

import {
  useGetManufacturers,
  usePostManufacturers,
  usePutManufacturersFromKey,
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

interface MfgForm {
  id: number;
  name: string;
  webPageUrl: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

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

  const [mfgForm, setMfgForm] = useState<MfgForm>({
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

  const createMfgMutation = usePostManufacturers({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Manufacturers"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
        if (res?.data) {
          const newMfg = res.data;
          setSelectedMfg(newMfg);
          setMfgForm((prev) => ({
            ...prev,
            id: newMfg.id,
          }));
        }
      },
      onError: (err: any) => {
        alert(
          "Failed to create manufacturer: " + (err?.message || "Unknown error"),
        );
        setIsSaving(false);
      },
    },
  });

  const updateMfgMutation = usePutManufacturersFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Manufacturers"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
      },
      onError: (err: any) => {
        alert(
          "Failed to save manufacturer: " + (err?.message || "Unknown error"),
        );
        setIsSaving(false);
      },
    },
  });

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
    setShowMfgModal(true);
  };

  // Switch right panel to editing mode with selected manufacturer
  const startEditMfg = () => {
    if (!selectedMfg) return;
    setIsEditMode(true);
    setMfgForm({
      id: selectedMfg.id || 0,
      name: selectedMfg.name || "",
      webPageUrl: selectedMfg.webPageUrl || "",
      phoneNumber: selectedMfg.phoneNumber || "",
      streetAddress: selectedMfg.streetAddress || "",
      city: selectedMfg.city || "",
      stateOrProvince: selectedMfg.stateOrProvince || "",
      postalCode: selectedMfg.postalCode || "",
      country: selectedMfg.country || "",
    });
    setShowMfgModal(true);
  };

  const handleSaveMfg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfgForm.name.trim()) return;

    setIsSaving(true);
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
        await createMfgMutation.mutateAsync({ data: payload });
      }
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
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
                {saveSuccess && (
                  <div className="detail-save-toast">
                    ✓ Manufacturer updated successfully
                  </div>
                )}
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
      {showMfgModal && (
        <div className="modal-overlay" onClick={() => setShowMfgModal(false)}>
          <div
            className="armory-center-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title-bar">
              <div className="title-left">
                <span className="modal-title-icon">🏢</span>
                <h3>
                  {isEditMode
                    ? "Modify Manufacturer Record"
                    : "Add New Corporate Record"}
                </h3>
              </div>
              <button
                className="modal-close-x-btn"
                onClick={() => setShowMfgModal(false)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSaveMfg}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
                margin: 0,
              }}
            >
              <div
                className="modal-tabs-body-content"
                style={{ padding: "20px" }}
              >
                <div className="form-grid">
                  <div className="form-item full-row">
                    <label>Official Corporate Name</label>
                    <input
                      type="text"
                      value={mfgForm.name || ""}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, name: e.target.value })
                      }
                      placeholder="e.g. Glock Ges.m.b.H."
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label>Company Website URL</label>
                    <input
                      type="url"
                      value={mfgForm.webPageUrl || ""}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, webPageUrl: e.target.value })
                      }
                      placeholder="https://glock.com"
                    />
                  </div>

                  <div className="form-item">
                    <label>Support Phone Number</label>
                    <input
                      type="tel"
                      value={mfgForm.phoneNumber || ""}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, phoneNumber: e.target.value })
                      }
                      placeholder="e.g. +1 770-432-1202"
                    />
                  </div>

                  <div className="form-item full-row">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={mfgForm.streetAddress || ""}
                      onChange={(e) =>
                        setMfgForm({
                          ...mfgForm,
                          streetAddress: e.target.value,
                        })
                      }
                      placeholder="e.g. 6000 Highlands Parkway"
                    />
                  </div>

                  <div className="form-item">
                    <label>City</label>
                    <input
                      type="text"
                      value={mfgForm.city || ""}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, city: e.target.value })
                      }
                      placeholder="e.g. Smyrna"
                    />
                  </div>

                  <div className="form-item">
                    <label>State / Province</label>
                    <input
                      type="text"
                      value={mfgForm.stateOrProvince || ""}
                      onChange={(e) =>
                        setMfgForm({
                          ...mfgForm,
                          stateOrProvince: e.target.value,
                        })
                      }
                      placeholder="e.g. GA"
                    />
                  </div>

                  <div className="form-item">
                    <label>Postal / ZIP Code</label>
                    <input
                      type="text"
                      value={mfgForm.postalCode || ""}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, postalCode: e.target.value })
                      }
                      placeholder="e.g. 30082"
                    />
                  </div>

                  <div className="form-item">
                    <label>Country of Origin</label>
                    <input
                      type="text"
                      value={mfgForm.country || ""}
                      onChange={(e) =>
                        setMfgForm({ ...mfgForm, country: e.target.value })
                      }
                      placeholder="e.g. United States"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div
                className="modal-footer-row-container"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  padding: "16px 20px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMfgModal(false)}
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
