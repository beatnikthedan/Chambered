import React from "react";
import { PRODUCT_STATIC_KEYS } from "../types/productSchema";
import type { Product } from "../api/models/product";

export interface ExtendedProduct extends Omit<Product, "productType"> {
  productType: string;
  manufacturerName: string;
  caliberName: string;
  [key: string]: any;
}

export interface ProductDetailsProps {
  product: ExtendedProduct | null;
  onEdit: () => void;
  onDelete: () => void;
  onAddNew: () => void;
}

const extractSpecifications = (product: any): Record<string, any> => {
  if (!product) return {};
  const specs: Record<string, any> = {};
  Object.keys(product).forEach((key) => {
    if (
      !PRODUCT_STATIC_KEYS.has(key) &&
      ![
        "manufacturer",
        "caliber",
        "productDocuments",
        "armoryItems",
        "coverImage",
        "manufacturerName",
        "caliberName",
      ].includes(key) &&
      !key.startsWith("@odata.") &&
      !key.startsWith("odata.")
    ) {
      specs[key] = product[key];
    }
  });
  return specs;
};

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

export default function ProductDetails({
  product,
  onEdit,
  onDelete,
  onAddNew,
}: ProductDetailsProps) {
  return (
    <div className="right-pane-column">
      {/* TOP PANEL: PRIMARY SELECTED META DETAILS */}
      <div className="detail-panel">
        {!product ? (
          <div className="empty-detail-state">
            <span className="icon">📦</span>
            <h3>No Product Selected</h3>
            <p>
              Select a product from the list on the left, or add a brand-new
              entry.
            </p>
            <button className="add-master-btn" onClick={onAddNew}>
              + Add Product
            </button>
          </div>
        ) : (
          <div className="detail-view-container">
            <div className="detail-panel-header">
              <span className="type-badge-pill">{product.productType}</span>
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
              <span className="detail-mfg">{product.manufacturerName}</span>
              <h2>{product.name}</h2>
              <div className="text-mono detail-pn-sku">
                <span>Part No: {product.partNumber || "None"}</span>
                <span>SKU: {product.sku || "None"}</span>
              </div>

              <p className="detail-desc">
                {product.description ||
                  "No model description loaded for this product catalog asset."}
              </p>

              {product.webPageUrl && (
                <a
                  href={product.webPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="external-site-link"
                >
                  🌐 Open Official Website
                </a>
              )}

              <hr className="detail-divider" />

              {/* Subclass Specs Detail Block */}
              {product.productType !== "Product" && (
                <div className="details-specs-block">
                  <h3>Technical Details</h3>
                  <p className="sub-specs-text">
                    {renderSubAttributesText(product)}
                  </p>
                </div>
              )}

              {/* Specifications Key-Value Details */}
              {(() => {
                const specs = extractSpecifications(product);
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
        {!product ? (
          <div className="empty-detail-state">
            <span className="icon">🛡️</span>
            <h3>No Product Selected</h3>
            <p>Select a product model to inspect physical armory inventory.</p>
          </div>
        ) : (
          <div className="detail-view-container">
            <div className="detail-panel-header">
              <h3>Related Physical Items</h3>
            </div>
            {/* Future armory items integration */}
          </div>
        )}
      </div>
    </div>
  );
}
