import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getAccountIsInitialized,
  getArsenals,
  postArsenals,
  putArsenalsFromKey,
  deleteArsenalsFromKey,
  getUsersProfile,
  postAccountLogin,
  postAccountLogout,
  postUsersRegister,
  getProductsActionTypes,
  getProductsBatteryTypes,
  getProductsLaserColors,
  getProductsLightMountTypes,
  getProductsOpticAdjustmentUnits,
  getProductsOpticReticles,
  getProductsOpticTypes,
  getProductsPewPewCategories,
  getProductsSuppressorAttachmentTypes,
  getProductsSuppressorMaterials,
  getArmoryItemsItemConditions,
  getArmoryItemsNfaFormTypes,
  getVaultsLockTypes,
  getVaultsVaultCategories,
  getProductDocumentsDocumentTypes,
} from "./api/endpoints";
import type { Arsenal } from "./api/models/arsenal";
import type { UserResponseDto } from "./api/models/userResponseDto";

export interface EnumOption {
  id: string;
  name: string;
  label: string;
}

export interface StoreEnums {
  actionTypes: EnumOption[];
  batteryTypes: EnumOption[];
  laserColors: EnumOption[];
  lightMountTypes: EnumOption[];
  opticAdjustmentUnits: EnumOption[];
  opticReticles: EnumOption[];
  opticTypes: EnumOption[];
  pewPewCategories: EnumOption[];
  suppressorAttachmentTypes: EnumOption[];
  suppressorMaterials: EnumOption[];
  itemConditions: EnumOption[];
  nfaFormTypes: EnumOption[];
  lockTypes: EnumOption[];
  vaultCategories: EnumOption[];
  documentTypes: EnumOption[];
}

export interface StoreContextType {
  user: UserResponseDto | null;
  isAuthenticated: boolean;
  isInitialized: boolean | null;
  loading: boolean;
  activeArsenalId: number | null;
  activeArsenalName: string;
  arsenals: Arsenal[];
  enums: StoreEnums | null;
  checkAuth: () => Promise<void>;
  checkInitialization: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  firstRegister: (
    username: string,
    password: string,
    email: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchArsenals: () => Promise<void>;
  selectArsenal: (id: number) => Promise<void>;
  createArsenal: (
    name: string,
    description: string | null,
    iconName: string | null,
    colorHex: string | null,
  ) => Promise<boolean>;
  updateArsenal: (
    id: number,
    name: string,
    description: string | null,
    iconName: string | null,
    colorHex: string | null,
  ) => Promise<boolean>;
  deleteArsenal: (id: number) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeArsenalId, setActiveArsenalId] = useState<number | null>(null);
  const [activeArsenalName, setActiveArsenalName] =
    useState<string>("Loading...");
  const [arsenals, setArsenals] = useState<Arsenal[]>([]);
  const [enums, setEnums] = useState<StoreEnums | null>(null);

  const checkInitialization = useCallback(async () => {
    try {
      const res = await getAccountIsInitialized();
      if (res.status === 200) {
        setIsInitialized(res.data.isInitialized ?? null);
      }
    } catch (err) {
      console.error("Initialization check failed", err);
    }
  }, []);

  const fetchArsenals = useCallback(async () => {
    try {
      const res = await getArsenals();
      if (res.status === 200) {
        const list = res.data.value || [];
        setArsenals(list);
        if (list.length > 0) {
          const savedId = localStorage.getItem("activeArsenalId");
          const found = list.find((a) => a.id === parseInt(savedId || ""));
          if (found && found.id !== undefined) {
            setActiveArsenalId(found.id);
            setActiveArsenalName(found.name || "");
          } else {
            setActiveArsenalId(list[0].id ?? null);
            setActiveArsenalName(list[0].name || "");
          }
        } else {
          setActiveArsenalId(null);
          setActiveArsenalName("No Collections");
        }
      }
    } catch (err) {
      console.error("Failed to load arsenals list", err);
    }
  }, []);

