import React, { useState } from "react";
import { useStore } from "../StoreContext";
import SubmitButton from "./SubmitButton";
import {
  useGetUsersUsers,
  useGetUsersProfile,
  useGetSettingsPasswordPolicy,
  useGetSettingsLoginSettings,
  usePostUsersRegister,
  usePutUsersUpdateUserFromId,
  useDeleteUsersUserFromId,
} from "../api/endpoints";

export default function UserSettings({ currentUserId }) {
  const store = useStore();
  const currentUserIsAdmin = store.user?.roles?.includes("Admin") || false;

  // React Query Hooks for loading users and password policy
  const {
    data: adminUsersData,
    isLoading: loadingAdminUsers,
    error: adminUsersError,
    refetch: refetchUsersList,
  } = useGetUsersUsers({ query: { enabled: currentUserIsAdmin } });

  const {
    data: profileData,
    isLoading: loadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useGetUsersProfile({ query: { enabled: !currentUserIsAdmin } });

  const {
    data: loginResponse,
    isLoading: loginLoading,
    error: loginError,
  } = useGetSettingsLoginSettings();

  const loginPolicy = loginResponse?.data;

  const {
    data: policyResponse,
    isLoading: policiesAreLoading,
    error: policyError,
  } = useGetSettingsPasswordPolicy();

  const passwordPolicy = policyResponse?.data;

  // Mutation Hooks for updating, registering, and deleting users
  const registerMutation = usePostUsersRegister();
  const updateMutation = usePutUsersUpdateUserFromId();
  const deleteMutation = useDeleteUsersUserFromId();

  const users = currentUserIsAdmin
    ? adminUsersData?.data || []
    : profileData?.data
      ? [profileData.data]
      : [];

  const loadingUsers = currentUserIsAdmin ? loadingAdminUsers : loadingProfile;
  const error = currentUserIsAdmin
    ? adminUsersError
      ? "Failed to load users from the database."
      : null
    : profileError
      ? "Failed to load profile."
      : null;

  // State for Modal Dialog & Form Input
  const [showUserForm, setShowUserForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    isAdmin: false,
  });

  // Calculate Password Strength in real time
  const getPasswordStrength = (pwd) => {
    if (!pwd)
      return { score: 0, text: "None", color: "transparent", percent: 0 };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score, text: "Weak", color: "#ef4444", percent: 33 };
    } else if (score <= 4) {
      return { score, text: "Medium", color: "#f59e0b", percent: 66 };
    } else {
      return { score, text: "Strong", color: "#10b981", percent: 100 };
    }
  };

  const strength = getPasswordStrength(userForm.password);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedUser(null);
    setUserForm({
      username: "",
      email: "",
      password: "",
      isAdmin: false,
    });
    setShowUserForm(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (usr) => {
    setIsEditMode(true);
    setSelectedUser(usr);
    setUserForm({
      username: usr.username || "",
      email: usr.email || "",
      password: "", // optional in edit mode
      isAdmin: usr.roles?.includes("Admin") || false,
    });
    setShowUserForm(true);
  };

  // Handle User Deletion (Live API connection)
  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to remove user "${username}"?`)) {
      try {
        await deleteMutation.mutateAsync({ id: userId });
        if (currentUserIsAdmin) {
          refetchUsersList();
        } else {
          refetchProfile();
        }
      } catch (err) {
        alert(err.message || "Failed to delete user.");
      }
    }
  };

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: selectedUser.id,
          data: {
            email: userForm.email,
            firstName: userForm.username,
            lastName: "",
            roles: userForm.isAdmin ? ["Admin"] : ["User"],
          },
        });
      } else {
        await registerMutation.mutateAsync({
          data: {
            username: userForm.username,
            email: userForm.email || `${userForm.username}@chambered.local`,
            firstName: userForm.username,
            lastName: "",
            password: userForm.password,
            roles: userForm.isAdmin ? ["Admin"] : ["User"],
          },
        });
      }

      setSaveSuccess(true);
      if (currentUserIsAdmin) {
        refetchUsersList();
      } else {
        refetchProfile();
      }

      // Delay closing modal slightly so the user sees the success checkmark animation
      setTimeout(() => {
        setShowUserForm(false);
        setSaveSuccess(false);
        setSelectedUser(null);
        setUserForm({
          username: "",
          email: "",
          password: "",
          isAdmin: false,
        });
      }, 1000);
    } catch (err) {
      alert(err.message || `Failed to ${isEditMode ? "update" : "add"} user.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic user summary stats based on fetched live database records
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.roles?.includes("Admin")).length;
  const userCount = totalCount - adminCount;

  const summaryText = `${totalCount} account${totalCount !== 1 ? "s" : ""} · ${adminCount} admin${adminCount !== 1 ? "s" : ""}, ${userCount} user${userCount !== 1 ? "s" : ""}`;

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <div>
          <h3 className="sec-title" style={{ margin: 0 }}>
            Users
          </h3>
          <div className="users-summary">
            {loadingUsers ? "Loading users database..." : summaryText}
          </div>
        </div>
        <button className="btn invite-btn" onClick={handleOpenCreateModal}>
          + Add user
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "14px",
          }}
        >
          Error: {error}
        </div>
      )}

      {loadingUsers && users.length === 0 ? (
        <div
          className="loading-inline"
          style={{
            padding: "40px 0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Auth</th>
                <th>Arsenals</th>
                <th>Last Seen</th>
                <th style={{ width: "120px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((usr) => {
                const initial = usr.username
                  ? usr.username.charAt(0).toUpperCase()
                  : "U";
                const isAdmin = usr.roles?.includes("Admin");
                const avatarClass = isAdmin ? "avatar-gold" : "avatar-grey";
                const badgeClass = isAdmin ? "badge-owner" : "badge-readonly";
                const roleLabel = isAdmin ? "Admin" : "User";
                const hasGravatar = !!usr.gravatarUrl;
                const isSelf =
                  store.user &&
                  (usr.username === store.user.username ||
                    usr.id === store.user.id);

                return (
                  <tr key={usr.id}>
                    <td>
                      <div className="avatar-cell">
                        {hasGravatar ? (
                          <img
                            src={usr.gravatarUrl}
                            className="avatar-circle"
                            alt={usr.username}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className={`avatar-circle ${avatarClass}`}>
                            {initial}
                          </div>
                        )}
                        <div className="user-info-text">
                          <span className="username-label">{usr.username}</span>
                          <span className="email-label">{usr.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-role ${badgeClass}`}>
                        {roleLabel}
                      </span>
                    </td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                      {/* Edit Button (White/Light gray pencil icon) */}
                      <button
                        className="btn-action-edit"
                        disabled={!currentUserIsAdmin && !isSelf}
                        onClick={() => handleOpenEditModal(usr)}
                        title={
                          !currentUserIsAdmin && !isSelf
                            ? "You can only edit your own profile"
                            : `Edit user account ${usr.username}`
                        }
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          className="pencil-icon"
                        >
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>

                      {/* Delete Button (Red trash icon) */}
                      <button
                        className="btn-action-delete"
                        disabled={isSelf}
                        onClick={() => handleDeleteUser(usr.id, usr.username)}
                        title={
                          isSelf
                            ? "You cannot delete your own account"
                            : `Delete user account ${usr.username}`
                        }
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          className="trash-icon"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Policies Split Column Layout */}

      <div className="policies-grid">
        {/* Session Policy Card */}

        {loginLoading ? (
          <div className="loading-spinner-box">
            <div className="spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : loginError ? (
          <div className="vaults-error-card">
            <span className="err-icon">⚠️</span>
            <p>{loginError?.message || "Failed to load."}</p>
            {/* <button
              className="btn btn-secondary btn-small"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["/api/v1/Vaults"] })
              }
            >
              Retry
            </button> */}
          </div>
        ) : loginPolicy === null ? (
          <div className="empty-state panel">
            <h3>You have no items in your Vaults.</h3>
            <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
              Click 'Add Item' above to add your first item.
            </p>
          </div>
        ) : (
          <div className="policy-card">
            <div className="policy-card-title">Session Policy</div>

            {/* <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Require TOTP for owners</span>
              <span className="policy-sublabel">
                Enforces multi-factor authentication for Owner level roles
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={sessionPolicy.requireTotp}
                onChange={(e) =>
                  setSessionPolicy({
                    ...sessionPolicy,
                    requireTotp: e.target.checked,
                  })
                }
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="policy-row">
            <div className="policy-info">
              <span className="policy-label">Auto-provision OIDC users</span>
              <span className="policy-sublabel">
                Automatically create local profile upon successful identity
                provider login
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={sessionPolicy.autoProvision}
                onChange={(e) =>
                  setSessionPolicy({
                    ...sessionPolicy,
                    autoProvision: e.target.checked,
                  })
                }
              />
              <span className="slider"></span>
            </label>
          </div> */}

            <div className="policy-row">
              <div className="policy-info">
                <span className="policy-label">Session lifetime</span>
                <span className="policy-sublabel">
                  Cookie validity duration for authenticated web sessions
                </span>
              </div>
              <input
                style={{ width: 60 }}
                type="number"
                //placeholder="7"
                value={loginPolicy.sessionLifetime}
              />
            </div>

            <div className="policy-row">
              <div className="policy-info">
                <span className="policy-label">Disable Local Users</span>
                <span className="policy-sublabel">
                  Restricts logins strictly to integrated OIDC sign-on
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={loginPolicy.disableLocalUsers}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="policy-row">
              <div className="policy-info">
                <span className="policy-label">
                  Disable new user registration
                </span>
                <span className="policy-sublabel">
                  Restricts the registration of new local users
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={loginPolicy.disableNewUserRegistration}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        )}

        {/* Password Policy Card */}
        {policiesAreLoading ? (
          <div className="loading-spinner-box">
            <div className="spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : policyError ? (
          <div className="vaults-error-card">
            <span className="err-icon">⚠️</span>
            <p>{policyError?.message || "Failed to load."}</p>
            {/* <button
              className="btn btn-secondary btn-small"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["/api/v1/Vaults"] })
              }
            >
              Retry
            </button> */}
          </div>
        ) : passwordPolicy === null ? (
          <div className="empty-state panel">
            <h3>You have no items in your Vaults.</h3>
            <p style={{ marginTop: "4px", color: "var(--text-muted)" }}>
              Click 'Add Item' above to add your first item.
            </p>
          </div>
        ) : (
          <div className="policy-card">
            <div className="policy-card-title">Password Policy</div>

            <div className="policy-row">
              <div className="policy-info">
                <span className="policy-label">Minimum length</span>
                <span className="policy-sublabel">
                  Minimum required character count for local user passwords
                </span>
              </div>
              <input
                type="number"
                className="policy-length-input"
                min="6"
                max="64"
                value={passwordPolicy.minLength}
                readOnly
              />
            </div>

            <div className="policy-row">
              <div className="policy-info">
                <span className="policy-label">Require uppercase letters</span>
                <span className="policy-sublabel">
                  Must contain at least one capital letter (A-Z)
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={passwordPolicy.requireUpper}
                  disabled
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="policy-row">
              <div className="policy-info">
                <span className="policy-label">Require lowercase letters</span>
                <span className="policy-sublabel">
                  Must contain at least one small letter (a-z)
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={passwordPolicy.requireLower}
                  disabled
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="policy-row">
              <div className="policy-info">
                <span className="policy-label">Require numbers</span>
                <span className="policy-sublabel">
                  Must contain at least one digit (0-9)
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={passwordPolicy.requireNumbers}
                  disabled
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="policy-row">
              <div className="policy-info">
                <span className="policy-label">Require special characters</span>
                <span className="policy-sublabel">
                  Must contain special symbol characters (e.g. @, #, $, !)
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={passwordPolicy.requireSpecial}
                  disabled
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* User Create / Edit dialog popup */}
      {showUserForm && (
        <div className="dialog-overlay" onClick={() => setShowUserForm(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <h4 className="dialog-title">
              {isEditMode ? "Edit User" : "Add New User"}
            </h4>
            <form onSubmit={handleFormSubmit} className="dialog-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      username: e.target.value,
                    })
                  }
                  placeholder="e.g. derek"
                  disabled={isEditMode}
                  style={
                    isEditMode ? { opacity: 0.6, cursor: "not-allowed" } : {}
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="user@domain.local"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      password: e.target.value,
                    })
                  }
                  placeholder={
                    isEditMode
                      ? "•••••••• (leave blank to keep unchanged)"
                      : "••••••••"
                  }
                  required={!isEditMode}
                />
                {/* Password Strength Indicator */}
                {userForm.password && (
                  <div className="strength-container">
                    <div className="strength-bar-bg">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width: `${strength.percent}%`,
                          backgroundColor: strength.color,
                        }}
                      ></div>
                    </div>
                    <div
                      className="strength-label"
                      style={{ color: strength.color }}
                    >
                      {strength.text} Strength
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  className="policy-lifetime-select"
                  style={{ width: "100%" }}
                  value={userForm.isAdmin ? "Admin" : "User"}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      isAdmin: e.target.value === "Admin",
                    })
                  }
                >
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div className="form-group">
                <label>Arsenal Access Mapping</label>
                <select
                  multiple
                  disabled
                  value={[]}
                  className="policy-lifetime-select"
                  style={{ width: "100%", opacity: 0.6 }}
                >
                  <option value="All">All Arsenals (Default)</option>
                  <option value="Primary">Primary Only</option>
                </select>
                <span className="policy-sublabel" style={{ marginTop: "4px" }}>
                  Multi-arsenal mapping is currently disabled (not supported by
                  the database yet)
                </span>
              </div>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUserForm(false)}
                >
                  Cancel
                </button>
                <SubmitButton
                  isSaving={isSaving}
                  saveSuccess={saveSuccess}
                  isEditMode={isEditMode}
                  createLabel="Add User"
                  updateLabel="Save User"
                  savingLabel={isEditMode ? "Saving..." : "Adding..."}
                  successLabel={isEditMode ? "✓ Saved!" : "✓ Added!"}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
