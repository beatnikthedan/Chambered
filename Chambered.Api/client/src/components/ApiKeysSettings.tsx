import React, { useState } from "react";
import SubmitButton from "./SubmitButton";
import {
  useGetApiKeyMyKeys,
  useGetApiKeyAllKeys,
  usePostApiKeyCreate,
  usePostApiKeyRevokeFromId,
  useGetUsersUsers,
} from "../api/endpoints";
import { useStore } from "../StoreContext";

export default function ApiKeysSettings({ usersList = [] }) {
  const { user: currentUser } = useStore();
  const isAdmin = currentUser?.roles?.includes("Admin") || false;

  // Dynamically load all users if Admin
  const { data: usersResponse } = useGetUsersUsers({
    query: { enabled: isAdmin },
  });
  const apiUsers = usersResponse?.data || [];

  const users =
    isAdmin && apiUsers.length > 0
      ? apiUsers.map((usr) => ({
          id: usr.id || "",
          username: usr.email || "Unknown User",
        }))
      : [
          {
            id: currentUser?.id || "1",
            username: currentUser?.email || "Default User",
          },
        ];

  // Dynamically load keys based on Admin role
  const {
    data: allKeysResponse,
    isLoading: loadingAllKeys,
    refetch: refetchAll,
  } = useGetApiKeyAllKeys({
    query: { enabled: isAdmin },
  });

  const {
    data: myKeysResponse,
    isLoading: loadingMyKeys,
    refetch: refetchMy,
  } = useGetApiKeyMyKeys({
    query: { enabled: !isAdmin },
  });

  const loadingKeys = isAdmin ? loadingAllKeys : loadingMyKeys;
  const refetch = isAdmin ? refetchAll : refetchMy;
  const apiKeys =
    (isAdmin ? allKeysResponse?.data : myKeysResponse?.data) || [];

  const createMutation = usePostApiKeyCreate();
  const revokeMutation = usePostApiKeyRevokeFromId();

  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyForm, setKeyForm] = useState({
    name: "",
    userId: "",
    duration: "365",
  });

  const [showRawTokenModal, setShowRawTokenModal] = useState(false);
  const [rawToken, setRawToken] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const getUserEmail = (ownerId) => {
    if (!ownerId) return currentUser?.email || "Current User";
    const foundUser = apiUsers.find((u) => u.id === ownerId);
    return foundUser?.email || ownerId;
  };

  const handlerevokeApiKey = async (keyId) => {
    if (window.confirm("Are you sure you want to revoke this API key?")) {
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
      let expiresAt = null;
      if (keyForm.duration !== "never") {
        const days = parseInt(keyForm.duration, 10);
        expiresAt = new Date(
          Date.now() + days * 24 * 60 * 60 * 1000,
        ).toISOString();
      }

      const response = await createMutation.mutateAsync({
        data: {
          name: keyForm.name,
          userId: keyForm.userId || undefined,
          claims: currentUser?.roles || [],
          expiresAt: expiresAt,
        },
      });

      if (response.status !== 200) {
        const errorData = response.data;
        const errorMsg =
          errorData?.detail ||
          errorData?.title ||
          "Failed to generate API key.";
        throw new Error(errorMsg);
      }

      const plainTextKey = response.data?.plainTextKey || "";
      setRawToken(plainTextKey);
      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
        setShowRawTokenModal(true);
        setShowKeyForm(false);
        setKeyForm({ name: "", userId: "", duration: "365" });
        refetch();
      }, 1000);
    } catch (err) {
      alert(err.message || "Failed to generate API key.");
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
          onClick={() => {
            setKeyForm((prev) => ({ ...prev, userId: users[0]?.id || "" }));
            setShowKeyForm(true);
          }}
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
                <th>Generated</th>
                <th>Expires</th>
                <th style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id}>
                  <td className="text-bold">{key.name}</td>
                  <td>{getUserEmail(key.ownerId)}</td>
                  <td>{formatDate(key.createdAt)}</td>
                  <td>{formatDate(key.expiresAt)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-mini"
                      onClick={() => handlerevokeApiKey(key.id!)}
                    >
                      Revoke
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
              <div className="form-group">
                <label>Key Expiration Window</label>
                <select
                  value={keyForm.duration}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, duration: e.target.value })
                  }
                  required
                >
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="365">1 Year (Recommended)</option>
                  <option value="never">No Expiration (Permanent)</option>
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
                <SubmitButton
                  isSaving={createMutation.isPending}
                  saveSuccess={saveSuccess}
                  createLabel="Generate Key"
                  savingLabel="Generating..."
                  successLabel="✓ Generated!"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {showRawTokenModal && (
        <div className="dialog-overlay bg-deep-blur">
          <div className="dialog-card gold-border">
            <h4 className="dialog-title gold-text">
              API Key Generated Successfully!
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