  const fetchEnums = useCallback(async () => {
    try {
      const fetchEnum = async (
        promiseFn: () => Promise<any>,
      ): Promise<EnumOption[]> => {
        try {
          const r = await promiseFn();
          if (r.status === 200) {
            const d = r.data;
            return (d.value || []).map((e: any) => ({
              id: e.value,
              name: e.value,
              label: e.displayName,
            }));
          }
        } catch (e) {
          console.error(e);
        }
        return [];
      };

      const [
        actionTypes,
        ammoItemDocumentTypes,
        batteryTypes,
        caseMaterials,
        itemConditions,
        laserColors,
        lightMountTypes,
        lockTypes,
        nfaFormTypes,
        opticAdjustmentUnits,
        opticReticles,
        opticTypes,
        pewPewCategories,
        powderBurnRates,
        powderShapes,
        powderTypes,
        primerSizes,
        primerTypes,
        productDocumentTypes,
        projectileMaterials,
        projectileProfiles,
        suppressorAttachmentTypes,
        suppressorMaterials,
        vaultCategories,
      ] = await Promise.all([
        fetchEnum(getProductsActionTypes),
        fetchEnum(getProductsBatteryTypes),
        fetchEnum(getProductsLaserColors),
        fetchEnum(getProductsLightMountTypes),
        fetchEnum(getProductsOpticAdjustmentUnits),
        fetchEnum(getProductsOpticReticles),
        fetchEnum(getProductsOpticTypes),
        fetchEnum(getProductsPewPewCategories),
        fetchEnum(getProductsSuppressorAttachmentTypes),
        fetchEnum(getProductsSuppressorMaterials),
        fetchEnum(getArmoryItemsItemConditions),
        fetchEnum(getArmoryItemsNfaFormTypes),
        fetchEnum(getVaultsLockTypes),
        fetchEnum(getVaultsVaultCategories),
        fetchEnum(getProductDocumentsDocumentTypes),
      ]);

      setEnums({
        actionTypes,
        batteryTypes,
        laserColors,
        lightMountTypes,
        opticAdjustmentUnits,
        opticReticles,
        opticTypes,
        pewPewCategories,
        suppressorAttachmentTypes,
        suppressorMaterials,
        itemConditions,
        nfaFormTypes,
        lockTypes,
        vaultCategories,
        documentTypes,
      });
    } catch (err) {
      console.error("Failed to load enums metadata", err);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      await checkInitialization();
      const res = await getUsersProfile();
      if (res.status === 200) {
        setUser(res.data);
        setIsAuthenticated(true);
        await fetchArsenals();
        await fetchEnums();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Auth verification failed", err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [checkInitialization, fetchArsenals, fetchEnums]);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await postAccountLogin({ email: username, password });
      if (res.status === 200) {
        const authResponse = res.data;
        setUser({
          id: authResponse.userId,
          username: authResponse.username || authResponse.email,
          email: authResponse.email,
          gravatarUrl: authResponse.gravatarUrl,
          roles: authResponse.roles || [],
        });
        setIsAuthenticated(true);
        setIsInitialized(true);

        await fetchArsenals();
        await fetchEnums();
        return true;
      }
      throw new Error("Invalid credentials");
    },
    [fetchEnums, fetchArsenals],
  );

  const firstRegister = useCallback(
    async (username: string, password: string, email: string) => {
      const res = await postUsersRegister({
        username,
        email,
        password,
      });
      if (res.status === 200 || res.status === 201) {
        setIsInitialized(true);
        return await login(email, password);
      }
      throw new Error("Registration failed");
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await postAccountLogout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setActiveArsenalId(null);
      setActiveArsenalName("Loading...");
      setArsenals([]);
      setEnums(null);
    }
  }, []);

  const selectArsenal = useCallback(async (id: number) => {
    const res = await getArsenals();
    if (res.status === 200) {
      const list = res.data.value || [];
      setArsenals(list);
      const found = list.find((a) => a.id === id);
      if (found && found.id !== undefined) {
        setActiveArsenalId(found.id);
        setActiveArsenalName(found.name || "");
        localStorage.setItem("activeArsenalId", String(found.id));
      }
    }
  }, []);

  const createArsenal = useCallback(
    async (
      name: string,
      description: string | null,
      iconName: string | null,
      colorHex: string | null,
    ) => {
      const res = await postArsenals({ name, description, iconName, colorHex });
      if (res.status === 200 || res.status === 201) {
        const newArsenal = res.data;
        const arsenalsRes = await getArsenals();
        if (arsenalsRes.status === 200) {
          const list = arsenalsRes.data.value || [];
          setArsenals(list);
          const found = list.find((a) => a.id === newArsenal.id);
          if (found && found.id !== undefined) {
            setActiveArsenalId(found.id);
            setActiveArsenalName(found.name || "");
            localStorage.setItem("activeArsenalId", String(found.id));
          }
        }
        return true;
      }
      throw new Error("Failed to create arsenal collection");
    },
    [],
  );

  const deleteArsenal = useCallback(async (id: number) => {
    const res = await deleteArsenalsFromKey(id);
    if (res.status === 200 || res.status === 204) {
      const arsenalsRes = await getArsenals();
      if (arsenalsRes.status === 200) {
        const list = arsenalsRes.data.value || [];
        setArsenals(list);
        if (list.length > 0) {
          const savedId = localStorage.getItem("activeArsenalId");
          const found = list.find((a) => a.id === parseInt(savedId || ""));
          if (found && found.id !== undefined) {
            setActiveArsenalId(found.id);
            setActiveArsenalName(found.name || "");
          } else {
            setActiveArsenalId(list[0].id ?? null);
            setActiveArsenalName(list[0].name || "");
          }
        } else {
          setActiveArsenalId(null);
          setActiveArsenalName("No Collections");
        }
      }
      return true;
    }
    throw new Error("Failed to delete arsenal");
  }, []);

  const updateArsenal = useCallback(
    async (
      id: number,
      name: string,
      description: string | null,
      iconName: string | null,
      colorHex: string | null,
    ) => {
      const res = await putArsenalsFromKey(id, {
        id,
        name,
        description,
        iconName,
        colorHex,
      });
      if (res.status === 200 || res.status === 204) {
        const arsenalsRes = await getArsenals();
        if (arsenalsRes.status === 200) {
          const list = arsenalsRes.data.value || [];
          setArsenals(list);
          const active = list.find((a) => a.id === id);
          if (active && id === activeArsenalId) {
            setActiveArsenalName(active.name || "");
          }
        }
        return true;
      }
      throw new Error("Failed to update arsenal collection");
    },
    [activeArsenalId],
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    isAuthenticated,
    isInitialized,
    loading,
    activeArsenalId,
    activeArsenalName,
    arsenals,
    enums,
    checkAuth,
    checkInitialization,
    login,
    firstRegister,
    logout,
    fetchArsenals,
    selectArsenal,
    createArsenal,
    updateArsenal,
    deleteArsenal,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
