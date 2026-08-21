import React, { useState } from "react";

export default function AuthSettings() {
  // OIDC Configuration State
  const [oidc, setOidc] = useState({
    isEnabled: true,
    issuerUrl: "https://auth.example.com/realms/master",
    clientId: "chambered-client-id",
    clientSecret: "",
    authUrl:
      "https://auth.example.com/realms/master/protocol/openid-connect/auth",
    tokenUrl:
      "https://auth.example.com/realms/master/protocol/openid-connect/token",
    userinfoUrl:
      "https://auth.example.com/realms/master/protocol/openid-connect/userinfo",
    jwksUrl:
      "https://auth.example.com/realms/master/protocol/openid-connect/certs",
    autoCreateUser: true,
  });

  const [discovering, setDiscovering] = useState(false);
  const [savingOidc, setSavingOidc] = useState(false);

  // Computed Redirect URI
  const resolvedRedirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v1/auth/oidc/callback`
      : "http://localhost:3000/api/v1/auth/oidc/callback";

  // Auto-Discover Handler
  const discoverOidc = () => {
    if (!oidc.issuerUrl) {
      alert("Please enter an Issuer URL first.");
      return;
    }

    setDiscovering(true);

    // Mock API discovery call
    setTimeout(() => {
      const baseUrl = oidc.issuerUrl.replace(/\/$/, "");
      setOidc((prev) => ({
        ...prev,
        authUrl: `${baseUrl}/protocol/openid-connect/auth`,
        tokenUrl: `${baseUrl}/protocol/openid-connect/token`,
        userinfoUrl: `${baseUrl}/protocol/openid-connect/userinfo`,
        jwksUrl: `${baseUrl}/protocol/openid-connect/certs`,
      }));
      setDiscovering(false);
    }, 600);
  };

  // Submit Handler
  const handleSaveOidc = (e) => {
    e.preventDefault();
    setSavingOidc(true);

    setTimeout(() => {
      setSavingOidc(false);
      alert("OIDC Configuration updated successfully!");
    }, 500);
  };

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Single Sign-On Integration</h3>
      </div>
      <p className="sec-subtitle">
        Connect your self-hosted identity provider (Keycloak, Authentik, Google)
        for centralized access.
      </p>

      <form onSubmit={handleSaveOidc} className="oidc-form">
        <div
          className="form-group checkbox-grp toggle-setting"
          style={{ marginBottom: "1.5rem" }}
        >
          <input
            type="checkbox"
            id="oidcEnabled"
            checked={oidc.isEnabled}
            onChange={(e) => setOidc({ ...oidc, isEnabled: e.target.checked })}
          />
          <label htmlFor="oidcEnabled">
            Enable OpenID Connect (OIDC) Authentication scheme
          </label>
        </div>

        <div className="form-grid">
          <div className="form-group full-width oidc-discover-grp">
            <label>OIDC Issuer URL (Base domain)</label>
            <div
              className="discover-input-row"
              style={{ display: "flex", gap: "8px" }}
            >
              <input
                type="url"
                value={oidc.issuerUrl || ""}
                onChange={(e) =>
                  setOidc({ ...oidc, issuerUrl: e.target.value })
                }
                placeholder="https://auth.example.com/realms/master"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary discover-btn"
                onClick={discoverOidc}
                disabled={discovering}
              >
                {discovering ? "Discovering..." : "Auto Discover Endpoints"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Client ID</label>
            <input
              type="text"
              value={oidc.clientId || ""}
              onChange={(e) => setOidc({ ...oidc, clientId: e.target.value })}
              placeholder="chambered-client-id"
            />
          </div>

          <div className="form-group">
            <label>Client Secret</label>
            <input
              type="password"
              value={oidc.clientSecret || ""}
              onChange={(e) =>
                setOidc({ ...oidc, clientSecret: e.target.value })
              }
              placeholder="••••••••••••••••"
            />
          </div>

          <div className="form-group">
            <label>Authorization Endpoint</label>
            <input
              type="text"
              value={oidc.authUrl || ""}
              onChange={(e) => setOidc({ ...oidc, authUrl: e.target.value })}
              placeholder="Automatically resolved"
            />
          </div>

          <div className="form-group">
            <label>Token Endpoint</label>
            <input
              type="text"
              value={oidc.tokenUrl || ""}
              onChange={(e) => setOidc({ ...oidc, tokenUrl: e.target.value })}
              placeholder="Automatically resolved"
            />
          </div>

          <div className="form-group">
            <label>UserInfo Endpoint</label>
            <input
              type="text"
              value={oidc.userinfoUrl || ""}
              onChange={(e) =>
                setOidc({ ...oidc, userinfoUrl: e.target.value })
              }
              placeholder="Automatically resolved"
            />
          </div>

          <div className="form-group">
            <label>JWKS URI</label>
            <input
              type="text"
              value={oidc.jwksUrl || ""}
              onChange={(e) => setOidc({ ...oidc, jwksUrl: e.target.value })}
              placeholder="Automatically resolved"
            />
          </div>

          <div
            className="form-group full-width checkbox-grp"
            style={{ marginTop: "0.5rem" }}
          >
            <input
              type="checkbox"
              id="autoCreateUser"
              checked={oidc.autoCreateUser}
              onChange={(e) =>
                setOidc({ ...oidc, autoCreateUser: e.target.checked })
              }
            />
            <label htmlFor="autoCreateUser">
              Auto-provision local accounts on successful OIDC logins
            </label>
          </div>

          <div
            className="form-group full-width redirect-helper"
            style={{ marginTop: "0.5rem" }}
          >
            <label>
              Authorized Redirect / Callback URI (Copy this to provider)
            </label>
            <input
              type="text"
              readOnly
              value={resolvedRedirectUri}
              className="text-mono readonly-input"
            />
          </div>
        </div>

        <div className="form-actions-row" style={{ marginTop: "1.5rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={savingOidc}
          >
            {savingOidc ? "Saving..." : "Save OIDC Configuration"}
          </button>
        </div>
      </form>
    </section>
  );
}
