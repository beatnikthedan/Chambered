import React from "react";
import { SortState } from "./useMasterView";
import "./MasterView.css";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T) => React.ReactNode;
}

export interface SortableTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  totalCount?: number;
  selectedItem: T | null;
  onSelectItem: (item: T) => void;
  sortState?: SortState;
  onSort?: (column: string) => void;
  topSlot?: React.ReactNode;
  emptyMessage?: string;
  entityName?: string;
  onImport?: () => void;
  onExport?: () => void;
}

export default function SortableTable<T extends { id: number | string }>({
  columns,
  data,
  totalCount,
  selectedItem,
  onSelectItem,
  sortState,
  onSort,
  topSlot,
  emptyMessage = "No items found matching criteria.",
  entityName = "items",
  onImport,
  onExport,
}: SortableTableProps<T>) {
  return (
    <div className="sortable-table-wrapper">
      <div className="table-container">
        <table className="app-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortState?.column === col.key;
                const sortIcon = isSorted
                  ? sortState?.direction === "asc"
                    ? " ▲"
                    : " ▼"
                  : "";

                return (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      textAlign: col.align || "left",
                      cursor: col.sortable !== false ? "pointer" : "default",
                      userSelect: "none",
                    }}
                    onClick={() => {
                      if (col.sortable !== false && onSort) {
                        onSort(col.key);
                      }
                    }}
                  >
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="sort-icon">{sortIcon}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {topSlot}
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: "center", padding: "32px 16px" }}
                >
                  <span className="empty-table-text">{emptyMessage}</span>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`table-row-item ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => onSelectItem(item)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || "left" }}
                      >
                        {col.render
                          ? col.render(item)
                          : (item as any)[col.key] !== undefined &&
                            (item as any)[col.key] !== null
                          ? String((item as any)[col.key])
                          : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer-row">
        <div>
          {data.length} of {totalCount ?? data.length} {entityName}
        </div>
        {(onImport || onExport) && (
          <div className="footer-actions">
            {onImport && (
              <button
                type="button"
                className="footer-btn"
                onClick={onImport}
              >
                Import
              </button>
            )}
            {onExport && (
              <button
                type="button"
                className="footer-btn"
                onClick={onExport}
              >
                Export
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
