import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../StoreContext";
import SubmitButton from "../components/SubmitButton";
import ArmoryItemDocumentsTable from "../components/ArmoryItemDocumentsTable";
import MarkdownRenderer from "../components/MarkdownRenderer";
import {
  useGetArmoryItemsFromKey,
  useGetArmoryItems,
  usePostArmoryItems,
  usePatchArmoryItemsFromKey,
  useGetProducts,
  useGetVaults,
  useGetUsersUsers,
  useGetArmoryItemsArmoryItemTypes,
  useGetArmoryItemDocuments,
} from "../api/endpoints";
import {
  createDefaultArmoryItemForm,
  ARMORY_STATIC_KEYS,
  type ArmoryItemFormData,
} from "../types/formModels";

export interface ArmoryItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  armoryItemId: number | null; // null for Add, number for Edit
  initialItem?: any;
  onSaved?: (savedItem: any) => void;
}

const extractSpecifications = (item: any): Record<string, any> => {
  if (!item) return {};
  const specs: Record<string, any> = {};
  if (item.specifications && typeof item.specifications === "object") {
    Object.assign(specs, item.specifications);
  }
  Object.keys(item).forEach((key) => {
    if (
      !ARMORY_STATIC_KEYS.has(key) &&
      key !== "specifications" &&
      ![
        "product",
        "vault",
        "arsenal",
        "owner",
        "beneficiary",
        "parentItem",
        "accessories",
        "armoryItemDocuments",
        "coverImage",
        "manufacturer",
        "model",
        "caliber",
        "actionType",
        "storageLocation",
        "isNfaItem",
        "arsenalName",
        "vaultName",
        "productName",
        "manufacturerName",
      ].includes(key) &&
      !key.startsWith("@odata.") &&
      !key.startsWith("odata.")
    ) {
      specs[key] = item[key];
    }
  });
  return specs;
};

