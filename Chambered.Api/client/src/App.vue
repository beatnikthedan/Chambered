<template>
  <div class="app-container" :class="{ 'logged-in': store.isAuthenticated }">
    <!-- Collapsible Sidebar -->
    <aside v-if="store.isAuthenticated" class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <span class="logo-emoji">🔥</span>
        <span class="logo-text" v-if="!isSidebarCollapsed">CHAMBERED</span>
        <button class="collapse-toggle" @click="isSidebarCollapsed = !isSidebarCollapsed">
          {{ isSidebarCollapsed ? '→' : '←' }}
        </button>
      </div>

      <!-- Arsenal library selector dropdown matching ABS look -->
      <div v-if="store.isAuthenticated && !isSidebarCollapsed" class="arsenal-selector-container">
        <button class="arsenal-selector-btn" @click.stop="showArsenalDropdown = !showArsenalDropdown">
          <span class="ars-name">{{ store.activeArsenalName }}</span>
          <span class="ars-chevron">▼</span>
        </button>
        <div v-if="showArsenalDropdown" class="arsenal-dropdown-popover" @click.stop>
          <div 
            v-for="ars in store.arsenals" 
            :key="ars.id" 
            class="arsenal-popover-item"
            :class="{ active: ars.id === store.activeArsenalId }"
            @click="selectArsenal(ars.id)"
          >
            <div class="item-details">
              <span class="item-name">{{ ars.name }}</span>
              <span class="item-desc" v-if="ars.description">{{ ars.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- Dashboard -->
        <router-link to="/" class="nav-item" active-class="active" title="Dashboard">
          <span class="nav-text" v-if="!isSidebarCollapsed">Dashboard</span>
        </router-link>
        
        <!-- Armory Main Item and its nested sub-items -->
        <div class="nav-group">
          <router-link to="/armory" class="nav-item" active-class="active" title="Armory">
            <span class="nav-text" v-if="!isSidebarCollapsed">Armory</span>
          </router-link>
          <!-- Maintenance sub-item nested under Armory -->
          <div class="nav-sub-items" v-if="!isSidebarCollapsed && route.path.startsWith('/armory')">
            <div class="sub-nav-item disabled" title="Maintenance Log Coming Soon">
              <span class="sub-text">Maintenance</span>
            </div>
          </div>
        </div>

        <!-- Munitions -->
        <div class="nav-group">
          <router-link to="/munitions" class="nav-item" active-class="active" title="Munitions">
            <span class="nav-text" v-if="!isSidebarCollapsed">Munitions</span>
          </router-link>
          <div class="nav-sub-items" v-if="!isSidebarCollapsed && route.path.startsWith('/munitions')">
            <router-link to="/munitions?type=factory" class="sub-nav-item" :class="{ active: route.fullPath.includes('type=factory') }">
              <span class="sub-text">Factory</span>
            </router-link>
            <router-link to="/munitions?type=handload" class="sub-nav-item" :class="{ active: route.fullPath.includes('type=handload') }">
              <span class="sub-text">Handloads</span>
            </router-link>
          </div>
        </div>

        <!-- Bench Main Item -->
        <div class="nav-group">
          <router-link to="/bench/load-data" class="nav-item" active-class="active" title="Bench">
            <span class="nav-text" v-if="!isSidebarCollapsed">Bench</span>
          </router-link>
          <div class="nav-sub-items" v-if="!isSidebarCollapsed && route.path.startsWith('/bench')">
            <router-link to="/bench/load-data" class="sub-nav-item" active-class="active">
              <span class="sub-text">Load Data</span>
            </router-link>
            <router-link to="/bench/components" class="sub-nav-item" active-class="active">
              <span class="sub-text">Components</span>
            </router-link>
          </div>
        </div>

        <!-- Range Main Item -->
        <div class="nav-group">
          <router-link to="/range/trips" class="nav-item" active-class="active" title="Range">
            <span class="nav-text" v-if="!isSidebarCollapsed">Range</span>
          </router-link>
          <div class="nav-sub-items" v-if="!isSidebarCollapsed && route.path.startsWith('/range')">
            <router-link to="/range/trips" class="sub-nav-item" active-class="active">
              <span class="sub-text">Trips</span>
            </router-link>
            <router-link to="/range/targets" class="sub-nav-item" active-class="active">
              <span class="sub-text">Targets</span>
            </router-link>
            <router-link to="/range/training" class="sub-nav-item" active-class="active">
              <span class="sub-text">Training</span>
            </router-link>
          </div>
        </div>

        <!-- Vaults Main Item -->
        <div class="nav-group">
          <router-link to="/vaults/locations" class="nav-item" active-class="active" title="Vaults">
            <span class="nav-text" v-if="!isSidebarCollapsed">Vaults</span>
          </router-link>
          <div class="nav-sub-items" v-if="!isSidebarCollapsed && route.path.startsWith('/vaults')">
            <router-link to="/vaults/locations" class="sub-nav-item" active-class="active">
              <span class="sub-text">Locations</span>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer matching Audiobookshelf Version / Docker Badge -->
      <div class="sidebar-footer version-footer">
        <div class="version-info" v-if="!isSidebarCollapsed">
          <div class="version-row">
            <span class="version-label">v1.0.0</span>
            <span class="container-badge">Docker</span>
            <!-- API Connected Signal -->
            <div class="api-signal" title="Chambered API Connected" style="margin-left: 8px;">
              <span class="status-indicator online"></span>
            </div>
          </div>
          <div class="update-row">
            <span class="status-dot green"></span>
            <span class="update-text">Up to date</span>
          </div>
        </div>
        <div class="version-info-collapsed" v-else title="v1.0.0 (Docker) - Up to date">
          <span class="status-dot green"></span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-viewport">
      <!-- Top Header Bar with Moved Profile on Right and Settings Gear to Left -->
      <header v-if="store.isAuthenticated" class="top-header">
        <div class="header-left">
          <h2 class="view-title">{{ routeTitle }}</h2>
        </div>
        
        <div class="header-right" v-if="store.user">
          <!-- Settings Gear button to the left of user avatar (just like ABS) -->
          <router-link to="/settings" class="header-action-btn" title="Settings Menu">
            <span class="btn-icon">⚙️</span>
          </router-link>

          <!-- User Profile Avatar with dropdown list container -->
          <div class="profile-dropdown-wrapper">
            <button class="avatar-trigger-btn" @click.stop="toggleProfileMenu" title="User Menu">
              <img 
                v-if="store.user.gravatarUrl" 
                :src="store.user.gravatarUrl" 
                class="user-profile-img" 
                alt="Profile Avatar"
              />
              <div v-else class="user-initials-avatar">
                {{ store.user.username[0].toUpperCase() }}
              </div>
            </button>

            <!-- Dropdown list, styled with grey ABS panel theme -->
            <div v-if="showProfileMenu" class="profile-dropdown-menu" @click.stop>
              <div class="dropdown-header-sec">
                <div class="header-username">{{ store.user.username }}</div>
                <div class="header-email" v-if="store.user.email">{{ store.user.email }}</div>
                <div class="header-role" v-if="store.user.roles && store.user.roles.length">
                  {{ store.user.roles[0] }}
                </div>
              </div>
              <div class="dropdown-divider-line"></div>
              <button class="dropdown-option-btn" @click="openAccountModal">
                Account Details
              </button>
              <button class="dropdown-option-btn logout-option" @click="handleLogout">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- View Content Router Outlet -->
      <div class="content-wrapper">
        <router-view v-if="!store.loading" />
        <div v-else class="global-loading">
          <div class="spinner"></div>
          <p>Opening vaults...</p>
        </div>
      </div>
    </main>

    <!-- Account Details Modal Overlay -->
    <div v-if="showAccountModal" class="modal-overlay" @click.self="showAccountModal = false">
      <div class="account-modal-card">
        <div class="modal-header-row">
          <h3>Your Profile Details</h3>
          <button class="close-modal-btn" @click="showAccountModal = false">×</button>
        </div>
        
        <div class="account-modal-content">
          <div class="profile-preview-row">
            <img 
              v-if="store.user?.gravatarUrl" 
              :src="store.user.gravatarUrl + '&s=120'" 
              class="large-modal-avatar" 
              alt="Gravatar Image"
            />
            <div class="avatar-explain">
              <span class="badge badge-success">Gravatar Enabled</span>
              <p>Your avatar is pulled automatically from gravatar.com using your email hash.</p>
            </div>
          </div>

          <div class="details-list">
            <div class="detail-item">
              <span class="item-label">Account Name</span>
              <span class="item-val">{{ store.user?.username }}</span>
            </div>
            <div class="detail-item" v-if="store.user?.email">
              <span class="item-label">Registered Email</span>
              <span class="item-val">{{ store.user?.email }}</span>
            </div>
            <div class="detail-item">
              <span class="item-label">Internal ID</span>
              <span class="item-val text-mono">{{ store.user?.id }}</span>
            </div>
            <div class="detail-item" v-if="store.user?.roles && store.user?.roles.length">
              <span class="item-label">Role Authorization</span>
              <span class="item-val">
                <span class="badge badge-danger">{{ store.user?.roles[0] }}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer-row">
          <button class="btn btn-secondary" @click="showAccountModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { store } from './store'

const router = useRouter()
const route = useRoute()
const isSidebarCollapsed = ref(false)
const showProfileMenu = ref(false)
const showAccountModal = ref(false)
const showArsenalDropdown = ref(false)

const routeTitle = computed(() => {
  if (route.name && route.name.startsWith('Bench')) return 'Chambered Bench'
  if (route.name && route.name.startsWith('Range')) return 'Chambered Range'
  if (route.name && route.name.startsWith('Vaults')) return 'Chambered Vaults'
  switch (route.name) {
    case 'Dashboard': return 'Dashboard'
    case 'Armory': return 'Chambered Armory'
    case 'Munitions': return 'Chambered Munitions'
    case 'Settings': return 'System Settings'
    default: return 'Chambered'
  }
})

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const closeProfileMenu = () => {
  showProfileMenu.value = false
}

const openAccountModal = () => {
  showAccountModal.value = true
  showProfileMenu.value = false
}

const handleLogout = async () => {
  await store.logout()
  router.push('/login')
}

const selectArsenal = async (id) => {
  await store.selectArsenal(id)
  showArsenalDropdown.value = false
}

const closeArsenalDropdown = () => {
  showArsenalDropdown.value = false
}

onMounted(async () => {
  await store.checkAuth()
  document.addEventListener('click', closeProfileMenu)
  document.addEventListener('click', closeArsenalDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeProfileMenu)
  document.removeEventListener('click', closeArsenalDropdown)
})
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-main);
  transition: var(--transition-normal);
}

