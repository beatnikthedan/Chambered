# CHAMBERED REPOSITORY RULES & CONSTRAINTS

## 1. DOMAIN MODELING & TERMINOLOGY

- **Forbidden Terms:** Never use the word "Firearm" in labels, variables, types, or UI text. Use domain-specific terms defined in the backend models (e.g., `Pew`, `PewArmoryItem`, `ArmoryItem`).
- **Exact Model & Subclass Names:** Do not invent or rename entity properties or types. Use exact C# model property and class names (e.g., `PewArmoryItem`, `OpticArmoryItem`, `SuppressorArmoryItem`, `LightArmoryItem`, `ArmoryItem`).
- **Base vs. Derived Properties:** `ArmoryItem` is the base model. Properties such as `SerialNumber`, `RoundCount`, `BarrelLengthInches`, and `NfaFormType` belong strictly to specific derived types (`PewArmoryItem`, etc.) and must not be placed on base tables/views.

## 2. API & PAYLOAD REQUIREMENTS

- **OData Polymorphic Typing:** All entity POST and PATCH payloads must include `"@odata.type": "#Chambered.Data.Models.<ItemType>"`.
- **No Unmapped Payload Properties:** Do not send properties not declared on the backend entity model (e.g., do not send `model` on `ArmoryItem`).

## 3. UI CONSISTENCY

- **Data-Driven Dropdowns:** Dropdowns must bind directly to backend lookup/type endpoints (`GetArmoryItemsArmoryItemTypes`, `Vaults`, `Enums`) without client-side cosmetic remapping.
- **Empty State Text:** Standardize empty list/table/card/tree view messages across all views (e.g., `"No matching armory items found."`).
- **No Unsolicited Icons:** Do not add icons or emojis to buttons, tabs, or headers unless explicitly requested.
