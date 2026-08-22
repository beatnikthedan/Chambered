import React, { useState, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { useStore } from "./StoreContext";
import "./App.css";
import "./components/VersionControl.tsx";

// Lazy loaded views stubs
import Dashboard from "./views/Dashboard";
import Armory from "./views/Armory";
import Munitions from "./views/Munitions";
import Settings from "./views/Settings";
import Login from "./views/Login";
import PlaceholderView from "./views/PlaceholderView";
import Vaults from "./views/Vaults";
import Catalog from "./views/Catalog";

// Route guarding components
// Route guarding components
import { ARSENAL_ICONS } from "./components/ArsenalIcons";
import { VersionControl } from "./components/VersionControl.tsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useStore();

  if (loading) {
    return (
      <div className="global-loading">
        <div className="spinner"></div>
        <p>Opening vaults...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useStore();

  if (loading) {
    return (
      <div className="global-loading">
        <div className="spinner"></div>
        <p>Opening vaults...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const store = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showArsenalDropdown, setShowArsenalDropdown] = useState(false);
  const activeArsenal = store.arsenals.find(
    (a) => a.id === store.activeArsenalId,
  );

  // Use refs for outside clicks
  const profileDropdownRef = useRef(null);
  const arsenalDropdownRef = useRef(null);

  // Compute view title based on active pathname
  const getRouteTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/bench")) return "Chambered Bench";
    if (path.startsWith("/range")) return "Chambered Range";
    if (path.startsWith("/vaults")) return "Chambered Vaults";

    switch (path) {
      case "/":
        return "Dashboard";
      case "/armory":
        return "Chambered Armory";
      case "/munitions":
        return "Chambered Munitions";
      case "/catalog":
        return "Product Catalog";
      case "/settings":
        return "System Settings";
      default:
        return "Chambered";
    }
  };

  const handleLogout = async () => {
    await store.logout();
    navigate("/login");
  };

  const selectArsenal = async (id) => {
    await store.selectArsenal(id);
    setShowArsenalDropdown(false);
  };

  // Handle outside clicks to close popovers
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false);
      }
      if (
        arsenalDropdownRef.current &&
        !arsenalDropdownRef.current.contains(e.target)
      ) {
        setShowArsenalDropdown(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <div
      className={`app-container ${store.isAuthenticated ? "logged-in" : ""}`}
    >
      {/* Collapsible Sidebar */}
      {store.isAuthenticated && (
        <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-header">
            <span className="logo-emoji">🔥</span>
            {!isSidebarCollapsed && (
              <span className="logo-text">CHAMBERED</span>
            )}
            <button
              className="collapse-toggle"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? "→" : "←"}
            </button>
          </div>

          {/* Arsenal library selector dropdown */}
          {store.isAuthenticated && !isSidebarCollapsed && (
            <div
              className="arsenal-selector-container"
              ref={arsenalDropdownRef}
            >
              <button
                className="arsenal-selector-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowArsenalDropdown(!showArsenalDropdown);
                }}
                style={{
                  borderLeft: `4px solid ${activeArsenal?.colorHex || "#2563eb"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ARSENAL_ICONS[activeArsenal?.iconName || "shield"]?.(
                    activeArsenal?.colorHex || "#2563eb",
                  )}
                </span>
                <span
                  className="ars-name"
                  style={{ flexGrow: 1, textAlign: "left", marginLeft: "2px" }}
                >
                  {store.activeArsenalName}
                </span>
                <span className="ars-chevron">▼</span>
              </button>
              {showArsenalDropdown && (
                <div
                  className="arsenal-dropdown-popover"
                  onClick={(e) => e.stopPropagation()}
                >
                  {store.arsenals.map((ars) => (
                    <div
                      key={ars.id}
                      className={`arsenal-popover-item ${ars.id === store.activeArsenalId ? "active" : ""}`}
                      onClick={() => selectArsenal(ars.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        borderLeft: `3px solid ${ars.colorHex || "#2563eb"}`,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {ARSENAL_ICONS[ars.iconName || "shield"]?.(
                          ars.colorHex || "#2563eb",
                        )}
                      </span>
                      <div
                        className="item-details"
                        style={{ display: "flex", flexDirection: "column" }}
                      >
                        <span
                          className="item-name"
                          style={{
                            fontWeight:
                              ars.id === store.activeArsenalId
                                ? "bold"
                                : "normal",
                          }}
                        >
                          {ars.name}
                        </span>
                        {ars.description && (
                          <span
                            className="item-desc"
                            style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {ars.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <nav className="sidebar-nav">
            {/* Dashboard */}
            <Link
              to="/"
              className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
              title="Dashboard"
            >
              <span className="nav-text">
                {!isSidebarCollapsed ? "Dashboard" : ""}
              </span>
            </Link>

            {/* Armory */}
            <div className="nav-group">
              <Link
                to="/armory"
                className={`nav-item ${location.pathname.startsWith("/armory") ? "active" : ""}`}
                title="Armory"
              >
                <span className="nav-text">
                  {!isSidebarCollapsed ? "Armory" : ""}
                </span>
              </Link>
              {!isSidebarCollapsed &&
                location.pathname.startsWith("/armory") && (
                  <div className="nav-sub-items">
                    <div
                      className="sub-nav-item disabled"
                      title="Maintenance Log Coming Soon"
                    >
                      <span className="sub-text">Maintenance</span>
                    </div>
                  </div>
                )}
            </div>

            {/* Munitions */}
            <div className="nav-group">
              <Link
                to="/munitions"
                className={`nav-item ${location.pathname.startsWith("/munitions") ? "active" : ""}`}
                title="munitions"
              >
                <span className="nav-text">
                  {!isSidebarCollapsed ? "Munitions" : ""}
                </span>
              </Link>
            </div>

            {/* Bench */}
            <div className="nav-group">
              <Link
                to="/bench/load-data"
                className={`nav-item ${location.pathname.startsWith("/bench") ? "active" : ""}`}
                title="Bench"
              >
                <span className="nav-text">
                  {!isSidebarCollapsed ? "Bench" : ""}
                </span>
              </Link>
              {!isSidebarCollapsed &&
                location.pathname.startsWith("/bench") && (
                  <div className="nav-sub-items">
                    <Link
                      to="/bench/load-data"
                      className={`sub-nav-item ${location.pathname === "/bench/load-data" ? "active" : ""}`}
                    >
                      <span className="sub-text">Load Data</span>
                    </Link>
                    <Link
                      to="/bench/components"
                      className={`sub-nav-item ${location.pathname === "/bench/components" ? "active" : ""}`}
                    >
                      <span className="sub-text">Components</span>
                    </Link>
                  </div>
                )}
            </div>

            {/* Range */}
            <div className="nav-group">
              <Link
                to="/range/trips"
                className={`nav-item ${location.pathname.startsWith("/range") ? "active" : ""}`}
                title="Range"
              >
                <span className="nav-text">
                  {!isSidebarCollapsed ? "Range" : ""}
                </span>
              </Link>
              {!isSidebarCollapsed &&
                location.pathname.startsWith("/range") && (
                  <div className="nav-sub-items">
                    <Link
                      to="/range/trips"
                      className={`sub-nav-item ${location.pathname === "/range/trips" ? "active" : ""}`}
                    >
                      <span className="sub-text">Trips</span>
                    </Link>
                    <Link
                      to="/range/targets"
                      className={`sub-nav-item ${location.pathname === "/range/targets" ? "active" : ""}`}
                    >
                      <span className="sub-text">Targets</span>
                    </Link>
                    <Link
                      to="/range/training"
                      className={`sub-nav-item ${location.pathname === "/range/training" ? "active" : ""}`}
                    >
                      <span className="sub-text">Training</span>
                    </Link>
                  </div>
                )}
            </div>

            {/* Vaults */}
            <div className="nav-group">
              <Link
                to="/vaults/locations"
                className={`nav-item ${location.pathname.startsWith("/vaults") ? "active" : ""}`}
                title="Vaults"
              >
                <span className="nav-text">
                  {!isSidebarCollapsed ? "Vaults" : ""}
                </span>
              </Link>
              {!isSidebarCollapsed &&
                location.pathname.startsWith("/vaults") && (
                  <div className="nav-sub-items">
                    <Link
                      to="/vaults/locations"
                      className={`sub-nav-item ${location.pathname === "/vaults/locations" ? "active" : ""}`}
                    >
                      <span className="sub-text">Locations</span>
                    </Link>
                  </div>
                )}
            </div>

            {/* Catalog Section */}
            <hr className="sidebar-divider" />
            <div className="nav-group">
              <Link
                to="/catalog"
                className={`nav-item ${location.pathname.startsWith("/catalog") ? "active" : ""}`}
                title="Catalog"
              >
                <span className="nav-text">
                  {!isSidebarCollapsed ? "Catalog" : ""}
                </span>
              </Link>
              {!isSidebarCollapsed &&
                location.pathname.startsWith("/catalog") && (
                  <div className="nav-sub-items">
                    <Link
                      to="/catalog"
                      className={`sub-nav-item ${location.pathname === "/catalog" || location.pathname === "/catalog/products" ? "active" : ""}`}
                    >
                      <span className="sub-text">Products</span>
                    </Link>
                    <Link
                      to="/catalog/manufacturers"
                      className={`sub-nav-item ${location.pathname === "/catalog/manufacturers" ? "active" : ""}`}
                    >
                      <span className="sub-text">Manufacturers</span>
                    </Link>
                  </div>
                )}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer version-footer">
            {!isSidebarCollapsed ? (
              <div className="version-info">
                <VersionControl isApiConnected:true></VersionControl>
              </div>
            ) : (
              <div
                className="version-info-collapsed"
                title="v1.0.0 (Docker) - Up to date"
              >
                <span className="status-dot green"></span>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="main-viewport">
        {store.isAuthenticated && (
          <header className="top-header">
            <div className="header-left">
              <h2 className="view-title">{getRouteTitle()}</h2>
            </div>

            {store.user && (
              <div className="header-right">
                {/* Only render Settings link if the user has the Admin role */}
                {store.user.roles?.includes("Admin") && (
                  <Link
                    to="/settings"
                    className="header-action-btn"
                    title="Settings Menu"
                  >
                    <span className="btn-icon">⚙️</span>
                  </Link>
                )}

                {/* Profile dropdown wrapper */}
                <div
                  className="profile-dropdown-wrapper"
                  ref={profileDropdownRef}
                >
                  <button
                    className="avatar-trigger-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu(!showProfileMenu);
                    }}
                    title="User Menu"
                  >
                    {store.user.gravatarUrl ? (
                      <img
                        src={store.user.gravatarUrl}
                        className="user-profile-img"
                        alt="Profile Avatar"
                      />
                    ) : (
                      <div className="user-initials-avatar">
                        {store.user.username[0].toUpperCase()}
                      </div>
                    )}
                  </button>

                  {showProfileMenu && (
                    <div
                      className="profile-dropdown-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="dropdown-header-sec">
                        <div className="header-username">
                          {store.user.username}
                        </div>
                        {store.user.email && (
                          <div className="header-email">{store.user.email}</div>
                        )}
                        {store.user.roles && store.user.roles.length > 0 && (
                          <div className="header-role">
                            {store.user.roles[0]}
                          </div>
                        )}
                      </div>
                      <div className="dropdown-divider-line"></div>
                      <button
                        className="dropdown-option-btn"
                        onClick={() => {
                          setShowAccountModal(true);
                          setShowProfileMenu(false);
                        }}
                      >
                        Account Details
                      </button>
                      <button
                        className="dropdown-option-btn logout-option"
                        onClick={handleLogout}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </header>
        )}
        <div className="content-wrapper">
          {store.loading ? (
            <div className="global-loading">
              <div className="spinner"></div>
              <p>Opening vaults...</p>
            </div>
          ) : (
            <Routes>
              {/* Authenticated Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/armory"
                element={
                  <ProtectedRoute>
                    <Armory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Munition routes */}
              <Route
                path="/munitions"
                element={
                  <ProtectedRoute>
                    <Munitions />
                  </ProtectedRoute>
                }
              />

              {/* Bench routes */}
              <Route
                path="/bench/load-data"
                element={
                  <ProtectedRoute>
                    <PlaceholderView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bench/components"
                element={
                  <ProtectedRoute>
                    <PlaceholderView />
                  </ProtectedRoute>
                }
              />

              {/* Range routes */}
              <Route
                path="/range/trips"
                element={
                  <ProtectedRoute>
                    <PlaceholderView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/range/targets"
                element={
                  <ProtectedRoute>
                    <PlaceholderView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/range/training"
                element={
                  <ProtectedRoute>
                    <PlaceholderView />
                  </ProtectedRoute>
                }
              />

              {/* Vaults routes */}
              <Route
                path="/vaults/locations"
                element={
                  <ProtectedRoute>
                    <Vaults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/catalog/*"
                element={
                  <ProtectedRoute>
                    <Catalog />
                  </ProtectedRoute>
                }
              />

              {/* Guest Route */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </main>

      {/* Account Details Modal */}
      {showAccountModal && store.user && (
        <div
          className="modal-overlay"
          onClick={() => setShowAccountModal(false)}
        >
          <div
            className="account-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <h3>Your Profile Details</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowAccountModal(false)}
              >
                ×
              </button>
            </div>

            <div className="account-modal-content">
              <div className="profile-preview-row">
                {store.user.gravatarUrl ? (
                  <img
                    src={`${store.user.gravatarUrl}&s=120`}
                    className="large-modal-avatar"
                    alt="Gravatar"
                  />
                ) : (
                  <div
                    className="large-modal-avatar user-initials-avatar"
                    style={{ fontSize: "24px" }}
                  >
                    {store.user.username[0].toUpperCase()}
                  </div>
                )}
                <div className="avatar-explain">
                  <span className="badge badge-success">Gravatar Enabled</span>
                  <p>
                    Your avatar is pulled automatically from gravatar.com using
                    your email hash.
                  </p>
                </div>
              </div>

              <div className="details-list">
                <div className="detail-item">
                  <span className="item-label">Account Name</span>
                  <span className="item-val">{store.user.username}</span>
                </div>
                {store.user.email && (
                  <div className="detail-item">
                    <span className="item-label">Registered Email</span>
                    <span className="item-val">{store.user.email}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="item-label">Internal ID</span>
                  <span className="item-val text-mono">{store.user.id}</span>
                </div>
                {store.user.roles && store.user.roles.length > 0 && (
                  <div className="detail-item">
                    <span className="item-label">Role Authorization</span>
                    <span className="item-val">
                      <span className="badge badge-danger">
                        {store.user.roles[0]}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer-row">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAccountModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
