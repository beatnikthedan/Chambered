import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import "./Products.css";
import SubmitButton from "../components/SubmitButton";
import ProductDocumentsTable from "../components/ProductDocumentsTable";

import {
  useGetProducts,
  usePostProducts,
  usePatchProductsFromKey,
  useDeleteProductsFromKey,
  useGetManufacturers,
  useGetCalibers,
  useGetProductsArmoryItemsFromKey,
  useGetProductsProductDocumentsFromKey,
  useGetProductsProductTypes,
} from "../api/endpoints";
import type { Product } from "../api/models/product";
import type { Manufacturer } from "../api/models/manufacturer";
import type { Caliber } from "../api/models/caliber";
import SecureImage, { useSecureImage } from "../components/SecureImage";

interface ExtendedProduct extends Omit<Product, "productType"> {
  productType: string;
  manufacturerName: string;
  caliberName: string;
  [key: string]: any;
}

interface ProductForm {
  id: number;
  productType: string;
  name: string;
  description: string;
  partNumber: string;
  sku: string;
  manufacturerId: string | number;
  webPageUrl: string;
  specifications: Record<string, any>;
  caliberId: string | number;
  pewPewCategory: string;
  actionType: string;
  isNfaItem: boolean;
  minMagnification: string | number;
  maxMagnification: string | number;
  objectiveDiameterMm: string | number;
  opticType: string;
  reticle: string;
  adjustmentUnits: string;
  tubeDiameter: string;
  isIlluminated: boolean;
  hasBattery: boolean;
  batteryType: string;
  threadPitch: string;
  attachmentType: string;
  material: string;
  soundReductionDb: string | number;
  isFullAutoRated: boolean;
  isUserServiceable: boolean;
  lumens: string | number;
  candela: string | number;
  mountType: string;
  laserColor: string;
  hasRemoteSwitchPort: boolean;
  isInfraredCapable: boolean;
  lockType: string;
  coverImageId: number | null;
}

const extractSpecifications = (product: any): Record<string, any> => {
  if (!product) return {};
  const staticKeys = new Set([
    "id",
    "name",
    "partNumber",
    "sku",
    "manufacturerId",
    "description",
    "webPageUrl",
    "productType",
    "created",
    "modified",
    "createdBy",
    "modifiedBy",
    "manufacturer",
    "productDocuments",
    "armoryItems",
    "coverImageId",
    "coverImage",
    "caliberId",
    "pewPewCategory",
    "actionType",
    "isNfaItem",
    "caliber",
    "minMagnification",
    "maxMagnification",
    "objectiveDiameterMm",
    "opticType",
    "reticle",
    "adjustmentUnits",
    "tubeDiameter",
    "isIlluminated",
    "hasBattery",
    "batteryType",
    "threadPitch",
    "attachmentType",
    "material",
    "soundReductionDb",
    "isFullAutoRated",
    "isUserServiceable",
    "lumens",
    "candela",
    "mountType",
    "laserColor",
    "hasRemoteSwitchPort",
    "isInfraredCapable",
    "lockType",
    "manufacturerName",
    "caliberName",
    "@odata.type",
    "@odata.context",
  ]);

  const specs: Record<string, any> = {};
  Object.keys(product).forEach((key) => {
    if (!staticKeys.has(key)) {
      specs[key] = product[key];
    }
  });
  return specs;
};

