<template>
  <div class="settings-view">
    <!-- Admin Settings Tabs Panel -->
    <div class="settings-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'users' }" 
        @click="activeTab = 'users'"
      >
        User Accounts
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'oidc' }" 
        @click="activeTab = 'oidc'"
      >
        OpenID Connect (SSO)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'apikeys' }" 
        @click="activeTab = 'apikeys'"
      >
        Developer API Keys
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'arsenals' }" 
        @click="activeTab = 'arsenals'"
      >
        Arsenals
      </button>
    </div>

    <!-- Active Tab Workspace -->
    <div class="tab-content panel">

      <!-- ==========================================
           TAB 1: USER MANAGEMENT
           ========================================== -->
      <section v-if="activeTab === 'users'" class="settings-sec">
        <div class="sec-header">
          <h3 class="sec-title">Manage User Accounts</h3>
          <button class="btn btn-primary" @click="showUserForm = true">Register New User</button>
        </div>

        <div v-if="loadingUsers" class="loading-inline"><div class="spinner"></div></div>
        <div v-else class="table-container">
          <table class="settings-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Roles / Authorization</th>
                <th style="width:100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="usr in users" :key="usr.id">
                <td class="text-bold">{{ usr.username }}</td>
                <td>{{ usr.email }}</td>
                <td>
                  <span v-for="r in usr.roles" :key="r" class="badge" :class="r === 'Admin' ? 'badge-danger' : 'badge-success'">
                    {{ r }}
                  </span>
                </td>
                <td>
                  <button 
                    class="btn btn-danger btn-mini" 
                    :disabled="usr.id === store.user?.id" 
                    @click="deleteUser(usr.id)"
                    title="Remove user account"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Create User Form Modal Overlay -->
        <div v-if="showUserForm" class="dialog-overlay" @click.self="showUserForm = false">
          <div class="dialog-card">
            <h4 class="dialog-title">Register Local Account</h4>
            <form @submit.prevent="createUser" class="dialog-form">
              <div class="form-group">
                <label>Username</label>
                <input type="text" v-model="userForm.username" placeholder="Letters & numbers" required />
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" v-model="userForm.email" placeholder="user@domain.com" />
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" v-model="userForm.password" placeholder="••••••••" required />
              </div>
              <div class="form-group checkbox-grp">
                <input type="checkbox" id="isAdmin" v-model="userForm.isAdmin" />
                <label for="isAdmin">Grant System Admin Role privileges</label>
              </div>
              <div class="dialog-actions">
                <button type="button" class="btn btn-secondary" @click="showUserForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="savingUser">Register</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB 2: OIDC / SSO CONFIGURATION
           ========================================== -->
      <section v-if="activeTab === 'oidc'" class="settings-sec">
        <h3 class="sec-title">Single Sign-On Integration</h3>
        <p class="sec-subtitle">Connect your self-hosted identity provider (Keycloak, Authentik, Google) for centralized access.</p>

        <form @submit.prevent="saveOidc" class="oidc-form">
          <div class="form-group checkbox-grp toggle-setting">
            <input type="checkbox" id="oidcEnabled" v-model="oidc.isEnabled" />
            <label for="oidcEnabled">Enable OpenID Connect (OIDC) Authentication scheme</label>
          </div>

          <div class="form-grid">
            <div class="form-group full-width oidc-discover-grp">
              <label>OIDC Issuer URL (Base domain)</label>
              <div class="discover-input-row">
                <input type="url" v-model="oidc.issuerUrl" placeholder="https://auth.example.com/realms/master" />
                <button type="button" class="btn btn-secondary discover-btn" @click="discoverOidc" :disabled="discovering">
                  Auto Discover Endpoints
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Client ID</label>
              <input type="text" v-model="oidc.clientId" placeholder="chambered-client-id" />
            </div>

            <div class="form-group">
              <label>Client Secret</label>
              <input type="password" v-model="oidc.clientSecret" placeholder="••••••••••••••••" />
            </div>

            <div class="form-group">
              <label>Authorization Endpoint</label>
              <input type="text" v-model="oidc.authUrl" placeholder="Automatically resolved" />
            </div>

            <div class="form-group">
              <label>Token Endpoint</label>
              <input type="text" v-model="oidc.tokenUrl" placeholder="Automatically resolved" />
            </div>

            <div class="form-group">
              <label>UserInfo Endpoint</label>
              <input type="text" v-model="oidc.userinfoUrl" placeholder="Automatically resolved" />
            </div>

            <div class="form-group">
              <label>JWKS URI</label>
              <input type="text" v-model="oidc.jwksUrl" placeholder="Automatically resolved" />
            </div>

            <div class="form-group full-width checkbox-grp">
              <input type="checkbox" id="autoCreateUser" v-model="oidc.autoCreateUser" />
              <label for="autoCreateUser">Auto-provision local accounts on successful OIDC logins</label>
            </div>
            
            <div class="form-group full-width redirect-helper">
              <label>Authorized Redirect / Callback URI (Copy this to provider)</label>
              <input type="text" readonly :value="resolvedRedirectUri" class="text-mono readonly-input" />
            </div>
          </div>

          <div class="form-actions-row">
            <button type="submit" class="btn btn-primary" :disabled="savingOidc">Save OIDC Configuration</button>
          </div>
        </form>
      </section>

      <!-- ==========================================
           TAB 3: API KEYS MANAGEMENT
           ========================================== -->
      <section v-if="activeTab === 'apikeys'" class="settings-sec">
        <div class="sec-header">
          <h3 class="sec-title">Developer Integration Keys</h3>
          <button class="btn btn-primary" @click="showKeyForm = true">Generate API Key</button>
        </div>
        <p class="sec-subtitle">Create cryptographically secure tokens for shell scripts, home automation sensors, or reloading import processes.</p>

        <div v-if="loadingKeys" class="loading-inline"><div class="spinner"></div></div>
        <div v-else class="table-container">
          <table class="settings-table">
            <thead>
              <tr>
                <th>Key Name</th>
                <th>Assigned User Account</th>
                <th>Preview Token</th>
                <th>Date Generated</th>
                <th style="width:100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in apiKeys" :key="key.id">
                <td class="text-bold">{{ key.name }}</td>
                <td>{{ key.userName }}</td>
                <td class="text-mono">{{ key.tokenPreview }}</td>
                <td>{{ formatDate(key.createdAt) }}</td>
                <td>
                  <button class="btn btn-danger btn-mini" @click="deleteApiKey(key.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Create Key Dialog Overlay -->
        <div v-if="showKeyForm" class="dialog-overlay" @click.self="showKeyForm = false">
          <div class="dialog-card">
            <h4 class="dialog-title">Generate API Token</h4>
            <form @submit.prevent="createApiKey" class="dialog-form">
              <div class="form-group">
                <label>Key Descriptor Name</label>
                <input type="text" v-model="keyForm.name" placeholder="e.g. Raspberry Pi reload script" required />
              </div>
              <div class="form-group">
                <label>Map to User Authorization Profile</label>
                <select v-model="keyForm.userId" required>
                  <option v-for="usr in users" :key="usr.id" :value="usr.id">{{ usr.username }}</option>
                </select>
              </div>
              <div class="dialog-actions">
                <button type="button" class="btn btn-secondary" @click="showKeyForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="savingKey">Generate Key</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Raw Token Display Modal (CRITICAL: Shown exactly once!) -->
        <div v-if="showRawTokenModal" class="dialog-overlay bg-deep-blur">
          <div class="dialog-card gold-border">
            <h4 class="dialog-title gold-text">⚠️ API Key Generated Successfully!</h4>
            <p class="warning-text">Copy this token immediately. For secure design protocols, it will <strong>never be shown again</strong>.</p>
            
            <div class="token-reveal">
              <input type="text" id="rawTokenInput" readonly :value="rawToken" class="text-mono raw-token-field" />
              <button class="btn btn-primary" @click="copyRawToken">Copy</button>
            </div>

            <div class="dialog-actions">
              <button class="btn btn-secondary" @click="closeRawTokenModal">I Have Safely Saved It</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ==========================================
           TAB 4: ARSENALS MANAGEMENT (Audiobookshelf style)
           ========================================== -->
      <section v-if="activeTab === 'arsenals'" class="settings-sec">
        <div class="sec-header">
          <h3 class="sec-title">Manage Arsenals</h3>
          <button class="btn btn-primary" @click="showArsenalForm = true">Create New Arsenal</button>
        </div>
        <p class="sec-subtitle">Create and organize isolated Arsenals. Each Arsenal contains its own independent armory items and ammunition lots.</p>

        <div v-if="store.arsenals.length === 0" class="loading-inline"><div class="spinner"></div></div>
        <div v-else class="table-container">
          <table class="settings-table">
            <thead>
              <tr>
                <th>Arsenal Name</th>
                <th>Description</th>
                <th>Status / Context</th>
                <th style="width:120px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ars in store.arsenals" :key="ars.id">
                <td class="text-bold">{{ ars.name }}</td>
                <td>{{ ars.description || 'No description provided' }}</td>
                <td>
                  <span v-if="ars.id === store.activeArsenalId" class="badge badge-success">
                    Active Arsenal
                  </span>
                  <span v-else class="badge badge-secondary" style="cursor:pointer;" @click="store.selectArsenal(ars.id)">
                    Click to Switch
                  </span>
                </td>
                <td>
                  <button 
                    class="btn btn-danger btn-mini" 
                    :disabled="store.arsenals.length <= 1" 
                    @click="deleteArsenal(ars.id)"
                    title="Remove arsenal and all its items"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Create Arsenal Form Modal Overlay -->
        <div v-if="showArsenalForm" class="dialog-overlay" @click.self="showArsenalForm = false">
          <div class="dialog-card">
            <h4 class="dialog-title">Create New Arsenal</h4>
            <form @submit.prevent="createArsenal" class="dialog-form">
              <div class="form-group">
                <label>Arsenal Name</label>
                <input type="text" v-model="arsenalForm.name" placeholder="e.g. Hunting Vault, Tactical Vault" required />
              </div>
              <div class="form-group">
                <label>Description (Optional)</label>
                <textarea v-model="arsenalForm.description" placeholder="Describe this arsenal..." rows="3" class="form-textarea-abs"></textarea>
              </div>
              <div class="dialog-actions">
                <button type="button" class="btn btn-secondary" @click="showArsenalForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="savingArsenal">Create Arsenal</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { store } from '../store'

