import React, { useState, useEffect, useMemo } from 'react'
import { useStore } from '../StoreContext'
import './Settings.css'

export default function Settings() {
  const store = useStore()

  // Tabs: 'users', 'oidc', 'apikeys', 'arsenals'
  const [activeTab, setActiveTab] = useState('users')

  // Users Management State
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', isAdmin: false })

  // OIDC State
  const [oidc, setOidc] = useState({
    id: 0,
    isEnabled: false,
    clientId: '',
    clientSecret: '',
    issuerUrl: '',
    authUrl: '',
    tokenUrl: '',
    userinfoUrl: '',
    jwksUrl: '',
    autoCreateUser: true
  })
  const [savingOidc, setSavingOidc] = useState(false)
  const [discovering, setDiscovering] = useState(false)

  // API Keys State
  const [apiKeys, setApiKeys] = useState([])
  const [loadingKeys, setLoadingKeys] = useState(false)
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [keyForm, setKeyForm] = useState({ name: '', userId: '' })
  const [rawToken, setRawToken] = useState('')
  const [showRawTokenModal, setShowRawTokenModal] = useState(false)

  // Arsenals Create State
  const [showArsenalForm, setShowArsenalForm] = useState(false)
  const [savingArsenal, setSavingArsenal] = useState(false)
  const [arsenalForm, setArsenalForm] = useState({ name: '', description: '' })

  const resolvedRedirectUri = useMemo(() => {
    return `${window.location.origin}/api/auth/oidc/callback`
  }, [])

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Fetch actions based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'oidc') {
      fetchOidc()
    } else if (activeTab === 'apikeys') {
      fetchApiKeys()
      fetchUsers() // we need users listing for dropdown form mapping
    } else if (activeTab === 'arsenals') {
      store.fetchArsenals()
    }
  }, [activeTab])

  // Set default selected user in Key Form when users list changes
  useEffect(() => {
    if (users.length && !keyForm.userId) {
      setKeyForm(prev => ({ ...prev, userId: users[0].id }))
    }
  }, [users])

  // Users CRUD Handlers
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/settings/users')
      if (res.ok) {
        setUsers(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setSavingUser(true)
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })
      if (res.ok) {
        await fetchUsers()
        setShowUserForm(false)
        setUserForm({ username: '', email: '', password: '', isAdmin: false })
      } else {
        const err = await res.text()
        alert(`Failed: ${err}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Remove this user profile? They will be immediately disconnected.')) return
    try {
      const res = await fetch(`/api/settings/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id))
      } else {
        const err = await res.text()
        alert(`Failed: ${err}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // OIDC Settings Handlers
  const fetchOidc = async () => {
    try {
      const res = await fetch('/api/settings/oidc')
      if (res.ok) {
        setOidc(await res.json())
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveOidc = async (e) => {
    e.preventDefault()
    setSavingOidc(true)
    try {
      const res = await fetch('/api/settings/oidc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oidc)
      })
      if (res.ok) {
        alert('OIDC Settings successfully written.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingOidc(false)
    }
  }

  const discoverOidc = async () => {
    if (!oidc.issuerUrl) {
      alert('Please enter an Issuer URL first.')
      return
    }
    setDiscovering(true)
    try {
      const res = await fetch('/api/settings/oidc/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuerUrl: oidc.issuerUrl })
      })
      if (res.ok) {
        const data = await res.json()
        setOidc(prev => ({
          ...prev,
          authUrl: data.authUrl,
          tokenUrl: data.tokenUrl,
          userinfoUrl: data.userinfoUrl,
          jwksUrl: data.jwksUrl
        }))
      } else {
        const err = await res.text()
        alert(`Discovery failed: ${err}`)
      }
    } catch (err) {
      alert(`Discovery request failed: ${err.message}`)
    } finally {
      setDiscovering(false)
    }
  }

  // Developer API Keys Handlers
  const fetchApiKeys = async () => {
    setLoadingKeys(true)
    try {
      const res = await fetch('/api/settings/apikeys')
      if (res.ok) {
        setApiKeys(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleCreateApiKey = async (e) => {
    e.preventDefault()
    setSavingKey(true)
    try {
      const res = await fetch('/api/settings/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyForm)
      })
      if (res.ok) {
        const data = await res.json()
        setRawToken(data.rawToken)
        setApiKeys(prev => [...prev, data.apiKey])
        setShowKeyForm(false)
        setShowRawTokenModal(true)
        setKeyForm({ name: '', userId: users.length ? users[0].id : '' })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingKey(false)
    }
  }

  const handleDeleteApiKey = async (id) => {
    if (!window.confirm('Permanently revoke this integration API key? Any active scripts using this key will immediately fail.')) return
    try {
      const res = await fetch(`/api/settings/apikeys/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const copyRawTokenToClipboard = () => {
    navigator.clipboard.writeText(rawToken)
    alert('API Key copied to clipboard.')
  }

  const closeRawTokenModal = () => {
    setShowRawTokenModal(false)
    setRawToken('')
  }

  // Arsenals CRUD Handlers
  const handleCreateArsenal = async (e) => {
    e.preventDefault()
    setSavingArsenal(true)
    try {
      const success = await store.createArsenal(arsenalForm.name, arsenalForm.description)
      if (success) {
        setShowArsenalForm(false)
        setArsenalForm({ name: '', description: '' })
      }
    } catch (err) {
      alert(`Failed to create arsenal collection: ${err.message}`)
    } finally {
      setSavingArsenal(false)
    }
  }

  const handleDeleteArsenal = async (id) => {
    if (!window.confirm("Are you sure you want to DELETE this entire Arsenal?\n\nWARNING: All Armory items and Ammunition lots contained inside this arsenal will be permanently deleted. This action is irreversible!")) {
      return
    }
    try {
      await store.deleteArsenal(id)
    } catch (err) {
      alert(`Failed to delete arsenal: ${err.message}`)
    }
  }

  return (
    <div className="settings-view">
      {/* Settings Navigation Tab row */}
      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Accounts
        </button>
        <button 
          className={`tab-btn ${activeTab === 'oidc' ? 'active' : ''}`}
          onClick={() => setActiveTab('oidc')}
        >
          OpenID Connect (SSO)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'apikeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('apikeys')}
        >
          Developer API Keys
        </button>
        <button 
          className={`tab-btn ${activeTab === 'arsenals' ? 'active' : ''}`}
          onClick={() => setActiveTab('arsenals')}
        >
          Arsenals
        </button>
      </div>

      <div className="tab-content panel">
        {/* TAB 1: User Accounts details */}
        {activeTab === 'users' && (
          <section className="settings-sec">
            <div className="sec-header">
              <h3 class="sec-title">Manage User Accounts</h3>
              <button className="btn btn-primary" onClick={() => setShowUserForm(true)}>Register New User</button>
            </div>

            {loadingUsers ? (
              <div className="loading-inline"><div className="spinner"></div></div>
            ) : (
              <div className="table-container">
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email Address</th>
                      <th>Roles / Authorization</th>
                      <th style={{ width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((usr) => (
                      <tr key={usr.id}>
                        <td className="text-bold">{usr.username}</td>
                        <td>{usr.email}</td>
                        <td>
                          {(usr.roles || []).map((r) => (
                            <span key={r} className={`badge ${r === 'Admin' ? 'badge-danger' : 'badge-success'}`} style={{ marginRight: '6px' }}>
                              {r}
                            </span>
                          ))}
                        </td>
                        <td>
                          <button 
                            className="btn btn-danger btn-mini" 
                            disabled={usr.id === store.user?.id}
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
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        placeholder="Letters & numbers" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        value={userForm.email} 
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="user@domain.com" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input 
                        type="password" 
                        value={userForm.password} 
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                    <div className="form-group checkbox-grp">
                      <input 
                        type="checkbox" 
                        id="isAdmin" 
                        checked={userForm.isAdmin}
                        onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                      />
                      <label htmlFor="isAdmin">Grant System Admin Role privileges</label>
                    </div>
                    <div className="dialog-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowUserForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={savingUser}>Register</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: OIDC integrations */}
        {activeTab === 'oidc' && (
          <section className="settings-sec">
            <h3 className="sec-title">Single Sign-On Integration</h3>
            <p className="sec-subtitle">Connect your self-hosted identity provider (Keycloak, Authentik, Google) for centralized access.</p>

            <form onSubmit={handleSaveOidc} className="oidc-form">
              <div className="form-group checkbox-grp toggle-setting">
                <input 
                  type="checkbox" 
                  id="oidcEnabled" 
                  checked={oidc.isEnabled}
                  onChange={(e) => setOidc({ ...oidc, isEnabled: e.target.checked })}
                />
                <label htmlFor="oidcEnabled">Enable OpenID Connect (OIDC) Authentication scheme</label>
              </div>

              <div className="form-grid">
                <div className="form-group full-width oidc-discover-grp">
                  <label>OIDC Issuer URL (Base domain)</label>
                  <div className="discover-input-row">
                    <input 
                      type="url" 
                      value={oidc.issuerUrl || ''} 
                      onChange={(e) => setOidc({ ...oidc, issuerUrl: e.target.value })}
                      placeholder="https://auth.example.com/realms/master" 
                    />
                    <button type="button" className="btn btn-secondary discover-btn" onClick={discoverOidc} disabled={discovering}>
                      {discovering ? 'Discovering...' : 'Auto Discover Endpoints'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Client ID</label>
                  <input 
                    type="text" 
                    value={oidc.clientId || ''} 
                    onChange={(e) => setOidc({ ...oidc, clientId: e.target.value })}
                    placeholder="chambered-client-id" 
                  />
                </div>

                <div className="form-group">
                  <label>Client Secret</label>
                  <input 
                    type="password" 
                    value={oidc.clientSecret || ''} 
                    onChange={(e) => setOidc({ ...oidc, clientSecret: e.target.value })}
                    placeholder="••••••••••••••••" 
                  />
                </div>

                <div className="form-group">
                  <label>Authorization Endpoint</label>
                  <input 
                    type="text" 
                    value={oidc.authUrl || ''} 
                    onChange={(e) => setOidc({ ...oidc, authUrl: e.target.value })}
                    placeholder="Automatically resolved" 
                  />
                </div>

                <div className="form-group">
                  <label>Token Endpoint</label>
                  <input 
                    type="text" 
                    value={oidc.tokenUrl || ''} 
                    onChange={(e) => setOidc({ ...oidc, tokenUrl: e.target.value })}
                    placeholder="Automatically resolved" 
                  />
                </div>

                <div className="form-group">
                  <label>UserInfo Endpoint</label>
                  <input 
                    type="text" 
                    value={oidc.userinfoUrl || ''} 
                    onChange={(e) => setOidc({ ...oidc, userinfoUrl: e.target.value })}
                    placeholder="Automatically resolved" 
                  />
                </div>

                <div className="form-group">
                  <label>JWKS URI</label>
                  <input 
                    type="text" 
                    value={oidc.jwksUrl || ''} 
                    onChange={(e) => setOidc({ ...oidc, jwksUrl: e.target.value })}
                    placeholder="Automatically resolved" 
                  />
                </div>

                <div className="form-group full-width checkbox-grp">
                  <input 
                    type="checkbox" 
                    id="autoCreateUser" 
                    checked={oidc.autoCreateUser}
                    onChange={(e) => setOidc({ ...oidc, autoCreateUser: e.target.checked })}
                  />
                  <label htmlFor="autoCreateUser">Auto-provision local accounts on successful OIDC logins</label>
                </div>
                
                <div className="form-group full-width redirect-helper">
                  <label>Authorized Redirect / Callback URI (Copy this to provider)</label>
                  <input type="text" readOnly value={resolvedRedirectUri} className="text-mono readonly-input" />
                </div>
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn btn-primary" disabled={savingOidc}>
                  {savingOidc ? 'Saving...' : 'Save OIDC Configuration'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 3: developer keys */}
        {activeTab === 'apikeys' && (
          <section className="settings-sec">
            <div className="sec-header">
              <h3 className="sec-title">Developer Integration Keys</h3>
              <button className="btn btn-primary" onClick={() => setShowKeyForm(true)}>Generate API Key</button>
            </div>
            <p className="sec-subtitle">Create cryptographically secure tokens for shell scripts, home automation sensors, or reloading import processes.</p>

            {loadingKeys ? (
              <div className="loading-inline"><div className="spinner"></div></div>
            ) : (
              <div className="table-container">
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Key Name</th>
                      <th>Assigned User Account</th>
                      <th>Preview Token</th>
                      <th>Date Generated</th>
                      <th style={{ width: '100px' }}>Actions</th>
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
                          <button className="btn btn-danger btn-mini" onClick={() => handleDeleteApiKey(key.id)}>Delete</button>
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
                        onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                        placeholder="e.g. Raspberry Pi reload script" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Map to User Authorization Profile</label>
                      <select 
                        value={keyForm.userId}
                        onChange={(e) => setKeyForm({ ...keyForm, userId: e.target.value })}
                        required
                      >
                        {users.map((usr) => (
                          <option key={usr.id} value={usr.id}>{usr.username}</option>
                        ))}
                      </select>
                    </div>
                    <div className="dialog-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowKeyForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={savingKey}>Generate Key</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Secure Token display overlay */}
            {showRawTokenModal && (
              <div className="dialog-overlay bg-deep-blur">
                <div className="dialog-card gold-border">
                  <h4 className="dialog-title gold-text">⚠️ API Key Generated Successfully!</h4>
                  <p className="warning-text">Copy this token immediately. For secure design protocols, it will <strong>never be shown again</strong>.</p>
                  
                  <div className="token-reveal">
                    <input type="text" readOnly value={rawToken} className="text-mono raw-token-field" />
                    <button className="btn btn-primary" onClick={copyRawTokenToClipboard}>Copy</button>
                  </div>

                  <div className="dialog-actions">
                    <button className="btn btn-secondary" onClick={closeRawTokenModal}>I Have Safely Saved It</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: Manage Arsenals list */}
        {activeTab === 'arsenals' && (
          <section className="settings-sec">
            <div className="sec-header">
              <h3 className="sec-title">Manage Arsenals</h3>
              <button className="btn btn-primary" onClick={() => setShowArsenalForm(true)}>Create New Arsenal</button>
            </div>
            <p className="sec-subtitle">Create and organize isolated Arsenals. Each Arsenal contains its own independent armory items and ammunition lots.</p>

            {store.arsenals.length === 0 ? (
              <div className="loading-inline"><div className="spinner"></div></div>
            ) : (
              <div className="table-container">
                <table className="settings-table">
                  <thead>
                    <tr>
                      <th>Arsenal Name</th>
                      <th>Description</th>
                      <th>Status / Context</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.arsenals.map((ars) => (
                      <tr key={ars.id}>
                        <td className="text-bold">{ars.name}</td>
                        <td>{ars.description || 'No description provided'}</td>
                        <td>
                          {ars.id === store.activeArsenalId ? (
                            <span className="badge badge-success">
                              Active Arsenal
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ cursor: 'pointer' }} onClick={() => store.selectArsenal(ars.id)}>
                              Click to Switch
                            </span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn btn-danger btn-mini" 
                            disabled={store.arsenals.length <= 1}
                            onClick={() => handleDeleteArsenal(ars.id)}
                            title="Remove arsenal and all its items"
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

            {/* Create new collection model form */}
            {showArsenalForm && (
              <div className="dialog-overlay" onClick={() => setShowArsenalForm(false)}>
                <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
                  <h4 className="dialog-title">Create New Arsenal</h4>
                  <form onSubmit={handleCreateArsenal} className="dialog-form">
                    <div className="form-group">
                      <label>Arsenal Name</label>
                      <input 
                        type="text" 
                        value={arsenalForm.name}
                        onChange={(e) => setArsenalForm({ ...arsenalForm, name: e.target.value })}
                        placeholder="e.g. Hunting Vault, Tactical Vault" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Description (Optional)</label>
                      <textarea 
                        value={arsenalForm.description}
                        onChange={(e) => setArsenalForm({ ...arsenalForm, description: e.target.value })}
                        placeholder="Describe this arsenal..." 
                        rows="3" 
                        className="form-textarea-abs"
                      />
                    </div>
                    <div className="dialog-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowArsenalForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={savingArsenal}>Create Arsenal</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
