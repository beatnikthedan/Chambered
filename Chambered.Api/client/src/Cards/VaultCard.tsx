import React from "react";
import type { Vault } from "../api/models/vault";

export interface VaultCardProps {
  item?: Vault & {
    product?: any;
    arsenal?: any;
    armoryItems?: any[];
    storedItems?: any[];
    [key: string]: any;
  };
  isSelected?: boolean;
  onClick?: () => void;
  // Optional explicit overrides
  title?: string;
  subtitle?: string | null;
  currentCount?: number;
  totalCount?: number;
  unit?: string;
  temp?: string | number;
  tempColor?: string;
  humidity?: string | number;
  humidityColor?: string;
  value?: string | number;
  statusText?: string;
  statusColor?: string;
  arsenalColor?: string;
  warningText?: string | null;
}

export default function VaultCard(props: VaultCardProps) {
  const {
    item,
    isSelected = false,
    onClick,
  } = props;

  // Resolve values from item or direct props
  const arsenalColor =
    props.arsenalColor ||
    item?.arsenal?.colorHex ||
    "#d9ac3a";

  const title =
    props.title ||
    item?.name ||
    "Vault";

  const rawArmoryItems = item?.armoryItems || item?.storedItems || [];
  const safeCurrent =
    props.currentCount !== undefined
      ? props.currentCount
      : rawArmoryItems.length;

  const safeTotal =
    props.totalCount !== undefined
      ? props.totalCount
      : ((item as any)?.capacity || (item?.product as any)?.capacity || 12);

  const fillPercentage = Math.min(
    100,
    Math.max(0, (safeCurrent / (safeTotal || 1)) * 100),
  );

  const unit = props.unit || "items";

  // Subtitle pieces: Description / location, Manufacturer + Model, Lock Type
  let subtitle = props.subtitle;
  if (subtitle === undefined && item) {
    const parts: string[] = [];
    if (item.description) parts.push(item.description);
    if (item.product) {
      const prodName = `${item.product.manufacturer?.name ? `${item.product.manufacturer.name} ` : ""}${item.product.name}`;
      parts.push(prodName);
      if ((item.product as any).lockType) {
        parts.push((item.product as any).lockType);
      }
    }
    subtitle = parts.join(" · ") || null;
  }

  // Telemetry metrics
  const temp = props.temp ?? (item?.temperature !== undefined ? item.temperature : (isSelected ? "68" : "--"));
  const humidity = props.humidity ?? (item?.humidity !== undefined ? item.humidity : (isSelected ? (item?.targetMaxHumidityPercent || "44") : "--"));

  const calculatedValue = React.useMemo(() => {
    if (props.value !== undefined) return String(props.value);
    if (!rawArmoryItems || rawArmoryItems.length === 0) return "0";
    const total = rawArmoryItems.reduce(
      (sum: number, it: any) =>
        sum + (Number(it.estimatedValue ?? it.purchasePrice) || 0),
      0,
    );
    if (total >= 1000) {
      return `${(total / 1000).toFixed(total % 1000 === 0 ? 0 : 1)}k`;
    }
    return String(total);
  }, [props.value, rawArmoryItems]);

  const value = calculatedValue;

  // Status & Warning
  const isHighHumidity =
    Number(humidity) > 60 ||
    (item?.targetMaxHumidityPercent && Number(humidity) > item.targetMaxHumidityPercent);

  const statusText =
    props.statusText ||
    (isHighHumidity ? "RH HIGH" : "ONLINE");

  const statusColor =
    props.statusColor ||
    (statusText === "ONLINE" || statusText === "NORMAL" ? "#10B981" : "#F97316");

  const tempColor = props.tempColor || "#10B981";
  const humidityColor = props.humidityColor || (isHighHumidity ? "#F97316" : "#10B981");

  const warningText =
    props.warningText !== undefined
      ? props.warningText
      : (isHighHumidity
          ? "Above target humidity — inspect dehumidifier"
          : null);

  const deselectedBorderColor = arsenalColor.startsWith("#")
    ? `${arsenalColor}44`
    : "#292c39";

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: isSelected ? "#1f2937" : "#181920",
        borderRadius: "14px",
        overflow: "hidden",
        border: isSelected
          ? `2px solid ${arsenalColor}`
          : `1px solid ${deselectedBorderColor}`,
        borderLeft: isSelected
          ? `10px solid ${arsenalColor}`
          : `1px solid ${deselectedBorderColor}`,
        boxShadow: isSelected ? `-4px 0 16px -2px ${arsenalColor}55` : "none",
        padding: "20px 22px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#d1d6e3",
        boxSizing: "border-box",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header Row: Title & Status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: isSelected ? "16px" : "0",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.3rem",
              fontWeight: 700,
              color: isSelected ? arsenalColor : "#ffffff",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                margin: "5px 0 0 0",
                fontSize: "0.85rem",
                color: "#7e879b",
                lineHeight: "1.3",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: statusColor,
            letterSpacing: "0.8px",
            flexShrink: 0,
            marginLeft: "12px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: statusColor,
            }}
          />
          {statusText}
        </div>
      </div>

      {/* Selected telemetry expansion */}
      {isSelected && (
        <section style={{ marginTop: "18px" }}>
          {/* Capacity Progress */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "1.2px",
                  color: "#7e879b",
                }}
              >
                CAPACITY
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "0.88rem" }}>
                <strong style={{ color: "#ffffff" }}>{safeCurrent}</strong>
                <span style={{ color: "#7e879b" }}> / </span>
                <strong style={{ color: "#ffffff" }}>{safeTotal}</strong>
                <span
                  style={{
                    color: "#7e879b",
                    fontFamily: "system-ui, sans-serif",
                    marginLeft: "4px",
                  }}
                >
                  {unit}
                </span>
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "7px",
                backgroundColor: "#222530",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fillPercentage}%`,
                  height: "100%",
                  backgroundColor: arsenalColor,
                  borderRadius: "999px",
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>

          {/* Metric Chips (Temp, RH, Value) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            <div
              style={{
                backgroundColor: "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "10px",
                padding: "10px 6px",
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              <span style={{ color: "#7e879b" }}>Temp </span>
              <span style={{ color: tempColor, fontWeight: 700 }}>{temp} </span>
              <span style={{ color: "#7e879b" }}>°F</span>
            </div>
            <div
              style={{
                backgroundColor: "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "10px",
                padding: "10px 6px",
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              <span style={{ color: "#7e879b" }}>RH </span>
              <span style={{ color: humidityColor, fontWeight: 700 }}>
                {humidity}%
              </span>
            </div>
            <div
              style={{
                backgroundColor: "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "10px",
                padding: "10px 6px",
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              <span style={{ color: "#7e879b" }}>Value </span>
              <span style={{ color: arsenalColor, fontWeight: 700 }}>
                ${value}
              </span>
            </div>
          </div>

          {/* Contextual Warning */}
          {warningText && (
            <div
              style={{
                marginTop: "14px",
                backgroundColor: "#2b1d16",
                border: "1px solid #f9731644",
                color: "#f97316",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "0.85rem",
                lineHeight: "1.4",
              }}
            >
              {warningText}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