const activeTab = ref('users')

// Users State
const users = ref([])
const loadingUsers = ref(false)
const showUserForm = ref(false)
const savingUser = ref(false)
const userForm = ref({ username: '', email: '', password: '', isAdmin: false })

// OIDC State
const oidc = ref({
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
const savingOidc = ref(false)
const discovering = ref(false)

// Keys State
const apiKeys = ref([])
const loadingKeys = ref(false)
const showKeyForm = ref(false)
const savingKey = ref(false)
const keyForm = ref({ name: '', userId: '' })
const rawToken = ref('')
const showRawTokenModal = ref(false)

// Arsenals State
const showArsenalForm = ref(false)
const savingArsenal = ref(false)
const arsenalForm = ref({ name: '', description: '' })

const resolvedRedirectUri = computed(() => {
  return `${window.location.origin}/api/auth/oidc/callback`
})

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Watchers to trigger loads when tab changes
watch(activeTab, (tab) => {
  if (tab === 'users') fetchUsers()
  if (tab === 'oidc') fetchOidc()
  if (tab === 'apikeys') {
    fetchApiKeys()
    fetchUsers() // Need users list for creator form dropdown
  }
  if (tab === 'arsenals') {
    store.fetchArsenals()
  }
})

const createArsenal = async () => {
  savingArsenal.value = true
  try {
    const success = await store.createArsenal(arsenalForm.value.name, arsenalForm.value.description)
    if (success) {
      showArsenalForm.value = false
      arsenalForm.value = { name: '', description: '' }
    }
  } catch (err) {
    alert(`Failed to create arsenal collection: ${err.message}`)
  } finally {
    savingArsenal.value = false
  }
}

const deleteArsenal = async (id) => {
  if (!confirm("Are you sure you want to DELETE this entire Arsenal?\n\nWARNING: All Armory items and Ammunition lots contained inside this arsenal will be permanently deleted. This action is irreversible!")) {
    return
  }
  try {
    await store.deleteArsenal(id)
  } catch (err) {
    alert(`Failed to delete arsenal: ${err.message}`)
  }
}

// ==========================================
// USER API CALLS
// ==========================================
const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const res = await fetch('/api/settings/users')
    if (res.ok) {
      users.value = await res.json()
    }
  } catch (err) {
    console.error(err)
  } finally {
    loadingUsers.value = false
  }
}

