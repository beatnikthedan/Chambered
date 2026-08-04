import { createRouter, createWebHistory } from 'vue-router'
import { store } from './store'

import Dashboard from './views/Dashboard.vue'
import Armory from './views/Armory.vue'
import Munitions from './views/Munitions.vue'
import Settings from './views/Settings.vue'
import Login from './views/Login.vue'
import PlaceholderView from './views/PlaceholderView.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/armory',
    name: 'Armory',
    component: Armory,
    meta: { requiresAuth: true }
  },
  {
    path: '/munitions',
    name: 'Munitions',
    component: Munitions,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/bench/load-data',
    name: 'BenchLoadData',
    component: PlaceholderView,
    meta: { requiresAuth: true }
  },
  {
    path: '/bench/components',
    name: 'BenchComponents',
    component: PlaceholderView,
    meta: { requiresAuth: true }
  },
  {
    path: '/range/trips',
    name: 'RangeTrips',
    component: PlaceholderView,
    meta: { requiresAuth: true }
  },
  {
    path: '/range/targets',
    name: 'RangeTargets',
    component: PlaceholderView,
    meta: { requiresAuth: true }
  },
  {
    path: '/range/training',
    name: 'RangeTraining',
    component: PlaceholderView,
    meta: { requiresAuth: true }
  },
  {
    path: '/vaults/locations',
    name: 'VaultsLocations',
    component: PlaceholderView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  if (store.loading) {
    await store.checkAuth()
  }

  if (to.meta.requiresAuth && !store.isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.meta.requiresGuest && store.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
