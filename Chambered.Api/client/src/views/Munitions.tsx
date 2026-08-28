import React, { useState, useEffect } from "react";

// ==========================================
// [SAVING DATA] - Imports the React Query client provider to manage cache and state sync.
// ==========================================
import { useQueryClient } from "@tanstack/react-query";

import ChargeLadder from "../components/ChargeLoader";

// ==========================================
// [PULLING DATA] & [SAVING DATA] - Imports generated OData hooks from the API client.
// - useArmoryGetGET: Hook for pulling multiple records (collection-get)
// - useArmoryPatchByKeyPATCH: Hook for partially updating a single record by its key (PATCH)
// ==========================================
import {
  useGetArmoryItems,
  usePatchArmoryItemsFromKey,
} from "../api/endpoints";

export default function Munitions() {
  // ==========================================
  // [SAVING DATA] - The queryClient is used to manipulate TanStack Query's cache.
  // After saving, we use it to mark the armory cache as "stale", triggering an auto-refresh.
  // ==========================================
  const queryClient = useQueryClient();

  // ==========================================
  // [UI & LOCAL STATE] - Component state to hold local form/input values and UI feedback.
  // ==========================================

  // Holds the editable text of the item name in the textbox.
  const [itemName, setItemName] = useState<string>("");

  // Holds the database ID of the currently loaded item (needed so we know WHICH record to update on save).
  const [itemId, setItemId] = useState<number | null>(null);

  // Boolean to toggle the visibility of the green success banner after a successful save.
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // ==========================================
  // [PULLING DATA] - Hook invocation to query the database.
  // This performs a GET request to /api/v1/Armory.
  // - top: 1 -> limit result to at most 1 item.
  // - select: "id,name" -> only load the 'id' and 'name' fields from the DB.
  // - filter: "product/manufacturer/name eq 'Glock'" -> only load items made by Glock.
  // ==========================================
  const { data } = useGetArmoryItems({
    top: 1,
    select: "id,name",
    filter: "product/manufacturer/name eq 'Glock'",
  });

  // ==========================================
  // [SAVING DATA] - Hook invocation to set up our save mutation.
  // This configures a PATCH request to /api/v1/Armory/{key}.
  // We pass an options object containing an 'onSuccess' callback.
  // ==========================================
  const saveMutation = usePatchArmoryItemsFromKey({
    mutation: {
      onSuccess: () => {
        // [UI FEEDBACK] - Show success notification banner
        setSaveSuccess(true);
        // [UI FEEDBACK] - Hide notification banner after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);

        // [SAVING DATA] - Invalidate the GET cache.
        // This tells React Query that any cached data starting with "/api/v1/ArmoryItems" is now out of date.
        // React Query will automatically re-run the GET hook above in the background to grab the updated name.
        queryClient.invalidateQueries({ queryKey: ["/api/v1/ArmoryItems"] });
      },
      onError: (err: any) => {
        alert("Failed to save changes: " + (err.message || "Unknown error"));
      },
    },
  });

  // ==========================================
  // [PULLING DATA] - Syncing Query Results into Local Input State.
  // This effect runs every time the network request returns new data.
  // We read the OData response, extract the ID and Name, and store them in local React state.
  // ==========================================
  useEffect(() => {
    // Orval wraps the HTTP response inside a { data, status, headers } envelope.
    // The OData body is inside 'data.data', and OData lists are always wrapped inside '.value'.
    const armoryItems = data?.data?.value || [];

    if (armoryItems.length > 0) {
      setItemId(armoryItems[0].id || null); // Saves the database ID (e.g. 1) to state
      setItemName(armoryItems[0].name || ""); // Loads the initial name into our textbox state
    }
  }, [data]); // This effect is triggered whenever 'data' shifts from undefined to loaded

  // ==========================================
  // [SAVING DATA] - Save Action Handler.
  // This function is bound to the save button's onClick event.
  // ==========================================
  const handleSave = () => {
    if (!itemId) return; // Prevent saving if no item is loaded yet

    // Triggers the partial update (PATCH) mutation.
    // We pass:
    // - key: The unique database ID of the item we are updating (e.g., itemId).
    // - data: An object containing only the fields we want to overwrite (e.g., name).
    saveMutation.mutate({
      key: itemId,
      data: {
        name: itemName,
      },
    });
  };

  // ==========================================
  // [UI & RENDER] - Conditional renders for loading and error states.
  // ==========================================

  return (
    <div style={{ padding: "20px" }}>
      <div>{ChargeLadder()}</div>
    </div>
  );
}
