import React from "react";

export interface VaultCardProps {
  title?: string;
  subtitle?: string | null;
  currentCount?: number;
  totalCount?: number;
  unit?: string;
  temp?: string;
  tempColor?: string;
  humidity?: string;
  humidityColor?: string;
  value?: string;
  statusText?: string;
  statusColor?: string;
  arsenalColor?: string;
  selected?: boolean;
  warningText?: string | null;
  onClick?: () => void;
}

export default function VaultCard({
  title = "Vault",
  subtitle,
  currentCount = 0,
  totalCount = 0,
  unit = "items",
  temp = "--",
  tempColor = "#10B981",
  humidity = "--",
  humidityColor = "#10B981",
  value = "--",
  statusText = "ONLINE",
  statusColor = "#10B981",
  arsenalColor = "#d9ac3a",
  selected = false,
  warningText = null,
  onClick,
}: VaultCardProps) {
  const safeCurrent = Number(currentCount) || 0;
  const safeTotal = Number(totalCount) || 1;
  const fillPercentage = Math.min(
    100,
    Math.max(0, (safeCurrent / safeTotal) * 100),
  );
  const deselectedBorderColor = arsenalColor.startsWith("#")
    ? `${arsenalColor}CC`
    : arsenalColor;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "480px",
        backgroundColor: selected ? "#1f2937" : "#181920",
        borderRadius: "16px",
        overflow: "hidden",
        border: selected
          ? `2px solid ${arsenalColor}`
          : `1px solid ${deselectedBorderColor}`,
        borderLeft: selected
          ? `12px solid ${arsenalColor}`
          : `1px solid ${deselectedBorderColor}`,
        boxShadow: selected ? `-4px 0 16px -2px ${arsenalColor}66` : "none",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#d1d6e3",
        boxSizing: "border-box",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.4rem",
              fontWeight: 700,
              color: arsenalColor,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                margin: "6px 0 0 0",
                fontSize: "0.85rem",
                color: "#7e879b",
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
            gap: "8px",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: statusColor,
            letterSpacing: "0.8px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: statusColor,
            }}
          ></span>
          {statusText}
        </div>
      </div>

      {selected && (
        <section>
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "8px",
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
              <span style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                <strong style={{ color: "#d1d6e3" }}>{safeCurrent}</strong>
                <span style={{ color: "#7e879b" }}> / </span>
                <strong style={{ color: "#d1d6e3" }}>{safeTotal}</strong>
                <span
                  style={{
                    color: "#7e879b",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {" "}
                  {unit}
                </span>
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: selected ? "#374151" : "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "10px",
                padding: "12px",
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
                backgroundColor: selected ? "#374151" : "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "10px",
                padding: "12px",
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
                backgroundColor: selected ? "#374151" : "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "10px",
                padding: "12px",
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

          {warningText && (
            <div
              style={{
                marginTop: "16px",
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
