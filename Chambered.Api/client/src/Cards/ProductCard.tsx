import React from "react";
import { useSecureImage } from "../components/SecureImage";
import type { Product } from "../api/models/product";

// export interface ExtendedProduct extends Omit<Product, "productType"> {
//   productType: string;
//   manufacturerName: string;
//   caliberName: string;
//   [key: string]: any;
// }

export interface ProductCardProps {
  item: Product;
  isSelected: boolean;
  onClick: () => void;
}

export default function ProductCard({
  item,
  isSelected,
  onClick,
}: ProductCardProps) {
  const imageUrl = item.coverImageId
    ? `/api/v1/ProductDocuments/${item.coverImageId}/Download`
    : null;
  const blobUrl = useSecureImage(imageUrl);

  return (
    <div
      className={`catalog-list-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      style={{
        backgroundImage: blobUrl
          ? `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.85)), url(${blobUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <span className="card-badge">{item.productType}</span>
      <span className="mfg-tag">{item.manufacturer?.name}</span>
      <h4>{item.name}</h4>
      <span className="sku-part-info">
        PN: {item.partNumber || "None"} | SKU: {item.sku || "None"}
      </span>
      <p className="card-desc-preview">
        {item.description || "No model description loaded."}
      </p>
    </div>
  );
}
