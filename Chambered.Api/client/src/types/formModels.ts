import type { Product } from "../api/models/product";
import type { ArmoryItem } from "../api/models/armoryItem";
import type { Manufacturer } from "../api/models/manufacturer";
import type { Vault } from "../api/models/vault";

// ---------------------------------------------------------------------------
// Product Form Model & Factories
// ---------------------------------------------------------------------------

export interface ProductFormData extends Partial<Product> {
  // Base Product Properties
  id?: number;
  name?: string | null;
  description?: string | null;
  manufacturerId?: number | any;
  productType?: string | null;
  partNumber?: string | null;
  sku?: string | null;
  webPageUrl?: string | null;
  coverImageId?: number | null;
  specifications?: Record<string, any>;

  // PewPew (Firearms)
  pewPewCategory?: string;
  caliberId?: string | number;
  actionType?: string;
  isNfaItem?: boolean;

  // Optics & Sights
  minMagnification?: string | number;
  maxMagnification?: string | number;
  objectiveDiameterMm?: string | number;
  opticType?: string;
  reticle?: string;
  adjustmentUnits?: string;
  tubeDiameter?: string;
  isIlluminated?: boolean;

  // Suppressors & Silencers
  threadPitch?: string;
  attachmentType?: string;
  material?: string;
  soundReductionDb?: string | number;
  isFullAutoRated?: boolean;
  isUserServiceable?: boolean;

  // Lights & Lasers
  lumens?: string | number;
  candela?: string | number;
  mountType?: string;
  laserColor?: string;
  hasRemoteSwitchPort?: boolean;
  isInfraredCapable?: boolean;

  // Security & Safes
  lockType?: string;

  // Reloading Powder
  powderType?: string;
  shape?: string;
  burnRate?: string;
  containerWeightLbs?: number;

  // Primers
  primerSize?: string;
  primerType?: string;
  isMagnum?: boolean;
  isMatch?: boolean;

  // Projectiles & Bullets
  bcG1?: number | null;
  bcG7?: number | null;
  isBoatTail?: boolean;
  hasCannelure?: boolean;

  // Casings & Brass
  primerPocketSize?: string;
  isPrimed?: boolean;
  isAnnealed?: boolean;
  isVirgin?: boolean;

  // Ammunition (Loaded Munitions)
  muzzleVelocityFps?: number;
  muzzleEnergyFtLbs?: number;
  isPlusP?: boolean;
  isSubsonic?: boolean;

  // Shared Attribute Fields
  hasBattery?: boolean;
  batteryType?: string;
  quantity?: number;
  projectileProfile?: string;
  projectileMaterial?: string;
  isLeadFree?: boolean;
  weightGrains?: number;
  caseMaterial?: string;
  headStamp?: string;
  isCapacityLimited?: boolean;
  maxCapacity?: number;

  [key: string]: any;
}

export const createDefaultProductForm = (): ProductFormData => ({
  id: 0,
  name: "",
  description: "",
  manufacturerId: "",
  productType: "PewPew",
  partNumber: "",
  sku: "",
  webPageUrl: "",
  coverImageId: null,
  specifications: {},

  // PewPew
  pewPewCategory: "",
  caliberId: "",
  actionType: "",
  isNfaItem: false,

  // Optic
  minMagnification: "",
  maxMagnification: "",
  objectiveDiameterMm: "",
  opticType: "",
  reticle: "",
  adjustmentUnits: "",
  tubeDiameter: "",
  isIlluminated: false,

  // Suppressor
  threadPitch: "",
  attachmentType: "",
  material: "",
  soundReductionDb: "",
  isFullAutoRated: false,
  isUserServiceable: false,

  // Light
  lumens: "",
  candela: "",
  mountType: "",
  laserColor: "",
  hasRemoteSwitchPort: false,
  isInfraredCapable: false,

  // Security
  lockType: "",

  // Powder
  powderType: "",
  shape: "",
  burnRate: "",
  containerWeightLbs: 0,

  // Primers
  primerSize: "",
  primerType: "",
  isMagnum: false,
  isMatch: false,

  // Projectiles
  bcG1: null,
  bcG7: null,
  isBoatTail: false,
  hasCannelure: false,

  // Casings
  primerPocketSize: "",
  isPrimed: false,
  isAnnealed: false,
  isVirgin: false,

  // Ammunition
  muzzleVelocityFps: 0,
  muzzleEnergyFtLbs: 0,
  isPlusP: false,
  isSubsonic: false,

  // Shared Attributes
  hasBattery: false,
  batteryType: "",
  quantity: 0,
  projectileProfile: "",
  projectileMaterial: "",
  isLeadFree: false,
  weightGrains: 0,
  caseMaterial: "",
  headStamp: "",
  isCapacityLimited: false,
  maxCapacity: 0,
});

