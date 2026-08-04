<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <span class="brand-emoji">🔥</span>
        <h1 class="brand-name" :class="{ 'font-setup': !store.isInitialized && store.isInitialized !== null }">
          {{ store.isInitialized ? 'CHAMBERED' : 'CHAMBERED SETUP' }}
        </h1>
        <p class="brand-subtitle">
          {{ store.isInitialized ? 'Precision Armory & Ammunition Server' : 'Register Primary Owner Account' }}
        </p>
      </div>

      <div class="setup-banner" v-if="!store.isInitialized && store.isInitialized !== null">
        Welcome! No user profiles found. The first account created will be granted <strong>System Owner (Administrator)</strong> credentials.
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="error-banner" v-if="errorMessage">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="e.g. administrator" 
            required 
            :disabled="isSubmitting"
          />
        </div>

        <!-- Optional email profile field during onboarding -->
        <div class="form-group" v-if="!store.isInitialized && store.isInitialized !== null">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="admin@domain.local" 
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="••••••••" 
            required 
            :disabled="isSubmitting"
          />
        </div>

        <button type="submit" class="btn btn-primary login-btn" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="mini-spinner"></span>
          <span v-else-if="store.isInitialized">Access Armory</span>
          <span v-else>Initialize Server & Sign In</span>
        </button>
      </form>

      <!-- SSO connection selectors, hidden on clean setups -->
      <template v-if="store.isInitialized">
        <div class="sso-divider">
          <span>or connect via</span>
        </div>

        <div class="sso-actions">
          <button @click="handleOidcLogin" class="btn btn-secondary sso-btn">
            <span class="sso-icon"></span>
            <span>Sign In with OIDC Single Sign-On</span>
          </button>
        </div>
      </template>

      <div class="login-footer">
        <p v-if="store.isInitialized">Protected by Mixed Casing Authentication</p>
        <p v-else>First-run initialization protocol active</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store'

const router = useRouter()
const username = ref('')
const password = ref('')
const email = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    if (store.isInitialized === false) {
      const success = await store.firstRegister(username.value, password.value, email.value)
      if (success) {
        router.push('/')
      }
    } else {
      const success = await store.login(username.value, password.value)
      if (success) {
        router.push('/')
      }
    }
  } catch (err) {
    errorMessage.value = err.message || 'Verification or profile creation failed.'
  } finally {
    isSubmitting.value = false
  }
}

const handleOidcLogin = () => {
  window.location.href = '/api/auth/oidc/login'
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--bg-main);
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(204, 164, 59, 0.04) 0%, transparent 45%),
    radial-gradient(circle at 90% 80%, rgba(210, 124, 45, 0.03) 0%, transparent 45%);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  overflow: hidden;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--bg-panel);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(204, 164, 59, 0.05);
  display: flex;
  flex-direction: column;
}

.brand {
  text-align: center;
  margin-bottom: 28px;
}

.brand-emoji {
  font-size: 40px;
  display: inline-block;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 10px rgba(204, 164, 59, 0.4));
}

.brand-name {
  font-family: var(--font-heading);
  font-size: 26px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.12em;
}

.font-setup {
  font-size: 21px !important;
  letter-spacing: 0.08em;
}

.brand-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.setup-banner {
  background: rgba(204, 164, 59, 0.06);
  color: var(--text-primary);
  border: 1px solid rgba(204, 164, 59, 0.15);
  padding: 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 24px;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  line-height: 1.4;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-family: var(--font-heading);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
}

.mini-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--bg-main);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.sso-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 24px 0;
  color: var(--text-muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sso-divider::before, .sso-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-solid);
}

.sso-divider span {
  padding: 0 10px;
}

.sso-btn {
  width: 100%;
  padding: 12px;
  font-size: 14px;
}

.sso-icon {
  font-size: 16px;
}

.login-footer {
  text-align: center;
  margin-top: 32px;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
