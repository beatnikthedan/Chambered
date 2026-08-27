import React, { useState, useEffect, useMemo, useRef } from "react";
import { useStore } from "../StoreContext";
import "./Armory.css";
import BatteryTracker from "../components/BatteryTracker";
import SubmitButton from "../components/SubmitButton";
import {
  getArmoryItems,
  getUsersUsers,
  getUsersProfile,
  getVaults,
  getProducts,
  putArmoryItemsFromKey,
  postArmoryItems,
  patchArmoryItemsFromKey,
  deleteArmoryItemsFromKey
} from "../api/endpoints";
import type { ArmoryItem } from "../api/models/armoryItem";
import type { Product } from "../api/models/product";
import type { Vault } from "../api/models/vault";

interface ExtendedArmoryItem extends ArmoryItem {
  itemType: string;
  manufacturer: string;
  model: string;
  caliber: string;
  actionType: string;
  storageLocation: string;
  vaultId?: any;
  isNfaItem?: boolean;
  arsenalColor?: string;
  arsenalName?: string;
  partNumber?: string;
  serialNumber?: string;
  roundCount?: number;
  [key: string]: any;
}

interface ExtendedProduct extends Product {
  productType: string;
  manufacturerName: string;
  caliberName: string;
  hasBattery?: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

interface MaintenanceTask {
  id: number;
  description: string;
  category: string;
  dueDate: string | null;
  enableNotifications: boolean;
  isCompleted: boolean;
}

interface ArmoryForm {
  id: number;
  pewpewModelId: string | number;
  firearmModelId: string | number;
  arsenalId: string | number;
  manufacturer: string;
  model: string;
  caliber: string;
  barrelLengthInches: string | number;
  twistRate: string;
  threadPitch: string;
  actionType: string;
  name: string;
  description: string;
  serialNumber: string;
  notes: string;
  purchasePrice: string | number;
  estimatedValue: string | number;
  purchaseDateString: string;
  condition: string;
  imageUrl: string;
  roundCount: string | number;
  owner?: any;
  ownerId: string;
  beneficiary?: any;
  beneficiaryId: string;
  storageLocation: string;
  vaultId: string | number;
  notesMarkdown: string;
  opticManufacturer: string;
  opticModel: string;
  opticReticle: string;
  opticSerial: string;
  opticBattery: string;
  isOpticMounted: boolean;
  isNfaItem: boolean;
  nfaFormType: string;
  taxStampDocumentUrl: string;
  stampApprovalDate: string;
  batteryLastChangedDate: string;
  batteryType: string;
  itemType: string;
  productId?: number;
  parentItemId?: number | null;
  [key: string]: any;
}

export default function Armory() {
  const store = useStore();
  const { enums } = store;

  // Memoized dynamic enums strictly loaded from the database
  const actionTypes = useMemo(() => {
    if (enums && enums.actionTypes) {
      return enums.actionTypes.map((e: any) => e.label);
    }
    return [];
  }, [enums]);

  const conditions = useMemo(() => {
    if (enums && enums.itemConditions) {
      return enums.itemConditions;
    }
    return [];
  }, [enums]);

  const nfaFormTypes = useMemo(() => {
    if (enums && enums.nfaFormTypes) {
      return enums.nfaFormTypes;
    }
    return [];
  }, [enums]);

  // State lists
  const [armoryItems, setArmoryItems] = useState<ExtendedArmoryItem[]>([]);
  const [vaultLocations, setVaultLocations] = useState<Vault[]>([]);
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filter conditions
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCaliber, setFilterCaliber] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");

  // Modal control & edit mode state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [viewMode, setViewMode] = useState<"grid" | "tree">("grid"); // 'grid' | 'tree'
  const [selectedExistingId, setSelectedExistingId] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  
  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  // New accessory inline creation state
  const [newAccProductId, setNewAccProductId] = useState<string>("");
  const [newAccSerialNumber, setNewAccSerialNumber] = useState<string>("");
  const [newAccCondition, setNewAccCondition] = useState<string>("Excellent");
  const [isCreatingAcc, setIsCreatingAcc] = useState<boolean>(false);

  // Form State
  const [form, setForm] = useState<ArmoryForm>({
    id: 0,
    pewpewModelId: 0,
    firearmModelId: 0,
    arsenalId: "",
    manufacturer: "",
    model: "",
    caliber: "",
    barrelLengthInches: "",
    twistRate: "",
    threadPitch: "",
    actionType: "",
    name: "",
    description: "",
    serialNumber: "",
    notes: "",
    purchasePrice: "",
    estimatedValue: "",
    purchaseDateString: "",
    condition: "",
    imageUrl: "",
    roundCount: 0,
    beneficiary: "",
    beneficiaryId: "",
    storageLocation: "",
    vaultId: "",
    notesMarkdown: "",
    opticManufacturer: "",
    opticModel: "",
    opticReticle: "",
    opticSerial: "",
    opticBattery: "",
    isOpticMounted: false,
    isNfaItem: false,
    nfaFormType: "",
    taxStampDocumentUrl: "",
    stampApprovalDate: "",
    batteryLastChangedDate: "",
    batteryType: "",
    itemType: "",
  });

  // Dynamic lists inside the modal
  const [accessoriesList, setAccessoriesList] = useState<any[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [rangeSessions, setRangeSessions] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Accessories inputs
  const [newAccessoryName, setNewAccessoryName] = useState<string>("");

  // Ref for markdown toolbar manipulations
  const markdownTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showSerial, setShowSerial] = useState<boolean>(false);