function ProductListCard({
  p,
  isSelected,
  onClick,
}: {
  p: ExtendedProduct;
  isSelected: boolean;
  onClick: () => void;
}) {
  const imageUrl = p.coverImageId
    ? `/api/v1/ProductDocuments/${p.coverImageId}/Download`
    : null;
  const blobUrl = useSecureImage(imageUrl);

  return (
    <div
      className={`catalog-list-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      style={{
        backgroundImage: blobUrl
          ? `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.85)), url(${blobUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <span className="card-badge">{p.productType}</span>
      <span className="mfg-tag">{p.manufacturerName}</span>
      <h4>{p.name}</h4>
      <span className="sku-part-info">
        PN: {p.partNumber || "None"} | SKU: {p.sku || "None"}
      </span>
      <p className="card-desc-preview">
        {p.description || "No model description loaded."}
      </p>
    </div>
  );
}

export default function Products() {
  const queryClient = useQueryClient();
  const store = useStore();
  const { enums } = store || {};

  const { data: productTypesData } = useGetProductsProductTypes();
  const productTypes = useMemo(() => {
    return productTypesData?.data?.value || [];
  }, [productTypesData]);

  // Fetch collections via Orval
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProducts({
    expand:
      "manufacturer,Chambered.Data.Models.PewPew/caliber,Chambered.Data.Models.Suppressor/caliber",
  });

  const { data: manufacturersData, isLoading: mfgsLoading } = useGetManufacturers();
  const { data: calibersData, isLoading: calibersLoading } = useGetCalibers();

  // Selected records
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);

  // Fetch documents for the selected product to populate cover image selector
  const { data: selectedProductDocsData } =
    useGetProductsProductDocumentsFromKey(selectedProduct?.id || 0, undefined, {
      query: {
        enabled: !!selectedProduct?.id && selectedProduct.id > 0,
      },
    });

  const productDocumentsRaw = selectedProductDocsData?.data;
  const productDocuments = useMemo(() => {
    return Array.isArray(productDocumentsRaw)
      ? productDocumentsRaw
      : (productDocumentsRaw as any)?.value || [];
  }, [productDocumentsRaw]);

  // Layout View Modes ("table" or "card")
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Interaction State (Modal overlays replace inline isEditing)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("general"); // 'general' | 'subclass' | 'specifications'

  // Dynamic specifications key-value editor local state
  const [customSpecs, setCustomSpecs] = useState<{ key: string; value: string }[]>([]);

  // Search & Sorting popovers active states
  const [showFilterPopover, setShowFilterPopover] = useState<boolean>(false);
  const [showSortPopover, setShowSortPopover] = useState<boolean>(false);

  // Base Data arrays
  const productsList = useMemo(
    () => (productsData?.data?.value || []) as Product[],
    [productsData],
  );
  const manufacturersList = useMemo(
    () => (manufacturersData?.data?.value || []) as Manufacturer[],
    [manufacturersData],
  );
  const calibersList = useMemo(
    () => (calibersData?.data?.value || []) as Caliber[],
    [calibersData],
  );

  // References for clicks outside popovers
  const filterRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  // Search, Sorters & Filters state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([]);
  const [selectedMfgFilters, setSelectedMfgFilters] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Quick Add state
  const [quickAddType, setQuickAddType] = useState<string>("Product");
  const [quickAddMfgId, setQuickAddMfgId] = useState<string>("");
  const [quickAddModel, setQuickAddModel] = useState<string>("");
  const [quickAddPartNo, setQuickAddPartNo] = useState<string>("");
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);
  const [quickSaveSuccess, setQuickSaveSuccess] = useState<boolean>(false);

  const handleHeaderSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Enums memoizations
  const suppressorMaterials = enums?.suppressorMaterials || [];
  const suppressorAttachmentTypes = enums?.suppressorAttachmentTypes || [];
  const opticReticles = enums?.opticReticles || [];
  const opticAdjustmentUnits = enums?.opticAdjustmentUnits || [];
  const batteryTypes = enums?.batteryTypes || [];
  const actionTypes = enums?.actionTypes || [];
  const pewPewCategories = enums?.pewPewCategories || [];
  const opticTypes = enums?.opticTypes || [];
  const laserColors = enums?.laserColors || [];
  const lightMountTypes = enums?.lightMountTypes || [];
  const lockTypes = enums?.lockTypes || [];

  const documentTypes = useMemo(() => [
    { id: "0", name: "UserManual" },
    { id: "1", name: "Schematic" },
    { id: "2", name: "Warranty" },
    { id: "3", name: "Invoice" },
    { id: "4", name: "Receipt" },
    { id: "5", name: "ProductImage" },
    { id: "6", name: "Other" }
  ], []);

  // Edit/Create Form State
  const [form, setForm] = useState<ProductForm>({
    id: 0,
    productType: "PewPew",
    name: "",
    description: "",
    partNumber: "",
    sku: "",
    manufacturerId: "",
    webPageUrl: "",
    specifications: {},
    caliberId: "",
    pewPewCategory: "",
    actionType: "",
    isNfaItem: false,
    minMagnification: "",
    maxMagnification: "",
    objectiveDiameterMm: "",
    opticType: "",
    reticle: "",
    adjustmentUnits: "",
    tubeDiameter: "",
    isIlluminated: false,
    hasBattery: false,
    batteryType: "",
    threadPitch: "",
    attachmentType: "",
    material: "",
    soundReductionDb: "",
    isFullAutoRated: false,
    isUserServiceable: false,
    lumens: "",
    candela: "",
    mountType: "",
    laserColor: "",
    hasRemoteSwitchPort: false,
    isInfraredCapable: false,
    lockType: "",
    coverImageId: null,
  });

  // Query Related Physical Armory Items for Product Bottom-Right Panel
  const { data: relatedArmoryItemsData, isLoading: relatedArmoryItemsLoading } =
    useGetProductsArmoryItemsFromKey(selectedProduct?.id || 0, undefined, {
      query: {
        enabled: !!selectedProduct?.id && selectedProduct.id > 0,
      },
    });

  // Mutations
  const createProductMutation = usePostProducts({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
        if (res?.data) {
          const newProd = res.data as any;
          setSelectedProduct(newProd);
          setForm((prev) => ({
            ...prev,
            id: newProd.id,
          }));
        }
      },
      onError: (err: any) => {
        alert("Failed to create product: " + (err?.message || "Unknown error"));
        setIsSaving(false);
      },
    },
  });

  const updateProductMutation = usePatchProductsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
      },
      onError: (err: any) => {
        alert("Failed to save product: " + (err?.message || "Unknown error"));
        setIsSaving(false);
      },
    },
  });

  const deleteProductMutation = useDeleteProductsFromKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Products"] });
        setSelectedProduct(null);
      },
      onError: (err: any) =>
        alert("Failed to delete product: " + (err?.message || "Unknown error")),
    },
  });

  // Handle outside clicks for popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPopover(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortPopover(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Process and sort products list
  const processedProducts = useMemo(() => {
    let result = productsList.map((p) => {
      const manufacturer =
        p.manufacturer ||
        manufacturersList.find((m) => m.id === p.manufacturerId);
      const caliber =
        p.caliber || calibersList.find((c) => c.id === p.caliberId);

      let type = p.productType;
      if (!type && p["@odata.type"]) {
        const parts = p["@odata.type"].split(".");
        type = parts[parts.length - 1];
      }
      if (!type) type = "Product";

      return {
        ...p,
        productType: type,
        manufacturerName: manufacturer?.name || "",
        caliberName: caliber?.name || "",
      } as ExtendedProduct;
    });

    // Search filter
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name!.toLowerCase().includes(search) ||
          (p.partNumber && p.partNumber.toLowerCase().includes(search)) ||
          (p.sku && p.sku.toLowerCase().includes(search)) ||
          p.manufacturerName.toLowerCase().includes(search),
      );
    }

    // Type filters
    if (selectedTypeFilters.length > 0) {
      result = result.filter((p) =>
        selectedTypeFilters.includes(p.productType),
      );
    }

    // Manufacturer filters
    if (selectedMfgFilters.length > 0) {
      result = result.filter(
        (p) =>
          p.manufacturerId !== undefined &&
          selectedMfgFilters.includes(p.manufacturerId),
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortKey === "name") {
        valA = a.name!.toLowerCase();
        valB = b.name!.toLowerCase();
      } else if (sortKey === "sku") {
        valA = (a.sku || "").toLowerCase();
        valB = (b.sku || "").toLowerCase();
      } else if (sortKey === "partNumber") {
        valA = (a.partNumber || "").toLowerCase();
        valB = (b.partNumber || "").toLowerCase();
      } else if (sortKey === "manufacturer") {
        valA = a.manufacturerName.toLowerCase();
        valB = b.manufacturerName.toLowerCase();
      } else if (sortKey === "type") {
        valA = a.productType.toLowerCase();
        valB = b.productType.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    productsList,
    manufacturersList,
    calibersList,
    searchTerm,
    selectedTypeFilters,
    selectedMfgFilters,
    sortKey,
    sortDirection,
  ]);

  // Automatically select first item if none is selected
  useEffect(() => {
    if (!selectedProduct && processedProducts.length > 0) {
      setSelectedProduct(processedProducts[0]);
    }
  }, [processedProducts, selectedProduct]);

  // Sync selectedProduct with the fresh data from the list
  useEffect(() => {
    if (selectedProduct && processedProducts.length > 0) {
      const freshProduct = processedProducts.find(
        (p) => p.id === selectedProduct.id,
      );
      if (freshProduct) {
        if (freshProduct !== selectedProduct) {
          setSelectedProduct(freshProduct);
        }
      } else {
        setSelectedProduct(processedProducts[0] || null);
      }
    }
  }, [processedProducts, selectedProduct]);

  // Sync custom specifications editor
  useEffect(() => {
    if (form.specifications) {
      const pairs = Object.entries(form.specifications).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setCustomSpecs(pairs);
    } else {
      setCustomSpecs([]);
    }
  }, [form.specifications]);

  const updateSpecsDictionary = (
    updatedPairs: { key: string; value: string }[],
  ) => {
    const dictionary: Record<string, string> = {};
    updatedPairs.forEach((p) => {
      if (p.key.trim()) {
        dictionary[p.key.trim()] = p.value;
      }
    });
    setForm((f) => ({ ...f, specifications: dictionary }));
  };

  const handleCustomSpecChange = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    const updated = customSpecs.map((spec, i) => {
      if (i === index) {
        return { ...spec, [field]: val };
      }
      return spec;
    });
    setCustomSpecs(updated);
    updateSpecsDictionary(updated);
  };

  const addCustomSpec = () => {
    const updated = [...customSpecs, { key: "", value: "" }];
    setCustomSpecs(updated);
  };

  const removeCustomSpec = (index: number) => {
    const updated = customSpecs.filter((_, i) => i !== index);
    setCustomSpecs(updated);
    updateSpecsDictionary(updated);
  };

  // Switch right panel to editing mode with a blank product
  const startAddProduct = () => {
    setIsEditMode(false);
    setActiveTab("general");
    setForm({
      id: 0,
      productType: "PewPew",
      name: "",
      description: "",
      partNumber: "",
      sku: "",
      manufacturerId: manufacturersList[0]?.id || "",
      webPageUrl: "",
      specifications: {},
      caliberId: calibersList[0]?.id || "",
      pewPewCategory: pewPewCategories[0]?.id || "",
      actionType: actionTypes[0]?.id || "",
      isNfaItem: false,
      minMagnification: "",
      maxMagnification: "",
      objectiveDiameterMm: "",
      opticType: opticTypes[0]?.id || "",
      reticle: opticReticles[0]?.id || "",
      adjustmentUnits: opticAdjustmentUnits[0]?.id || "",
      tubeDiameter: "",
      isIlluminated: false,
      hasBattery: false,
      batteryType: batteryTypes[0]?.id || "",
      threadPitch: "",
      attachmentType: suppressorAttachmentTypes[0]?.id || "",
      material: suppressorMaterials[0]?.id || "",
      soundReductionDb: "",
      isFullAutoRated: false,
      isUserServiceable: false,
      lumens: "",
      candela: "",
      mountType: lightMountTypes[0]?.id || "",
      laserColor: laserColors[0]?.id || "",
      hasRemoteSwitchPort: false,
      isInfraredCapable: false,
      lockType: lockTypes[0]?.id || "",
      coverImageId: null,
    });
    setCustomSpecs([]);
    setShowModal(true);
  };

  // Switch right panel to editing mode with selected product
  const startEditProduct = () => {
    if (!selectedProduct) return;
    setIsEditMode(true);
    setActiveTab("general");

    const specs = extractSpecifications(selectedProduct);
    const specsArray = Object.entries(specs).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setCustomSpecs(specsArray);

    setForm({
      id: selectedProduct.id || 0,
      productType: selectedProduct.productType || "Product",
      name: selectedProduct.name || "",
      description: selectedProduct.description || "",
      partNumber: selectedProduct.partNumber || "",
      sku: selectedProduct.sku || "",
      manufacturerId: selectedProduct.manufacturerId || "",
      webPageUrl: selectedProduct.webPageUrl || "",
      specifications: extractSpecifications(selectedProduct),
      caliberId: (selectedProduct as any).caliberId || "",
      pewPewCategory: (selectedProduct as any).pewPewCategory || "",
      actionType: (selectedProduct as any).actionType || "",
      isNfaItem: !!(selectedProduct as any).isNfaItem,
      minMagnification: (selectedProduct as any).minMagnification || "",
      maxMagnification: (selectedProduct as any).maxMagnification || "",
      objectiveDiameterMm: (selectedProduct as any).objectiveDiameterMm || "",
      opticType: (selectedProduct as any).opticType || "",
      reticle: (selectedProduct as any).reticle || "",
      adjustmentUnits: (selectedProduct as any).adjustmentUnits || "",
      tubeDiameter: (selectedProduct as any).tubeDiameter || "",
      isIlluminated: !!(selectedProduct as any).isIlluminated,
      hasBattery: !!(selectedProduct as any).hasBattery,
      batteryType: (selectedProduct as any).batteryType || "",
      threadPitch: (selectedProduct as any).threadPitch || "",
      attachmentType: (selectedProduct as any).attachmentType || "",
      material: (selectedProduct as any).material || "",
      soundReductionDb: (selectedProduct as any).soundReductionDb || "",
      isFullAutoRated: !!(selectedProduct as any).isFullAutoRated,
      isUserServiceable: !!(selectedProduct as any).isUserServiceable,
      lumens: (selectedProduct as any).lumens || "",
      candela: (selectedProduct as any).candela || "",
      mountType: (selectedProduct as any).mountType || "",
      laserColor: (selectedProduct as any).laserColor || "",
      hasRemoteSwitchPort: !!(selectedProduct as any).hasRemoteSwitchPort,
      isInfraredCapable: !!(selectedProduct as any).isInfraredCapable,
      lockType: (selectedProduct as any).lockType || "",
      coverImageId: (selectedProduct as any).coverImageId || null,
    });
    setShowModal(true);
  };

  const buildProductPayload = (targetForm: ProductForm) => {
    const type = targetForm.productType || "Product";
    const payload: any = {};
    if (type !== "Product") {
      payload["@odata.type"] = `#Chambered.Data.Models.${type}`;
    }

    payload.id = targetForm.id || 0;
    payload.name = targetForm.name || "";
    payload.partNumber = targetForm.partNumber || "";
    payload.sku = targetForm.sku || "";
    payload.manufacturerId =
      parseInt(targetForm.manufacturerId as string, 10) || 0;
    payload.description = targetForm.description || null;
    payload.webPageUrl = targetForm.webPageUrl || null;
    payload.coverImageId = targetForm.coverImageId
      ? parseInt(targetForm.coverImageId as any, 10)
      : null;

    if (targetForm.specifications) {
      Object.entries(targetForm.specifications).forEach(([key, value]) => {
        payload[key] = value;
      });
    }

    if (type === "PewPew") {
      payload.caliberId = parseInt(targetForm.caliberId as string, 10) || null;
      payload.pewPewCategory = targetForm.pewPewCategory || null;
      payload.actionType = targetForm.actionType || null;
      payload.isNfaItem = !!targetForm.isNfaItem;
    } else if (type === "Optic") {
      payload.minMagnification =
        parseFloat(targetForm.minMagnification as string) || 1.0;
      payload.maxMagnification =
        parseFloat(targetForm.maxMagnification as string) || 1.0;
      payload.objectiveDiameterMm =
        parseInt(targetForm.objectiveDiameterMm as string, 10) || 0;
      payload.opticType = targetForm.opticType || null;
      payload.reticle = targetForm.reticle || null;
      payload.adjustmentUnits = targetForm.adjustmentUnits || null;
      payload.tubeDiameter = targetForm.tubeDiameter || null;
      payload.isIlluminated = !!targetForm.isIlluminated;
      payload.hasBattery = !!targetForm.hasBattery;
      payload.batteryType = targetForm.hasBattery
        ? targetForm.batteryType
        : null;
    } else if (type === "Suppressor") {
      payload.caliberId = parseInt(targetForm.caliberId as string, 10) || null;
      payload.threadPitch = targetForm.threadPitch || null;
      payload.attachmentType = targetForm.attachmentType || null;
      payload.material = targetForm.material || null;
      payload.soundReductionDb =
        parseInt(targetForm.soundReductionDb as string, 10) || null;
      payload.isFullAutoRated = !!targetForm.isFullAutoRated;
      payload.isUserServiceable = !!targetForm.isUserServiceable;
    } else if (type === "PewPewLight") {
      payload.lumens = parseInt(targetForm.lumens as string, 10) || 0;
      payload.candela = parseInt(targetForm.candela as string, 10) || 0;
      payload.mountType = targetForm.mountType || null;
      payload.laserColor = targetForm.laserColor || null;
      payload.hasRemoteSwitchPort = !!targetForm.hasRemoteSwitchPort;
      payload.isInfraredCapable = !!targetForm.isInfraredCapable;
    } else if (type === "Security") {
      payload.lockType = targetForm.lockType || null;
    }

    // Clean payload of navigation objects to avoid OData issues
    Object.keys(payload).forEach((key) => {
      if (
        payload[key] !== null &&
        typeof payload[key] === "object" &&
        key !== "specifications"
      ) {
        delete payload[key];
      }
    });

    return payload;
  };

  const handleQuickAddSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddModel.trim() || !quickAddMfgId) return;

    setIsQuickSaving(true);

    const tempForm: ProductForm = {
      id: 0,
      productType: quickAddType as any,
      name: quickAddModel.trim(),
      description: "",
      partNumber: quickAddPartNo.trim(),
      sku: "",
      manufacturerId: quickAddMfgId,
      webPageUrl: "",
      specifications: {},
      caliberId: calibersList[0]?.id || "",
      pewPewCategory: pewPewCategories[0]?.id || "",
      actionType: actionTypes[0]?.id || "",
      isNfaItem: false,
      minMagnification: "",
      maxMagnification: "",
      objectiveDiameterMm: "",
      opticType: opticTypes[0]?.id || "",
      reticle: opticReticles[0]?.id || "",
      adjustmentUnits: opticAdjustmentUnits[0]?.id || "",
      tubeDiameter: quickAddType === "Optic" ? "Unknown" : "",
      isIlluminated: false,
      hasBattery: false,
      batteryType: batteryTypes[0]?.id || "",
      threadPitch: "",
      attachmentType: suppressorAttachmentTypes[0]?.id || "",
      material: suppressorMaterials[0]?.id || "",
      soundReductionDb: "",
      isFullAutoRated: false,
      isUserServiceable: false,
      lumens: "",
      candela: "",
      mountType: lightMountTypes[0]?.id || "",
      laserColor: laserColors[0]?.id || "",
      hasRemoteSwitchPort: false,
      isInfraredCapable: false,
      lockType: lockTypes[0]?.id || "",
      coverImageId: null,
    };

    const payload = buildProductPayload(tempForm);

    try {
      await createProductMutation.mutateAsync({ data: payload });
      setQuickSaveSuccess(true);
      setTimeout(() => setQuickSaveSuccess(false), 2000);
      setQuickAddModel("");
      setQuickAddPartNo("");
    } catch (err) {
      console.error("Failed to quick add product:", err);
    } finally {
      setIsQuickSaving(false);
    }
  };

  // Form Saves
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    const payload = buildProductPayload(form);

    try {
      if (form.id > 0) {
        await updateProductMutation.mutateAsync({
          key: form.id,
          data: payload,
        });
        const cleanedSelected = { ...selectedProduct } as any;
        const oldSpecs = extractSpecifications(selectedProduct);
        Object.keys(oldSpecs).forEach((key) => {
          delete cleanedSelected[key];
        });

        setSelectedProduct({
          ...cleanedSelected,
          ...payload,
          productType: form.productType || "Product",
        } as ExtendedProduct);
      } else {
        await createProductMutation.mutateAsync({ data: payload });
      }
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct?.id) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${selectedProduct.name}"?`,
      )
    ) {
      deleteProductMutation.mutate({ key: selectedProduct.id });
    }
  };

  // Helper labels & display
  const renderSubAttributesText = (p: ExtendedProduct) => {
    if (p.productType === "PewPew") {
      return `Category: ${p.pewPewCategory || "N/A"} | Caliber: ${p.caliberName || "Unknown"} | Action: ${p.actionType || "N/A"}`;
    }
    if (p.productType === "Optic") {
      return `Type: ${p.opticType || "N/A"} | Magnification: ${p.minMagnification}-${p.maxMagnification}x | Reticle: ${p.reticle || "N/A"}`;
    }
    if (p.productType === "Suppressor") {
      return `Material: ${p.material || "N/A"} | Pitch: ${p.threadPitch || "N/A"} | Sound: -${p.soundReductionDb || 0}dB`;
    }
    if (p.productType === "PewPewLight") {
      return `Lumens: ${p.lumens || 0}lm | Candela: ${p.candela || 0}cd | Mount: ${p.mountType || "N/A"}`;
    }
    if (p.productType === "Security") {
      return `Locking: ${p.lockType || "N/A"}`;
    }
    return "";
  };

  const getConditionClass = (cond?: string | null) => {
    if (!cond) return "badge-success";
    const c = cond.toLowerCase();
    if (c.includes("unfired") || c.includes("excel") || c.includes("very"))
      return "badge-success";
    if (c.includes("good") || c.includes("fair")) return "badge-warning";
    return "badge-danger";
  };

  // Reusable control that renders BOTH the checkbox and the battery dropdown
  const renderBatteryControl = (checkboxLabel = "Requires Battery") => {
    return (
      <>
        <div
          className="form-item checkbox-row full-row"
          style={{ marginBottom: "14px" }}
        >
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={form.hasBattery || false}
              onChange={(e) =>
                setForm({ ...form, hasBattery: e.target.checked })
              }
            />
            <span className="checkmark"></span>
            <span>{checkboxLabel}</span>
          </label>
        </div>

        {form.hasBattery && (
          <div className="form-item">
            <label>Battery Type</label>
            <select
              value={form.batteryType || ""}
              onChange={(e) =>
                setForm({ ...form, batteryType: e.target.value })
              }
            >
              {batteryTypes.map((bat: any) => (
                <option key={bat.id} value={bat.id}>
                  {bat.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </>
    );
  };

  if (productsLoading || mfgsLoading || calibersLoading) {
    return <div className="loading-state">Loading catalog data...</div>;
  }

  if (productsError) {
    return (
      <div className="error-alert">
        Error loading catalog: {(productsError as any)?.message}
      </div>
    );
  }

  return (
    <div className="catalog-split-view">
      {/* LEFT 2/3: MASTER LIST PANEL */}
      <div className="master-panel">
        <div className="view-actions-row">
          {/* SEARCH BAR */}
          <div className="search-filters-group">
            <input
              type="text"
              placeholder="Search model, SKU, or manufacturer..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* ADVANCED FILTER BUTTON */}
            <div className="popover-wrapper" ref={filterRef}>
              <button
                className={`control-popover-btn ${selectedTypeFilters.length > 0 || selectedMfgFilters.length > 0 ? "active-filters" : ""}`}
                onClick={() => setShowFilterPopover(!showFilterPopover)}
              >
                Filter
                {selectedTypeFilters.length + selectedMfgFilters.length > 0 && (
                  <span className="filter-badge">
                    {selectedTypeFilters.length + selectedMfgFilters.length}
                  </span>
                )}
              </button>
              {showFilterPopover && (
                <div className="abs-popover-panel filter-popover">
                  <div className="popover-sec">
                    <h5>Product Types</h5>
                    <div className="options-grid">
                      {[
                        "PewPew",
                        "Optic",
                        "Suppressor",
                        "PewPewLight",
                        "Security",
                        "Product",
                      ].map((type) => (
                        <label key={type} className="popover-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedTypeFilters.includes(type)}
                            onChange={() => {
                              setSelectedTypeFilters((prev) =>
                                prev.includes(type)
                                  ? prev.filter((t) => t !== type)
                                  : [...prev, type],
                              );
                            }}
                          />
                          <span>
                            {type === "Product" ? "General" : type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="popover-sec">
                    <h5>Manufacturers</h5>
                    <div className="options-grid scrollable-options">
                      {manufacturersList.map((m) => (
                        <label key={m.id} className="popover-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedMfgFilters.includes(m.id!)}
                            onChange={() => {
                              setSelectedMfgFilters((prev) =>
                                prev.includes(m.id!)
                                  ? prev.filter((id) => id !== m.id)
                                  : [...prev, m.id!],
                              );
                            }}
                          />
                          <span>{m.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="popover-actions">
                    <button
                      className="clear-btn"
                      onClick={() => {
                        setSelectedTypeFilters([]);
                        setSelectedMfgFilters([]);
                        setSearchTerm("");
                      }}
                    >
                      Clear All
                    </button>
                    <button
                      className="close-btn"
                      onClick={() => setShowFilterPopover(false)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VIEW SWITCHER & ADD BUTTONS */}
          <div className="actions-right-group">
            <div className="view-mode-toggle">
              <button
                className={`toggle-icon-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                List
              </button>
              <button
                className={`toggle-icon-btn ${viewMode === "card" ? "active" : ""}`}
                onClick={() => setViewMode("card")}
                title="Card View"
              >
                Cards
              </button>
            </div>

            <button className="add-master-btn" onClick={startAddProduct}>
              Add Product
            </button>
          </div>
        </div>

        {/* MASTER LIST CONTENT CONTAINER */}
        <div className="master-list-scroller">
          {processedProducts.length === 0 ? (
            <div className="empty-state">
              No matching catalog products found.
            </div>
          ) : viewMode === "table" ? (
            <>
              {/* QUICK ADD ROW */}
              <div className="quick-add-container">
                <span className="quick-add-label">QUICK ADD</span>
                <form className="quick-add-form" onSubmit={handleQuickAddSave}>
                  <select
                    className="quick-add-select"
                    value={quickAddType}
                    onChange={(e) => setQuickAddType(e.target.value)}
                  >
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    className="quick-add-select"
                    value={quickAddMfgId}
                    onChange={(e) => setQuickAddMfgId(e.target.value)}
                  >
                    <option value="">-- Select Manufacturer --</option>
                    {manufacturersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    className="quick-add-input"
                    placeholder="Model Name"
                    value={quickAddModel}
                    onChange={(e) => setQuickAddModel(e.target.value)}
                  />

                  <input
                    type="text"
                    className="quick-add-input"
                    placeholder="Part Number"
                    value={quickAddPartNo}
                    onChange={(e) => setQuickAddPartNo(e.target.value)}
                  />

                  <SubmitButton
                    isSaving={isQuickSaving}
                    saveSuccess={quickSaveSuccess}
                    isEditMode={false}
                    createLabel="Save"
                    style={{ height: "38px" }}
                  />
                </form>
              </div>

              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}></th>
                    <th
                      onClick={() => handleHeaderSort("type")}
                      style={{
                        cursor: "pointer",
                        userSelect: "none",
                        textAlign: "center",
                      }}
                    >
                      Type{" "}
                      {sortKey === "type" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleHeaderSort("manufacturer")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Manufacturer{" "}
                      {sortKey === "manufacturer" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleHeaderSort("name")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Model Name{" "}
                      {sortKey === "name" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleHeaderSort("partNumber")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Part Number{" "}
                      {sortKey === "partNumber" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleHeaderSort("sku")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      SKU{" "}
                      {sortKey === "sku" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className={`table-row-item ${selectedProduct?.id === p.id ? "selected" : ""}`}
                      onClick={() => setSelectedProduct(p)}
                    >
                      <td
                        style={{
                          width: "40px",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        {p.coverImageId ? (
                          <SecureImage
                            src={`/api/v1/ProductDocuments/${p.coverImageId}/Download`}
                            alt={p.name}
                            style={{
                              width: "28px",
                              height: "28px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid var(--border-color)",
                              backgroundColor: "var(--bg-input)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "4px",
                              border: "1px solid var(--border-color)",
                              backgroundColor: "transparent",
                              boxSizing: "border-box",
                            }}
                          />
                        )}
                      </td>
                      <td
                        className="type-badge-cell"
                        style={{
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        <span
                          className={`type-badge ${p.productType.toLowerCase()}`}
                        >
                          {p.productType}
                        </span>
                      </td>
                      <td>{p.manufacturerName}</td>
                      <td className="bold-name-cell">{p.name}</td>
                      <td className="text-muted text-mono">
                        {p.partNumber || "N/A"}
                      </td>
                      <td className="text-muted text-mono">
                        {p.sku || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            /* CARD VIEW MODE */
            <div className="split-view-cards-grid">
              {processedProducts.map((p) => (
                <ProductListCard
                  key={p.id}
                  p={p}
                  isSelected={selectedProduct?.id === p.id}
                  onClick={() => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* TABLE FOOTER ROW */}
        {viewMode === "table" && productsList.length > 0 && (
          <div className="table-footer-row">
            <div>
              {processedProducts.length} of {productsList.length} products
            </div>
            <div className="footer-actions">
              <button
                type="button"
                className="footer-btn"
                onClick={() => alert("GRT import functionality is a stub.")}
              >
                Import
              </button>
              <button
                type="button"
                className="footer-btn"
                onClick={() => {
                  const headers = [
                    "Type",
                    "Manufacturer",
                    "Model Name",
                    "Part Number",
                    "SKU",
                  ];
                  const rows = processedProducts.map((p) => [
                    p.productType,
                    p.manufacturerName,
                    p.name,
                    p.partNumber || "N/A",
                    p.sku || "N/A",
                  ]);
                  const csvContent = [
                    headers.join(","),
                    ...rows.map((e) =>
                      e
                        .map((val) => `"${val.replace(/"/g, '""')}"`)
                        .join(","),
                    ),
                  ].join("\n");
                  const blob = new Blob([csvContent], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute(
                    "download",
                    `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
                  );
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Export
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT 1/3: DETAILS COLUMN WITH DUAL TILED MASTER-DETAIL VIEW */}
      <div className="right-pane-column">
        {/* TOP PANEL: PRIMARY SELECTED META DETAILS */}
        <div className="detail-panel">
          {!selectedProduct ? (
            <div className="empty-detail-state">
              <span className="icon">📦</span>
              <h3>No Product Selected</h3>
              <p>
                Select a product from the list on the left, or add a brand-new
                entry.
              </p>
              <button className="add-master-btn" onClick={startAddProduct}>
                + Add Product
              </button>
            </div>
          ) : (
            <div className="detail-view-container">
              <div className="detail-panel-header">
                <span className="type-badge-pill">
                  {selectedProduct.productType}
                </span>
                <div className="header-actions">
                  <button
                    className="btn btn-secondary edit-btn"
                    onClick={startEditProduct}
                  >
                    Edit
                  </button>
                  <button
                    className="btn delete-btn"
                    onClick={handleDeleteProduct}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="detail-view-body">
                {saveSuccess && (
                  <div className="detail-save-toast">
                    ✓ Product updated successfully
                  </div>
                )}
                <span className="detail-mfg">
                  {selectedProduct.manufacturerName}
                </span>
                <h2>{selectedProduct.name}</h2>
                <div className="text-mono detail-pn-sku">
                  <span>Part No: {selectedProduct.partNumber || "None"}</span>
                  <span>SKU: {selectedProduct.sku || "None"}</span>
                </div>

                <p className="detail-desc">
                  {selectedProduct.description ||
                    "No model description loaded for this product catalog asset."}
                </p>

                {selectedProduct.webPageUrl && (
                  <a
                    href={selectedProduct.webPageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="external-site-link"
                  >
                    🌐 Open Official Website
                  </a>
                )}

                <hr className="detail-divider" />

                {/* Subclass Specs Detail Block */}
                {selectedProduct.productType !== "Product" && (
                  <div className="details-specs-block">
                    <h3>Technical Details</h3>
                    <p className="sub-specs-text">
                      {renderSubAttributesText(selectedProduct)}
                    </p>
                  </div>
                )}

                {/* Specifications Key-Value Details */}
                {(() => {
                  const specs = extractSpecifications(selectedProduct);
                  return (
                    Object.keys(specs).length > 0 && (
                      <div className="details-specs-block">
                        <h3>Manual Specifications</h3>
                        <div className="specs-table">
                          {Object.entries(specs).map(([key, value]) => (
                            <div key={key} className="specs-table-row">
                              <span className="key-col">{key}</span>
                              <span className="val-col">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM PANEL: RELATED PHYSICAL INVENTORY ITEMS */}
        <div className="detail-panel">
          {!selectedProduct ? (
            <div className="empty-detail-state">
              <span className="icon">🛡️</span>
              <h3>No Product Selected</h3>
              <p>
                Select a product model to inspect physical armory inventory.
              </p>
            </div>
          ) : (
            <div className="detail-view-container">
              <div className="detail-panel-header">
                <h3>Related Physical Items</h3>
              </div>
              {relatedArmoryItemsLoading ? (
                <div className="loading-state" style={{ padding: "20px 0" }}>
                  Loading physical armory inventory...
                </div>
              ) : !relatedArmoryItemsData?.data?.value ||
                relatedArmoryItemsData.data.value.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 0" }}>
                  No physical instances registered in your armory for this
                  model.
                </div>
              ) : (
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Serial Number</th>
                      <th>Name / Nickname</th>
                      <th>Condition</th>
                      <th>Round Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(relatedArmoryItemsData.data.value || []).map(
                      (item: any) => (
                        <tr
                          key={item.id}
                          className="table-row-item"
                          style={{ cursor: "default" }}
                        >
                          <td className="bold-name-cell">
                            {item.serialNumber || "N/A"}
                          </td>
                          <td>{item.name || "N/A"}</td>
                          <td>
                            <span
                              className={`badge item-badge-condition ${getConditionClass(item.condition)}`}
                            >
                              {item.condition}
                            </span>
                          </td>
                          <td className="text-mono">
                            {item.roundCount !== undefined
                              ? item.roundCount
                              : "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="armory-center-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title-bar">
              <div className="title-left">
                <span className="modal-title-icon">🏷️</span>
                <h3>
                  {isEditMode
                    ? "Modify Product Reference"
                    : "Add New Catalog Reference"}
                </h3>
              </div>
              <button
                className="modal-close-x-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            {/* Modal navigation tabs with conditionally visible subclass-specific tab */}
            <div className="modal-tabs-header-row">
              <button
                className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
                onClick={() => setActiveTab("general")}
                type="button"
              >
                General Details
              </button>

              {/* Subclass-specific conditional tab showing/hiding dynamically */}
              {form.productType !== "Product" && (
                <button
                  className={`tab-btn ${activeTab === "subclass" ? "active" : ""}`}
                  onClick={() => setActiveTab("subclass")}
                  type="button"
                >
                  {form.productType === "PewPew" && "PewPew Specs"}
                  {form.productType === "Optic" && "Optical Specs"}
                  {form.productType === "Suppressor" && "Suppressor Specs"}
                  {form.productType === "PewPewLight" && "Light Specs"}
                  {form.productType === "Security" && "Security Specs"}
                </button>
              )}

              {form.id > 0 && (
                <button
                  className={`tab-btn ${activeTab === "documents" ? "active" : ""}`}
                  onClick={() => setActiveTab("documents")}
                  type="button"
                >
                  📁 Attachments
                </button>
              )}

              <button
                className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
                onClick={() => setActiveTab("specifications")}
                type="button"
              >
                User Specs
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
                margin: 0,
              }}
            >
              <div className="modal-tabs-body-content">
                {/* TAB: GENERAL */}
                {activeTab === "general" && (
                  <div className="form-grid">
                    <div className="form-item">
                      <label>Product Catalog Class Type</label>
                      <select
                        value={form.productType}
                        onChange={(e) =>
                          setForm({ ...form, productType: e.target.value })
                        }
                        disabled={isEditMode}
                      >
                        {productTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Manufacturer</label>
                      <select
                        value={form.manufacturerId || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            manufacturerId: parseInt(e.target.value, 10),
                          })
                        }
                        required
                      >
                        <option value="">-- Select Manufacturer --</option>
                        {manufacturersList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item full-row">
                      <label>Product Model Name</label>
                      <input
                        type="text"
                        value={form.name || ""}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="e.g. 19 Gen 5"
                        required
                      />
                    </div>

                    <div className="form-item">
                      <label>Manufacturer Part Number (MPN)</label>
                      <input
                        type="text"
                        value={form.partNumber || ""}
                        onChange={(e) =>
                          setForm({ ...form, partNumber: e.target.value })
                        }
                        placeholder="e.g. UA1950712"
                        required
                      />
                    </div>

                    <div className="form-item">
                      <label>Universal SKU / Product Number</label>
                      <input
                        type="text"
                        value={form.sku || ""}
                        onChange={(e) =>
                          setForm({ ...form, sku: e.target.value })
                        }
                        placeholder="e.g. 764503030109"
                      />
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

                    <div className="form-item full-row">
                      <label>Web Page URL</label>
                      <input
                        type="url"
                        value={form.webPageUrl || ""}
                        onChange={(e) =>
                          setForm({ ...form, webPageUrl: e.target.value })
                        }
                        placeholder="https://manufacturersite.com/product"
                      />
                    </div>

                    {form.id > 0 && (
                      <div className="form-item full-row">
                        <label>🖼️ Product Cover Image</label>
                        <select
                          value={form.coverImageId || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              coverImageId: e.target.value
                                ? parseInt(e.target.value, 10)
                                : null,
                            })
                          }
                          style={{
                            backgroundColor: "var(--bg-input)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "0 12px",
                            color: "var(--text-primary)",
                            fontSize: "13px",
                            outline: "none",
                            height: "38px",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="">
                            -- No Cover Image (Default Placeholder) --
                          </option>
                          {productDocuments
                            .filter((doc) => {
                              const typeStr = String(doc.type || "").toLowerCase();
                              if (
                                typeStr === "productimage" ||
                                typeStr === "6" ||
                                typeStr === "5"
                              )
                                return true;
                              const opt = documentTypes.find(
                                (o) =>
                                  o.id === typeStr ||
                                  o.name?.toLowerCase() === typeStr,
                              );
                              return opt
                                ? opt.name?.toLowerCase() === "productimage"
                                : false;
                            })
                            .map((img) => (
                              <option key={img.id} value={img.id}>
                                {img.fileName} (
                                {((img.fileSizeBytes || 0) / 1024).toFixed(1)}{" "}
                                KB)
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: SUBCLASS SPECIFIC */}
                {activeTab === "subclass" && (
                  <div className="form-grid">
                    {/* PewPew Subclass Form Controls */}
                    {form.productType === "PewPew" && (
                      <>
                        <div className="form-item">
                          <label>Caliber</label>
                          <select
                            value={form.caliberId || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                caliberId: parseInt(e.target.value, 10),
                              })
                            }
                            required
                          >
                            <option value="">-- Select Caliber --</option>
                            {calibersList.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>PewPew Category</label>
                          <select
                            value={form.pewPewCategory || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                pewPewCategory: e.target.value,
                              })
                            }
                          >
                            {pewPewCategories.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Action Type</label>
                          <select
                            value={form.actionType || ""}
                            onChange={(e) =>
                              setForm({ ...form, actionType: e.target.value })
                            }
                          >
                            {actionTypes.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div
                          className="form-item checkbox-row"
                          style={{ alignSelf: "center", marginTop: "14px" }}
                        >
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={form.isNfaItem || false}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  isNfaItem: e.target.checked,
                                })
                              }
                            />
                            <span className="checkmark"></span>
                            <span>Is NFA Item</span>
                          </label>
                        </div>
                      </>
                    )}

                    {/* Optic Subclass Form Controls */}
                    {form.productType === "Optic" && (
                      <>
                        <div className="form-item">
                          <label>Optic Type</label>
                          <select
                            value={form.opticType || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                opticType: e.target.value,
                              })
                            }
                          >
                            {opticTypes.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Reticle Type</label>
                          <select
                            value={form.reticle || ""}
                            onChange={(e) =>
                              setForm({ ...form, reticle: e.target.value })
                            }
                          >
                            {opticReticles.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Minimum Magnification</label>
                          <input
                            type="number"
                            step="0.1"
                            value={form.minMagnification || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                minMagnification: parseFloat(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Maximum Magnification</label>
                          <input
                            type="number"
                            step="0.1"
                            value={form.maxMagnification || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                maxMagnification: parseFloat(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Objective Lens Size (mm)</label>
                          <input
                            type="number"
                            value={form.objectiveDiameterMm || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                objectiveDiameterMm: parseInt(
                                  e.target.value,
                                  10,
                                ),
                              })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Tube / Body Diameter</label>
                          <input
                            type="text"
                            value={form.tubeDiameter || ""}
                            placeholder="e.g. 30mm, 34mm, 1-inch"
                            onChange={(e) =>
                              setForm({ ...form, tubeDiameter: e.target.value })
                            }
                          />
                        </div>

                        <div className="form-item full-row">
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            Turret Adjustment Units (Select All That Apply)
                          </label>
                          <div
                            className="adjustment-units-grid"
                            style={{
                              display: "flex",
                              gap: "20px",
                              flexWrap: "wrap",
                              padding: "10px",
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: "6px",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            {opticAdjustmentUnits
                              .filter((opt: any) => opt.name !== "None")
                              .map((opt: any) => {
                                const isChecked = form.adjustmentUnits
                                  ? form.adjustmentUnits
                                      .split(",")
                                      .map((s) => s.trim())
                                      .includes(opt.label)
                                  : false;
                                return (
                                  <label
                                    key={opt.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      cursor: "pointer",
                                      userSelect: "none",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        let current = form.adjustmentUnits
                                          ? form.adjustmentUnits
                                              .split(",")
                                              .map((s) => s.trim())
                                              .filter(Boolean)
                                          : [];
                                        if (current.includes(opt.label)) {
                                          current = current.filter(
                                            (u) => u !== opt.label,
                                          );
                                        } else {
                                          current = [...current, opt.label];
                                        }
                                        setForm({
                                          ...form,
                                          adjustmentUnits: current.join(", "),
                                        });
                                      }}
                                      style={{
                                        cursor: "pointer",
                                        width: "16px",
                                        height: "16px",
                                      }}
                                    />
                                    <span style={{ fontSize: "14px" }}>
                                      {opt.label}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>

                        <div className="form-item checkbox-row full-row">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={form.isIlluminated || false}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  isIlluminated: e.target.checked,
                                })
                              }
                            />
                            <span className="checkmark"></span>
                            <span>Features Reticle Illumination</span>
                          </label>
                        </div>

                        {renderBatteryControl(
                          "Requires Battery Power (Illuminated Reticle / Dial)",
                        )}
                      </>
                    )}

                    {/* Suppressor Subclass Form Controls */}
                    {form.productType === "Suppressor" && (
                      <>
                        <div className="form-item">
                          <label>Caliber</label>
                          <select
                            value={form.caliberId || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                caliberId: parseInt(e.target.value, 10),
                              })
                            }
                            required
                          >
                            <option value="">-- Select Caliber --</option>
                            {calibersList.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Muzzle Thread Pitch</label>
                          <input
                            type="text"
                            value={form.threadPitch || ""}
                            placeholder="e.g. 1/2x28, 5/8x24"
                            onChange={(e) =>
                              setForm({ ...form, threadPitch: e.target.value })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Attachment Type</label>
                          <select
                            value={form.attachmentType || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                attachmentType: e.target.value,
                              })
                            }
                          >
                            {suppressorAttachmentTypes.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Material</label>
                          <select
                            value={form.material || ""}
                            onChange={(e) =>
                              setForm({ ...form, material: e.target.value })
                            }
                          >
                            {suppressorMaterials.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Sound Reduction Rating (dB)</label>
                          <input
                            type="number"
                            value={form.soundReductionDb || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                soundReductionDb:
                                  parseInt(e.target.value, 10) || 0,
                              })
                            }
                          />
                        </div>

                        <div
                          className="form-item checkbox-row full-row"
                          style={{ marginTop: "14px" }}
                        >
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={form.isFullAutoRated || false}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  isFullAutoRated: e.target.checked,
                                })
                              }
                            />
                            <span className="checkmark"></span>
                            <span>Rated for Sustained Full-Automatic Fire</span>
                          </label>
                        </div>

                        <div className="form-item checkbox-row full-row">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={form.isUserServiceable || false}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  isUserServiceable: e.target.checked,
                                })
                              }
                            />
                            <span className="checkmark"></span>
                            <span>
                              User Serviceable (Disassembles for cleaning)
                            </span>
                          </label>
                        </div>
                      </>
                    )}

                    {/* PewPewLight Subclass Form Controls */}
                    {form.productType === "PewPewLight" && (
                      <>
                        <div className="form-item">
                          <label>Luminous Flux (Lumens)</label>
                          <input
                            type="number"
                            value={form.lumens || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                lumens: parseInt(e.target.value, 10),
                              })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Peak Beam Intensity (Candela)</label>
                          <input
                            type="number"
                            value={form.candela || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                candela: parseInt(e.target.value, 10),
                              })
                            }
                          />
                        </div>

                        <div className="form-item">
                          <label>Mount Base Interface</label>
                          <select
                            value={form.mountType || ""}
                            onChange={(e) =>
                              setForm({ ...form, mountType: e.target.value })
                            }
                          >
                            <option value="">-- Select Mount Type --</option>
                            {lightMountTypes.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-item">
                          <label>Laser Designator Spectrum</label>
                          <select
                            value={form.laserColor || ""}
                            onChange={(e) =>
                              setForm({ ...form, laserColor: e.target.value })
                            }
                          >
                            {laserColors.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div
                          className="form-item checkbox-row full-row"
                          style={{ marginTop: "14px" }}
                        >
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={form.hasRemoteSwitchPort || false}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  hasRemoteSwitchPort: e.target.checked,
                                })
                              }
                            />
                            <span className="checkmark"></span>
                            <span>
                              Supports Pressure Switches (Tailcap switch port)
                            </span>
                          </label>
                        </div>

                        <div className="form-item checkbox-row full-row">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={form.isInfraredCapable || false}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  isInfraredCapable: e.target.checked,
                                })
                              }
                            />
                            <span className="checkmark"></span>
                            <span>
                              Features IR Illuminator / Night Vision Mode
                            </span>
                          </label>
                        </div>

                        {renderBatteryControl("Requires Battery Power")}
                      </>
                    )}

                    {/* Security Subclass Form Controls */}
                    {form.productType === "Security" && (
                      <>
                        <div className="form-item">
                          <label>Lock Type</label>
                          <select
                            value={form.lockType || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                lockType: e.target.value,
                              })
                            }
                          >
                            <option value="">-- Select Lock Type --</option>
                            {lockTypes.map((opt: any) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {renderBatteryControl(
                          "Requires Battery Power (For locking mechanisms or electronic keypads)",
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* TAB: ATTACHMENTS & DOCUMENTS */}
                {activeTab === "documents" && (
                  <div
                    style={{
                      padding: "10px 0",
                      overflowY: "auto",
                      flex: 1,
                      maxHeight: "550px",
                    }}
                  >
                    <ProductDocumentsTable productId={form.id} readOnly={false} />
                  </div>
                )}

                {/* TAB: DYNAMIC JSON SPECIFICATIONS */}
                {activeTab === "specifications" && (
                  <div className="specifications-editor-container">
                    <div className="spec-info-card">
                      <h4>💡 User Custom Specifications</h4>
                      <p>
                        You can store arbitrary metadata parameters that don't
                        belong to predefined schemas. These fields compile
                        dynamically into an offline JSON attribute dictionary on
                        save.
                      </p>
                    </div>

                    <div className="specs-editor-grid">
                      <div className="specs-headers">
                        <span>Parameter Key</span>
                        <span>Parameter Specification Value</span>
                        <span></span>
                      </div>

                      {customSpecs.length === 0 ? (
                        <div className="no-specs-text">
                          No custom parameters added yet.
                        </div>
                      ) : (
                        customSpecs.map((spec, index) => (
                          <div key={index} className="spec-editor-row">
                            <input
                              type="text"
                              placeholder="e.g. Eye Relief"
                              value={spec.key}
                              onChange={(e) =>
                                handleCustomSpecChange(
                                  index,
                                  "key",
                                  e.target.value,
                                )
                              }
                              required
                            />
                            <input
                              type="text"
                              placeholder="e.g. 4.5 inches"
                              value={spec.value}
                              onChange={(e) =>
                                handleCustomSpecChange(
                                  index,
                                  "value",
                                  e.target.value,
                                )
                              }
                              required
                            />
                            <button
                              type="button"
                              className="remove-spec-btn"
                              onClick={() => removeCustomSpec(index)}
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      className="add-spec-btn"
                      onClick={addCustomSpec}
                    >
                      + Add New Specification Key
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="modal-footer-row-container">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <SubmitButton
                  isSaving={isSaving}
                  saveSuccess={saveSuccess}
                  isEditMode={isEditMode}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
