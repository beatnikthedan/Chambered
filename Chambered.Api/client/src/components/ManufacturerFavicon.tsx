import React from "react";
import { useGetManufacturersFaviconFromKey } from "../api/endpoints";

export interface ManufacturerFaviconProps {
  mfgId?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ManufacturerFavicon: React.FC<ManufacturerFaviconProps> = ({
  mfgId,
  size = 24,
  className = "",
  style = {},
}) => {
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

  const dimensionStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
    boxSizing: "border-box",
    ...style,
  };

  if (isLoading) {
    return (
      <span
        className={`mfg-favicon-placeholder loading ${className}`.trim()}
        style={{
          ...dimensionStyle,
          border: "2px solid rgba(0, 0, 0, 0.08)",
          borderTopColor: "var(--color-primary, #007bff)",
          backgroundColor: "transparent",
        }}
      />
    );
  }

  if (isError || !data?.data?.base64Data) {
    return (
      <span
        className={`mfg-favicon-placeholder text-icon ${className}`.trim()}
        style={{
          ...dimensionStyle,
          backgroundColor: "var(--bg-input, #e9ecef)",
          color: "var(--text-secondary, #495057)",
          fontSize: `${Math.max(10, Math.floor(size * 0.55))}px`,
          border: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
        }}
      >
        🏢
      </span>
    );
  }

  const { base64Data, contentType } = data.data;

  return (
    <img
      src={`data:${contentType};base64,${base64Data}`}
      alt="Logo"
      className={`mfg-favicon-img ${className}`.trim()}
      style={{
        ...dimensionStyle,
        objectFit: "contain",
        backgroundColor: "#fff",
        border: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
      }}
    />
  );
};

export default ManufacturerFavicon;
