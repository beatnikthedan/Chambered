import React, { useState, useMemo, useRef } from "react";
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
    >
      {/* Root Level Drop Banner */}
      <div
        className={`spatial-root-dropzone ${
          draggedItemId !== null ? "is-active-mode" : ""
        } ${dragOverTargetId === "ROOT" ? "active-target" : ""}`}
      >
        <span>Root Level Dropzone (Drag any accessory here to unmount / make standalone)</span>
      </div>

      {treeRoots.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
          No armory items found matching current filters.
        </div>
      ) : (
        <div className="spatial-tree-grid">
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
  const isSelected = selectedItemId === node.id;
  const isDragTarget = dragOverTargetId === node.id;
  const isBeingDragged = draggedItemId === node.id;
  const isDropEligible =
    draggedItemId !== null &&
    draggedItemId !== node.id &&
    canDrop(draggedItemId, node.id);

  const dragCounterRef = useRef<number>(0);

  const linkedProduct = node.product;

  // Valid target parents for the quick move selector
  const validParents = useMemo(() => {
    return allItems.filter((i) => i.id !== node.id && !isDescendant(node.id, i.id));
  }, [allItems, node.id, isDescendant]);

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
      className={`spatial-vault-card depth-${depth} ${
        isSelected ? "selected-vault" : ""
      } ${isDropEligible ? "drop-eligible" : ""} ${
        isDragTarget ? "drag-target-hover" : ""
      } ${isBeingDragged ? "is-dragging" : ""}`}
      style={{ "--depth": depth } as React.CSSProperties}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header bar / Drag grip */}
      <div
        className="spatial-node-header"
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onSelectItem(node);
        }}
      >
        <div className="spatial-title-group">
          <div
            className="spatial-drag-handle"
            title="Click and drag to mount onto another armory item"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="2" />
              <circle cx="15" cy="6" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="15" cy="12" r="2" />
              <circle cx="9" cy="18" r="2" />
              <circle cx="15" cy="18" r="2" />
            </svg>
          </div>

          {linkedProduct?.manufacturerId && (
            <ManufacturerFavicon mfgId={linkedProduct.manufacturerId} size={16} />
          )}

          <h3 className="spatial-vault-title">
            {node.name || linkedProduct?.name || `Item #${node.id}`}
          </h3>

          {linkedProduct && (
            <span className="spatial-product-tag">
              {linkedProduct.manufacturer?.name
                ? `${linkedProduct.manufacturer.name} `
                : ""}
              {linkedProduct.name}
            </span>
          )}

          {node.serialNumber && (
            <span className="spatial-count-tag" style={{ fontFamily: "monospace" }}>
              SN: {node.serialNumber}
            </span>
          )}
        </div>

        <div className="spatial-badges-group">
          {/* Quick Nest / Move Dropdown */}
          <div className="spatial-move-wrapper" onClick={(e) => e.stopPropagation()}>
            <select
              className="spatial-quick-move-select"
              title="Quick re-mount / change parent"
              value={node.parentItemId ?? "ROOT"}
              onChange={(e) => {
                const val = e.target.value === "ROOT" ? null : Number(e.target.value);
                onReparentItem(node.id, val);
              }}
            >
              <option value="ROOT">Standalone (Root)</option>
              {validParents.map((p) => (
                <option key={p.id} value={p.id}>
                  Mounted on: {p.name || p.product?.name || `Item #${p.id}`}
                </option>
              ))}
            </select>
          </div>

          {node.arsenal && (
            <span
              className="spatial-arsenal-tag"
              style={{
                color: node.arsenal.colorHex || "var(--color-primary)",
                borderColor: node.arsenal.colorHex ? `${node.arsenal.colorHex}66` : undefined,
                backgroundColor: node.arsenal.colorHex ? `${node.arsenal.colorHex}22` : undefined,
              }}
            >
              {node.arsenal.name}
            </span>
          )}

          {node.vault && (
            <span className="spatial-count-tag">
              {node.vault.name}
            </span>
          )}

          <span className="spatial-count-tag">
            {node.childrenNodes.length} {node.childrenNodes.length === 1 ? "accessory" : "accessories"}
          </span>
        </div>
      </div>

      {/* Body: Nested child accessories */}
      <div className="spatial-contents-body">
        {/* Nested Child Accessories */}
        {node.childrenNodes.length > 0 && (
          <div className="spatial-children-zone">
            {node.childrenNodes.map((child) => (
              <ArmoryItemTreeNode
                key={child.id}
                node={child}
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

        {/* Empty slot drop invitation */}
        {node.childrenNodes.length === 0 && (
          <div className="spatial-empty-zone">
            <span>Empty Attachment Slot (Drag accessories here or select parent in dropdown)</span>
          </div>
        )}
      </div>
    </div>
  );
}
