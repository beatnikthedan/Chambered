import { reactive } from 'vue'

export const store = reactive({
  user: null,
  isAuthenticated: false,
  isInitialized: null,
  loading: true,

  // Arsenal state
  activeArsenalId: null,
  activeArsenalName: 'Loading...',
  arsenals: [],

  async checkAuth() {
    try {
      await this.checkInitialization()
      
      const res = await fetch('/api/auth/user')
      if (res.ok) {
        this.user = await res.json()
        this.isAuthenticated = true
        // Fetch arsenals right after successful authentication
        await this.fetchArsenals()
      } else {
        this.user = null
        this.isAuthenticated = false
      }
    } catch (err) {
      console.error('Auth verification failed', err)
      this.user = null
      this.isAuthenticated = false
    } finally {
      this.loading = false
    }
  },

  async checkInitialization() {
    try {
      const res = await fetch('/api/auth/is-initialized')
      if (res.ok) {
        const data = await res.json()
        this.isInitialized = data.isInitialized
      }
    } catch (err) {
      console.error('Initialization check failed', err)
    }
  },

  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (res.ok) {
      this.user = await res.json()
      this.isAuthenticated = true
      await this.fetchArsenals()
      return true
    }
    const err = await res.text()
    throw new Error(err || 'Invalid credentials')
  },

  async firstRegister(username, password, email) {
    const res = await fetch('/api/auth/first-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    })
    if (res.ok) {
      this.user = await res.json()
      this.isAuthenticated = true
      this.isInitialized = true
      await this.fetchArsenals()
      return true
    }
    const err = await res.text()
    throw new Error(err || 'Registration failed')
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error', err)
    } finally {
      this.user = null
      this.isAuthenticated = false
      this.activeArsenalId = null
      this.activeArsenalName = 'Loading...'
      this.arsenals = []
    }
  },

  // Arsenal operations
  async fetchArsenals() {
    try {
      const res = await fetch('/api/arsenals')
      if (res.ok) {
        this.arsenals = await res.json()
        if (this.arsenals.length > 0) {
          // Attempt to restore active arsenal from LocalStorage
          const savedId = localStorage.getItem('activeArsenalId')
          const found = this.arsenals.find(a => a.id === parseInt(savedId))
          if (found) {
            this.activeArsenalId = found.id
            this.activeArsenalName = found.name
          } else {
            // Default to first
            this.activeArsenalId = this.arsenals[0].id
            this.activeArsenalName = this.arsenals[0].name
          }
        } else {
          this.activeArsenalId = null
          this.activeArsenalName = 'No Collections'
        }
      }
    } catch (err) {
      console.error('Failed to load arsenals list', err)
    }
  },

  async selectArsenal(id) {
    const found = this.arsenals.find(a => a.id === id)
    if (found) {
      this.activeArsenalId = found.id
      this.activeArsenalName = found.name
      localStorage.setItem('activeArsenalId', found.id)
    }
  },

  async createArsenal(name, description) {
    const res = await fetch('/api/arsenals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    })
    if (res.ok) {
      const newArsenal = await res.json()
      await this.fetchArsenals()
      // Automatically switch to the newly created arsenal!
      await this.selectArsenal(newArsenal.id)
      return true
    }
    const err = await res.text()
    throw new Error(err || 'Failed to create arsenal collection')
  },

  async deleteArsenal(id) {
    const res = await fetch(`/api/arsenals/${id}`, { method: 'DELETE' })
    if (res.ok) {
      await this.fetchArsenals()
      return true
    }
    const err = await res.text()
    throw new Error(err || 'Failed to delete arsenal')
  }
})
