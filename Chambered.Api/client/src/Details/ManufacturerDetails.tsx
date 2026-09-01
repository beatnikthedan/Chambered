import React from "react";
import type { Manufacturer } from "../api/models/manufacturer";
import { useGetManufacturersFaviconFromKey } from "../api/endpoints";
import { ExtendedProduct } from "./ProductDetails";

export interface ManufacturerDetailsProps {
  manufacturer: Manufacturer | null;
  relatedProducts: ExtendedProduct[];
  onEdit: () => void;
  onDelete: () => void;
  onAddNew: () => void;
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

export default function ManufacturerDetails({
  manufacturer,
  relatedProducts,
  onEdit,
  onDelete,
  onAddNew,
}: ManufacturerDetailsProps) {
  return (
    <div className="right-pane-column">
      {/* TOP PANEL: PRIMARY SELECTED META DETAILS */}
      <div className="detail-panel">
        {!manufacturer ? (
          <div className="empty-detail-state">
            <span className="icon">🏢</span>
            <h3>No Manufacturer Selected</h3>
            <p>Select a manufacturer on the left to inspect details.</p>
            <button
              type="button"
              className="add-master-btn"
              onClick={onAddNew}
            >
              + Add Manufacturer
            </button>
          </div>
        ) : (
          <div className="detail-view-container">
            <div className="detail-panel-header">
              <span className="type-badge-pill">ID #{manufacturer.id}</span>
              <div className="header-actions">
                <button
                  type="button"
                  className="btn btn-secondary edit-btn"
                  onClick={onEdit}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn delete-btn"
                  onClick={onDelete}
                >
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
                  marginBottom: "8px",
                }}
              >
                <ManufacturerFavicon mfgId={manufacturer.id} />
                <h2 style={{ margin: 0 }}>{manufacturer.name}</h2>
              </div>

              <div className="detail-section" style={{ marginTop: "16px" }}>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Street Address</span>
                    <span className="detail-value">
                      {manufacturer.streetAddress || "—"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">City</span>
                    <span className="detail-value">
                      {manufacturer.city || "—"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">State / Province</span>
                    <span className="detail-value">
                      {manufacturer.stateOrProvince || "—"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Postal Code</span>
                    <span className="detail-value">
                      {manufacturer.postalCode || "—"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Country</span>
                    <span className="detail-value">
                      {manufacturer.country || "—"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-value">
                      {manufacturer.phoneNumber ? (
                        <a href={`tel:${manufacturer.phoneNumber}`}>
                          {manufacturer.phoneNumber}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {manufacturer.webPageUrl && (
                <div className="detail-section" style={{ marginTop: "12px" }}>
                  <div className="detail-grid">
                    <div className="detail-item full-width">
                      <span className="detail-label">Website URL</span>
                      <span className="detail-value">
                        <a
                          href={manufacturer.webPageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="external-site-link"
                        >
                          🌐 Open Official Website
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM PANEL: RELATED PRODUCTS */}
      <div className="detail-panel">
        {!manufacturer ? (
          <div className="empty-detail-state">
            <span className="icon">📦</span>
            <h3>No Manufacturer Selected</h3>
            <p>Select a manufacturer to inspect associated product models.</p>
          </div>
        ) : (
          <div className="detail-view-container">
            <div className="detail-panel-header">
              <h3>Catalog Products ({relatedProducts.length})</h3>
            </div>
            <div className="detail-view-body" style={{ padding: 0 }}>
              {relatedProducts.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 16px" }}>
                  No catalog products linked to this manufacturer.
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
          </div>
        )}
      </div>
    </div>
  );
}