const createUser = async () => {
  savingUser.value = true
  try {
    const res = await fetch('/api/settings/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm.value)
    })
    if (res.ok) {
      await fetchUsers()
      showUserForm.value = false
      userForm.value = { username: '', email: '', password: '', isAdmin: false }
    } else {
      const err = await res.text()
      alert(`Failed: ${err}`)
    }
  } catch (err) {
    console.error(err)
  } finally {
    savingUser.value = false
  }
}

const deleteUser = async (id) => {
  if (!confirm('Remove this user profile? They will be immediately disconnected.')) return
  try {
    const res = await fetch(`/api/settings/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      users.value = users.value.filter(u => u.id !== id)
    } else {
      const err = await res.text()
      alert(`Failed: ${err}`)
    }
  } catch (err) {
    console.error(err)
  }
}

// ==========================================
// OIDC API CALLS
// ==========================================
const fetchOidc = async () => {
  try {
    const res = await fetch('/api/settings/oidc')
    if (res.ok) {
      oidc.value = await res.json()
    }
  } catch (err) {
    console.error(err)
  }
}

const saveOidc = async () => {
  savingOidc.value = true
  try {
    const res = await fetch('/api/settings/oidc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(oidc.value)
    })
    if (res.ok) {
      alert('OIDC Settings successfully written.')
    }
  } catch (err) {
    console.error(err)
  } finally {
    savingOidc.value = false
  }
}

const discoverOidc = async () => {
  if (!oidc.value.issuerUrl) {
    alert('Please enter an Issuer URL first.')
    return
  }
  discovering.value = true
  try {
    const res = await fetch('/api/settings/oidc/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issuerUrl: oidc.value.issuerUrl })
    })
    if (res.ok) {
      const data = await res.json()
      oidc.value.authUrl = data.authUrl
      oidc.value.tokenUrl = data.tokenUrl
      oidc.value.userinfoUrl = data.userinfoUrl
      oidc.value.jwksUrl = data.jwksUrl
    } else {
      const err = await res.text()
      alert(`Discovery failed: ${err}`)
    }
  } catch (err) {
    alert(`Discovery request failed: ${err.message}`)
  } finally {
    discovering.value = false
  }
}

// ==========================================
// API KEYS API CALLS
// ==========================================
const fetchApiKeys = async () => {
  loadingKeys.value = true
  try {
    const res = await fetch('/api/settings/apikeys')
    if (res.ok) {
      apiKeys.value = await res.json()
    }
  } catch (err) {
    console.error(err)
  } finally {
    loadingKeys.value = false
  }
}

const createApiKey = async () => {
  savingKey.value = true
  try {
    const res = await fetch('/api/settings/apikeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keyForm.value)
    })
    if (res.ok) {
      const data = await res.json()
      rawToken.value = data.rawToken
      apiKeys.value.push(data.apiKey)
      showKeyForm.value = false
      showRawTokenModal.value = true
      keyForm.value = { name: '', userId: users.value.length ? users.value[0].id : '' }
    }
  } catch (err) {
    console.error(err)
  } finally {
    savingKey.value = false
  }
}

const deleteApiKey = async (id) => {
  if (!confirm('Permanently revoke this integration API key? Any active scripts using this key will immediately fail.')) return
  try {
    const res = await fetch(`/api/settings/apikeys/${id}`, { method: 'DELETE' })
    if (res.ok) {
      apiKeys.value = apiKeys.value.filter(k => k.id !== id)
    }
  } catch (err) {
    console.error(err)
  }
}

const copyRawToken = () => {
  const inp = document.getElementById('rawTokenInput')
  if (inp) {
    inp.select()
    inp.setSelectionRange(0, 99999)
    navigator.clipboard.writeText(inp.value)
    alert('API Key copied to clipboard.')
  }
}

const closeRawTokenModal = () => {
  showRawTokenModal.value = false
  rawToken.value = ''
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 8px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.tab-btn:hover {
  background: rgba(204, 164, 59, 0.05);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(204, 164, 59, 0.1);
  color: var(--color-primary);
  border: 1px solid var(--border-light);
}

.settings-sec {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sec-title {
  font-size: 18px;
  font-family: var(--font-heading);
  color: var(--text-primary);
}

.sec-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: -12px;
  line-height: 1.5;
}

.loading-inline {
  display: flex;
  justify-content: center;
  padding: 40px;
}

/* Tabular lists */
.table-container {
  overflow-x: auto;
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
}

.settings-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.settings-table th, .settings-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-solid);
}

.settings-table th {
  background: var(--bg-input);
  font-family: var(--font-heading);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.settings-table tbody tr:hover {
  background: rgba(255,255,255,0.01);
}

.text-bold {
  font-weight: 600;
  color: var(--text-primary);
}

.text-mono {
  font-family: monospace;
  color: var(--color-primary);
}

/* Dialog Overlay modals */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-deep-blur {
  backdrop-filter: blur(15px);
}

.dialog-card {
  background: var(--bg-modal);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.7);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkbox-grp {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
}

.checkbox-grp input {
  width: auto;
  cursor: pointer;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}

/* OIDC forms */
.oidc-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.toggle-setting {
  background: var(--bg-input);
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-solid);
  font-size: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.full-width {
  grid-column: span 2;
}

.discover-input-row {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.discover-btn {
  white-space: nowrap;
}

.redirect-helper {
  border-top: 1px dashed var(--border-light);
  padding-top: 16px;
}

.readonly-input {
  background: var(--bg-sidebar);
  border-color: var(--border-light);
  color: var(--text-secondary);
  cursor: default;
}

.form-actions-row {
  display: flex;
  justify-content: flex-start;
  border-top: 1px solid var(--border-solid);
  padding-top: 20px;
}

/* Token reveal dialog */
.warning-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.token-reveal {
  display: flex;
  gap: 10px;
  background: var(--bg-sidebar);
  padding: 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-primary);
}

.raw-token-field {
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 700;
  flex-grow: 1;
}
.raw-token-field:focus {
  box-shadow: none;
}

.form-textarea-abs {
  width: 100%;
  background-color: var(--bg-input);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  padding: 10px;
  resize: vertical;
}
.form-textarea-abs:focus {
  border-color: var(--color-primary);
  outline: none;
}
</style>
