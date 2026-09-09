import React from "react";
import { useSecureImage } from "../components/SecureImage";
import type { ArmoryItem } from "../api/models/armoryItem";

export interface ExtendedArmoryItem extends ArmoryItem {
  itemType?: string;
  manufacturer?: string;
  model?: string;
  caliber?: string;
  actionType?: string;
  storageLocation?: string;
  arsenalColor?: string;
  arsenalName?: string;
  partNumber?: string;
  serialNumber?: string;
  roundCount?: number;
  accessories?: ExtendedArmoryItem[];
  [key: string]: any;
}

export interface ArmoryItemCardProps {
  item: ExtendedArmoryItem;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ArmoryItemCard({
  item,
  isSelected = false,
  onClick,
}: ArmoryItemCardProps) {
  const coverUrl = item.coverImageId
    ? `/api/v1/ArmoryItemDocuments/${item.coverImageId}/Download`
    : item.product?.coverImageId
      ? `/api/v1/ProductDocuments/${item.product.coverImageId}/Download`
      : null;

  const blobUrl = useSecureImage(coverUrl);

  const conditionName =
    typeof item.condition === "object" && item.condition
      ? (item.condition as any).name || "Good"
      : typeof item.condition === "string"
        ? item.condition
        : "Good";

  const getConditionClass = (cond?: string | null) => {
    if (!cond) return "badge-success";
    const c = cond.toLowerCase();
    if (c.includes("unfired") || c.includes("excel") || c.includes("very"))
      return "badge-success";
    if (c.includes("good") || c.includes("fair")) return "badge-warning";
    return "badge-danger";
  };

  const itemType = item.itemType || "ArmoryItem";
  const displayType = itemType.replace("ArmoryItem", "").replace("Item", "") || item.product?.productType || "Item";

  const formattedValue = item.estimatedValue
    ? `$${Number(item.estimatedValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : item.purchasePrice
      ? `$${Number(item.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null;

  const mfgName = item.manufacturer || item.product?.manufacturer?.name || "";
  const modelName = item.name || item.model || item.product?.name || "Armory Item";

  const arsenalColor = item.arsenal?.colorHex || item.arsenalColor || "var(--color-primary)";
  const hasArsenal = Boolean(item.arsenal || item.arsenalColor);
  const deselectedBorderColor = hasArsenal && arsenalColor.startsWith("#")
    ? `${arsenalColor}44`
    : "var(--border-color)";

  return (
    <div
      className={`catalog-list-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      style={{
        backgroundImage: blobUrl
          ? `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.88)), url(${blobUrl})`
          : undefined,
        backgroundColor: isSelected ? "var(--bg-selected)" : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
        border: isSelected
          ? `2px solid ${arsenalColor}`
          : `1px solid ${deselectedBorderColor}`,
        borderLeft: isSelected
          ? `10px solid ${arsenalColor}`
          : `1px solid ${deselectedBorderColor}`,
        boxShadow: isSelected ? `-4px 0 16px -2px ${arsenalColor}55` : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="card-badge">{displayType}</span>
        {item.arsenal && (
          <span
            className="type-badge-pill"
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              backgroundColor: `${item.arsenal.colorHex || "var(--color-primary)"}22`,
              color: item.arsenal.colorHex || "var(--color-primary)",
              border: `1px solid ${item.arsenal.colorHex || "var(--color-primary)"}55`,
            }}
          >
            {item.arsenal.name}
          </span>
        )}
      </div>

      {mfgName && <span className="mfg-tag">{mfgName}</span>}
      <h4>{modelName}</h4>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", margin: "4px 0" }}>
        {item.serialNumber && (
          <span className="text-mono" style={{ fontSize: "12px", color: "var(--color-primary)" }}>
            SN: {item.serialNumber}
          </span>
        )}
        {item.caliber && (
          <span className="text-mono text-muted" style={{ fontSize: "12px" }}>
            {item.caliber}
          </span>
        )}
        {item.storageLocation && (
          <span className="text-muted" style={{ fontSize: "12px" }}>
            {item.storageLocation}
          </span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
        <span className={`status-pill ${getConditionClass(conditionName)}`} style={{ fontSize: "11px" }}>
          {conditionName}
        </span>
        {formattedValue && (
          <span style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "13px" }}>
            {formattedValue}
          </span>
        )}
      </div>
    </div>
  );
}
