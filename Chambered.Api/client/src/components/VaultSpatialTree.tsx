import React, { useState, useMemo, useRef } from "react";
import type { ExtendedVault } from "../Details/VaultDetails";

export interface VaultSpatialTreeProps {
  vaults: ExtendedVault[];
  selectedVault: ExtendedVault | null;
  onSelectVault: (vault: ExtendedVault) => void;
  onReparentVault: (vaultId: number, targetParentId: number | null) => Promise<void> | void;
}

interface TreeNode extends ExtendedVault {
  childrenNodes: TreeNode[];
}

export default function VaultSpatialTree({
  vaults,
  selectedVault,
  onSelectVault,
  onReparentVault,
}: VaultSpatialTreeProps) {
  const [draggedVaultId, setDraggedVaultId] = useState<number | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<number | null | "ROOT">(null);

  // Synchronous ref for instant dragover hit tests without React render latency
  const activeDragIdRef = useRef<number | null>(null);
  const rootDragCounterRef = useRef<number>(0);

  // Index map of all vaults by id
  const vaultMap = useMemo(() => {
    const map = new Map<number, ExtendedVault>();
    vaults.forEach((v) => map.set(v.id, v));
    return map;
  }, [vaults]);

  // Build hierarchical tree
  const treeRoots = useMemo(() => {
    const nodeMap = new Map<number, TreeNode>();
    vaults.forEach((v) => {
      nodeMap.set(v.id, { ...v, childrenNodes: [] });
    });

    const roots: TreeNode[] = [];

    nodeMap.forEach((node) => {
      if (node.parentVaultId && nodeMap.has(node.parentVaultId)) {
        const parent = nodeMap.get(node.parentVaultId);
        parent?.childrenNodes.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [vaults]);

  // Prevent circular nesting (cannot drop vault into itself or any of its descendants)
  const isDescendant = (currentParentId: number, searchTargetId: number): boolean => {
    const parent = vaultMap.get(currentParentId);
    if (!parent) return false;

    const children = vaults.filter((v) => v.parentVaultId === currentParentId);
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
    setDraggedVaultId(id);
  };

  const handleDragEnd = () => {
    activeDragIdRef.current = null;
    rootDragCounterRef.current = 0;
    setDraggedVaultId(null);
    setDragOverTargetId(null);
  };

  // Root dropzone handlers with counter protection
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
      const sourceVault = vaultMap.get(sourceId);
      if (sourceVault && sourceVault.parentVaultId !== null) {
        onReparentVault(sourceId, null);
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
          draggedVaultId !== null ? "is-active-mode" : ""
        } ${dragOverTargetId === "ROOT" ? "active-target" : ""}`}
      >
        <span>Root Level Dropzone (Drag any vault here to make standalone)</span>
      </div>

      {treeRoots.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center" }}>
          No vaults found matching current filters.
        </div>
      ) : (
        <div className="spatial-tree-grid">
          {treeRoots.map((rootNode) => (
            <SpatialVaultNode
              key={rootNode.id}
              node={rootNode}
              allVaults={vaults}
              depth={0}
              selectedVaultId={selectedVault?.id ?? null}
              draggedVaultId={draggedVaultId}
              dragOverTargetId={dragOverTargetId}
              activeDragIdRef={activeDragIdRef}
              onSelectVault={onSelectVault}
              onReparentVault={onReparentVault}
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

interface SpatialVaultNodeProps {
  node: TreeNode;
  allVaults: ExtendedVault[];
  depth: number;
  selectedVaultId: number | null;
  draggedVaultId: number | null;
  dragOverTargetId: number | null | "ROOT";
  activeDragIdRef: React.MutableRefObject<number | null>;
  onSelectVault: (vault: ExtendedVault) => void;
  onReparentVault: (vaultId: number, targetParentId: number | null) => Promise<void> | void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDragTargetChange: (id: number | null) => void;
  canDrop: (sourceId: number | null, targetId: number | null) => boolean;
  isDescendant: (parentId: number, searchId: number) => boolean;
}

function SpatialVaultNode({
  node,
  allVaults,
  depth,
  selectedVaultId,
  draggedVaultId,
  dragOverTargetId,
  activeDragIdRef,
  onSelectVault,
  onReparentVault,
  onDragStart,
  onDragEnd,
  onDragTargetChange,
  canDrop,
  isDescendant,
}: SpatialVaultNodeProps) {
  const isSelected = selectedVaultId === node.id;
  const isDragTarget = dragOverTargetId === node.id;
  const isBeingDragged = draggedVaultId === node.id;
  const isDropEligible =
    draggedVaultId !== null &&
    draggedVaultId !== node.id &&
    canDrop(draggedVaultId, node.id);

  const dragCounterRef = useRef<number>(0);

  const armoryItems = node.armoryItems || node.storedItems || [];
  const linkedProduct = node.product;

  // Valid target parents for the quick move selector
  const validParents = useMemo(() => {
    return allVaults.filter((v) => v.id !== node.id && !isDescendant(node.id, v.id));
  }, [allVaults, node.id, isDescendant]);

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
      onReparentVault(sourceId, node.id);
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
          onSelectVault(node);
        }}
      >
        <div className="spatial-title-group">
          <div
            className="spatial-drag-handle"
            title="Click and drag to nest inside another vault"
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
          <h3 className="spatial-vault-title">
            {node.name}
          </h3>
          {linkedProduct && (
            <span className="spatial-product-tag">
              {linkedProduct.manufacturer?.name
                ? `${linkedProduct.manufacturer.name} `
                : ""}
              {linkedProduct.name}
            </span>
          )}
        </div>

        <div className="spatial-badges-group">
          {/* Quick Nest / Move Dropdown */}
          <div className="spatial-move-wrapper" onClick={(e) => e.stopPropagation()}>
            <select
              className="spatial-quick-move-select"
              title="Quick re-nest / change parent"
              value={node.parentVaultId ?? "ROOT"}
              onChange={(e) => {
                const val = e.target.value === "ROOT" ? null : Number(e.target.value);
                onReparentVault(node.id, val);
              }}
            >
              <option value="ROOT">Standalone (Root)</option>
              {validParents.map((p) => (
                <option key={p.id} value={p.id}>
                  Inside: {p.name}
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
          <span className="spatial-count-tag">
            {armoryItems.length} {armoryItems.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {/* Body: Nested child vaults and stored armory items */}
      <div className="spatial-contents-body">
        {/* Stored Armory Items / Cases / Action Locks */}
        {armoryItems.length > 0 && (
          <div className="spatial-items-zone">
            {armoryItems.map((item: any) => (
              <div
                key={item.id}
                className="spatial-item-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVault(node);
                }}
                title={`Serial: ${item.serialNumber || "N/A"}`}
              >
                <div className="item-chip-title">{item.name || "Armory Item"}</div>
                {item.model && (
                  <div className="item-chip-sub">{item.model}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nested Vault Containers */}
        {node.childrenNodes.length > 0 && (
          <div className="spatial-children-zone">
            {node.childrenNodes.map((child) => (
              <SpatialVaultNode
                key={child.id}
                node={child}
                allVaults={allVaults}
                depth={depth + 1}
                selectedVaultId={selectedVaultId}
                draggedVaultId={draggedVaultId}
                dragOverTargetId={dragOverTargetId}
                activeDragIdRef={activeDragIdRef}
                onSelectVault={onSelectVault}
                onReparentVault={onReparentVault}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragTargetChange={onDragTargetChange}
                canDrop={canDrop}
                isDescendant={isDescendant}
              />
            ))}
          </div>
        )}

        {/* Empty container drop invitation */}
        {armoryItems.length === 0 && node.childrenNodes.length === 0 && (
          <div className="spatial-empty-zone">
            <span>Empty Container (Drag vaults here or select parent in dropdown)</span>
          </div>
        )}
      </div>
    </div>
  );
}
