import React, { useState, useEffect } from "react";
import { useStore } from "../StoreContext";
import { useQueryClient } from "@tanstack/react-query";
import SubmitButton from "../components/SubmitButton";

import {
  useGetVaultsFromKey,
  useGetProducts,
  usePostVaults,
  usePatchVaultsFromKey,
  getGetVaultsQueryKey,
} from "../api/endpoints";

export interface VaultFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentId: number | null; // null for "Add New", number for "Edit"
  onSaved?: (savedManufacturer: any) => void;
}

interface formState {
  id: number;
  name: string;
  webPageUrl: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
}

const INITIAL_FORM_STATE: formState = {
  id: 0,
  name: "",
  webPageUrl: "",
  phoneNumber: "",
  streetAddress: "",
  city: "",
  stateOrProvince: "",
  postalCode: "",
  country: "",
};

export default function ManufacturerForm({
  isOpen,
  onClose,
  currentId,
  onSaved,
}: VaultFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = currentId !== null && currentId > 0;

  const [form, setForm] = useState<formState>(INITIAL_FORM_STATE);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const store = useStore();
  const activeArsenal = store.arsenals.find(
    (a) => a.id === store.activeArsenalId,
  );

  const { data, isLoading } = useGetVaultsFromKey(
    currentId || 0,
    {
      expand: "product($expand=manufacturer),armoryItems,arsenal",
    },
    {
      query: {
        enabled: isOpen && isEditMode && !!currentId,
      },
    },
  );

  if (!isOpen) return null;
}
