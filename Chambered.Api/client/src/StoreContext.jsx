import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(null);
  const [loading, setLoading] = useState(true);

  // Arsenal state
  const [activeArsenalId, setActiveArsenalId] = useState(null);
  const [activeArsenalName, setActiveArsenalName] = useState('Loading...');
  const [arsenals, setArsenals] = useState([]);
  
  // Enums metadata state
  const [enums, setEnums] = useState(null);

  // Check initialization status
  const checkInitialization = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/is-initialized');
      if (res.ok) {
        const data = await res.json();
        setIsInitialized(data.isInitialized);
      }
    } catch (err) {
      console.error('Initialization check failed', err);
    }
  }, []);

  // Fetch all arsenals
  const fetchArsenals = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/Arsenals');
      if (res.ok) {
        const data = await res.json();
        const list = data.value || [];
        setArsenals(list);
        if (list.length > 0) {
          const savedId = localStorage.getItem('activeArsenalId');
          const found = list.find(a => a.id === parseInt(savedId));
          if (found) {
            setActiveArsenalId(found.id);
            setActiveArsenalName(found.name);
          } else {
            setActiveArsenalId(list[0].id);
            setActiveArsenalName(list[0].name);
          }
        } else {
          setActiveArsenalId(null);
          setActiveArsenalName('No Collections');
        }
      }
    } catch (err) {
      console.error('Failed to load arsenals list', err);
    }
  }, []);

  // Fetch all metadata enums
  const fetchEnums = useCallback(async () => {
    try {
      const fetchEnum = async (url) => {
        try {
          const r = await fetch(url);
          if (r.ok) {
            const d = await r.json();
            return (d.value || []).map(e => ({
              id: e.value,
              name: e.value,
              label: e.displayName
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
        documentTypes
      ] = await Promise.all([
        fetchEnum('/api/v1/Products/GetActionTypes()'),
        fetchEnum('/api/v1/Products/GetBatteryTypes()'),
        fetchEnum('/api/v1/Products/GetLaserColors()'),
        fetchEnum('/api/v1/Products/GetLightMountTypes()'),
        fetchEnum('/api/v1/Products/GetOpticAdjustmentUnits()'),
        fetchEnum('/api/v1/Products/GetOpticReticles()'),
        fetchEnum('/api/v1/Products/GetOpticTypes()'),
        fetchEnum('/api/v1/Products/GetPewPewCategories()'),
        fetchEnum('/api/v1/Products/GetSuppressorAttachmentTypes()'),
        fetchEnum('/api/v1/Products/GetSuppressorMaterials()'),
        fetchEnum('/api/v1/Armory/GetItemConditions()'),
        fetchEnum('/api/v1/Armory/GetNfaFormTypes()'),
        fetchEnum('/api/v1/Vaults/GetLockTypes()'),
        fetchEnum('/api/v1/Vaults/GetVaultCategories()'),
        fetchEnum('/api/v1/Documents/GetDocumentTypes()')
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
        documentTypes
      });
    } catch (err) {
      console.error('Failed to load enums metadata', err);
    }
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      await checkInitialization();
      const res = await fetch('/api/auth/user');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
        // Fetch arsenals right after successful auth
        await fetchArsenals();
        await fetchEnums();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth verification failed', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [checkInitialization, fetchArsenals, fetchEnums]);

  // Login action
  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      setIsAuthenticated(true);
      
      // Fetch arsenals right after login
      const arsenalsRes = await fetch('/api/v1/Arsenals');
      if (arsenalsRes.ok) {
        const data = await arsenalsRes.json();
        const list = data.value || [];
        setArsenals(list);
        if (list.length > 0) {
          const savedId = localStorage.getItem('activeArsenalId');
          const found = list.find(a => a.id === parseInt(savedId));
          if (found) {
            setActiveArsenalId(found.id);
            setActiveArsenalName(found.name);
          } else {
            setActiveArsenalId(list[0].id);
            setActiveArsenalName(list[0].name);
          }
        } else {
          setActiveArsenalId(null);
          setActiveArsenalName('No Collections');
        }
      }
      await fetchEnums();
      return true;
    }
    const err = await res.text();
    throw new Error(err || 'Invalid credentials');
  }, [fetchEnums]);

  // Register action
  const firstRegister = useCallback(async (username, password, email) => {
    const res = await fetch('/api/auth/first-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      setIsAuthenticated(true);
      setIsInitialized(true);
      
      // Fetch arsenals right after registration
      const arsenalsRes = await fetch('/api/v1/Arsenals');
      if (arsenalsRes.ok) {
        const data = await arsenalsRes.json();
        const list = data.value || [];
        setArsenals(list);
        if (list.length > 0) {
          setActiveArsenalId(list[0].id);
          setActiveArsenalName(list[0].name);
        } else {
          setActiveArsenalId(null);
          setActiveArsenalName('No Collections');
        }
      }
      await fetchEnums();
      return true;
    }
    const err = await res.text();
    throw new Error(err || 'Registration failed');
  }, [fetchEnums]);

  // Logout action
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setActiveArsenalId(null);
      setActiveArsenalName('Loading...');
      setArsenals([]);
      setEnums(null);
    }
  }, []);

  // Select an arsenal
  const selectArsenal = useCallback(async (id) => {
    const res = await fetch('/api/v1/Arsenals');
    if (res.ok) {
      const data = await res.json();
      const list = data.value || [];
      setArsenals(list);
      const found = list.find(a => a.id === id);
      if (found) {
        setActiveArsenalId(found.id);
        setActiveArsenalName(found.name);
        localStorage.setItem('activeArsenalId', found.id);
      }
    }
  }, []);

  // Create arsenal collection
  const createArsenal = useCallback(async (name, description, iconName, colorHex) => {
    const res = await fetch('/api/v1/Arsenals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, iconName, colorHex })
    });
    if (res.ok) {
      const newArsenal = await res.json();
      
      // Reload and select
      const arsenalsRes = await fetch('/api/v1/Arsenals');
      if (arsenalsRes.ok) {
        const data = await arsenalsRes.json();
        const list = data.value || [];
        setArsenals(list);
        const found = list.find(a => a.id === newArsenal.id);
        if (found) {
          setActiveArsenalId(found.id);
          setActiveArsenalName(found.name);
          localStorage.setItem('activeArsenalId', found.id);
        }
      }
      return true;
    }
    const err = await res.text();
    throw new Error(err || 'Failed to create arsenal collection');
  }, []);

  // Delete arsenal
  const deleteArsenal = useCallback(async (id) => {
    const res = await fetch(`/api/v1/Arsenals/${id}`, { method: 'DELETE' });
    if (res.ok) {
      // Reload arsenals
      const arsenalsRes = await fetch('/api/v1/Arsenals');
      if (arsenalsRes.ok) {
        const data = await arsenalsRes.json();
        const list = data.value || [];
        setArsenals(list);
        if (list.length > 0) {
          const savedId = localStorage.getItem('activeArsenalId');
          const found = list.find(a => a.id === parseInt(savedId));
          if (found) {
            setActiveArsenalId(found.id);
            setActiveArsenalName(found.name);
          } else {
            setActiveArsenalId(list[0].id);
            setActiveArsenalName(list[0].name);
          }
        } else {
          setActiveArsenalId(null);
          setActiveArsenalName('No Collections');
        }
      }
      return true;
    }
    const err = await res.text();
    throw new Error(err || 'Failed to delete arsenal');
  }, []);

  // Update arsenal collection
  const updateArsenal = useCallback(async (id, name, description, iconName, colorHex) => {
    const res = await fetch(`/api/v1/Arsenals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, description, iconName, colorHex })
    });
    if (res.ok) {
      // Reload lists
      const arsenalsRes = await fetch('/api/v1/Arsenals');
      if (arsenalsRes.ok) {
        const data = await arsenalsRes.json();
        const list = data.value || [];
        setArsenals(list);
        const active = list.find(a => a.id === id);
        if (active && id === activeArsenalId) {
          setActiveArsenalName(active.name);
        }
      }
      return true;
    }
    const err = await res.text();
    throw new Error(err || 'Failed to update arsenal collection');
  }, [activeArsenalId]);

  // Check auth on mount
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
    deleteArsenal
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