/* Sidebar styling */
.sidebar {
  width: 240px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 100;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 68px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-light);
  justify-content: space-between;
  flex-shrink: 0;
}

.logo-emoji {
  font-size: 24px;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.1em;
  margin-left: 10px;
  white-space: nowrap;
}

.collapse-toggle {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}
.collapse-toggle:hover {
  background: var(--bg-input);
  color: var(--color-primary);
}

.sidebar-nav {
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-grow: 1;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: var(--transition-fast);
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(204, 164, 59, 0.05);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(204, 164, 59, 0.12);
  color: var(--color-primary);
  border-left: 3px solid var(--color-primary);
  font-weight: 600;
}

.disabled-item {
  opacity: 0.45;
  cursor: not-allowed;
  position: relative;
}
.disabled-item:hover {
  background: transparent;
  color: var(--text-secondary);
}

.lock-badge {
  font-size: 9px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: auto;
  text-transform: uppercase;
}

.nav-sub-items {
  padding-left: 30px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
}

.sub-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
}

.sub-nav-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 18px;
  min-width: 24px;
}

.nav-text {
  margin-left: 12px;
}

/* Sidebar footer version specifications */
.version-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
  background: var(--bg-sidebar);
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.version-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-label {
  font-size: 12px;
  font-family: monospace;
  font-weight: 600;
  color: var(--text-secondary);
}

