import React, { useState } from "react";
import {
  useGetApiKeyMyKeys,
  useGetApiKeyCreate,
  useGetApiKeyRevokeFromId,
} from "../api/endpoints";
import { useStore } from "../StoreContext";

export default function ApiKeysSettings({ usersList = [] }) {
  const { user: currentUser } = useStore();
  const users =
    Array.isArray(usersList) && usersList.length > 0
      ? usersList
      : [{ id: currentUser?.id || "1", username: currentUser?.email || "Default User" }];

  const {
    data: apiKeysResponse,
    isLoading: loadingKeys,
    refetch,
  } = useGetApiKeyMyKeys();
  
  const apiKeys = apiKeysResponse?.data || [];
  
  const createMutation = useGetApiKeyCreate();
  const revokeMutation = useGetApiKeyRevokeFromId();

  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyForm, setKeyForm] = useState({
    name: "",
    userId: users[0]?.id || "",
  });

  const [showRawTokenModal, setShowRawTokenModal] = useState(false);
  const [rawToken, setRawToken] = useState("");

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

  const handleDeleteApiKey = async (keyId) => {
    if (window.confirm("Are you sure you want to delete this API key?")) {
      try {
        await revokeMutation.mutateAsync({ id: keyId });
        refetch();
      } catch (err) {
        alert("Failed to revoke API key.");
      }
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    try {
      const response = await createMutation.mutateAsync({
        data: {
          name: keyForm.name,
          userId: keyForm.userId || undefined,
          claims: ["Read", "Write"],
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
      });
      
      const plainTextKey = response.data?.plainTextKey || "";
      setRawToken(plainTextKey);
      setShowRawTokenModal(true);
      setShowKeyForm(false);
      setKeyForm({ name: "", userId: users[0]?.id || "" });
      refetch();
    } catch (err) {
      alert("Failed to generate API key.");
    }
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
                  <td>{currentUser?.email || "Current User"}</td>
                  <td className="text-mono">••••••••</td>
                  <td>{formatDate(key.createdAt)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-mini"
                      onClick={() => handleDeleteApiKey(key.id!)}
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
                  disabled={createMutation.isPending}
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
