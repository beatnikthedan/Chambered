import React from "react";
import type { Manufacturer } from "../api/models/manufacturer";
import ManufacturerFavicon from "../components/ManufacturerFavicon";

export default function ManufacturerCard({
  item,
  isSelected,
  onClick,
}: ManufacturerCardProps) {
  const locationText =
    [item.city, item.stateOrProvince, item.country]
      .filter(Boolean)
      .join(", ") || "No location info";

  return (
    <div
      className={`catalog-list-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      style={{
        transition: "all 0.2s ease-in-out",
      }}
    >
      <span className="card-badge">{item.country || "Manufacturer"}</span>
      <span className="mfg-tag">ID #{item.id}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "6px",
          marginBottom: "4px",
        }}
      >
        <ManufacturerFavicon mfgId={item.id} />
        <h4 style={{ margin: 0 }}>{item.name}</h4>
      </div>
      <span className="sku-part-info">📍 {locationText}</span>
      <p className="card-desc-preview" style={{ marginTop: "6px" }}>
        {item.phoneNumber ? `📞 ${item.phoneNumber}` : ""}
        {item.phoneNumber && item.webPageUrl ? " | " : ""}
        {item.webPageUrl ? `🌐 ${item.webPageUrl}` : ""}
      </p>
    </div>
  );
}