.container-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--bg-input);
  color: var(--color-accent);
  border: 1px solid rgba(210, 124, 45, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.update-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot.green {
  background-color: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.update-text {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.version-info-collapsed {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

/* Main Viewport styling */
.main-viewport {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
}

.top-header {
  height: 64px;
  background-color: var(--bg-panel);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
}

.view-title {
  font-size: 18px;
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.api-signal {
  display: flex;
  align-items: center;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.online {
  background: var(--color-success);
  box-shadow: 0 0 8px var(--color-success);
}

.header-action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: var(--transition-fast);
}

.header-action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn-icon {
  font-size: 18px;
  color: var(--text-secondary);
}

/* Profile menu wrapper */
.profile-dropdown-wrapper {
  position: relative;
}

.avatar-trigger-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  transition: transform 0.15s ease;
}

.avatar-trigger-btn:hover {
  transform: scale(1.05);
}

.user-profile-img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--color-primary);
}

.user-initials-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--bg-main);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Audiobookshelf styled Grey popup dropdown menu */
.profile-dropdown-menu {
  position: absolute;
  top: 48px;
  right: 0;
  background-color: #1a1a1a; /* Gray theme exact match */
  border: 1px solid #2d2d2d;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  padding: 8px 0;
  min-width: 220px;
  z-index: 500;
  animation: dropdownIn 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-header-sec {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-username {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.header-email {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-role {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--color-primary);
  font-weight: 600;
  margin-top: 4px;
}

.dropdown-divider-line {
  height: 1px;
  background-color: #2d2d2d;
  margin: 6px 0;
}

.dropdown-option-btn {
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: var(--transition-fast);
}

.dropdown-option-btn:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.logout-option {
  color: #ef4444;
}
.logout-option:hover {
  background-color: rgba(239, 68, 68, 0.08);
  color: #ff5a5a;
}

/* Modal details */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-modal-card {
  background: var(--bg-modal);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header-row h3 {
  font-family: var(--font-heading);
  color: var(--color-primary);
  font-size: 18px;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
}

.account-modal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-preview-row {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--bg-input);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-solid);
}

.large-modal-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-primary);
}

.avatar-explain {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.avatar-explain p {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  border-bottom: 1px dashed var(--border-solid);
  padding-bottom: 8px;
}

.item-label {
  color: var(--text-muted);
}

.item-val {
  color: var(--text-primary);
  font-weight: 600;
}

.modal-footer-row {
  display: flex;
  justify-content: flex-end;
}

.content-wrapper {
  flex-grow: 1;
  padding: 32px;
  position: relative;
}

.global-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-secondary);
}

/* Arsenal Selector Styles */
.arsenal-selector-container {
  padding: 10px 14px;
  position: relative;
  border-bottom: 1px solid var(--border-light);
  background: rgba(24, 25, 30, 0.4);
}

.arsenal-selector-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition-fast);
  text-align: left;
}

.arsenal-selector-btn:hover {
  border-color: var(--color-primary);
  background: var(--bg-sidebar);
}

.ars-emoji {
  font-size: 16px;
}

.ars-name {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ars-chevron {
  font-size: 10px;
  color: var(--text-muted);
}

.arsenal-dropdown-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 14px;
  right: 14px;
  background: var(--bg-panel);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  max-height: 250px;
  overflow-y: auto;
  padding: 4px;
}

.arsenal-popover-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.arsenal-popover-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.arsenal-popover-item.active {
  background: rgba(204, 164, 59, 0.08);
}

.item-emoji {
  font-size: 16px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arsenal-popover-item.active .item-name {
  color: var(--color-primary);
}

.item-desc {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
