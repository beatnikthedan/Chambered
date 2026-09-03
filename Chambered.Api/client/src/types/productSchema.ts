// ---------------------------------------------------------------------------
// Base Product Fields (Applicable to all Products)
// ---------------------------------------------------------------------------
export const BASE_PRODUCT_FIELDS = {
  // audit
  created: new Date(),
  modified: new Date(),
  createdBy: "",
  modifiedBy: "",

  // product
  id: 0,
  name: "",
  description: "",
  manufacturerId: "" as string | number,
  productType: "PewPew",
  partNumber: "",
  sku: "",
  webPageUrl: "",
  coverImageId: null as number | null,
  specifications: {} as Record<string, any>,
};

// ---------------------------------------------------------------------------
// PewPew (Firearms)
// ---------------------------------------------------------------------------
export const PEWPEW_FIELDS = {
  pewPewCategory: "",
  caliberId: "" as string | number,
  actionType: "",
  isNfaItem: false,
};

// ---------------------------------------------------------------------------
// Optics & Sights
// ---------------------------------------------------------------------------
export const OPTIC_FIELDS = {
  minMagnification: "" as string | number,
  maxMagnification: "" as string | number,
  objectiveDiameterMm: "" as string | number,
  opticType: "",
  reticle: "",
  adjustmentUnits: "",
  tubeDiameter: "",
  isIlluminated: false,
};

// ---------------------------------------------------------------------------
// Suppressors & Silencers
// ---------------------------------------------------------------------------
export const SUPPRESSOR_FIELDS = {
  threadPitch: "",
  attachmentType: "",
  material: "",
  soundReductionDb: "" as string | number,
  isFullAutoRated: false,
  isUserServiceable: false,
};

// ---------------------------------------------------------------------------
// Lights & Lasers
// ---------------------------------------------------------------------------
export const LIGHT_FIELDS = {
  lumens: "" as string | number,
  candela: "" as string | number,
  mountType: "",
  laserColor: "",
  hasRemoteSwitchPort: false,
  isInfraredCapable: false,
};

// ---------------------------------------------------------------------------
// Security & Safes
// ---------------------------------------------------------------------------
export const SECURITY_FIELDS = {
  lockType: "",
};

// ---------------------------------------------------------------------------
// Reloading Powder
// ---------------------------------------------------------------------------
export const POWDER_FIELDS = {
  powderType: "",
  shape: "",
  burnRate: "",
  containerWeightLbs: 0,
};

// ---------------------------------------------------------------------------
// Primers
// ---------------------------------------------------------------------------
export const PRIMER_FIELDS = {
  primerSize: "",
  primerType: "",
  isMagnum: false,
  isMatch: false,
};

// ---------------------------------------------------------------------------
// Projectiles & Bullets
// ---------------------------------------------------------------------------
export const PROJECTILE_FIELDS = {
  bcG1: null as number | null,
  bcG7: null as number | null,
  isBoatTail: false,
  hasCannelure: false,
};

// ---------------------------------------------------------------------------
// Casings & Brass
// ---------------------------------------------------------------------------
export const CASING_FIELDS = {
  primerPocketSize: "",
  isPrimed: false,
  isAnnealed: false,
  isVirgin: false,
};

// ---------------------------------------------------------------------------
// Ammunition (Loaded Munitions)
// ---------------------------------------------------------------------------
export const AMMUNITION_FIELDS = {
  muzzleVelocityFps: 0,
  muzzleEnergyFtLbs: 0,
  isPlusP: false,
  isSubsonic: false,
};

// ---------------------------------------------------------------------------
// Shared Interface Attributes (Batteries, Capacity, Materials, Grain Weights)
// ---------------------------------------------------------------------------
export const SHARED_ATTRIBUTE_FIELDS = {
  // Battery & Power
  hasBattery: false,
  batteryType: "",

  // General Quantities
  quantity: 0,

  // Projectile Specs (Shared across Projectiles & Ammunition)
  projectileProfile: "",
  projectileMaterial: "",
  isLeadFree: false,
  weightGrains: 0,

  // Casing Specs (Shared across Casings & Ammunition)
  caseMaterial: "",
  headStamp: "",

  // Capacity Restrictions (AmmoBoxes, Safes, Magazines)
  isCapacityLimited: false,
  maxCapacity: 0,
};

// ---------------------------------------------------------------------------
// Combined Single Source of Truth
// ---------------------------------------------------------------------------
export const INITIAL_FORM_STATE = {
  ...BASE_PRODUCT_FIELDS,
  ...PEWPEW_FIELDS,
  ...OPTIC_FIELDS,
  ...SUPPRESSOR_FIELDS,
  ...LIGHT_FIELDS,
  ...SECURITY_FIELDS,
  ...POWDER_FIELDS,
  ...PRIMER_FIELDS,
  ...PROJECTILE_FIELDS,
  ...CASING_FIELDS,
  ...AMMUNITION_FIELDS,
  ...SHARED_ATTRIBUTE_FIELDS,
};

export type FormState = typeof INITIAL_FORM_STATE;

// Derived Runtime Static Keys for Spec Filtering & Dynamic Mapping
export const PRODUCT_STATIC_KEYS = new Set(Object.keys(INITIAL_FORM_STATE));
