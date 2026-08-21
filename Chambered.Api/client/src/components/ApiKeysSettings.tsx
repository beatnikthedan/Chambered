import React, { useState } from "react";

export default function ApiKeysSettings({ usersList = [] }) {
  // 1. Ensure users array is never undefined
  const users =
    Array.isArray(usersList) && usersList.length > 0
      ? usersList
      : [{ id: "1", username: "Default User" }];

  // 2. States
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState([
    {
      id: "k1",
      name: "Raspberry Pi Reload Script",
      userName: "johndoe",
      tokenPreview: "sk_live_...9f2a",
      createdAt: "2026-03-15T10:30:00Z",
    },
  ]);

  const [showKeyForm, setShowKeyForm] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyForm, setKeyForm] = useState({
    name: "",
    userId: users[0].id,
  });

  const [showRawTokenModal, setShowRawTokenModal] = useState(false);
  const [rawToken, setRawToken] = useState("");

  // 3. Helper Functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const handleDeleteApiKey = (keyId) => {
    if (window.confirm("Are you sure you want to delete this API key?")) {
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    }
  };

  const handleCreateApiKey = (e) => {
    e.preventDefault();
    setSavingKey(true);

    setTimeout(() => {
      const generatedRawToken = `sk_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
      const selectedUserObj = users.find(
        (u) => String(u.id) === String(keyForm.userId),
      );
      const assignedUser = selectedUserObj
        ? selectedUserObj.username
        : "Default User";

      const newKey = {
        id: `key_${Date.now()}`,
        name: keyForm.name,
        userName: assignedUser,
        tokenPreview: `${generatedRawToken.substring(0, 8)}...${generatedRawToken.slice(-4)}`,
        createdAt: new Date().toISOString(),
      };

      setApiKeys((prev) => [newKey, ...prev]);
      setSavingKey(false);
      setShowKeyForm(false);
      setRawToken(generatedRawToken);
      setShowRawTokenModal(true);
      setKeyForm({ name: "", userId: users[0]?.id || "" });
    }, 400);
  };

  const copyRawTokenToClipboard = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(rawToken);
      alert("Token copied to clipboard!");
    }
  };

  const closeRawTokenModal = () => {
    setShowRawTokenModal(false);
    setRawToken("");
  };

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Developer Integration Keys</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowKeyForm(true)}
        >
          Generate API Key
        </button>
      </div>
      <p className="sec-subtitle">
        Create cryptographically secure tokens for shell scripts, home
        automation sensors, or reloading import processes.
      </p>

      {loadingKeys ? (
        <div className="loading-inline">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Key Name</th>
                <th>Assigned User Account</th>
                <th>Preview Token</th>
                <th>Date Generated</th>
                <th style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id}>
                  <td className="text-bold">{key.name}</td>
                  <td>{key.userName}</td>
                  <td className="text-mono">{key.tokenPreview}</td>
                  <td>{formatDate(key.createdAt)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-mini"
                      onClick={() => handleDeleteApiKey(key.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create integration token overlay */}
      {showKeyForm && (
        <div className="dialog-overlay" onClick={() => setShowKeyForm(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <h4 className="dialog-title">Generate API Token</h4>
            <form onSubmit={handleCreateApiKey} className="dialog-form">
              <div className="form-group">
                <label>Key Descriptor Name</label>
                <input
                  type="text"
                  value={keyForm.name}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, name: e.target.value })
                  }
                  placeholder="e.g. Raspberry Pi reload script"
                  required
                />
              </div>
              <div className="form-group">
                <label>Map to User Authorization Profile</label>
                <select
                  value={keyForm.userId}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, userId: e.target.value })
                  }
                  required
                >
                  {users.map((usr) => (
                    <option key={usr.id} value={usr.id}>
                      {usr.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowKeyForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingKey}
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secure Token display overlay */}
      {showRawTokenModal && (
        <div className="dialog-overlay bg-deep-blur">
          <div className="dialog-card gold-border">
            <h4 className="dialog-title gold-text">
              ⚠️ API Key Generated Successfully!
            </h4>
            <p className="warning-text">
              Copy this token immediately. For secure design protocols, it will{" "}
              <strong>never be shown again</strong>.
            </p>

            <div className="token-reveal">
              <input
                type="text"
                readOnly
                value={rawToken}
                className="text-mono raw-token-field"
              />
              <button
                className="btn btn-primary"
                onClick={copyRawTokenToClipboard}
              >
                Copy
              </button>
            </div>

            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={closeRawTokenModal}
              >
                I Have Safely Saved It
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
