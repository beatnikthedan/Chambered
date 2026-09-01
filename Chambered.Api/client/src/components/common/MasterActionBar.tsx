import React, { useState, useRef, useEffect } from "react";
import { FilterGroupConfig } from "./useMasterView";
import "./MasterView.css";

export interface MasterActionBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroupConfig[];
  selectedFilters?: Record<string, string[]>;
  onToggleFilter?: (groupId: string, value: string) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
  viewMode?: "table" | "card";
  onViewModeChange?: (mode: "table" | "card") => void;
  showViewToggle?: boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
}

export default function MasterActionBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search items...",
  filterGroups = [],
  selectedFilters = {},
  onToggleFilter,
  onClearFilters,
  activeFilterCount = 0,
  viewMode = "table",
  onViewModeChange,
  showViewToggle = true,
  onAddNew,
  addNewLabel = "+ Add Item",
}: MasterActionBarProps) {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowFilterPopover(false);
      }
    };

    if (showFilterPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterPopover]);

  return (
    <div className="master-action-bar">
      <div className="master-action-bar-left">
        {/* Search Bar */}
        <div className="master-search-container">
          <input
            type="text"
            className="master-search-input"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="master-search-clear"
              onClick={() => onSearchChange("")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Popover Dropdown */}
        {filterGroups.length > 0 && (
          <div className="master-filter-container" ref={popoverRef}>
            <button
              type="button"
              className={`master-filter-btn ${
                activeFilterCount > 0 ? "active" : ""
              }`}
              onClick={() => setShowFilterPopover(!showFilterPopover)}
            >
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="master-filter-badge">{activeFilterCount}</span>
              )}
            </button>

            {showFilterPopover && (
              <div className="master-filter-popover">
                <div className="master-filter-popover-header">
                  <span>Filter Options</span>
                  {activeFilterCount > 0 && onClearFilters && (
                    <button
                      type="button"
                      className="master-filter-clear-link"
                      onClick={onClearFilters}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="master-filter-popover-body">
                  {filterGroups.map((group) => (
                    <div key={group.id} className="master-filter-group">
                      <div className="master-filter-group-title">
                        {group.label}
                      </div>
                      <div className="master-filter-group-options">
                        {group.options.map((option) => {
                          const isChecked = (
                            selectedFilters[group.id] || []
                          ).includes(option.value);
                          return (
                            <label
                              key={option.value}
                              className="master-filter-checkbox-label"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  onToggleFilter &&
                                  onToggleFilter(group.id, option.value)
                                }
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="master-action-bar-right">
        {/* Table / Card View Mode Toggle with Icons */}
        {showViewToggle && onViewModeChange && (
          <div className="master-view-toggle">
            <button
              type="button"
              className={`master-toggle-btn ${
                viewMode === "table" ? "active" : ""
              }`}
              onClick={() => onViewModeChange("table")}
              title="List View"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
            <button
              type="button"
              className={`master-toggle-btn ${
                viewMode === "card" ? "active" : ""
              }`}
              onClick={() => onViewModeChange("card")}
              title="Cards View"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        )}

        {/* Add Button */}
        {onAddNew && (
          <button
            type="button"
            className="btn btn-primary master-add-btn"
            onClick={onAddNew}
          >
            {addNewLabel}
          </button>
        )}
      </div>
    </div>
  );
}