export default function ArmoryItemForm({
  isOpen,
  onClose,
  armoryItemId,
  initialItem,
  onSaved,
}: ArmoryItemFormProps) {
  const queryClient = useQueryClient();
  const store = useStore();
  const { enums, arsenals = [], activeArsenalId } = store || {};

  const isEditMode = armoryItemId !== null && armoryItemId > 0;

  const [activeTab, setActiveTab] = useState<string>("general");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [selectedChildToAttach, setSelectedChildToAttach] = useState<string>("");

  const [form, setForm] = useState<ArmoryItemFormData>(createDefaultArmoryItemForm());

  // Dynamic specifications state
  const [customSpecs, setCustomSpecs] = useState<
    { key: string; value: string }[]
  >([]);

  // Fetch lookups
  const { data: armoryTypesData } = useGetArmoryItemsArmoryItemTypes();
  const armoryTypes = useMemo(() => {
    const raw = (armoryTypesData?.data?.value || armoryTypesData?.data || []) as string[];
    if (raw && raw.length > 0) return raw;
    return [
      "PewArmoryItem",
      "OpticArmoryItem",
      "SuppressorArmoryItem",
      "LightArmoryItem",
    ];
  }, [armoryTypesData]);

  const { data: productsData } = useGetProducts({
    expand: "manufacturer",
  });
  const productsList = useMemo(() => {
    const raw = productsData?.data;
    return (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
  }, [productsData]);

  // Filter products by selected ArmoryItem type
  const filteredProductsList = useMemo(() => {
    if (!productsList || productsList.length === 0) return [];
    let list = productsList;
    if (form.itemType && form.itemType !== "ArmoryItem") {
      if (form.itemType === "PewArmoryItem") {
        list = productsList.filter(
          (p) =>
            p.productType === "PewPew" ||
            p.productType === "Pew" ||
            p.productType === "Firearm",
        );
      } else if (form.itemType === "OpticArmoryItem") {
        list = productsList.filter((p) => p.productType === "Optic");
      } else if (form.itemType === "SuppressorArmoryItem") {
        list = productsList.filter((p) => p.productType === "Suppressor");
      } else if (form.itemType === "LightArmoryItem") {
        list = productsList.filter(
          (p) => p.productType === "Light" || p.productType === "PewPewLight",
        );
      }
    }
    if (form.productId) {
      const selected = productsList.find(
        (p) => String(p.id) === String(form.productId),
      );
      if (
        selected &&
        !list.some((p) => String(p.id) === String(form.productId))
      ) {
        list = [selected, ...list];
      }
    }
    return list;
  }, [productsList, form.itemType, form.productId]);

  const { data: vaultsData } = useGetVaults();
  const vaultsList = useMemo(() => {
    const raw = vaultsData?.data;
    return (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
  }, [vaultsData]);

  const { data: usersData } = useGetUsersUsers();
  const usersList = useMemo(() => {
    const raw = usersData?.data;
    return (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
  }, [usersData]);

  const { data: allItemsData } = useGetArmoryItems({
    expand: "product",
  });
  const otherItemsList = useMemo(() => {
    const raw = allItemsData?.data;
    const list = (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
    return list.filter((i) => !armoryItemId || i.id !== armoryItemId);
  }, [allItemsData, armoryItemId]);

  const attachedAccessories = useMemo(() => {
    const raw = allItemsData?.data;
    const list = (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
    if (!form.id) return [];
    return list.filter((i) => i.parentItemId === form.id);
  }, [allItemsData, form.id]);

  const availableToAttach = useMemo(() => {
    const raw = allItemsData?.data;
    const list = (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
    if (!form.id) return [];
    return list.filter((i) => i.id !== form.id && i.parentItemId !== form.id);
  }, [allItemsData, form.id]);

  // Fetch single item if in edit mode (expand product for trait flags)
  const { data: itemDetailsData, isLoading: isDetailsLoading } =
    useGetArmoryItemsFromKey(
      armoryItemId || 0,
      {
        expand: "product",
      },
      {
        query: {
          enabled: isOpen && isEditMode && !!armoryItemId,
        },
      },
    );

  // Directly fetch documents for immediate reactivity upon upload/delete
  const { data: itemDocumentsData } = useGetArmoryItemDocuments(
    {
      filter: `armoryItemId eq ${armoryItemId}`,
    },
    {
      query: {
        enabled: isOpen && isEditMode && !!armoryItemId,
      },
    },
  );

  const itemDocuments = useMemo(() => {
    if (itemDocumentsData?.data) {
      const raw = itemDocumentsData.data;
      return (Array.isArray(raw) ? raw : (raw as any)?.value || []) as any[];
    }
    if (itemDetailsData?.data) {
      const data = itemDetailsData.data as any;
      return data.armoryItemDocuments || [];
    }
    if (initialItem?.armoryItemDocuments) {
      return initialItem.armoryItemDocuments || [];
    }
    return [];
  }, [itemDocumentsData, itemDetailsData, initialItem]);

  // Selected catalog product model for interface checks (e.g. isNfaItem, hasBattery)
  const selectedProduct = useMemo(() => {
    if (form.productId) {
      const p = productsList.find(
        (prod) => String(prod.id) === String(form.productId),
      );
      if (p) return p;
    }
    const currentDataSource = itemDetailsData?.data || initialItem;
    if (currentDataSource && (currentDataSource as any).product) {
      return (currentDataSource as any).product;
    }
    return null;
  }, [productsList, form.productId, itemDetailsData, initialItem]);

  // Trait flag resolution with product and dataSource fallbacks
  const isNfaItem = useMemo(() => {
    const currentDataSource = itemDetailsData?.data || initialItem;
    return Boolean(
      selectedProduct?.isNfaItem ||
      (currentDataSource as any)?.product?.isNfaItem ||
      (currentDataSource as any)?.isNfaItem ||
      (initialItem as any)?.product?.isNfaItem ||
      (initialItem as any)?.isNfaItem
    );
  }, [selectedProduct, itemDetailsData, initialItem]);

  const hasBattery = useMemo(() => {
    const currentDataSource = itemDetailsData?.data || initialItem;
    return Boolean(
      selectedProduct?.hasBattery ||
      (currentDataSource as any)?.product?.hasBattery ||
      (currentDataSource as any)?.hasBattery ||
      (initialItem as any)?.product?.hasBattery ||
      (initialItem as any)?.hasBattery
    );
  }, [selectedProduct, itemDetailsData, initialItem]);

  // Enums
  const itemConditions = enums?.itemConditions || [];
  const nfaFormTypes = enums?.nfaFormTypes || [];

  // Populate form on open / edit
  useEffect(() => {
    if (!isOpen) {
      setForm(createDefaultArmoryItemForm());
      setCustomSpecs([]);
      setActiveTab("general");
      setIsSaving(false);
      setSaveSuccess(false);
      setSelectedChildToAttach("");
      return;
    }

    const dataSource = itemDetailsData?.data || (isEditMode ? initialItem : null);

    if (isEditMode && dataSource) {
      const data = dataSource as any;
      let detectedType = data.itemType;
      if (data["@odata.type"]) {
        const fullType = data["@odata.type"].replace("#", "");
        detectedType = fullType.split(".").pop() || detectedType;
      }
      if (!detectedType && (data.product?.productType || data.productType)) {
        const pType = data.product?.productType || data.productType;
        if (pType === "PewPew" || pType === "Pew" || pType === "Firearm") {
          detectedType = "PewArmoryItem";
        } else if (pType === "Optic") {
          detectedType = "OpticArmoryItem";
        } else if (pType === "Suppressor") {
          detectedType = "SuppressorArmoryItem";
        } else if (pType === "Light" || pType === "PewPewLight") {
          detectedType = "LightArmoryItem";
        }
      }
      if (!detectedType) {
        detectedType = "ArmoryItem";
      }

      const prodId = data.productId ? String(data.productId) : data.product?.id ? String(data.product.id) : "";
      const arsId = data.arsenalId ? String(data.arsenalId) : data.arsenal?.id ? String(data.arsenal.id) : "";
      const vltId = data.vaultId ? String(data.vaultId) : data.vault?.id ? String(data.vault.id) : "";
      const ownId = data.ownerId || data.owner?.id || "";
      const benId = data.beneficiaryId || data.beneficiary?.id || "";

      let condVal = "Good";
      if (data.condition) {
        condVal = typeof data.condition === "object" ? data.condition.name || data.condition.id || "Good" : String(data.condition);
      }

      let nfaVal = "Form4";
      if (data.nfaFormType) {
        nfaVal = typeof data.nfaFormType === "object" ? data.nfaFormType.name || data.nfaFormType.id || "Form4" : String(data.nfaFormType);
      }

      setForm({
        ...createDefaultArmoryItemForm(),
        id: data.id || 0,
        name: data.name || "",
        description: data.description || "",
        itemType: detectedType,
        productId: prodId,
        arsenalId: arsId,
        vaultId: vltId,
        ownerId: ownId,
        beneficiaryId: benId,
        parentItemId: data.parentItemId || null,
        condition: condVal,
        purchasePrice: data.purchasePrice !== null && data.purchasePrice !== undefined ? data.purchasePrice : "",
        estimatedValue: data.estimatedValue !== null && data.estimatedValue !== undefined ? data.estimatedValue : "",
        purchaseDate: data.purchaseDate ? data.purchaseDate.substring(0, 10) : "",
        coverImageId: data.coverImageId || null,
        notesMarkdown: data.notesMarkdown || "",
        specifications: data.specifications || {},
        roundCount: data.roundCount ?? 0,
        barrelLengthInches: data.barrelLengthInches ?? "",
        twistRate: data.twistRate || "",
        threadPitch: data.threadPitch || "",
        serialNumber: data.serialNumber || "",
        nfaFormType: nfaVal,
        taxStampDocumentUrl: data.taxStampDocumentUrl || "",
        stampApprovalDate: data.stampApprovalDate ? data.stampApprovalDate.substring(0, 10) : "",
        batteryLastChangedDate: data.batteryLastChangedDate ? data.batteryLastChangedDate.substring(0, 10) : "",
        batteryExpirationDate: data.batteryExpirationDate ? data.batteryExpirationDate.substring(0, 10) : "",
      });

      const extracted = extractSpecifications(data);
      const parsedSpecs = Object.entries(extracted).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setCustomSpecs(parsedSpecs);
    } else if (!isEditMode) {
      setForm({
        ...createDefaultArmoryItemForm(),
        arsenalId: activeArsenalId || (arsenals[0]?.id ? String(arsenals[0].id) : ""),
        vaultId: vaultsList[0]?.id ? String(vaultsList[0].id) : "",
        condition: itemConditions[0]?.name || "Excellent",
        nfaFormType: nfaFormTypes[0]?.name || "Form4",
      });
      setCustomSpecs([]);
      setActiveTab("general");
    }
  }, [isOpen, isEditMode, armoryItemId, itemDetailsData, initialItem, activeArsenalId, arsenals, vaultsList, itemConditions, nfaFormTypes]);

  // Handle Item Type Change with cascading product reset
  const handleItemTypeChange = (newItemType: string) => {
    setForm((prev) => {
      const currentProd = productsList.find(
        (p) => String(p.id) === String(prev.productId),
      );
      let shouldResetProduct = false;
      if (currentProd && newItemType !== "ArmoryItem") {
        const pType = currentProd.productType || "";
        if (newItemType === "PewArmoryItem" && pType !== "PewPew" && pType !== "Pew")
          shouldResetProduct = true;
        else if (newItemType === "OpticArmoryItem" && pType !== "Optic")
          shouldResetProduct = true;
        else if (
          newItemType === "SuppressorArmoryItem" &&
          pType !== "Suppressor"
        )
          shouldResetProduct = true;
        else if (
          newItemType === "LightArmoryItem" &&
          pType !== "Light" &&
          pType !== "PewPewLight"
        )
          shouldResetProduct = true;
      }

      return {
        ...prev,
        itemType: newItemType,
        productId: shouldResetProduct ? "" : prev.productId,
      };
    });
  };

  // Handle Product Selection
  const handleProductChange = (prodId: string) => {
    const selectedProd = productsList.find(
      (p) => String(p.id) === String(prodId),
    );
    let derivedType = form.itemType;
    if (selectedProd?.productType) {
      const pType = selectedProd.productType;
      if (pType === "PewPew" || pType === "Pew" || pType === "Firearm") {
        derivedType = "PewArmoryItem";
      } else if (pType === "Optic") {
        derivedType = "OpticArmoryItem";
      } else if (pType === "Suppressor") {
        derivedType = "SuppressorArmoryItem";
      } else if (pType === "Light" || pType === "PewPewLight") {
        derivedType = "LightArmoryItem";
      }
    }
    setForm((prev) => ({
      ...prev,
      productId: prodId,
      itemType: derivedType || prev.itemType,
    }));
  };

  // Dynamic Specs Key-Value Handlers
  const addCustomSpec = () => {
    setCustomSpecs((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeCustomSpec = (index: number) => {
    setCustomSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomSpec = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setCustomSpecs((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  // Markdown editor ref & helper
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertMarkdown = (
    type: "bold" | "italic" | "heading" | "list" | "code" | "table",
  ) => {
    const textarea = notesTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.notesMarkdown || "";
    const selectedText = text.substring(start, end);

    let replacement = "";
    let cursorOffset = 0;

    switch (type) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;
      case "italic":
        replacement = `*${selectedText || "italic text"}*`;
        cursorOffset = selectedText ? replacement.length : 1;
        break;
      case "heading":
        replacement = `\n### ${selectedText || "Heading"}\n`;
        cursorOffset = replacement.length;
        break;
      case "list":
        replacement = `\n- ${selectedText || "List item"}\n`;
        cursorOffset = replacement.length;
        break;
      case "code":
        replacement = selectedText.includes("\n")
          ? `\n\`\`\`\n${selectedText || "code block"}\n\`\`\`\n`
          : `\`${selectedText || "code"}\``;
        cursorOffset = selectedText ? replacement.length : 1;
        break;
      case "table":
        replacement = `\n| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n`;
        cursorOffset = replacement.length;
        break;
    }

    const updatedText =
      text.substring(0, start) + replacement + text.substring(end);
    setForm((prev) => ({ ...prev, notesMarkdown: updatedText }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  // Mutation Save operations
  const createItemMutation = usePostArmoryItems({
    mutation: {
      onSuccess: (res: any) => {
        if (res?.status && res.status >= 400) {
          const errMsg =
            res.data?.error?.message ||
            res.data?.title ||
            `Server returned HTTP ${res.status}`;
          alert("Failed to create armory item: " + errMsg);
          setIsSaving(false);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["/api/v1/ArmoryItems"] });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Armory"] });
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsSaving(false);
          onClose();
        }, 800);
        if (res?.data && onSaved) {
          onSaved(res.data);
        }
      },
      onError: (err: any) => {
        alert(
          "Failed to create armory item: " + (err?.message || "Unknown error"),
        );
        setIsSaving(false);
      },
    },
  });

  const updateItemMutation = usePatchArmoryItemsFromKey({
    mutation: {
      onSuccess: (res: any) => {
        if (res?.status && res.status >= 400) {
          const errMsg =
            res.data?.error?.message ||
            res.data?.title ||
            `Server returned HTTP ${res.status}`;
          alert("Failed to save armory item: " + errMsg);
          setIsSaving(false);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["/api/v1/ArmoryItems"] });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Armory"] });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
        if (onSaved) {
          onSaved(res?.data || { ...form });
        }
      },
      onError: (err: any) => {
        alert(
          "Failed to save armory item: " + (err?.message || "Unknown error"),
        );
        setIsSaving(false);
      },
    },
  });

  const handleAttachAccessory = async (childId: number) => {
    if (!childId || !form.id) return;
    try {
      await updateItemMutation.mutateAsync({
        key: childId,
        data: { parentItemId: form.id },
      });
      setSelectedChildToAttach("");
      queryClient.invalidateQueries({ queryKey: ["/api/v1/ArmoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/Armory"] });
    } catch (err: any) {
      alert("Failed to attach accessory: " + (err?.message || "Unknown error"));
    }
  };

  const handleDetachAccessory = async (childId: number) => {
    if (!childId) return;
    if (window.confirm("Detach this accessory from this item?")) {
      try {
        await updateItemMutation.mutateAsync({
          key: childId,
          data: { parentItemId: null },
        });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/ArmoryItems"] });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/Armory"] });
      } catch (err: any) {
        alert("Failed to detach accessory: " + (err?.message || "Unknown error"));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Name is required.");
      return;
    }

    setIsSaving(true);

    const dynamicSpecifications: Record<string, any> = {};
    customSpecs.forEach((s) => {
      if (s.key.trim() !== "") {
        dynamicSpecifications[s.key.trim()] = s.value;
      }
    });

    const payload: Record<string, any> = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      productId: form.productId ? parseInt(String(form.productId), 10) : null,
      arsenalId: form.arsenalId ? parseInt(String(form.arsenalId), 10) : null,
      vaultId: form.vaultId ? parseInt(String(form.vaultId), 10) : null,
      ownerId: form.ownerId?.trim() || null,
      beneficiaryId: form.beneficiaryId?.trim() || null,
      parentItemId: form.parentItemId
        ? parseInt(String(form.parentItemId), 10)
        : null,
      condition: form.condition,
      purchasePrice:
        form.purchasePrice !== "" && form.purchasePrice !== null
          ? parseFloat(String(form.purchasePrice))
          : null,
      estimatedValue:
        form.estimatedValue !== "" && form.estimatedValue !== null
          ? parseFloat(String(form.estimatedValue))
          : null,
      purchaseDate: form.purchaseDate
        ? new Date(form.purchaseDate).toISOString()
        : null,
      coverImageId: form.coverImageId
        ? parseInt(String(form.coverImageId), 10)
        : null,
      notesMarkdown: form.notesMarkdown?.trim() || null,
      specifications: dynamicSpecifications,
    };

    if (form.itemType && form.itemType !== "ArmoryItem") {
      payload["@odata.type"] = `#Chambered.Data.Models.${form.itemType}`;
    }

    if (form.itemType === "PewArmoryItem") {
      payload.roundCount = parseInt(String(form.roundCount), 10) || 0;
      payload.barrelLengthInches =
        form.barrelLengthInches !== "" && form.barrelLengthInches !== null
          ? parseFloat(String(form.barrelLengthInches))
          : null;
      payload.twistRate = form.twistRate?.trim() || null;
      payload.threadPitch = form.threadPitch?.trim() || null;
      payload.serialNumber = form.serialNumber?.trim() || "";
      payload.nfaFormType = form.nfaFormType;
      payload.taxStampDocumentUrl = form.taxStampDocumentUrl?.trim() || null;
      payload.stampApprovalDate = form.stampApprovalDate
        ? new Date(form.stampApprovalDate).toISOString()
        : null;
    } else if (form.itemType === "SuppressorArmoryItem") {
      payload.serialNumber = form.serialNumber?.trim() || "";
      payload.nfaFormType = form.nfaFormType;
      payload.taxStampDocumentUrl = form.taxStampDocumentUrl?.trim() || null;
      payload.stampApprovalDate = form.stampApprovalDate
        ? new Date(form.stampApprovalDate).toISOString()
        : null;
    } else if (form.itemType === "OpticArmoryItem") {
      payload.serialNumber = form.serialNumber?.trim() || "";
      payload.batteryLastChangedDate = form.batteryLastChangedDate
        ? new Date(form.batteryLastChangedDate).toISOString()
        : null;
      payload.batteryExpirationDate = form.batteryExpirationDate
        ? new Date(form.batteryExpirationDate).toISOString()
        : null;
    } else if (form.itemType === "LightArmoryItem") {
      payload.batteryLastChangedDate = form.batteryLastChangedDate
        ? new Date(form.batteryLastChangedDate).toISOString()
        : null;
      payload.batteryExpirationDate = form.batteryExpirationDate
        ? new Date(form.batteryExpirationDate).toISOString()
        : null;
    }

    // Strip complex navigation objects from payload to avoid OData binding errors
    Object.keys(payload).forEach((key) => {
      if (
        payload[key] !== null &&
        typeof payload[key] === "object" &&
        key !== "specifications"
      ) {
        delete payload[key];
      }
    });

    if (isEditMode && armoryItemId) {
      await updateItemMutation.mutateAsync({
        key: armoryItemId,
        data: payload,
      });
    } else {
      await createItemMutation.mutateAsync({
        data: payload,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="armory-center-modal" onClick={(e) => e.stopPropagation()}>
        {/* MODAL TITLE BAR */}
        <div className="modal-title-bar">
          <div className="title-left">
            <h3>
              {isEditMode
                ? `Edit Armory Item #${armoryItemId}`
                : "Add New Armory Item"}
            </h3>
          </div>
          <button className="modal-close-x-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {/* MODAL TABS HEADER ROW */}
        <div className="modal-tabs-header-row">
          <button
            className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
            type="button"
          >
            Armory Details
          </button>

          {form.itemType !== "ArmoryItem" && (
            <button
              className={`tab-btn ${activeTab === "subclass" ? "active" : ""}`}
              onClick={() => setActiveTab("subclass")}
              type="button"
            >
              {form.itemType === "PewArmoryItem" && "Firearm Specs"}
              {form.itemType === "OpticArmoryItem" && "Optical Specs"}
              {form.itemType === "SuppressorArmoryItem" && "Suppressor Specs"}
              {form.itemType === "LightArmoryItem" && "Light Specs"}
            </button>
          )}

          <button
            className={`tab-btn ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
            type="button"
          >
            Notes
          </button>

          {form.id > 0 && (
            <button
              className={`tab-btn ${activeTab === "attachments" ? "active" : ""}`}
              onClick={() => setActiveTab("attachments")}
              type="button"
            >
              Attachments
            </button>
          )}

          {form.id > 0 && (
            <button
              className={`tab-btn ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
              type="button"
            >
              Documents ({itemDocuments.length})
            </button>
          )}

          <button
            className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
            onClick={() => setActiveTab("specifications")}
            type="button"
          >
            User Specs ({customSpecs.length})
          </button>
        </div>

        {isDetailsLoading && isEditMode ? (
          <div className="loading-state" style={{ padding: "40px" }}>
            Loading armory item details...
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
              margin: 0,
            }}
          >
            <div className="modal-tabs-body-content" style={{ padding: "20px" }}>
              {saveSuccess && (
                <div className="detail-save-toast">
                  ✓ Armory item saved successfully
                </div>
              )}

              {/* TAB 1: ARMORY DETAILS (BASE PROPERTIES) */}
              {activeTab === "general" && (
                <div className="form-grid">
                  <div className="form-item">
                    <label>Armory Item Subclass Type</label>
                    <select
                      value={form.itemType}
                      onChange={(e) => handleItemTypeChange(e.target.value)}
                      disabled={isEditMode}
                    >
                      {armoryTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item">
                    <label>Catalog Product Reference</label>
                    <select
                      value={form.productId || ""}
                      onChange={(e) => handleProductChange(e.target.value)}
                      disabled={isEditMode}
                      required
                    >
                      <option value="">-- Select Catalog Product --</option>
                      {filteredProductsList.map((p) => {
                        const mfg = p.manufacturer?.name
                          ? `${p.manufacturer.name} - `
                          : "";
                        return (
                          <option key={p.id} value={p.id}>
                            {mfg}
                            {p.name} [{p.productType || "Product"}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-item full-row">
                    <label>Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. BCM Recce-14 Custom Build"
                      required
                    />
                  </div>

                  <div className="form-item full-row">
                    <label>Description</label>
                    <textarea
                      rows={2}
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Brief summary or description..."
                    />
                  </div>

                  {/* Valuation & Condition Group Container */}
                  <div
                    className="full-row"
                    style={{
                      backgroundColor: "var(--bg-selected)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "var(--color-primary)",
                        borderBottom: "1px solid var(--border-color)",
                        paddingBottom: "8px",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      Valuation & Condition
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div className="form-item">
                        <label>Purchase Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.purchasePrice ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              purchasePrice: e.target.value
                                ? parseFloat(e.target.value)
                                : "",
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div className="form-item">
                        <label>Estimated Market Value ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.estimatedValue ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              estimatedValue: e.target.value
                                ? parseFloat(e.target.value)
                                : "",
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div className="form-item">
                        <label>Purchase Date</label>
                        <input
                          type="date"
                          value={form.purchaseDate || ""}
                          onChange={(e) =>
                            setForm({ ...form, purchaseDate: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-item">
                        <label>Physical Condition</label>
                        <select
                          value={form.condition}
                          onChange={(e) =>
                            setForm({ ...form, condition: e.target.value })
                          }
                        >
                          {itemConditions.map((c: any) => (
                            <option key={c.id} value={c.name || c.id}>
                              {c.label || c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Assignment & Location Group Container */}
                  <div
                    className="full-row"
                    style={{
                      backgroundColor: "var(--bg-selected)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "var(--color-primary)",
                        borderBottom: "1px solid var(--border-color)",
                        paddingBottom: "8px",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      Assignment & Location
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div className="form-item">
                        <label>Arsenal</label>
                        <select
                          value={form.arsenalId || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              arsenalId: e.target.value
                                ? parseInt(e.target.value, 10)
                                : "",
                            })
                          }
                        >
                          <option value="">-- Unassigned Arsenal --</option>
                          {arsenals.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Vault Location</label>
                        <select
                          value={form.vaultId || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              vaultId: e.target.value
                                ? parseInt(e.target.value, 10)
                                : "",
                            })
                          }
                        >
                          <option value="">-- Unassigned Vault --</option>
                          {vaultsList.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Legal Estate Beneficiary</label>
                        <select
                          value={form.beneficiaryId || ""}
                          onChange={(e) =>
                            setForm({ ...form, beneficiaryId: e.target.value })
                          }
                        >
                          <option value="">-- Select Beneficiary --</option>
                          {usersList.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.userName || u.email || u.id}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Parent Item (Attachment Mount)</label>
                        <select
                          value={form.parentItemId || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              parentItemId: e.target.value
                                ? parseInt(e.target.value, 10)
                                : null,
                            })
                          }
                        >
                          <option value="">-- Standalone Item (No Parent) --</option>
                          {otherItemsList.map((it: any) => (
                            <option key={it.id} value={it.id}>
                              {it.name || it.product?.name || `Item #${it.id}`} (
                              {it.itemType?.replace("ArmoryItem", "") || "Item"})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {form.id > 0 && (
                    <div className="form-item full-row">
                      <label>Cover Image</label>
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
                      >
                        <option value="">-- Select Cover Image --</option>
                        {itemDocuments.map((doc: any) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.fileName} ({doc.contentType})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SUBCLASS SPECS */}
              {activeTab === "subclass" && (
                <div className="form-grid">
                  {form.itemType === "PewArmoryItem" && (
                    <>
                      <div className="form-item">
                        <label>Serial Number</label>
                        <input
                          type="text"
                          className="text-mono"
                          value={form.serialNumber || ""}
                          onChange={(e) =>
                            setForm({ ...form, serialNumber: e.target.value })
                          }
                          placeholder="e.g. SN12345678"
                          required
                        />
                      </div>
                      <div className="form-item">
                        <label>Cumulative Round Count</label>
                        <input
                          type="number"
                          step="1"
                          value={form.roundCount ?? 0}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              roundCount: e.target.value
                                ? parseInt(e.target.value, 10)
                                : 0,
                            })
                          }
                          placeholder="0"
                          required
                        />
                      </div>
                      <div className="form-item">
                        <label>Barrel Length (Inches)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.barrelLengthInches ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              barrelLengthInches: e.target.value
                                ? parseFloat(e.target.value)
                                : "",
                            })
                          }
                          placeholder="16.0"
                        />
                      </div>
                      <div className="form-item">
                        <label>Rifling Twist Rate</label>
                        <input
                          type="text"
                          value={form.twistRate || ""}
                          onChange={(e) =>
                            setForm({ ...form, twistRate: e.target.value })
                          }
                          placeholder="e.g. 1:7, 1:10"
                        />
                      </div>
                      <div className="form-item">
                        <label>Muzzle Thread Pitch</label>
                        <input
                          type="text"
                          value={form.threadPitch || ""}
                          onChange={(e) =>
                            setForm({ ...form, threadPitch: e.target.value })
                          }
                          placeholder="e.g. 1/2x28, 5/8x24"
                        />
                      </div>

                      {/* INfaItem Section Card - Only rendered if selected product is an NFA item */}
                      {isNfaItem && (
                        <div
                          className="full-row"
                          style={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #3b82f6",
                            borderLeft: "6px solid #3b82f6",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.95rem",
                              color: "#60a5fa",
                              borderBottom: "1px solid rgba(59, 130, 246, 0.3)",
                              paddingBottom: "8px",
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                            }}
                          >
                            National Firearms Act (NFA) Configuration
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px",
                            }}
                          >
                            <div className="form-item">
                              <label style={{ color: "#93c5fd" }}>NFA Form Type</label>
                              <select
                                value={form.nfaFormType}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    nfaFormType: e.target.value,
                                  })
                                }
                              >
                                {nfaFormTypes.map((n: any) => (
                                  <option key={n.id} value={n.name || n.id}>
                                    {n.label || n.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="form-item">
                              <label style={{ color: "#93c5fd" }}>Tax Stamp Approval Date</label>
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
                            <div className="form-item full-row">
                              <label style={{ color: "#93c5fd" }}>Tax Stamp Document URL</label>
                              <input
                                type="text"
                                value={form.taxStampDocumentUrl || ""}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    taxStampDocumentUrl: e.target.value,
                                  })
                                }
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {form.itemType === "SuppressorArmoryItem" && (
                    <>
                      <div className="form-item full-row">
                        <label>Serial Number</label>
                        <input
                          type="text"
                          className="text-mono"
                          value={form.serialNumber || ""}
                          onChange={(e) =>
                            setForm({ ...form, serialNumber: e.target.value })
                          }
                          placeholder="e.g. SUP-987654"
                          required
                        />
                      </div>

                      {/* INfaItem Section Card - Only rendered if selected product is an NFA item */}
                      {isNfaItem && (
                        <div
                          className="full-row"
                          style={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #3b82f6",
                            borderLeft: "6px solid #3b82f6",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.95rem",
                              color: "#60a5fa",
                              borderBottom: "1px solid rgba(59, 130, 246, 0.3)",
                              paddingBottom: "8px",
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                            }}
                          >
                            National Firearms Act (NFA) Configuration
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px",
                            }}
                          >
                            <div className="form-item">
                              <label style={{ color: "#93c5fd" }}>NFA Form Type</label>
                              <select
                                value={form.nfaFormType}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    nfaFormType: e.target.value,
                                  })
                                }
                              >
                                {nfaFormTypes.map((n: any) => (
                                  <option key={n.id} value={n.name || n.id}>
                                    {n.label || n.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="form-item">
                              <label style={{ color: "#93c5fd" }}>Tax Stamp Approval Date</label>
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
                            <div className="form-item full-row">
                              <label style={{ color: "#93c5fd" }}>Tax Stamp Document URL</label>
                              <input
                                type="text"
                                value={form.taxStampDocumentUrl || ""}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    taxStampDocumentUrl: e.target.value,
                                  })
                                }
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {form.itemType === "OpticArmoryItem" && (
                    <>
                      <div className="form-item full-row">
                        <label>Serial Number</label>
                        <input
                          type="text"
                          className="text-mono"
                          value={form.serialNumber || ""}
                          onChange={(e) =>
                            setForm({ ...form, serialNumber: e.target.value })
                          }
                          placeholder="e.g. OPT-112233"
                          required
                        />
                      </div>

                      {/* IHasBattery Section Card - Only rendered if selected product has battery */}
                      {hasBattery && (
                        <div
                          className="full-row"
                          style={{
                            backgroundColor: "#064e3b",
                            border: "1px solid #10b981",
                            borderLeft: "6px solid #10b981",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.95rem",
                              color: "#34d399",
                              borderBottom: "1px solid rgba(16, 185, 129, 0.3)",
                              paddingBottom: "8px",
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                            }}
                          >
                            Battery & Power Management
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px",
                            }}
                          >
                            <div className="form-item">
                              <label style={{ color: "#a7f3d0" }}>Battery Last Changed Date</label>
                              <input
                                type="date"
                                value={form.batteryLastChangedDate || ""}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    batteryLastChangedDate: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="form-item">
                              <label style={{ color: "#a7f3d0" }}>Battery Expiration Date</label>
                              <input
                                type="date"
                                value={form.batteryExpirationDate || ""}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    batteryExpirationDate: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {form.itemType === "LightArmoryItem" && (
                    <>
                      {/* IHasBattery Section Card - Only rendered if selected product has battery */}
                      {hasBattery && (
                        <div
                          className="full-row"
                          style={{
                            backgroundColor: "#064e3b",
                            border: "1px solid #10b981",
                            borderLeft: "6px solid #10b981",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.95rem",
                              color: "#34d399",
                              borderBottom: "1px solid rgba(16, 185, 129, 0.3)",
                              paddingBottom: "8px",
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                            }}
                          >
                            Battery & Power Management
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px",
                            }}
                          >
                            <div className="form-item">
                              <label style={{ color: "#a7f3d0" }}>Battery Last Changed Date</label>
                              <input
                                type="date"
                                value={form.batteryLastChangedDate || ""}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    batteryLastChangedDate: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="form-item">
                              <label style={{ color: "#a7f3d0" }}>Battery Expiration Date</label>
                              <input
                                type="date"
                                value={form.batteryExpirationDate || ""}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    batteryExpirationDate: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: NOTES (MARKDOWN EDITOR & TOOLBAR) */}
              {activeTab === "notes" && (
                <div className="markdown-editor-pane">
                  <div className="markdown-toolbar">
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => insertMarkdown("bold")}
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => insertMarkdown("italic")}
                    >
                      Italic
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => insertMarkdown("heading")}
                    >
                      Heading
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => insertMarkdown("list")}
                    >
                      List
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => insertMarkdown("code")}
                    >
                      Code
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => insertMarkdown("table")}
                    >
                      Table
                    </button>
                    <span className="text-format-indicator">
                      Markdown Supported
                    </span>
                  </div>
                  <div className="markdown-split-panel">
                    <div className="editor-col">
                      <textarea
                        ref={notesTextareaRef}
                        value={form.notesMarkdown || ""}
                        onChange={(e) =>
                          setForm({ ...form, notesMarkdown: e.target.value })
                        }
                        placeholder="Detailed notes, maintenance logs, configuration markdown..."
                      />
                    </div>
                    <div className="preview-col">
                      <div className="preview-tag-title">Live Preview</div>
                      <div className="markdown-rendered-view">
                        <MarkdownRenderer
                          content={form.notesMarkdown || "*Nothing to preview...*"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ATTACHMENTS (CHILD ACCESSORIES & PARENT HOST) */}
              {activeTab === "attachments" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Parent Host Item */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--bg-selected)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: "var(--color-primary)",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                      }}
                    >
                      Parent Host Item
                    </div>
                    {form.parentItemId ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          backgroundColor: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                            {otherItemsList.find((i) => i.id === form.parentItemId)?.name || `Item #${form.parentItemId}`}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {otherItemsList.find((i) => i.id === form.parentItemId)?.product?.name || ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setForm((prev) => ({ ...prev, parentItemId: null }))}
                        >
                          Detach From Parent
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        This item is currently a standalone root item (not mounted to any parent).
                      </div>
                    )}
                  </div>

                  {/* Attached Accessories */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--bg-selected)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: "var(--color-primary)",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                      }}
                    >
                      Attached Accessories ({attachedAccessories.length})
                    </div>
                    {attachedAccessories.length === 0 ? (
                      <div style={{ padding: "12px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        No accessories or sub-items are currently attached to this item.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                        {attachedAccessories.map((acc: any) => (
                          <div
                            key={acc.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              backgroundColor: "var(--bg-card)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{acc.name}</div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {acc.product?.name || acc.productName || acc.itemType || "Accessory"}
                                {acc.serialNumber ? ` • S/N: ${acc.serialNumber}` : ""}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: "var(--danger-color, #ff5c5c)" }}
                              onClick={() => handleDetachAccessory(acc.id)}
                            >
                              Detach
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Attach New Accessory Dropdown */}
                    {availableToAttach.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid var(--border-color)",
                        }}
                      >
                        <select
                          className="form-control"
                          style={{ flex: 1 }}
                          value={selectedChildToAttach}
                          onChange={(e) => setSelectedChildToAttach(e.target.value)}
                        >
                          <option value="">-- Select an item to attach --</option>
                          {availableToAttach.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.name} {item.product?.name ? `(${item.product.name})` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={!selectedChildToAttach}
                          onClick={() => {
                            if (selectedChildToAttach) {
                              handleAttachAccessory(parseInt(selectedChildToAttach, 10));
                            }
                          }}
                        >
                          Attach Item
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: DOCUMENTS */}
              {activeTab === "documents" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {form.id > 0 ? (
                    <ArmoryItemDocumentsTable
                      armoryItemId={form.id}
                      selectedCoverImageId={form.coverImageId}
                      onSetCoverImage={(docId) => {
                        setForm((prev) => ({ ...prev, coverImageId: docId }));
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      Documents can be uploaded after saving the armory item.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: USER SPECS (MATCHES PRODUCTFORM) */}
              {activeTab === "specifications" && (
                <div className="specifications-editor-container">
                  <div className="spec-info-card">
                    <div className="spec-info-title">
                      Custom Item Specifications
                    </div>
                    <div className="spec-info-text">
                      Define custom key-value specification pairs for this
                      specific armory item.
                    </div>
                  </div>

                  <div className="specs-editor-grid">
                    <div className="specs-headers">
                      <span>Specification Key</span>
                      <span>Value</span>
                      <span></span>
                    </div>

                    {customSpecs.length === 0 ? (
                      <div className="no-specs-text">
                        No custom specifications defined yet. Click below to
                        add key-value specifications.
                      </div>
                    ) : (
                      customSpecs.map((spec, index) => (
                        <div key={index} className="spec-editor-row">
                          <input
                            type="text"
                            placeholder="e.g. Trigger Pull Weight"
                            value={spec.key}
                            onChange={(e) =>
                              updateCustomSpec(index, "key", e.target.value)
                            }
                          />
                          <input
                            type="text"
                            placeholder="e.g. 3.5 lbs"
                            value={spec.value}
                            onChange={(e) =>
                              updateCustomSpec(index, "value", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="remove-spec-btn"
                            onClick={() => removeCustomSpec(index)}
                            title="Remove Specification"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}

                    <button
                      type="button"
                      className="add-spec-btn"
                      onClick={addCustomSpec}
                    >
                      + Add Custom Specification
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="modal-footer-row-container">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
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
        )}
      </div>
    </div>
  );
}
