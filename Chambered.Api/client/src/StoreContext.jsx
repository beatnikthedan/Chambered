import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const [activeArsenalId, setActiveArsenalId] = useState(null);
  const [activeArsenalName, setActiveArsenalName] = useState("Loading...");
  const [arsenals, setArsenals] = useState([]);
  const [enums, setEnums] = useState(null);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
    const currentToken = localStorage.getItem("token");
    if (currentToken) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }
    return fetch(url, { ...options, headers });
  }, []);

  const checkInitialization = useCallback(async () => {
    try {
      const res = await authenticatedFetch("/api/account/is-initialized");
      if (res.ok) {
        const data = await res.json();
        setIsInitialized(data.isInitialized);
      }
    } catch (err) {
      console.error("Initialization check failed", err);
    }
  }, [authenticatedFetch]);

  const fetchArsenals = useCallback(async () => {
    try {
      const res = await authenticatedFetch("/api/v1/Arsenals");
      if (res.ok) {
        const data = await res.json();
        const list = data.value || [];
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
  }, [authenticatedFetch]);

  const fetchEnums = useCallback(async () => {
    try {
      const fetchEnum = async (url) => {
        try {
          const r = await authenticatedFetch(url);
          if (r.ok) {
            const d = await r.json();
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
        fetchEnum("/api/v1/Products/GetActionTypes()"),
        fetchEnum("/api/v1/Products/GetBatteryTypes()"),
        fetchEnum("/api/v1/Products/GetLaserColors()"),
        fetchEnum("/api/v1/Products/GetLightMountTypes()"),
        fetchEnum("/api/v1/Products/GetOpticAdjustmentUnits()"),
        fetchEnum("/api/v1/Products/GetOpticReticles()"),
        fetchEnum("/api/v1/Products/GetOpticTypes()"),
        fetchEnum("/api/v1/Products/GetPewPewCategories()"),
        fetchEnum("/api/v1/Products/GetSuppressorAttachmentTypes()"),
        fetchEnum("/api/v1/Products/GetSuppressorMaterials()"),
        fetchEnum("/api/v1/Armory/GetItemConditions()"),
        fetchEnum("/api/v1/Armory/GetNfaFormTypes()"),
        fetchEnum("/api/v1/Vaults/GetLockTypes()"),
        fetchEnum("/api/v1/Vaults/GetVaultCategories()"),
        fetchEnum("/api/v1/Documents/GetDocumentTypes()"),
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
  }, [authenticatedFetch]);

  const checkAuth = useCallback(async () => {
    try {
      await checkInitialization();
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const res = await authenticatedFetch("/api/Users/profile");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
        await fetchArsenals();
        await fetchEnums();
      } else {
        localStorage.removeItem("token");
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
  }, [checkInitialization, fetchArsenals, fetchEnums, authenticatedFetch]);

  const login = useCallback(
    async (username, password) => {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });
      if (res.ok) {
        const authResponse = await res.json();
        localStorage.setItem("token", authResponse.accessToken);
        setToken(authResponse.accessToken);
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
      const err = await res.text();
      throw new Error(err || "Invalid credentials");
    },
    [fetchEnums, fetchArsenals],
  );

  const firstRegister = useCallback(
    async (username, password, email) => {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: username,
          lastName: "",
        }),
      });
      if (res.ok) {
        setIsInitialized(true);
        return await login(email, password);
      }
      const err = await res.text();
      throw new Error(err || "Registration failed");
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authenticatedFetch("/api/account/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setActiveArsenalId(null);
      setActiveArsenalName("Loading...");
      setArsenals([]);
      setEnums(null);
    }
  }, [authenticatedFetch]);

  const selectArsenal = useCallback(
    async (id) => {
      const res = await authenticatedFetch("/api/v1/Arsenals");
      if (res.ok) {
        const data = await res.json();
        const list = data.value || [];
        setArsenals(list);
        const found = list.find((a) => a.id === id);
        if (found) {
          setActiveArsenalId(found.id);
          setActiveArsenalName(found.name);
          localStorage.setItem("activeArsenalId", found.id);
        }
      }
    },
    [authenticatedFetch],
  );

  const createArsenal = useCallback(
    async (name, description, iconName, colorHex) => {
      const res = await authenticatedFetch("/api/v1/Arsenals", {
        method: "POST",
        body: JSON.stringify({ name, description, iconName, colorHex }),
      });
      if (res.ok) {
        const newArsenal = await res.json();
        const arsenalsRes = await authenticatedFetch("/api/v1/Arsenals");
        if (arsenalsRes.ok) {
          const data = await arsenalsRes.json();
          const list = data.value || [];
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
      const err = await res.text();
      throw new Error(err || "Failed to create arsenal collection");
    },
    [authenticatedFetch],
  );

  const deleteArsenal = useCallback(
    async (id) => {
      const res = await authenticatedFetch(`/api/v1/Arsenals/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const arsenalsRes = await authenticatedFetch("/api/v1/Arsenals");
        if (arsenalsRes.ok) {
          const data = await arsenalsRes.json();
          const list = data.value || [];
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
      const err = await res.text();
      throw new Error(err || "Failed to delete arsenal");
    },
    [authenticatedFetch],
  );

  const updateArsenal = useCallback(
    async (id, name, description, iconName, colorHex) => {
      const res = await authenticatedFetch(`/api/v1/Arsenals/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, name, description, iconName, colorHex }),
      });
      if (res.ok) {
        const arsenalsRes = await authenticatedFetch("/api/v1/Arsenals");
        if (arsenalsRes.ok) {
          const data = await arsenalsRes.json();
          const list = data.value || [];
          setArsenals(list);
          const active = list.find((a) => a.id === id);
          if (active && id === activeArsenalId) {
            setActiveArsenalName(active.name);
          }
        }
        return true;
      }
      const err = await res.text();
      throw new Error(err || "Failed to update arsenal collection");
    },
    [activeArsenalId, authenticatedFetch],
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
