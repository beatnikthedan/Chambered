import React from "react";

export default function ArmoryItemCard({
  item,
  onSelect,
}) {
  if (!item) return null;

  const imageUrl = item.imageUrl ? (
    <img
      src={item.imageUrl}
      alt={item.name || "Armory Item"}
      style={{
        width: "100%",
        height: "auto",
        maxHeight: "150px",
        objectFit: "cover",
        borderRadius: "12px",
        marginTop: "16px",
      }}
    />
  ) : null;

  const estimatedValueDisplay = item.estimatedValue ? (
    <span style={{ color: "#fbbf24", fontWeight: 700 }}>
      ${item.estimatedValue.toLocaleString()}
    </span>
  ) : null;

  const purchasePriceDisplay = item.purchasePrice ? (
    <span style={{ color: "#7e879b", fontSize: "0.75rem" }}>
      Purchased: ${item.purchasePrice.toLocaleString()}
    </span>
  ) : null;

  return (
    <div
      onClick={() => onSelect?.(item)}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "480px",
        backgroundColor: "#181920",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #292c39",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#d1d6e3",
        cursor: onSelect ? "pointer" : "default",
        transition: "all 0.2s ease",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#d9ac3a",
            flex: 1,
            paddingRight: "16px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name || "Unnamed Item"}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#10B981",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }}></span>
          IN STOCK
        </div>
      </div>

      {(item.description || item.condition) && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          {item.description && (
            <span
              style={{
                backgroundColor: "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "0.8rem",
                flex: 1,
              }}
            >
              {item.description}
            </span>
          )}

          {item.condition && (
            <span
              style={{
                backgroundColor: "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "0.8rem",
                flex: 1,
              }}
            >
              Condition: {item.condition.name}
            </span>
          )}

          {purchasePriceDisplay && (
            <span
              style={{
                backgroundColor: "#1c1e27",
                border: "1px solid #292c39",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "0.8rem",
                flex: 1,
              }}
            >
              {purchasePriceDisplay}
            </span>
          )}
        </div>
      )}

      {imageUrl}

      {(item.product || estimatedValueDisplay) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid #292c39",
          }}
        >
          {item.product && (
            <div style={{ fontSize: "0.8rem", color: "#7e879b" }}>
              {item.product.manufacturer ? item.product.manufacturer.name + " - " : ""}
              {item.product.name || item.productId}
            </div>
          )}

          {estimatedValueDisplay && (
            <div
              style={{
                backgroundColor: "#374151",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Est. Value: {estimatedValueDisplay}
            </div>
          )}
        </div>
      )}
    </div>
  );
}