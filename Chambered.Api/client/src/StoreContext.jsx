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
      const res = await fetch('/api/arsenals');
      if (res.ok) {
        const list = await res.json();
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
  }, [checkInitialization, fetchArsenals]);

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
      const arsenalsRes = await fetch('/api/arsenals');
      if (arsenalsRes.ok) {
        const list = await arsenalsRes.json();
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
    throw new Error(err || 'Invalid credentials');
  }, []);

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
      const arsenalsRes = await fetch('/api/arsenals');
      if (arsenalsRes.ok) {
        const list = await arsenalsRes.json();
        setArsenals(list);
        if (list.length > 0) {
          setActiveArsenalId(list[0].id);
          setActiveArsenalName(list[0].name);
        } else {
          setActiveArsenalId(null);
          setActiveArsenalName('No Collections');
        }
      }
      return true;
    }
    const err = await res.text();
    throw new Error(err || 'Registration failed');
  }, []);

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
    }
  }, []);

  // Select an arsenal
  const selectArsenal = useCallback(async (id) => {
    const res = await fetch('/api/arsenals');
    if (res.ok) {
      const list = await res.json();
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
  const createArsenal = useCallback(async (name, description) => {
    const res = await fetch('/api/arsenals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (res.ok) {
      const newArsenal = await res.json();
      
      // Reload and select
      const arsenalsRes = await fetch('/api/arsenals');
      if (arsenalsRes.ok) {
        const list = await arsenalsRes.json();
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
    const res = await fetch(`/api/arsenals/${id}`, { method: 'DELETE' });
    if (res.ok) {
      // Reload arsenals
      const arsenalsRes = await fetch('/api/arsenals');
      if (arsenalsRes.ok) {
        const list = await arsenalsRes.json();
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
    checkAuth,
    checkInitialization,
    login,
    firstRegister,
    logout,
    fetchArsenals,
    selectArsenal,
    createArsenal,
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
