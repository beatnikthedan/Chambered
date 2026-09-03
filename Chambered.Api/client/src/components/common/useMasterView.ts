import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface FilterGroupConfig {
  id: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface UseMasterViewOptions<T> {
  data: T[];
  searchFields: (keyof T | string)[];
  defaultSortColumn?: string;
  defaultSortDirection?: SortDirection;
  defaultViewMode?: "table" | "card";
  customFilter?: (item: T, activeFilters: Record<string, string[]>) => boolean;
}

export function useMasterView<T extends Record<string, any>>({
  data,
  searchFields,
  defaultSortColumn = "",
  defaultSortDirection = "asc",
  defaultViewMode = "table",
  customFilter,
}: UseMasterViewOptions<T>) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortState, setSortState] = useState<SortState>({
    column: defaultSortColumn,
    direction: defaultSortDirection,
  });
  const [viewMode, setViewMode] = useState<"table" | "card">(defaultViewMode);

  // Active filter count (excluding empty arrays)
  const activeFilterCount = useMemo(() => {
    return Object.values(selectedFilters).reduce(
      (sum, filterList) => sum + filterList.length,
      0
    );
  }, [selectedFilters]);

  // Toggle or set a specific facet filter value
  const toggleFilter = (groupId: string, value: string) => {
    setSelectedFilters((prev) => {
      const currentList = prev[groupId] || [];
      const updatedList = currentList.includes(value)
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];

      if (updatedList.length === 0) {
        const copy = { ...prev };
        delete copy[groupId];
        return copy;
      }
      return { ...prev, [groupId]: updatedList };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({});
    setSearchTerm("");
  };

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        column,
        direction: "asc",
      };
    });
  };

  // Main processing pipeline: Search -> Custom/Facet Filter -> Sort
  const processedItems = useMemo(() => {
    let result = [...data];

    // 1. Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter((item) => {
        return searchFields.some((field) => {
          const val = item[field as keyof T];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // 2. Custom/Facet filters
    if (customFilter && Object.keys(selectedFilters).length > 0) {
      result = result.filter((item) => customFilter(item, selectedFilters));
    }

    // 3. Sorting
    if (sortState.column) {
      result.sort((a, b) => {
        let valA = a[sortState.column];
        let valB = b[sortState.column];

        if (valA === null || valA === undefined) valA = "";
        if (valB === null || valB === undefined) valB = "";

        if (typeof valA === "string" && typeof valB === "string") {
          const comp = valA.localeCompare(valB, undefined, { numeric: true });
          return sortState.direction === "asc" ? comp : -comp;
        }

        if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, selectedFilters, sortState, searchFields, customFilter]);

  return {
    searchTerm,
    setSearchTerm,
    selectedFilters,
    setSelectedFilters,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    sortState,
    handleSort,
    viewMode,
    setViewMode,
    processedItems,
  };
}