  // Load backend collections
  const fetchArmoryItems = async () => {
    setLoading(true);
    setError("");
    try {
      const filter = store.activeArsenalId ? `arsenalId eq ${store.activeArsenalId}` : undefined;
      const res = await getArmoryItems({
        expand: "product($expand=manufacturer,Chambered.Data.Models.PewPew/caliber,Chambered.Data.Models.Suppressor/caliber),vault,owner,beneficiary",
        filter
      });
      if (res.status === 200) {
        const mappedItems = (res.data.value || []).map((item: any) => {
          const product = item.product || {};
          const manufacturer = product.manufacturer || {};
          const caliber = product.caliber || {};

          let derivedType = "ArmoryItem";
          if (item["@odata.type"]) {
            const parts = item["@odata.type"].split(".");
            derivedType = parts[parts.length - 1];
          }

          return {
            ...item,
            itemType: derivedType,
            manufacturer: manufacturer.name || "",
            model: product.model || "",
            caliber: caliber.name || "",
            actionType: product.actionType || "",
            storageLocation: item.vault?.name || "",
            vaultId: item.vaultId || "",
            isNfaItem: !!product.isNfaItem,
          } as ExtendedArmoryItem;
        });
        setArmoryItems(mappedItems);
      } else {
        setError(`Error loading: ${res.status}`);
      }
    } catch (err) {
      setError("Failed to fetch armory items.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      let res = await getUsersUsers().catch(() => null);
      if (!res || res.status === 403 || res.status === 401) {
        res = await getUsersProfile().catch(() => null);
      }
      if (res && res.status === 200) {
        const data = res.data;
        setUsers(Array.isArray(data) ? data : [data]);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchVaultLocations = async () => {
    try {
      const filter = store.activeArsenalId
        ? `arsenalId eq ${store.activeArsenalId}`
        : undefined;
      const res = await getVaults({ filter });
      if (res.status === 200) {
        setVaultLocations(res.data.value || []);
      }
    } catch (err) {
      console.error("Failed to load vault locations", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getProducts({
        expand: "manufacturer,Chambered.Data.Models.PewPew/caliber,Chambered.Data.Models.Suppressor/caliber"
      });
      if (res.status === 200) {
        const rawProducts = res.data.value || [];
        const mappedProducts = rawProducts.map((p: any) => {
          let type = "Product";
          if (p["@odata.type"]) {
            const parts = p["@odata.type"].split(".");
            type = parts[parts.length - 1];
          }
          return {
            ...p,
            productType: type,
            manufacturerName: p.manufacturer?.name || "Unknown Brand",
            caliberName: p.caliber?.name || "N/A",
          } as ExtendedProduct;
        });
        setProducts(mappedProducts);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  useEffect(() => {
    fetchArmoryItems();
    fetchVaultLocations();
    fetchProducts();
    fetchUsers();
  }, [store.activeArsenalId]);

  // Computed / filtered helpers
  const uniqueCalibers = useMemo(() => {
    const cals = armoryItems.map((f) => f.caliber).filter(Boolean);
    return [...new Set(cals)].sort();
  }, [armoryItems]);

  const uniqueActions = useMemo(() => {
    const acts = armoryItems.map((f) => f.actionType).filter(Boolean);
    return [...new Set(acts)].sort();
  }, [armoryItems]);

  const filteredArmoryItems = useMemo(() => {
    return armoryItems.filter((item) => {
      const isParent = !item.parentItemId;
      const textMatch =
        !searchQuery ||
        [item.manufacturer, item.model, item.serialNumber, item.caliber].some(
          (v) => v && v.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const caliberMatch = !filterCaliber || item.caliber === filterCaliber;
      const actionMatch = !filterAction || item.actionType === filterAction;

      return isParent && textMatch && caliberMatch && actionMatch;
    });
  }, [armoryItems, searchQuery, filterCaliber, filterAction]);

  const handleAttachAccessory = async () => {
    const accessoryId = parseInt(selectedExistingId) || 0;
    if (!accessoryId) return;

    const accessoryItem = armoryItems.find((x) => x.id === accessoryId);
    if (!accessoryItem) return;

    try {
      const payload: any = {
        ...(accessoryItem["@odata.type"] ? { "@odata.type": accessoryItem["@odata.type"] } : {}),
        parentItemId: form.id,
      };

      const res = await patchArmoryItemsFromKey(accessoryId, payload);
      if (res.status === 200 || res.status === 204) {
        await fetchArmoryItems();
        setSelectedExistingId("");
      } else {
        alert("Failed to attach accessory.");
      }
    } catch (err) {
      console.error("Error attaching accessory", err);
    }
  };

  const handleDetachAccessory = async (accessoryId: number) => {
    const accessoryItem = armoryItems.find((x) => x.id === accessoryId);
    if (!accessoryItem) return;

    try {
      const payload: any = {
        ...(accessoryItem["@odata.type"] ? { "@odata.type": accessoryItem["@odata.type"] } : {}),
        parentItemId: null,
      };

      const res = await patchArmoryItemsFromKey(accessoryId, payload);
      if (res.status === 200 || res.status === 204) {
        await fetchArmoryItems();
      } else {
        alert("Failed to detach accessory.");
      }
    } catch (err) {
      console.error("Error detaching accessory", err);
    }
  };

  const handleCreateAndAttachAccessory = async () => {
    const prodId = parseInt(newAccProductId) || 0;
    if (!prodId) {
      alert("Please select a catalog product first.");
      return;
    }

    setIsCreatingAcc(true);
    try {
      const p = products.find((prod) => prod.id === prodId);
      if (!p) {
        alert("Selected product not found in catalog.");
        setIsCreatingAcc(false);
        return;
      }

      const resolvedItemType =
        p.productType === "PewPew"
          ? "PewArmoryItem"
          : p.productType === "Suppressor"
            ? "SuppressorArmoryItem"
            : p.productType === "Optic"
              ? "OpticArmoryItem"
              : p.productType === "PewPewLight"
                ? "LightArmoryItem"
                : "ArmoryItem";

      const payload: any = {
        ...(resolvedItemType !== "ArmoryItem"
          ? { "@odata.type": `#Chambered.Data.Models.${resolvedItemType}` }
          : {}),
        productId: p.id,
        parentItemId: form.id,
        condition: newAccCondition,
        arsenalId: form.arsenalId || store.activeArsenalId || 1,
        name: `${p.manufacturerName} ${p.name || ""}`.trim() || "Accessory",
      };

      if (
        ["PewArmoryItem", "SuppressorArmoryItem", "OpticArmoryItem"].includes(
          resolvedItemType,
        )
      ) {
        payload.serialNumber = newAccSerialNumber || "";
      }

      const res = await postArmoryItems(payload);

      if (res.status === 200 || res.status === 201 || res.status === 204) {
        await fetchArmoryItems();
        setNewAccProductId("");
        setNewAccSerialNumber("");
        setNewAccCondition("Excellent");
      } else {
        alert(`Failed to create accessory: status ${res.status}`);
      }
    } catch (err) {
      console.error("Error creating accessory", err);
    } finally {
      setIsCreatingAcc(false);
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setActiveTab("general");
    setAccessoriesList([]);
    setMaintenanceTasks([]);
    setRangeSessions([]);
    setAttachments([]);
    setSelectedExistingId("");

    setForm({
      id: 0,
      pewpewModelId: 0,
      firearmModelId: 0,
      arsenalId: store.activeArsenalId || store.arsenals[0]?.id || 1,
      manufacturer: "",
      model: "",
      caliber: "",
      barrelLengthInches: "",
      twistRate: "",
      threadPitch: "",
      actionType: "",
      name: "",
      description: "",
      serialNumber: "",
      notes: "",
      purchasePrice: "",
      estimatedValue: "",
      purchaseDateString: "",
      condition: "Good",
      imageUrl: "",
      roundCount: 0,
      owner: "",
      ownerId: "",
      beneficiary: "",
      beneficiaryId: "",
      storageLocation: "",
      vaultId: "",
      notesMarkdown: "",
      opticManufacturer: "",
      opticModel: "",
      opticReticle: "",
      opticSerial: "",
      opticBattery: "",
      isOpticMounted: false,
      isNfaItem: false,
      nfaFormType: "",
      taxStampDocumentUrl: "",
      stampApprovalDate: "",
      batteryLastChangedDate: "",
      batteryType: "",
      itemType: "",
    });
    setShowModal(true);
  };

  const openEditModal = (item: ExtendedArmoryItem) => {
    setIsEditMode(true);
    setActiveTab("general");
    setSelectedExistingId("");

    let dateString = "";
    if (item.purchaseDate) {
      dateString = item.purchaseDate.split("T")[0];
    }

    setForm({
      ...item,
      id: item.id || 0,
      pewpewModelId: item.productId || item.pewpewModelId || item.firearmModelId || 0,
      firearmModelId: item.productId || item.firearmModelId || item.pewpewModelId || 0,
      arsenalId: item.arsenalId || store.activeArsenalId || 1,
      purchaseDateString: dateString,
      owner: item.owner || "",
      ownerId: item.ownerId || "",
      beneficiary: item.beneficiary || "",
      beneficiaryId: item.beneficiaryId || "",
      storageLocation: item.vault?.name || item.storageLocation || "",
      vaultId: item.vaultId || "",
      notesMarkdown: item.notesMarkdown || "",
      opticManufacturer: item.opticManufacturer || "",
      opticModel: item.opticModel || "",
      opticReticle: item.opticReticle || "",
      opticSerial: item.opticSerial || "",
      opticBattery: item.opticBattery || "",
      isOpticMounted: item.isOpticMounted || false,
      threadPitch: item.threadPitch || "",
      isNfaItem: item.isNfaItem || false,
      nfaFormType: item.nfaFormType || "",
      taxStampDocumentUrl: item.taxStampDocumentUrl || "",
      stampApprovalDate: item.stampApprovalDate
        ? item.stampApprovalDate.split("T")[0]
        : "",
      batteryLastChangedDate: item.batteryLastChangedDate
        ? item.batteryLastChangedDate.split("T")[0]
        : "",
      itemType: item.itemType || "",
      name: item.name || "",
      description: item.description || "",
      serialNumber: item.serialNumber || "",
      notes: item.notes || "",
      purchasePrice: item.purchasePrice || "",
      estimatedValue: item.estimatedValue || "",
      condition: item.condition ? (typeof item.condition === 'string' ? item.condition : (item.condition as any).name || "") : "Good",
      imageUrl: item.imageUrl || "",
      roundCount: item.roundCount || 0,
    });

    try {
      setAccessoriesList(
        item.accessoriesListJson ? JSON.parse(item.accessoriesListJson) : [],
      );
    } catch (err) {
      setAccessoriesList([]);
    }

    try {
      setMaintenanceTasks(
        item.maintenanceTasksJson ? JSON.parse(item.maintenanceTasksJson) : [],
      );
    } catch (err) {
      setMaintenanceTasks([]);
    }

    try {
      setRangeSessions(
        item.rangeHistoryJson ? JSON.parse(item.rangeHistoryJson) : [],
      );
    } catch (err) {
      setRangeSessions([]);
    }

    setAttachments([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleProductSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = parseInt(e.target.value) || 0;
    if (prodId > 0) {
      const p = products.find((prod) => prod.id === prodId);
      if (p) {
        setForm((prev) => ({
          ...prev,
          pewpewModelId: p.id!,
          firearmModelId: p.id!,
          manufacturer: p.manufacturerName || "",
          model: p.model || "",
          caliber: p.caliberName || "",
          actionType: p.actionType || "",
          isNfaItem: !!p.isNfaItem,
          itemType:
            p.productType === "PewPew"
              ? "PewArmoryItem"
              : p.productType === "Suppressor"
                ? "SuppressorArmoryItem"
                : p.productType === "Optic"
                  ? "OpticArmoryItem"
                  : p.productType === "PewPewLight"
                    ? "LightArmoryItem"
                    : "ArmoryItem",
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        pewpewModelId: 0,
        firearmModelId: 0,
        manufacturer: "",
        model: "",
        caliber: "",
        actionType: "",
        isNfaItem: false,
        itemType: "",
      }));
    }
  };

  // CRUD actions
  const handleSave = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!form.pewpewModelId && !form.productId) {
      alert("Please select a catalog product.");
      return;
    }

    setIsSaving(true);
    try {
      const resolvedItemType = form.itemType || activeItemType || "ArmoryItem";

      // Build a clean payload matching the C# ArmoryItem base properties exactly
      const payload: any = {
        ...(resolvedItemType && resolvedItemType !== "ArmoryItem"
          ? { "@odata.type": `#Chambered.Data.Models.${resolvedItemType}` }
          : {}),
        id: form.id || 0,
        productId: form.productId || Number(form.pewpewModelId) || Number(form.firearmModelId) || 0,
        name: form.name || form.model || "Armory Item",
        description: form.description || "",
        condition: form.condition || "Unknown",
        imageUrl: form.imageUrl || "",
        notesMarkdown: form.notes || form.notesMarkdown || "",
        
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice as string) : null,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue as string) : null,
        purchaseDate: form.purchaseDateString ? new Date(form.purchaseDateString).toISOString() : null,
        
        ownerId: form.ownerId || null,
        beneficiaryId: form.beneficiaryId || null,
        vaultId: form.vaultId ? parseInt(form.vaultId as string) : null,
        arsenalId: parseInt(form.arsenalId as string) || store.activeArsenalId,
        parentItemId: form.parentItemId ? parseInt(form.parentItemId as any) : null,
      };

      // Add Serial Number fields if the subclass supports it
      if (["PewArmoryItem", "SuppressorArmoryItem", "OpticArmoryItem"].includes(resolvedItemType)) {
        payload.serialNumber = form.serialNumber || "";
      }

      // Add NFA-specific fields if subclass implements IHasNfa
      if (["PewArmoryItem", "SuppressorArmoryItem"].includes(resolvedItemType)) {
        payload.nfaFormType = form.nfaFormType && form.nfaFormType !== "" ? form.nfaFormType : "Unknown";
        payload.taxStampDocumentUrl = form.taxStampDocumentUrl || "";
        payload.stampApprovalDate = form.stampApprovalDate ? new Date(form.stampApprovalDate).toISOString() : null;
      }

      // Add Battery-specific fields if subclass implements IHasBattery
      if (["OpticArmoryItem", "LightArmoryItem"].includes(resolvedItemType)) {
        payload.batteryLastChangedDate = form.batteryLastChangedDate ? new Date(form.batteryLastChangedDate).toISOString() : null;
        payload.batteryExpirationDate = form.batteryExpirationDate ? new Date(form.batteryExpirationDate).toISOString() : null;
      }

      // Add PewPew custom subclass specifications
      if (resolvedItemType === "PewArmoryItem") {
        payload.roundCount = parseInt(form.roundCount as string) || 0;
        payload.barrelLengthInches = form.barrelLengthInches ? parseFloat(form.barrelLengthInches as string) : null;
        payload.twistRate = form.twistRate || "";
        payload.threadPitch = form.threadPitch || "";
      }

      // Perform the API Request
      const res = isEditMode
        ? await putArmoryItemsFromKey(form.id, payload)
        : await postArmoryItems(payload);

      if (res.status === 200 || res.status === 201 || res.status === 204) {
        await fetchArmoryItems();
        
        let savedItem = form;
        if (res.status !== 204 && res.data) {
          savedItem = res.data;
        }

        setIsEditMode(true);
        
        // Map saved entity values cleanly back into the form state
        setForm({
          ...savedItem,
          id: savedItem.id || 0,
          pewpewModelId: savedItem.productId || savedItem.pewpewModelId || savedItem.firearmModelId || "",
          firearmModelId: savedItem.productId || savedItem.firearmModelId || savedItem.pewpewModelId || "",
          purchaseDateString: savedItem.purchaseDate ? savedItem.purchaseDate.split("T")[0] : "",
          ownerId: savedItem.ownerId || "",
          beneficiaryId: savedItem.beneficiaryId || "",
          vaultId: savedItem.vaultId || "",
          isNfaItem: !!savedItem.product?.isNfaItem,
          stampApprovalDate: savedItem.stampApprovalDate ? savedItem.stampApprovalDate.split("T")[0] : "",
          batteryLastChangedDate: savedItem.batteryLastChangedDate ? savedItem.batteryLastChangedDate.split("T")[0] : "",
          name: savedItem.name || "",
          description: savedItem.description || "",
          serialNumber: savedItem.serialNumber || "",
          notes: savedItem.notes || "",
          purchasePrice: savedItem.purchasePrice || "",
          estimatedValue: savedItem.estimatedValue || "",
          condition: savedItem.condition ? (typeof savedItem.condition === 'string' ? savedItem.condition : (savedItem.condition as any).name || "") : "Good",
          imageUrl: savedItem.imageUrl || "",
          roundCount: savedItem.roundCount || 0,
          itemType: savedItem.itemType || resolvedItemType,
        });

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        alert(`Save failed: status ${res.status}`);
      }
    } catch (err) {
      console.error("Save connection/network error:", err);
      alert("Failed to connect to the backend server.");
    } finally {
      setIsSaving(false);
    }
  };

  // Triggers when you click "Remove" on the card
  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  // Triggers when you click "Yes, Delete" in the confirmation modal
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await deleteArmoryItemsFromKey(deleteConfirmId);
      if (res.status === 200 || res.status === 204) {
        setArmoryItems((prev) => prev.filter((f) => f.id !== deleteConfirmId));
      } else {
        alert("Delete failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getConditionClass = (cond?: string | null) => {
    if (!cond) return "badge-success";
    const c = cond.toLowerCase();
    if (c.includes("unfired") || c.includes("excel") || c.includes("very"))
      return "badge-success";
    if (c.includes("good") || c.includes("fair")) return "badge-warning";
    return "badge-danger";
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const renderTreeNode = (item: ExtendedArmoryItem, depth = 0) => {
    const children = armoryItems.filter(
      (child) => child.parentItemId === item.id,
    );
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes[item.id!] !== false; // default to expanded

    return (
      <div
        key={item.id}
        className="tree-node-wrapper"
        style={{
          marginLeft: `${depth * 24}px`,
          borderLeft: depth > 0 ? "1px dashed var(--border-color)" : "none",
        }}
      >
        <div className="tree-node-strip" onClick={() => openEditModal(item)}>
          <div className="tree-node-toggle-col">
            {hasChildren ? (
              <button
                type="button"
                className="btn-toggle-tree"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(item.id!);
                }}
              >
                {isExpanded ? "▼" : "►"}
              </button>
            ) : (
              <span className="leaf-bullet">•</span>
            )}
          </div>

          <div className="tree-node-info-col">
            <span className="tree-hub-name">
              {item.manufacturer} {item.model}
            </span>
            {item.caliber && (
              <span className="tree-hub-cat">({item.caliber})</span>
            )}
            {item.serialNumber && (
              <span
                className="tree-hub-inventory-count"
                style={{ marginLeft: "8px" }}
              >
                SN: {item.serialNumber}
              </span>
            )}
            {item.roundCount !== undefined && item.roundCount > 0 && (
              <span
                className="tree-hub-inventory-count"
                style={{ marginLeft: "8px" }}
              >
                • {item.roundCount} rounds
              </span>
            )}
            {item.storageLocation && (
              <span
                className="tree-node-location"
                style={{ marginLeft: "12px" }}
              >
                📍 {item.storageLocation}
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="tree-node-children-subgroup">
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Consulting inventory logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="error-msg">Failed to load armory inventory. {error}</p>
        <button onClick={fetchArmoryItems} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  // Helper to determine active item type subclasses
  const activeItemType =
    form.itemType ||
    (() => {
      if (!form.pewpewModelId) return "ArmoryItem";
      const p = products.find((prod) => prod.id === Number(form.pewpewModelId));
      if (!p) return "ArmoryItem";
      if (p.productType === "PewPew") return "PewArmoryItem";
      if (p.productType === "Suppressor") return "SuppressorArmoryItem";
      if (p.productType === "Optic") return "OpticArmoryItem";
      if (p.productType === "PewPewLight") return "LightArmoryItem";
      return "ArmoryItem";
    })();

  const isPewPew = activeItemType === "PewArmoryItem";
  const isNfa = !!form.isNfaItem;
  const needsBattery = (() => {
    if (
      activeItemType === "OpticArmoryItem" ||
      activeItemType === "LightArmoryItem"
    )
      return true;
    const p = products.find((prod) => prod.id === Number(form.pewpewModelId));
    return p?.hasBattery || false;
  })();

  return (
    <div className="armory-view">
      {/* Search and Filters Bar */}
      <section className="filter-bar">
        <div className="search-inputs">
          <input
            type="text"
            placeholder="Search manufacturers, models, serial numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={filterCaliber}
            onChange={(e) => setFilterCaliber(e.target.value)}
            className="filter-select"
          >
            <option value="">All Calibers</option>
            {uniqueCalibers.map((cal) => (
              <option key={cal} value={cal}>
                {cal}
              </option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="filter-select"
          >
            <option value="">All Actions</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
        <div className="header-actions">
          <div className="view-toggle-buttons">
            <button
              type="button"
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              Grid
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === "tree" ? "active" : ""}`}
              onClick={() => setViewMode("tree")}
              title="Hierarchy Tree View"
            >
              Tree View
            </button>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            Add Item
          </button>
        </div>
      </section>

      {/* Layout Display based on viewMode */}
      {viewMode === "tree" ? (
        <div className="treeview-panel panel">
          <h3
            style={{
              marginBottom: "24px",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🌿</span> Armory Hierarchy Tree
          </h3>
          <div className="treeview-container">
            {armoryItems
              .filter(
                (item) =>
                  item.parentItemId === null || item.parentItemId === undefined,
              )
              .map((rootItem) => renderTreeNode(rootItem))}
            {armoryItems.filter(
              (item) =>
                item.parentItemId === null || item.parentItemId === undefined,
            ).length === 0 && (
              <div
                className="empty-state"
                style={{ padding: "40px 0", textAlign: "center" }}
              >
                <p style={{ color: "var(--text-muted)" }}>
                  No parent items registered in inventory.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : /* Grid Display */
      filteredArmoryItems.length === 0 ? (
        <div className="empty-state panel">
          <h3>You have no items in your Armory.</h3>
          <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
            Click 'Add Item' above to add your first item.
          </p>
        </div>
      ) : (
        <section className="items-grid">
          {filteredArmoryItems.map((item) => (
            <div
              key={item.id}
              className="item-card"
              onClick={() => openEditModal(item)}
            >
              {/* Colored Top Accent Bar based on Arsenal context color */}
              <div
                className="card-top-accent"
                style={{
                  height: "4px",
                  width: "100%",
                  backgroundColor: item.arsenalColor || "#2563eb",
                  boxShadow: `0 2px 8px ${item.arsenalColor || "#2563eb"}80`,
                }}
              />
              <div className="item-header-img">
                <span className="item-action-type">{item.actionType}</span>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    className="active-cover-img"
                    alt={item.model}
                  />
                ) : (
                  <div className="item-silhouette">🛡️</div>
                )}
                <span
                  className={`badge item-badge-condition ${getConditionClass(item.condition ? (typeof item.condition === 'string' ? item.condition : (item.condition as any).name || "") : "")}`}
                >
                  {item.condition ? (typeof item.condition === 'string' ? item.condition : (item.condition as any).name || "") : ""}
                </span>
              </div>

              <div className="item-card-body">
                <div className="item-title-row">
                  <h4 className="item-title">
                    {item.manufacturerWebPageUrl ? (
                      <a
                        href={item.manufacturerWebPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {item.manufacturer}
                      </a>
                    ) : (
                      item.manufacturer
                    )}{" "}
                    {item.webPageUrl ? (
                      <a
                        href={item.webPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: "var(--color-primary)",
                          textDecoration: "none",
                          fontWeight: "600",
                        }}
                      >
                        {item.model}
                      </a>
                    ) : (
                      item.model
                    )}
                  </h4>
                  <span className="item-caliber">{item.caliber}</span>
                </div>

                <div className="item-details">
                  <div className="detail-row">
                    <span className="detail-label">Part Number</span>
                    <span className="detail-value">
                      {item.partNumber || "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Vault</span>
                    <span className="detail-value">
                      {item.storageLocation || ""}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Arsenal</span>
                    <span className="detail-value">
                      {item.arsenalName || "N/A"}
                    </span>
                  </div>
                  {item.purchasePrice && (
                    <div className="detail-row">
                      <span className="detail-label">Valuation</span>
                      <span className="detail-value gold-text">
                        ${formatCurrency(item.purchasePrice)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="item-card-actions">
                  <button
                    onClick={(e) => handleDeleteClick(item.id!, e)}
                    className="btn btn-danger btn-small"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Identical Audiobookshelf tabs modal overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="armory-center-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title-bar">
              <div className="title-left">
                <span className="modal-title-icon">🔥</span>
                <h3>{isEditMode ? "Edit Item" : "Add New Item"}</h3>
              </div>
              <button className="modal-close-x-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            {/* Modal Tabs strip */}
            <div className="modal-tabs-header-row">
              <button
                className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
                onClick={() => setActiveTab("general")}
              >
                General Specs
              </button>
              {isEditMode && (
                <button
                  className={`tab-btn ${activeTab === "accessories" ? "active" : ""}`}
                  onClick={() => setActiveTab("accessories")}
                >
                  Accessories
                </button>
              )}
            </div>

            {/* Scrollable Modal content wrapper */}
            <div className="modal-tabs-body-content">
              {/* TAB 1: General Specs */}
              {activeTab === "general" && (
                <div className="tab-pane">
                  <div className="form-grid-columns">
                    <div className="form-item" style={{ gridColumn: "span 2" }}>
                      <label>Select product from Catalog</label>
                      <select
                        value={form.pewpewModelId || ""}
                        onChange={handleProductSelectChange}
                        style={{
                          border: form.pewpewModelId
                            ? "1px solid var(--color-success)"
                            : "1px solid var(--border-solid)",
                        }}
                      >
                        <option value="">-- Choose product --</option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            [{prod.productType}] {prod.manufacturerName} -{" "}
                            {prod.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {Number(form.pewpewModelId) > 0 &&
                      (() => {
                        const selectedProduct = products.find(
                          (p) => p.id === Number(form.pewpewModelId),
                        );
                        return (
                          <div
                            className="specifications-card"
                            style={{
                              gridColumn: "span 2",
                              background: "rgba(255, 255, 255, 0.02)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "var(--radius-md)",
                              padding: "16px 20px",
                              marginTop: "4px",
                              marginBottom: "12px",
                              display: "flex",
                              gap: "20px",
                              alignItems: "center",
                            }}
                          >
                            {/* Square Image Thumbnail */}
                            {form.imageUrl ? (
                              <div
                                style={{
                                  width: "74px",
                                  height: "74px",
                                  borderRadius: "var(--radius-sm)",
                                  overflow: "hidden",
                                  border: "1px solid var(--border-solid)",
                                  background: "rgba(0,0,0,0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={form.imageUrl}
                                  alt="Item Thumbnail"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: "74px",
                                  height: "74px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px dashed var(--border-solid)",
                                  background: "rgba(255,255,255,0.01)",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "var(--text-muted)",
                                  fontSize: "10px",
                                  flexShrink: 0,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "18px",
                                    marginBottom: "2px",
                                  }}
                                >
                                  📷
                                </span>
                                No Image
                              </div>
                            )}

                            {/* Specification details */}
                            <div style={{ flexGrow: 1 }}>
                              <h4
                                style={{
                                  color: "var(--color-primary)",
                                  fontSize: "13px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  margin: "0 0 10px 0",
                                  fontWeight: "700",
                                }}
                              >
                                Product Specs
                              </h4>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "8px 16px",
                                  fontSize: "13px",
                                }}
                              >
                                <div>
                                  <strong
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    Manufacturer:
                                  </strong>{" "}
                                  {(selectedProduct as any)?.manufacturerWebPageUrl ? (
                                    <a
                                      href={
                                        (selectedProduct as any).manufacturerWebPageUrl
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: "var(--color-primary)",
                                        fontWeight: "600",
                                        textDecoration: "none",
                                      }}
                                    >
                                      {form.manufacturer} ↗
                                    </a>
                                  ) : (
                                    <span
                                      style={{
                                        color: "var(--text-primary)",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {form.manufacturer}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <strong
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    Model Name:
                                  </strong>{" "}
                                  {(selectedProduct as any)?.webPageUrl ? (
                                    <a
                                      href={(selectedProduct as any).webPageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: "var(--color-primary)",
                                        fontWeight: "600",
                                        textDecoration: "none",
                                      }}
                                    >
                                      {form.model} ↗
                                    </a>
                                  ) : (
                                    <span
                                      style={{
                                        color: "var(--text-primary)",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {form.model}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <strong
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    Part Number:
                                  </strong>{" "}
                                  <span
                                    style={{
                                      color: "var(--text-primary)",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {selectedProduct?.partNumber || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <strong
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    SKU:
                                  </strong>{" "}
                                  <span
                                    style={{
                                      color: "var(--text-primary)",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {selectedProduct?.sku || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    {isPewPew && (
                      <div
                        className="form-item-group-container"
                        style={{
                          gridColumn: "span 2",
                          background: "rgba(138, 79, 255, 0.03)",
                          border: "1px solid rgba(138, 79, 255, 0.15)",
                          borderRadius: "var(--radius-md)",
                          padding: "16px 20px",
                          marginTop: "4px",
                          marginBottom: "12px",
                        }}
                      >
                        <h4
                          style={{
                            color: "#8a4fff",
                            fontSize: "13px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            margin: "0 0 14px 0",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "15px" }}>🎯</span> Firearm &
                          Ballistics Specifications
                        </h4>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "14px",
                          }}
                        >
                          <div className="form-item">
                            <label
                              style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                              }}
                            >
                              Barrel Length (Inches)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={form.barrelLengthInches || ""}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  barrelLengthInches: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="form-item">
                            <label
                              style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                              }}
                            >
                              Twist Rate
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 1:10"
                              value={form.twistRate || ""}
                              onChange={(e) =>
                                setForm({ ...form, twistRate: e.target.value })
                              }
                            />
                          </div>

                          <div
                            className="form-item"
                            style={{ gridColumn: "span 2" }}
                          >
                            <label
                              style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                              }}
                            >
                              Thread Pitch
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 1/2x28, 5/8x24"
                              value={form.threadPitch || ""}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  threadPitch: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {isNfa && (
                      <div
                        className="form-item-group-container"
                        style={{
                          gridColumn: "span 2",
                          background: "rgba(235, 94, 85, 0.03)",
                          border: "1px solid rgba(235, 94, 85, 0.15)",
                          borderRadius: "var(--radius-md)",
                          padding: "16px 20px",
                          marginTop: "4px",
                          marginBottom: "12px",
                        }}
                      >
                        <h4
                          style={{
                            color: "#eb5e55",
                            fontSize: "13px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            margin: "0 0 14px 0",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "15px" }}>📁</span> National
                          Firearms Act (NFA) Registry Specs
                        </h4>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "14px",
                          }}
                        >
                          <div className="form-item">
                            <label
                              style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                              }}
                            >
                              ATF Form Type
                            </label>
                            <select
                              value={form.nfaFormType || ""}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  nfaFormType: e.target.value,
                                })
                              }
                            >
                              <option value="">-- Select ATF Form --</option>
                              {nfaFormTypes.map((f: any) => (
                                <option key={f.value} value={f.value}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item">
                            <label
                              style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                              }}
                            >
                              Stamp Approval Date
                            </label>
                            <input
                              type="date"
                              value={form.stampApprovalDate || ""}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  stampApprovalDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div
                            className="form-item"
                            style={{ gridColumn: "span 2" }}
                          >
                            <label
                              style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                              }}
                            >
                              Tax Stamp Document (PDF/URL)
                            </label>
                            <input
                              type="text"
                              placeholder="Secure document link or cloud bucket URL..."
                              value={form.taxStampDocumentUrl || ""}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  taxStampDocumentUrl: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <BatteryTracker
                      hasBattery={needsBattery}
                      form={form}
                      setForm={setForm}
                    />

                    <div className="form-item">
                      <label>Name<span className="req">*</span></label>
                      <input
                        type="string"
                        value={form.name || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>   

                    <div className="form-item">
                      <label>
                        Serial Number{" "}
                        <span style={{ color: "green" }}>
                          (256-AES Encryption)
                        </span>
                      </label>
                      <div className="passcode-input-wrapper">
                        <input
                          type={showSerial ? "text" : "password"}
                          className="passcode-field"
                          placeholder="Decrypted serial number..."
                          value={form.serialNumber || ""}
                          onChange={(e) =>
                            setForm({ ...form, serialNumber: e.target.value })
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-secondary passcode-reveal-btn"
                          onClick={() => setShowSerial(!showSerial)}
                        >
                          {showSerial ? "Hide 🔒" : "Show 👁️"}
                        </button>
                      </div>
                    </div>

                    <div className="form-item full-row">
                      <label>Description</label>
                      <textarea
                        rows={3}
                        value={form.description || ""}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        placeholder="Enter product description..."
                      />
                    </div> 

                    <div className="form-item">
                      <label>Purchase Price</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price paid"
                        value={form.purchasePrice || ""}
                        onChange={(e) =>
                          setForm({ ...form, purchasePrice: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-item">
                      <label>Purchase Date</label>
                      <input
                        type="date"
                        value={form.purchaseDateString || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            purchaseDateString: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-item">
                      <label>Estimated Value</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Estimated current value"
                        value={form.estimatedValue || ""}
                        onChange={(e) =>
                          setForm({ ...form, estimatedValue: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-item">
                      <label>Condition</label>
                      <select
                        value={form.condition}
                        onChange={(e) =>
                          setForm({ ...form, condition: e.target.value })
                        }
                      >
                        {conditions.map((p: any) => (
                          <option key={p.id} value={p.name}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Designated Owner</label>
                      <select
                        value={form.ownerId || ""}
                        onChange={(e) =>
                          setForm({ ...form, ownerId: e.target.value })
                        }
                      >
                        <option value="">-- No Owner Assigned --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Beneficiary</label>
                      <select
                        value={form.beneficiaryId || ""}
                        onChange={(e) =>
                          setForm({ ...form, beneficiaryId: e.target.value })
                        }
                      >
                        <option value="">-- No Beneficiary Assigned --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Vault</label>
                      <select
                        value={form.vaultId || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            vaultId: e.target.value
                              ? parseInt(e.target.value)
                              : "",
                          })
                        }
                      >
                        <option value="">None / Standalone</option>
                        {vaultLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} (
                            {loc.vaultCategory || loc.securityLevel || "N/A"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Arsenal</label>
                      <select
                        value={form.arsenalId || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            arsenalId: e.target.value,
                          }))
                        }
                        required
                      >
                        {store.arsenals.map((ars: any) => (
                          <option key={ars.id} value={ars.id}>
                            {ars.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "accessories" && (
                <div
                  className="tab-pane"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                    alignItems: "start",
                  }}
                >
                  {/* LEFT COLUMN: Currently Attached Accessories */}
                  <div
                    className="accessories-card"
                    style={{
                      background: "rgba(255, 255, 255, 0.01)",
                      border: "1px solid var(--border-solid, #203040)",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <h4
                      style={{
                        marginBottom: "16px",
                        color: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "1.05rem",
                        fontWeight: "600",
                      }}
                    >
                      <span>🔗</span> Accessories
                    </h4>

                    <div
                      className="mounted-list"
                      style={{
                        minHeight: "180px",
                        maxHeight: "350px",
                        overflowY: "auto",
                        paddingRight: "4px",
                      }}
                    >
                      {armoryItems.filter(
                        (item) => item.parentItemId === form.id,
                      ).length === 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "180px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.85rem",
                              fontStyle: "italic",
                              margin: 0,
                            }}
                          >
                            No accessories attached to this item.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {armoryItems
                            .filter((item) => item.parentItemId === form.id)
                            .map((acc) => (
                              <div
                                key={acc.id}
                                className="accessory-row"
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "10px 14px",
                                  background: "rgba(255,255,255,0.02)",
                                  border:
                                    "1px solid var(--border-color, #203040)",
                                  borderRadius: "8px",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "var(--color-primary)",
                                      fontSize: "1.1rem",
                                    }}
                                  >
                                    •
                                  </span>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "2px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: "600",
                                        fontSize: "0.9rem",
                                      }}
                                    >
                                      {acc.manufacturer} {acc.model}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.78rem",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      Caliber: {acc.caliber || "N/A"} • SN:{" "}
                                      {acc.serialNumber || "N/A"}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-small"
                                    style={{
                                      padding: "4px 8px",
                                      fontSize: "0.72rem",
                                      background: "transparent",
                                      border:
                                        "1px solid var(--text-muted, #718096)",
                                      color: "var(--text-muted, #718096)",
                                      height: "auto",
                                      minWidth: "0",
                                    }}
                                    onClick={() => openEditModal(acc)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-small"
                                    style={{
                                      padding: "4px 8px",
                                      fontSize: "0.72rem",
                                      background: "transparent",
                                      border: "1px solid #ef4444",
                                      color: "#ef4444",
                                      height: "auto",
                                      minWidth: "0",
                                    }}
                                    onClick={() =>
                                      handleDetachAccessory(acc.id!)
                                    }
                                  >
                                    Detach
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Attach & Create Controls */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {/* Card A: Attach Existing Accessory */}
                    <div
                      className="accessories-card"
                      style={{
                        background: "rgba(255, 255, 255, 0.01)",
                        border: "1px solid var(--border-solid, #203040)",
                        borderRadius: "10px",
                        padding: "20px",
                      }}
                    >
                      <h5
                        style={{
                          marginBottom: "14px",
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "0.95rem",
                          fontWeight: "600",
                        }}
                      >
                        Attach Existing Item
                      </h5>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <select
                          style={{
                            flex: 1,
                            height: "38px",
                            borderRadius: "6px",
                            padding: "0 12px",
                            fontSize: "0.85rem",
                          }}
                          value={selectedExistingId}
                          onChange={(e) =>
                            setSelectedExistingId(e.target.value)
                          }
                        >
                          <option value="">
                            -- Select from your unattached inventory --
                          </option>
                          {armoryItems
                            .filter(
                              (item) =>
                                item.id !== form.id && !item.parentItemId,
                            )
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.manufacturer} {item.model}{" "}
                                {item.caliber ? `(${item.caliber})` : ""}{" "}
                                {item.serialNumber
                                  ? `[SN: ${item.serialNumber}]`
                                  : ""}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            padding: "0 16px",
                            height: "38px",
                            fontSize: "0.85rem",
                            whiteSpace: "nowrap",
                          }}
                          onClick={handleAttachAccessory}
                          disabled={!selectedExistingId}
                        >
                          Attach Item
                        </button>
                      </div>
                    </div>

                    {/* Card B: Create & Attach New Accessory */}
                    <div
                      className="accessories-card"
                      style={{
                        background: "rgba(255, 255, 255, 0.01)",
                        border: "1px solid var(--border-solid, #203040)",
                        borderRadius: "10px",
                        padding: "20px",
                      }}
                    >
                      <h5
                        style={{
                          marginBottom: "14px",
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "0.95rem",
                          fontWeight: "600",
                        }}
                      >
                        Create &amp; Attach a new Item
                      </h5>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <select
                          style={{
                            flex: 1,
                            height: "38px",
                            borderRadius: "6px",
                            padding: "0 12px",
                            fontSize: "0.85rem",
                          }}
                          value={newAccProductId}
                          onChange={(e) => setNewAccProductId(e.target.value)}
                        >
                          <option value="">
                            -- Choose reference product --
                          </option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.manufacturerName} {p.model}{" "}
                              {p.partNumber ? `[PN: ${p.partNumber}]` : ""} (
                              {p.caliberName || "N/A"})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            padding: "0 16px",
                            height: "38px",
                            fontSize: "0.85rem",
                            whiteSpace: "nowrap",
                          }}
                          onClick={handleCreateAndAttachAccessory}
                          disabled={!newAccProductId || isCreatingAcc}
                        >
                          {isCreatingAcc ? "Creating..." : "Attach New"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer-row-container">
              <SubmitButton
                type="button"
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                isEditMode={isEditMode}
                onClick={handleSave}
              />
            </div>
          </div>
        </div>
      )}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: "400px" }}
          >
            <h3 style={{ marginBottom: "12px" }}>Are you sure?</h3>
            <p
              style={{
                marginBottom: "20px",
                color: "var(--text-muted)",
                fontSize: "0.95rem",
                lineHeight: "1.4",
              }}
            >
              This action will permanently delete this item from your armory.
              This cannot be undone.
            </p>
            <div
              className="modal-footer-row-container"
              style={{
                marginTop: "0",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