export const PRODUCT_STATIC_KEYS = new Set([
  ...Object.keys(createDefaultProductForm()),
  "created",
  "createdBy",
  "modified",
  "modifiedBy",
]);

// ---------------------------------------------------------------------------
// Armory Item Form Model & Factories
// ---------------------------------------------------------------------------

export interface ArmoryItemFormData extends Partial<ArmoryItem> {
  id?: number;
  name?: string | null;
  description?: string | null;
  itemType?: string | null;
  productId?: number | any;
  arsenalId?: number | any;
  vaultId?: number | any;
  ownerId?: string | null;
  beneficiaryId?: string | null;
  parentItemId?: number | null;
  condition?: any;
  purchasePrice?: number | any;
  estimatedValue?: number | any;
  purchaseDate?: string | null;
  coverImageId?: number | null;
  notesMarkdown?: string | null;
  specifications?: Record<string, any>;

  // Sub-model specific fields
  serialNumber?: string;
  roundCount?: string | number;
  barrelLengthInches?: string | number;
  twistRate?: string;
  threadPitch?: string;
  nfaFormType?: string;
  taxStampDocumentUrl?: string;
  stampApprovalDate?: string;
  batteryLastChangedDate?: string;
  batteryExpirationDate?: string;

  [key: string]: any;
}

export const createDefaultArmoryItemForm = (): ArmoryItemFormData => ({
  id: 0,
  name: "",
  description: "",
  itemType: "PewArmoryItem",
  productId: "",
  arsenalId: "",
  vaultId: "",
  ownerId: "",
  beneficiaryId: "",
  parentItemId: null,
  condition: "Excellent",
  purchasePrice: "",
  estimatedValue: "",
  purchaseDate: "",
  coverImageId: null,
  notesMarkdown: "",
  specifications: {},

  // Sub-model defaults
  serialNumber: "",
  roundCount: 0,
  barrelLengthInches: "",
  twistRate: "",
  threadPitch: "",
  nfaFormType: "Form4",
  taxStampDocumentUrl: "",
  stampApprovalDate: "",
  batteryLastChangedDate: "",
  batteryExpirationDate: "",
});

export const ARMORY_STATIC_KEYS = new Set([
  ...Object.keys(createDefaultArmoryItemForm()),
  "created",
  "createdBy",
  "modified",
  "modifiedBy",
]);

// ---------------------------------------------------------------------------
// Manufacturer & Vault Default Factories
// ---------------------------------------------------------------------------

export const createDefaultManufacturerForm = (): Partial<Manufacturer> => ({
  id: 0,
  name: "",
  webPageUrl: "",
  phoneNumber: "",
  streetAddress: "",
  city: "",
  stateOrProvince: "",
  postalCode: "",
  country: "",
});

export const createDefaultVaultForm = (): Partial<Vault> => ({
  id: 0,
  name: "",
  description: "",
  arsenalId: 1,
  parentVaultId: null,
  productId: null,
  encryptedPasscode: "",
  passcodeHint: "",
  backupKeyLocation: "",
  batteryLastChangedDate: null,
  batteryExpirationDate: null,
  hasDehumidifier: false,
  dehumidifierLastServiced: null,
  targetMaxHumidityPercent: 45,
});
