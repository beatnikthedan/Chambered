import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import SubmitButton from "../components/SubmitButton";

import {
  useGetManufacturersFromKey,
  usePostManufacturers,
  usePutManufacturersFromKey,
  getGetManufacturersQueryKey,
} from "../api/endpoints";

export interface ManufacturerFormProps {
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
}: ManufacturerFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = currentId !== null && currentId > 0;

  const [form, setForm] = useState<formState>(INITIAL_FORM_STATE);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Fetch existing manufacturer details if editing
  const { data, isLoading } = useGetManufacturersFromKey(
    currentId || 0,
    undefined,
    {
      query: {
        enabled: isOpen && isEditMode && !!currentId,
      },
    },
  );

  // Reset or load initial form state
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && data?.data) {
      const item = data.data as any;
      setForm({
        id: item.id || 0,
        name: item.name || "",
        webPageUrl: item.webPageUrl || "",
        phoneNumber: item.phoneNumber || "",
        streetAddress: item.streetAddress || "",
        city: item.city || "",
        stateOrProvince: item.stateOrProvince || "",
        postalCode: item.postalCode || "",
        country: item.country || "",
      });
    } else if (!isEditMode) {
      setForm(INITIAL_FORM_STATE);
    }
  }, [isOpen, isEditMode, data]);

  // Mutations
  const create = usePostManufacturers({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({
          queryKey: getGetManufacturersQueryKey(),
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
        if (res?.data && onSaved) {
          onSaved(res.data);
        }
      },
      onError: (err: any) => {
        alert(
          "Failed to create manufacturer: " + (err?.message || "Unknown error"),
        );
        setIsSaving(false);
      },
    },
  });

  const update = usePutManufacturersFromKey({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({
          queryKey: getGetManufacturersQueryKey(),
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsSaving(false);
        if (onSaved) {
          onSaved(res?.data || { ...form });
        }
      },
      onError: (err: any) => {
        alert(
          "Failed to save manufacturer: " + (err?.message || "Unknown error"),
        );
        setIsSaving(false);
      },
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    const payload = {
      id: form.id || 0,
      name: form.name || "",
      webPageUrl: form.webPageUrl || null,
      phoneNumber: form.phoneNumber || null,
      streetAddress: form.streetAddress || null,
      city: form.city || null,
      stateOrProvince: form.stateOrProvince || null,
      postalCode: form.postalCode || null,
      country: form.country || null,
    };

    try {
      if (form.id > 0) {
        await update.mutateAsync({ key: form.id, data: payload });
      } else {
        await create.mutateAsync({ data: payload });
      }
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="armory-center-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title-bar">
          <div className="title-left">
            <h3>{isEditMode ? "Edit Item" : "Add New Item"}</h3>
          </div>
          <button className="modal-close-x-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {isLoading && isEditMode ? (
          <div className="loading-state" style={{ padding: "40px" }}>
            Loading manufacturer details...
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
            <div
              className="modal-tabs-body-content"
              style={{ padding: "20px" }}
            >
              {saveSuccess && (
                <div className="detail-save-toast">
                  ✓ Manufacturer saved successfully
                </div>
              )}
              <div className="form-grid">
                <div className="form-item full-row">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Acme"
                    required
                  />
                </div>

                <div className="form-item">
                  <label>Website</label>
                  <input
                    type="url"
                    value={form.webPageUrl}
                    onChange={(e) =>
                      setForm({ ...form, webPageUrl: e.target.value })
                    }
                    placeholder="https://www.acme.com"
                  />
                </div>

                <div className="form-item">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                    placeholder="e.g. +1 770-555-1202"
                  />
                </div>

                <div className="form-item full-row">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={form.streetAddress}
                    onChange={(e) =>
                      setForm({ ...form, streetAddress: e.target.value })
                    }
                    placeholder="e.g. 6000 Highlands Parkway"
                  />
                </div>

                <div className="form-item">
                  <label>City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Smyrna"
                  />
                </div>

                <div className="form-item">
                  <label>State / Province</label>
                  <input
                    type="text"
                    value={form.stateOrProvince}
                    onChange={(e) =>
                      setForm({ ...form, stateOrProvince: e.target.value })
                    }
                    placeholder="e.g. GA"
                  />
                </div>

                <div className="form-item">
                  <label>Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                    placeholder="e.g. 30082"
                  />
                </div>

                <div className="form-item">
                  <label>Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                    placeholder="e.g. United States"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div
              className="modal-footer-row-container"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                padding: "16px 20px",
              }}
            >
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
