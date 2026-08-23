import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
  getArmoryItemConditions,
  getArmoryNfaFormTypes,
  getVaultsLockTypes,
  getVaultsVaultCategories,
  getDocumentsDocumentTypes
} from "./api/endpoints";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeArsenalId, setActiveArsenalId] = useState(null);
  const [activeArsenalName, setActiveArsenalName] = useState("Loading...");
  const [arsenals, setArsenals] = useState([]);
  const [enums, setEnums] = useState(null);

  const checkInitialization = useCallback(async () => {
    try {
      const res = await getAccountIsInitialized();
      if (res.status === 200) {
        setIsInitialized(res.data.isInitialized);
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
          const found = list.find((a) => a.id === parseInt(savedId));
          if (found) {
            setActiveArsenalId(found.id);
            setActiveArsenalName(found.name);
          } else {
            setActiveArsenalId(list[0].id);
            setActiveArsenalName(list[0].name);
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
      const fetchEnum = async (promiseFn) => {
        try {
          const r = await promiseFn();
          if (r.status === 200) {
            const d = r.data;
            return (d.value || []).map((e) => ({
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
        fetchEnum(getArmoryItemConditions),
        fetchEnum(getArmoryNfaFormTypes),
        fetchEnum(getVaultsLockTypes),
        fetchEnum(getVaultsVaultCategories),
        fetchEnum(getDocumentsDocumentTypes),
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
    async (username, password) => {
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
    async (username, password, email) => {
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

  const selectArsenal = useCallback(
    async (id) => {
      const res = await getArsenals();
      if (res.status === 200) {
        const list = res.data.value || [];
        setArsenals(list);
        const found = list.find((a) => a.id === id);
        if (found) {
          setActiveArsenalId(found.id);
          setActiveArsenalName(found.name);
          localStorage.setItem("activeArsenalId", found.id);
        }
      }
    },
    [],
  );

  const createArsenal = useCallback(
    async (name, description, iconName, colorHex) => {
      const res = await postArsenals({ name, description, iconName, colorHex });
      if (res.status === 200 || res.status === 201) {
        const newArsenal = res.data;
        const arsenalsRes = await getArsenals();
        if (arsenalsRes.status === 200) {
          const list = arsenalsRes.data.value || [];
          setArsenals(list);
          const found = list.find((a) => a.id === newArsenal.id);
          if (found) {
            setActiveArsenalId(found.id);
            setActiveArsenalName(found.name);
            localStorage.setItem("activeArsenalId", found.id);
          }
        }
        return true;
      }
      throw new Error("Failed to create arsenal collection");
    },
    [],
  );

  const deleteArsenal = useCallback(
    async (id) => {
      const res = await deleteArsenalsFromKey(id);
      if (res.status === 200 || res.status === 204) {
        const arsenalsRes = await getArsenals();
        if (arsenalsRes.status === 200) {
          const list = arsenalsRes.data.value || [];
          setArsenals(list);
          if (list.length > 0) {
            const savedId = localStorage.getItem("activeArsenalId");
            const found = list.find((a) => a.id === parseInt(savedId));
            if (found) {
              setActiveArsenalId(found.id);
              setActiveArsenalName(found.name);
            } else {
              setActiveArsenalId(list[0].id);
              setActiveArsenalName(list[0].name);
            }
          } else {
            setActiveArsenalId(null);
            setActiveArsenalName("No Collections");
          }
        }
        return true;
      }
      throw new Error("Failed to delete arsenal");
    },
    [],
  );

  const updateArsenal = useCallback(
    async (id, name, description, iconName, colorHex) => {
      const res = await putArsenalsFromKey(id, { id, name, description, iconName, colorHex });
      if (res.status === 200 || res.status === 204) {
        const arsenalsRes = await getArsenals();
        if (arsenalsRes.status === 200) {
          const list = arsenalsRes.data.value || [];
          setArsenals(list);
          const active = list.find((a) => a.id === id);
          if (active && id === activeArsenalId) {
            setActiveArsenalName(active.name);
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
