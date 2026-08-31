import React, { useState } from "react";
import { useStore } from "../StoreContext";
import "./Settings.css";

import UserSettings from "../components/UserSettings";
import ApiKeysSettings from "../components/ApiKeysSettings";
import BackupSettings from "../components/BackupSettings";
import AuthSettings from "../components/AuthSettings";
import ImportExportSettings from "../components/ImportExportSettings";
import ArsenalSettings from "../components/ArsenalSettings";
import EmailSettings from "../components/EmailSettings";
import AppriseSettings from "../components/AppriseSettings";

export default function Settings() {
  const store = useStore();
  const [activeView, setActiveView] = useState<string>("arsenals");

  return (
    <div className="layout-grid">
      {/* ASIDE ON THE LEFT */}
      <aside className="settings-sidebar">
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

        {/* NOTIFICATION Group */}
        <div className="menu-group">
          <div className="menu-title">NOTIFICATIONS</div>

          <ul className="menu-list">
            <li
              className={`menu-item ${activeView === "email" ? "ative" : ""}`}
              onClick={() => setActiveView("email")}
            >
              <span>Email</span>
            </li>

            <li
              className={`menu-item ${activeView === "home" ? "active" : ""}`}
              onClick={() => setActiveView("home")}
            >
              <span>Home Assistant</span>
            </li>

            <li
              className={`menu-item ${activeView === "apprise" ? "active" : ""}`}
              onClick={() => setActiveView("apprise")}
            >
              <span>Apprise</span>
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
              <span className="badge badge-yellow"></span>
            </li>
            <li
              className={`menu-item ${activeView === "auth" ? "active" : ""}`}
              onClick={() => setActiveView("auth")}
            >
              <span>Authentication</span>
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

        {/* SERVER Group */}
        <div className="menu-group">
          <div className="menu-title">SERVER</div>
          <ul className="menu-list">
            <li
              className={`menu-item ${activeView === "history" ? "active" : ""}`}
              onClick={() => setActiveView("history")}
            >
              <span>History</span>
            </li>
            <li
              className={`menu-item ${activeView === "about" ? "active" : ""}`}
              onClick={() => setActiveView("about")}
            >
              <span>About</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* MAIN ON THE RIGHT */}
      <main className="main-content">
        {/* Paste your main content here */}

        {activeView === "arsenals" && <ArsenalSettings />}

        {activeView === "backup" && <BackupSettings />}

        {activeView === "import-export" && (
          <ImportExportSettings store={store} />
        )}

        {activeView === "email" && <EmailSettings />}

        {activeView === "apprise" && <AppriseSettings />}

        {activeView === "users" && <UserSettings currentUserId="1" />}

        {activeView === "auth" && <AuthSettings />}

        {activeView === "api" && <ApiKeysSettings />}
      </main>
    </div>
  );
}
