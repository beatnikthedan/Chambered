import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../StoreContext";
import "./Settings.css";

import UserSettings from "../components/UserSettings";
import AresenalSettings from "../components/ArsenalSettings";
import ApiKeysSettings from "../components/ApiKeysSettings";
import BackupSettings from "../components/BackupSettings";
import AuthSettings from "../components/AuthSettings";
import ImportExportSettings from "../components/ImportExportSettings";

import {
  ARSENAL_ICONS,
  ARSENAL_PRESET_COLORS,
} from "../components/ArsenalIcons";
import SubmitButton from "../components/SubmitButton";
import ArsenalSettings from "../components/ArsenalSettings";

export default function Settings() {
  const store = useStore();

  // Tabs: 'users', 'oidc', 'apikeys', 'arsenals'
  const [activeTab, setActiveTab] = useState("users");

  const [activeView, setActiveView] = useState("arsenals");

  // Users Management State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    isAdmin: false,
  });

  // OIDC State
  const [oidc, setOidc] = useState({
    id: 0,
    isEnabled: false,
    clientId: "",
    clientSecret: "",
    issuerUrl: "",
    authUrl: "",
    tokenUrl: "",
    userinfoUrl: "",
    jwksUrl: "",
    autoCreateUser: true,
  });
  const [savingOidc, setSavingOidc] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: "", userId: "" });
  const [rawToken, setRawToken] = useState("");
  const [showRawTokenModal, setShowRawTokenModal] = useState(false);

  // Arsenals Create/Edit State
  const [showArsenalForm, setShowArsenalForm] = useState(false);
  const [isEditArsenalMode, setIsEditArsenalMode] = useState(false);
  const [editingArsenalId, setEditingArsenalId] = useState(null);
  const [savingArsenal, setSavingArsenal] = useState(false);
  const [arsenalSaveSuccess, setArsenalSaveSuccess] = useState(false);
  const [arsenalForm, setArsenalForm] = useState({
    name: "",
    description: "",
    iconName: "shield",
    colorHex: "#2563EB",
  });

  const resolvedRedirectUri = useMemo(() => {
    return `${window.location.origin}/api/auth/oidc/callback`;
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Fetch actions based on active tab
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "oidc") {
      fetchOidc();
    } else if (activeTab === "apikeys") {
      fetchApiKeys();
      fetchUsers(); // we need users listing for dropdown form mapping
    } else if (activeTab === "arsenals") {
      store.fetchArsenals();
    }
  }, [activeTab]);

  // Set default selected user in Key Form when users list changes
  useEffect(() => {
    if (users.length && !keyForm.userId) {
      setKeyForm((prev) => ({ ...prev, userId: users[0].id }));
    }
  }, [users]);

  // Users CRUD Handlers
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/settings/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      if (res.ok) {
        await fetchUsers();
        setShowUserForm(false);
        setUserForm({ username: "", email: "", password: "", isAdmin: false });
      } else {
        const err = await res.text();
        alert(`Failed: ${err}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (
      !window.confirm(
        "Remove this user profile? They will be immediately disconnected.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/settings/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        const err = await res.text();
        alert(`Failed: ${err}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // OIDC Settings Handlers
  const fetchOidc = async () => {
    try {
      const res = await fetch("/api/settings/oidc");
      if (res.ok) {
        setOidc(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveOidc = async (e) => {
    e.preventDefault();
    setSavingOidc(true);
    try {
      const res = await fetch("/api/settings/oidc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oidc),
      });
      if (res.ok) {
        alert("OIDC Settings successfully written.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingOidc(false);
    }
  };

  const discoverOidc = async () => {
    if (!oidc.issuerUrl) {
      alert("Please enter an Issuer URL first.");
      return;
    }
    setDiscovering(true);
    try {
      const res = await fetch("/api/settings/oidc/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issuerUrl: oidc.issuerUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setOidc((prev) => ({
          ...prev,
          authUrl: data.authUrl,
          tokenUrl: data.tokenUrl,
          userinfoUrl: data.userinfoUrl,
          jwksUrl: data.jwksUrl,
        }));
      } else {
        const err = await res.text();
        alert(`Discovery failed: ${err}`);
      }
    } catch (err) {
      alert(`Discovery request failed: ${err.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  // Developer API Keys Handlers
  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/settings/apikeys");
      if (res.ok) {
        setApiKeys(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      const res = await fetch("/api/settings/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keyForm),
      });
      if (res.ok) {
        const data = await res.json();
        setRawToken(data.rawToken);
        setApiKeys((prev) => [...prev, data.apiKey]);
        setShowKeyForm(false);
        setShowRawTokenModal(true);
        setKeyForm({ name: "", userId: users.length ? users[0].id : "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteApiKey = async (id) => {
    if (
      !window.confirm(
        "Permanently revoke this integration API key? Any active scripts using this key will immediately fail.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/settings/apikeys/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyRawTokenToClipboard = () => {
    navigator.clipboard.writeText(rawToken);
    alert("API Key copied to clipboard.");
  };

  const closeRawTokenModal = () => {
    setShowRawTokenModal(false);
    setRawToken("");
  };

  // Arsenals CRUD Handlers
  const openEditArsenalModal = (ars) => {
    setIsEditArsenalMode(true);
    setEditingArsenalId(ars.id);
    setArsenalForm({
      name: ars.name,
      description: ars.description || "",
      iconName: ars.iconName || "shield",
      colorHex: ars.colorHex || "#2563EB",
    });
    setShowArsenalForm(true);
  };

  const handleSaveArsenal = async (e) => {
    e.preventDefault();
    setSavingArsenal(true);
    setArsenalSaveSuccess(false);
    try {
      if (isEditArsenalMode) {
        const success = await store.updateArsenal(
          editingArsenalId,
          arsenalForm.name,
          arsenalForm.description,
          arsenalForm.iconName,
          arsenalForm.colorHex,
        );
        if (success) {
          setArsenalSaveSuccess(true);
          setTimeout(() => {
            setShowArsenalForm(false);
            setIsEditArsenalMode(false);
            setEditingArsenalId(null);
            setArsenalForm({
              name: "",
              description: "",
              iconName: "shield",
              colorHex: "#2563EB",
            });
            setArsenalSaveSuccess(false);
          }, 800);
        }
      } else {
        const success = await store.createArsenal(
          arsenalForm.name,
          arsenalForm.description,
          arsenalForm.iconName,
          arsenalForm.colorHex,
        );
        if (success) {
          setArsenalSaveSuccess(true);
          setTimeout(() => {
            setShowArsenalForm(false);
            setArsenalForm({
              name: "",
              description: "",
              iconName: "shield",
              colorHex: "#2563EB",
            });
            setArsenalSaveSuccess(false);
          }, 800);
        }
      }
    } catch (err) {
      alert(`Failed to save arsenal collection: ${err.message}`);
    } finally {
      setSavingArsenal(false);
    }
  };

  const handleDeleteArsenal = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to DELETE this entire Arsenal?\n\nWARNING: All Armory items and Ammunition lots contained inside this arsenal will be permanently deleted. This action is irreversible!",
      )
    ) {
      return;
    }
    try {
      await store.deleteArsenal(id);
    } catch (err) {
      alert(`Failed to delete arsenal: ${err.message}`);
    }
  };

  return (
    <div className="layout-grid">
      {/* ASIDE ON THE LEFT */}
      <aside className="sidebar">
        {/* DATA Group */}
        <div className="menu-group">
          <div className="menu-title">DATA</div>
          <ul className="menu-list">
            <li
              className={`menu-item ${activeView === "arsenals" ? "active" : ""}`}
              onClick={() => setActiveView("arsenals")}
            >
              <span>Arsenals</span>
              <span className="badge badge-muted">
                {store.arsenals?.length ?? null}
              </span>
            </li>
            {/* <li
              className={`menu-item ${activeView === "units" ? "active" : ""}`}
              onClick={() => setActiveView("units")}
            >
              <span>Units & formats</span>
            </li> */}
            <li
              className={`menu-item ${activeView === "backup" ? "active" : ""}`}
              onClick={() => setActiveView("backup")}
            >
              <span>Backup</span>
            </li>
            <li
              className={`menu-item ${activeView === "import-export" ? "active" : ""}`}
              onClick={() => setActiveView("import-export")}
            >
              <span>Import/Export</span>
            </li>
          </ul>
        </div>

        {/* ACCESS Group */}
        <div className="menu-group">
          <div className="menu-title">ACCESS</div>
          <ul className="menu-list">
            <li
              className={`menu-item ${activeView === "users" ? "active" : ""}`}
              onClick={() => setActiveView("users")}
            >
              <span>Users</span>
              <span className="badge badge-yellow">3</span>
            </li>
            <li
              className={`menu-item ${activeView === "auth" ? "active" : ""}`}
              onClick={() => setActiveView("auth")}
            >
              <span>OIDC / SSO</span>
              <span className="badge badge-green">on</span>
            </li>
            <li
              className={`menu-item ${activeView === "api" ? "active" : ""}`}
              onClick={() => setActiveView("api")}
            >
              <span>API keys</span>
              <span className="badge badge-muted">2</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* MAIN ON THE RIGHT */}
      <main className="main-content">
        {/* Paste your main content here */}

        {activeView === "arsenals" && (
          <ArsenalSettings
            store={store}
            ARSENAL_ICONS={ARSENAL_ICONS}
            ARSENAL_PRESET_COLORS={ARSENAL_PRESET_COLORS}
            SubmitButton={SubmitButton}
          />
        )}

        {activeView === "backup" && <BackupSettings />}

        {activeView === "import-export" && (
          <ImportExportSettings store={store} />
        )}

        {activeView === "users" && <UserSettings currentUserId={1} />}

        {activeView === "auth" && <AuthSettings />}

        {activeView === "api" && <ApiKeysSettings />}
      </main>
    </div>
  );
}
