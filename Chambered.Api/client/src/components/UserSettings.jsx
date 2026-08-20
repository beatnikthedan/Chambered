import React, { useState } from "react";

export default function UserSettings({ currentUserId }) {
  // State for Users List & Loading
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState([
    {
      id: 1,
      username: "johndoe",
      email: "john@domain.com",
      roles: ["Admin", "User"],
    },
    { id: 2, username: "janesmith", email: "jane@domain.com", roles: ["User"] },
  ]);

  // State for Modal Dialog & Form Input
  const [showUserForm, setShowUserForm] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    isAdmin: false,
  });

  // Handle User Deletion
  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user account?")) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  // Handle Creating a User
  const handleCreateUser = (e) => {
    e.preventDefault();
    setSavingUser(true);

    // Mock network request delay
    setTimeout(() => {
      const newUser = {
        id: Date.now(),
        username: userForm.username,
        email: userForm.email,
        roles: userForm.isAdmin ? ["Admin", "User"] : ["User"],
      };

      setUsers((prev) => [...prev, newUser]);
      setSavingUser(false);
      setShowUserForm(false);
      setUserForm({ username: "", email: "", password: "", isAdmin: false });
    }, 400);
  };

  return (
    <section className="settings-sec">
      <div className="sec-header">
        <h3 className="sec-title">Manage User Accounts</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowUserForm(true)}
        >
          Register New User
        </button>
      </div>

      {loadingUsers ? (
        <div className="loading-inline">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Roles / Authorization</th>
                <th style={{ width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((usr) => (
                <tr key={usr.id}>
                  <td className="text-bold">{usr.username}</td>
                  <td>{usr.email}</td>
                  <td>
                    {(usr.roles || []).map((r) => (
                      <span
                        key={r}
                        className={`badge ${r === "Admin" ? "badge-danger" : "badge-success"}`}
                        style={{ marginRight: "6px" }}
                      >
                        {r}
                      </span>
                    ))}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-mini"
                      disabled={usr.id === currentUserId}
                      onClick={() => handleDeleteUser(usr.id)}
                      title="Remove user account"
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

      {/* User Create dialog popup */}
      {showUserForm && (
        <div className="dialog-overlay" onClick={() => setShowUserForm(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <h4 className="dialog-title">Register Local Account</h4>
            <form onSubmit={handleCreateUser} className="dialog-form">
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
                  placeholder="Letters & numbers"
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
                  placeholder="user@domain.com"
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
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="form-group checkbox-grp">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={userForm.isAdmin}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      isAdmin: e.target.checked,
                    })
                  }
                />
                <label htmlFor="isAdmin">
                  Grant System Admin Role privileges
                </label>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUserForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingUser}
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
