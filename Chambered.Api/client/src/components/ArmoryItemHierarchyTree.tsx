import React, { useState, useMemo, useRef } from "react";
import SecureImage from "./SecureImage";
import ManufacturerFavicon from "./ManufacturerFavicon";
import type { ExtendedArmoryItem } from "../views/Armory";

export interface ArmoryItemHierarchyTreeProps {
  items: ExtendedArmoryItem[];
  selectedItem: ExtendedArmoryItem | null;
  onSelectItem: (item: ExtendedArmoryItem) => void;
  onReparentItem: (itemId: number, targetParentId: number | null) => Promise<void> | void;
}

interface TreeItemNode extends ExtendedArmoryItem {
  childrenNodes: TreeItemNode[];
}

export default function ArmoryItemHierarchyTree({
  items,
  selectedItem,
  onSelectItem,
  onReparentItem,
}: ArmoryItemHierarchyTreeProps) {
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<number | null | "ROOT">(null);

  // Synchronous ref for instant dragover hit tests without React render latency
  const activeDragIdRef = useRef<number | null>(null);
  const rootDragCounterRef = useRef<number>(0);

  // Map of all items by ID
  const itemMap = useMemo(() => {
    const map = new Map<number, ExtendedArmoryItem>();
    items.forEach((i) => map.set(i.id, i));
    return map;
  }, [items]);

  // Build hierarchical tree
  const treeRoots = useMemo(() => {
    const nodeMap = new Map<number, TreeItemNode>();
    items.forEach((item) => {
      nodeMap.set(item.id, { ...item, childrenNodes: [] });
    });

    const roots: TreeItemNode[] = [];

    nodeMap.forEach((node) => {
      if (node.parentItemId && nodeMap.has(node.parentItemId)) {
        const parent = nodeMap.get(node.parentItemId);
        parent?.childrenNodes.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [items]);

  // Prevent circular nesting (cannot drop an item into itself or any of its descendants)
  const isDescendant = (currentParentId: number, searchTargetId: number): boolean => {
    const parent = itemMap.get(currentParentId);
    if (!parent) return false;

    const children = items.filter((i) => i.parentItemId === currentParentId);
    for (const child of children) {
      if (child.id === searchTargetId) return true;
      if (isDescendant(child.id, searchTargetId)) return true;
    }
    return false;
  };

  const canDrop = (sourceId: number | null, targetId: number | null): boolean => {
    if (!sourceId) return false;
    if (sourceId === targetId) return false;
    if (targetId === null) return true; // Dropping to root is always valid
    return !isDescendant(sourceId, targetId);
  };

  const handleDragStart = (id: number) => {
    activeDragIdRef.current = id;
    setDraggedItemId(id);
  };

  const handleDragEnd = () => {
    activeDragIdRef.current = null;
    rootDragCounterRef.current = 0;
    setDraggedItemId(null);
    setDragOverTargetId(null);
  };

  // Root dropzone handlers
  const handleRootDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    rootDragCounterRef.current += 1;
    const currentId = activeDragIdRef.current;
    if (currentId && canDrop(currentId, null)) {
      setDragOverTargetId("ROOT");
    }
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentId = activeDragIdRef.current;
    if (currentId && canDrop(currentId, null)) {
      e.dataTransfer.dropEffect = "move";
      if (dragOverTargetId !== "ROOT") {
        setDragOverTargetId("ROOT");
      }
    }
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    rootDragCounterRef.current -= 1;
    if (rootDragCounterRef.current <= 0) {
      rootDragCounterRef.current = 0;
      if (dragOverTargetId === "ROOT") {
        setDragOverTargetId(null);
      }
    }
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = activeDragIdRef.current || Number(e.dataTransfer.getData("text/plain"));
    if (sourceId && canDrop(sourceId, null)) {
      const sourceItem = itemMap.get(sourceId);
      if (sourceItem && sourceItem.parentItemId !== null) {
        onReparentItem(sourceId, null);
      }
    }
    handleDragEnd();
  };

  return (
    <div
      className="vault-spatial-tree-wrapper"
      onDragEnter={handleRootDragEnter}
      onDragOver={handleRootDragOver}
      onDragLeave={handleRootDragLeave}
      onDrop={handleRootDrop}
      style={{ minHeight: "100%", padding: "12px" }}
    >
      {/* Root Level Dropzone Banner */}
      <div
        className={`spatial-root-dropzone ${
          draggedItemId !== null ? "is-active-mode" : ""
        } ${dragOverTargetId === "ROOT" ? "active-target" : ""}`}
        style={{
          border: "1.5px dashed var(--color-primary)",
          borderRadius: "8px",
          padding: "12px",
          textAlign: "center",
          marginBottom: "16px",
          backgroundColor: dragOverTargetId === "ROOT" ? "rgba(240, 98, 146, 0.1)" : "transparent",
          transition: "all 0.2s ease",
          display: draggedItemId !== null ? "block" : "none",
        }}
      >
        <span style={{ fontWeight: 600, color: "var(--color-primary)", fontSize: "13px" }}>
          Root Level Dropzone (Drag any accessory here to unmount / make standalone)
        </span>
      </div>

      {treeRoots.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
          No matching armory items found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {treeRoots.map((rootNode) => (
            <ArmoryItemTreeNode
              key={rootNode.id}
              node={rootNode}
              allItems={items}
              depth={0}
              selectedItemId={selectedItem?.id ?? null}
              draggedItemId={draggedItemId}
              dragOverTargetId={dragOverTargetId}
              activeDragIdRef={activeDragIdRef}
              onSelectItem={onSelectItem}
              onReparentItem={onReparentItem}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragTargetChange={(targetId) => setDragOverTargetId(targetId)}
              canDrop={canDrop}
              isDescendant={isDescendant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ArmoryItemTreeNodeProps {
  node: TreeItemNode;
  allItems: ExtendedArmoryItem[];
  depth: number;
  selectedItemId: number | null;
  draggedItemId: number | null;
  dragOverTargetId: number | null | "ROOT";
  activeDragIdRef: React.MutableRefObject<number | null>;
  onSelectItem: (item: ExtendedArmoryItem) => void;
  onReparentItem: (itemId: number, targetParentId: number | null) => Promise<void> | void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDragTargetChange: (id: number | null) => void;
  canDrop: (sourceId: number | null, targetId: number | null) => boolean;
  isDescendant: (parentId: number, searchId: number) => boolean;
}

function ArmoryItemTreeNode({
  node,
  allItems,
  depth,
  selectedItemId,
  draggedItemId,
  dragOverTargetId,
  activeDragIdRef,
  onSelectItem,
  onReparentItem,
  onDragStart,
  onDragEnd,
  onDragTargetChange,
  canDrop,
  isDescendant,
}: ArmoryItemTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isSelected = selectedItemId === node.id;
  const isDragTarget = dragOverTargetId === node.id;
  const isBeingDragged = draggedItemId === node.id;
  const isDropEligible =
    draggedItemId !== null &&
    draggedItemId !== node.id &&
    canDrop(draggedItemId, node.id);

  const dragCounterRef = useRef<number>(0);

  const coverUrl = node.coverImageId
    ? `/api/v1/ArmoryItemDocuments/${node.coverImageId}/Download`
    : node.product?.coverImageId
      ? `/api/v1/ProductDocuments/${node.product.coverImageId}/Download`
      : null;

  const typeName = node.itemType?.replace("ArmoryItem", "") || "Item";

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(node.id));
    onDragStart(node.id);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    const currentId = activeDragIdRef.current;
    if (currentId && canDrop(currentId, node.id)) {
      onDragTargetChange(node.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentId = activeDragIdRef.current;
    if (currentId && canDrop(currentId, node.id)) {
      e.dataTransfer.dropEffect = "move";
      if (dragOverTargetId !== node.id) {
        onDragTargetChange(node.id);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      if (dragOverTargetId === node.id) {
        onDragTargetChange(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    const sourceId = activeDragIdRef.current || Number(e.dataTransfer.getData("text/plain"));
    if (sourceId && canDrop(sourceId, node.id)) {
      onReparentItem(sourceId, node.id);
    }
    onDragEnd();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginLeft: depth > 0 ? `${depth * 20}px` : "0px",
      }}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onSelectItem(node)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: "8px",
          backgroundColor: isSelected
            ? "rgba(240, 98, 146, 0.08)"
            : isDragTarget
              ? "rgba(240, 98, 146, 0.15)"
              : "var(--bg-card)",
          border: `1px solid ${
            isDragTarget
              ? "var(--color-primary)"
              : isSelected
                ? "var(--color-primary)"
                : isDropEligible
                  ? "rgba(240, 98, 146, 0.3)"
                  : "var(--border-color)"
          }`,
          cursor: "grab",
          opacity: isBeingDragged ? 0.4 : 1,
          boxShadow: isSelected ? "0 0 0 1px var(--color-primary)" : "none",
          transition: "all 0.15s ease",
          gap: "12px",
        }}
      >
        {/* Left Info Group */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
          {/* Chevron expand/collapse if has children */}
          {node.childrenNodes.length > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "2px 4px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          ) : (
            <div style={{ width: "16px" }} />
          )}

          {/* Depth connector indicator */}
          {depth > 0 && (
            <span style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "14px" }}>
              ↳
            </span>
          )}

          {/* Cover Thumbnail */}
          {coverUrl ? (
            <SecureImage
              src={coverUrl}
              alt={node.name || "Cover"}
              style={{
                width: "32px",
                height: "32px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "4px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                flexShrink: 0,
              }}
            />
          )}

          {/* Type Badge */}
          <span className={`type-badge ${typeName.toLowerCase()}`} style={{ fontSize: "11px" }}>
            {typeName}
          </span>

          {/* Manufacturer & Title */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {node.product?.manufacturerId && (
                <ManufacturerFavicon mfgId={node.product.manufacturerId} size={16} />
              )}
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "13.5px",
                  color: isSelected ? "var(--color-primary)" : "var(--text-main)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {node.name || node.product?.name || `Item #${node.id}`}
              </span>
            </div>
            {node.product?.name && node.name !== node.product.name && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Model: {node.product.name}
              </span>
            )}
          </div>
        </div>

        {/* Right Info Group: Vault, Serial, Accessory Count */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {node.serialNumber && (
            <span className="text-mono" style={{ fontSize: "11px", color: "var(--color-primary)" }}>
              SN: {node.serialNumber}
            </span>
          )}

          <span className="text-muted" style={{ fontSize: "11.5px" }}>
            {node.vault?.name || node.storageLocation || "Unassigned"}
          </span>

          {node.childrenNodes.length > 0 && (
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                padding: "2px 6px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "10px",
                color: "var(--text-muted)",
              }}
            >
              {node.childrenNodes.length} mounted
            </span>
          )}
        </div>
      </div>

      {/* Child Accessories Nodes (Recursive) */}
      {isExpanded && node.childrenNodes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {node.childrenNodes.map((childNode) => (
            <ArmoryItemTreeNode
              key={childNode.id}
              node={childNode}
              allItems={allItems}
              depth={depth + 1}
              selectedItemId={selectedItemId}
              draggedItemId={draggedItemId}
              dragOverTargetId={dragOverTargetId}
              activeDragIdRef={activeDragIdRef}
              onSelectItem={onSelectItem}
              onReparentItem={onReparentItem}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragTargetChange={onDragTargetChange}
              canDrop={canDrop}
              isDescendant={isDescendant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
