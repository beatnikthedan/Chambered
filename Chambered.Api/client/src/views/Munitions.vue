<template>
  <div class="munitions-view">
    <!-- Filter bar -->
    <div class="filter-bar panel">
      <div class="search-inputs">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search lots, brands, specifications..." 
          class="search-input"
        />
        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option value="factory">Factory Ammo</option>
          <option value="handload">Custom Handloads</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        Log Ammunition Lot
      </button>
    </div>

    <!-- Main View Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Opening ammunition bunker...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-msg">Failed to load munitions inventory. {{ error }}</p>
      <button @click="fetchMunitions" class="btn btn-primary">Retry</button>
    </div>

    <div v-else-if="filteredLots.length === 0" class="empty-state panel">
      <p>No ammunition lots found matching active search parameters.</p>
      <button class="btn btn-primary" style="margin-top:12px;" @click="openCreateModal">Log First Ammo Lot</button>
    </div>

    <!-- Lots List Cards -->
    <div v-else class="lots-list">
      <div v-for="lot in filteredLots" :key="lot.id" class="lot-card" :class="{ 'handload-lot': !lot.factoryAmmoId }">
        <div class="lot-side-color"></div>
        <div class="lot-content">
          <!-- Lot Main Header -->
          <div class="lot-header">
            <div class="lot-title-grp">
              <span class="lot-type-tag badge" :class="lot.factoryAmmoId ? 'badge-success' : 'badge-warning'">
                {{ lot.factoryAmmoId ? 'Factory' : 'Handload' }}
              </span>
              <h3 class="lot-title">
                {{ lot.factoryAmmoId ? lot.factoryAmmo?.manufacturer?.name + ' ' + lot.factoryAmmo?.sku : 'Custom ' + lot.cartridge?.name }}
              </h3>
            </div>
            <div class="lot-stock-adjust">
              <button class="btn btn-secondary adjust-btn" @click="adjustStock(lot.id, -20)" title="Quick subtract 20 rounds">-20</button>
              <span class="lot-qty text-mono">{{ lot.quantity }} <span class="qty-unit">rds</span></span>
              <button class="btn btn-secondary adjust-btn" @click="adjustStock(lot.id, 20)" title="Quick add 20 rounds">+20</button>
            </div>
          </div>

          <!-- Specifications Grid -->
          <div class="lot-specs">
            <div class="spec-col">
              <span class="spec-label">Caliber / Cartridge</span>
              <span class="spec-value">{{ lot.cartridge?.name }}</span>
            </div>
            <div class="spec-col" v-if="lot.lotNumber">
              <span class="spec-label">Lot Identifier</span>
              <span class="spec-value text-mono highlight-val">{{ lot.lotNumber }}</span>
            </div>
            
            <!-- Factory specifics -->
            <template v-if="lot.factoryAmmoId">
              <div class="spec-col" v-if="lot.factoryAmmo?.projectile">
                <span class="spec-label">Projectile Bullet</span>
                <span class="spec-value">{{ lot.factoryAmmo.projectile.weightGrains }}gr {{ lot.factoryAmmo.projectile.name }}</span>
              </div>
              <div class="spec-col" v-if="lot.factoryAmmo?.upc">
                <span class="spec-label">UPC Barcode</span>
                <span class="spec-value text-mono">{{ lot.factoryAmmo.upc }}</span>
              </div>
            </template>

            <!-- Handload specifics -->
            <template v-else>
              <div class="spec-col" v-if="lot.projectile">
                <span class="spec-label">Reload Bullet</span>
                <span class="spec-value">{{ lot.projectile.weightGrains }}gr {{ lot.projectile.name }}</span>
              </div>
              <div class="spec-col" v-if="lot.powder">
                <span class="spec-label">Powder / Charge</span>
                <span class="spec-value">{{ lot.powderChargeGrains }}gr {{ lot.powder.manufacturer }} {{ lot.powder.name }}</span>
              </div>
              <div class="spec-col" v-if="lot.cartridgeOverallLength">
                <span class="spec-label">COAL (Length)</span>
                <span class="spec-value text-mono">{{ lot.cartridgeOverallLength }}"</span>
              </div>
            </template>
          </div>

          <!-- Footer/Notes row -->
          <div class="lot-footer">
            <span class="lot-date">Logged: {{ formatDate(lot.dateLoaded) }}</span>
            <span class="lot-notes" v-if="lot.notes">{{ lot.notes }}</span>
            <div class="lot-actions">
              <button class="btn btn-secondary btn-mini" @click="openEditModal(lot)">Edit</button>
              <button class="btn btn-danger btn-mini" @click="handleDelete(lot.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit ABS Center Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="abs-center-modal">
        <div class="modal-title-bar">
          <div class="title-left">
            <h3>{{ isEditMode ? 'Modify Ammunition Lot' : 'Log Ammunition Lot' }}</h3>
          </div>
          <button class="modal-close-x-btn" @click="closeModal">×</button>
        </div>

        <!-- Horizontal Tabs Header Row -->
        <div class="modal-tabs-header-row">
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'general' }" 
            @click="activeTab = 'general'"
          >
            General
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'ballistics' }" 
            @click="activeTab = 'ballistics'"
            v-if="lotClass === 'handload'"
          >
            Ballistics
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            :class="{ active: activeTab === 'notes' }" 
            @click="activeTab = 'notes'"
          >
            Notes
          </button>
        </div>

        <form @submit.prevent="saveLot" style="display: flex; flex-direction: column; flex-grow: 1; overflow: hidden;">
          <div class="modal-tabs-body-content">
            <!-- General Tab -->
            <div v-show="activeTab === 'general'" class="tab-pane">
              <div class="form-group" v-if="!isEditMode">
                <label>Lot Classification</label>
                <div class="toggle-switch">
                  <button 
                    type="button" 
                    class="switch-option" 
                    :class="{ active: lotClass === 'factory' }" 
                    @click="lotClass = 'factory'"
                  >
                    Factory Purchased Box
                  </button>
                  <button 
                    type="button" 
                    class="switch-option" 
                    :class="{ active: lotClass === 'handload' }" 
                    @click="lotClass = 'handload'"
                  >
                    Custom Handload Batch
                  </button>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Caliber / Cartridge *</label>
                  <select v-model="form.cartridgeId" @change="onCartridgeChange" required>
                    <option :value="0">Select Caliber</option>
                    <option v-for="c in cartridges" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>

                <!-- Factory Catalog Selector -->
                <div class="form-group full-width" v-if="lotClass === 'factory'">
                  <label>Commercial Product Link</label>
                  <select v-model="form.factoryAmmoId">
                    <option :value="null">-- Generic Box Stock (Unlisted) --</option>
                    <option v-for="f in filteredFactoryAmmo" :key="f.id" :value="f.id">
                      [{{ f.manufacturer?.name }}] {{ f.sku }} - {{ f.projectile?.weightGrains }}gr {{ f.projectile?.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Starting Quantity *</label>
                  <input type="number" v-model="form.quantity" placeholder="0 rds" required />
                </div>
                <div class="form-group">
                  <label>Lot / Batch Number</label>
                  <input type="text" v-model="form.lotNumber" placeholder="Lot identifier tag" />
                </div>
              </div>
            </div>

            <!-- Ballistics Tab (Only visible if Custom Handload is selected) -->
            <div v-show="activeTab === 'ballistics'" class="tab-pane" v-if="lotClass === 'handload'">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Reloading Projectile (Bullet)</label>
                  <select v-model="form.projectileId">
                    <option :value="null">-- None selected --</option>
                    <option v-for="p in projectiles" :key="p.id" :value="p.id">
                      [{{ p.manufacturer?.name }}] {{ p.weightGrains }}gr {{ p.name }} ({{ p.diameterInches }}")
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Powder Selection</label>
                  <select v-model="form.powderId">
                    <option :value="null">-- None selected --</option>
                    <option v-for="pw in powders" :key="pw.id" :value="pw.id">
                      {{ pw.manufacturer }} - {{ pw.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Charge Weight (Grains)</label>
                  <input type="number" step="0.01" v-model="form.powderChargeGrains" placeholder="e.g. 43.5" />
                </div>
                <div class="form-group">
                  <label>Overall Length (COAL)</label>
                  <input type="number" step="0.001" v-model="form.cartridgeOverallLength" placeholder="e.g. 2.800" />
                </div>
              </div>
            </div>

            <!-- Notes Tab -->
            <div v-show="activeTab === 'notes'" class="tab-pane">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Logging / Loading Date</label>
                  <input type="datetime-local" v-model="formDateFormatted" />
                </div>
                <div class="form-group full-width">
                  <label>Log Notes</label>
                  <textarea v-model="form.notes" rows="4" placeholder="e.g. Grouping tests, chrono averages..."></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="drawer-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Log Lot') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { store } from '../store'

const route = useRoute()

const lots = ref([])
const loading = ref(true)
const error = ref('')
const isSaving = ref(false)

// Selectors catalogues
const cartridges = ref([])
const projectiles = ref([])
const powders = ref([])
const factoryAmmoCatalog = ref([])

// Filtering
const searchQuery = ref('')
const filterType = ref('')

// Modal controls
const isEditMode = ref(false)
const lotClass = ref('factory') // 'factory' or 'handload'
const formDateFormatted = ref('')
const activeTab = ref('general')
const form = ref({
  id: 0,
  cartridgeId: 0,
  projectileId: null,
  powderId: null,
  powderChargeGrains: null,
  cartridgeOverallLength: null,
  factoryAmmoId: null,
  quantity: 0,
  lotNumber: '',
  dateLoaded: '',
  notes: ''
})

const filteredLots = computed(() => {
  return lots.value.filter(lot => {
    const textMatch = !searchQuery.value ||
      [lot.lotNumber, lot.notes, lot.cartridge?.name, lot.factoryAmmo?.sku]
        .some(v => v && v.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const typeMatch = !filterType.value ||
      (filterType.value === 'factory' && lot.factoryAmmoId !== null) ||
      (filterType.value === 'handload' && lot.factoryAmmoId === null)

    return textMatch && typeMatch
  })
})

const filteredFactoryAmmo = computed(() => {
  if (form.value.cartridgeId === 0) return factoryAmmoCatalog.value
  return factoryAmmoCatalog.value.filter(f => f.cartridgeId === form.value.cartridgeId)
})

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const onCartridgeChange = () => {
  // Clear details on caliber shift to maintain integrity
  form.value.factoryAmmoId = null
}

const fetchMunitions = async () => {
  loading.value = true
  error.value = ''
  try {
    const url = store.activeArsenalId 
      ? `/api/munitions?arsenalId=${store.activeArsenalId}` 
      : '/api/munitions'
    const [lotsRes, cRes, pRes, pwRes, fRes] = await Promise.all([
      fetch(url),
      fetch('/api/munitions/cartridges'),
      fetch('/api/munitions/projectiles'),
      fetch('/api/munitions/powders'),
      fetch('/api/munitions/factory-ammo')
    ])

    if (lotsRes.ok) lots.value = await lotsRes.json()
    if (cRes.ok) cartridges.value = await cRes.json()
    if (pRes.ok) projectiles.value = await pRes.json()
    if (pwRes.ok) powders.value = await pwRes.json()
    if (fRes.ok) factoryAmmoCatalog.value = await fRes.json()
  } catch (err) {
    error.value = 'Network fetch issue.'
  } finally {
    loading.value = false
  }
}

const adjustStock = async (id, delta) => {
  try {
    const res = await fetch(`/api/munitions/${id}/adjust-quantity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    })
    if (res.ok) {
      const data = await res.json()
      const lot = lots.value.find(l => l.id === id)
      if (lot) {
        lot.quantity = data.quantity
      }
    }
  } catch (err) {
    console.error('Adjust stock failed', err)
  }
}

const openCreateModal = () => {
  isEditMode.value = false
  lotClass.value = 'factory'
  activeTab.value = 'general'
  
  // Localized string formatting for datetime-local
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  formDateFormatted.value = now.toISOString().slice(0, 16)

  form.value = {
    id: 0,
    cartridgeId: cartridges.value.length ? cartridges.value[0].id : 0,
    projectileId: null,
    powderId: null,
    powderChargeGrains: null,
    cartridgeOverallLength: null,
    factoryAmmoId: null,
    quantity: 100,
    lotNumber: '',
    dateLoaded: '',
    notes: ''
  }
  showModal.value = true
}

const openEditModal = (lot) => {
  isEditMode.value = true
  lotClass.value = lot.factoryAmmoId ? 'factory' : 'handload'
  activeTab.value = 'general'
  
  const d = new Date(lot.dateLoaded)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  formDateFormatted.value = d.toISOString().slice(0, 16)

  form.value = { ...lot }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveLot = async () => {
  isSaving.value = true
  form.value.dateLoaded = new Date(formDateFormatted.value).toISOString()
  
  // Clear unrelated specifications depending on selected lot class
  if (lotClass.value === 'factory') {
    form.value.projectileId = null
    form.value.powderId = null
    form.value.powderChargeGrains = null
    form.value.cartridgeOverallLength = null
  } else {
    form.value.factoryAmmoId = null
  }

  // Assign the active arsenal collection ID
  form.value.arsenalId = store.activeArsenalId

  try {
    const url = isEditMode.value ? `/api/munitions/${form.value.id}` : '/api/munitions'
    const method = isEditMode.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (res.ok) {
      await fetchMunitions()
      closeModal()
    } else {
      alert('Save inventory lot failed.')
    }
  } catch (err) {
    console.error(err)
  } finally {
    isSaving.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('Remove this ammunition lot from inventory records? This is permanent.')) return
  try {
    const res = await fetch(`/api/munitions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      lots.value = lots.value.filter(l => l.id !== id)
    }
  } catch (err) {
    console.error(err)
  }
}

watch(() => store.activeArsenalId, () => {
  fetchMunitions()
})

watch(lotClass, (newClass) => {
  if (newClass === 'factory' && activeTab.value === 'ballistics') {
    activeTab.value = 'general'
  }
})

watch(() => route.query.type, (newType) => {
  if (newType === 'factory' || newType === 'handload') {
    filterType.value = newType
  } else {
    filterType.value = ''
  }
}, { immediate: true })

onMounted(() => {
  fetchMunitions()
})
</script>

<style scoped>
.munitions-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-inputs {
  display: flex;
  gap: 12px;
  flex-grow: 1;
  max-width: 800px;
}

.search-input {
  flex-grow: 2;
}

.filter-select {
  flex-grow: 1;
  max-width: 180px;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: var(--text-secondary);
}

.lots-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lot-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  transition: var(--transition-normal);
}

.lot-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-glow);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.lot-side-color {
  width: 6px;
  background-color: var(--color-success); /* Factory green side highlight */
  flex-shrink: 0;
}

.handload-lot .lot-side-color {
  background-color: var(--color-primary); /* Handload brass/gold side highlight */
}

.lot-content {
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.lot-title-grp {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lot-title {
  font-size: 16px;
  font-family: var(--font-heading);
  color: var(--text-primary);
  font-weight: 700;
}

.lot-stock-adjust {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  padding: 4px;
  gap: 8px;
}

.adjust-btn {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
}

.lot-qty {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 72px;
  text-align: center;
}

.qty-unit {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 400;
}

.lot-specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  padding: 14px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-solid);
}

.spec-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spec-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
}

.spec-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.highlight-val {
  color: var(--color-accent);
}

.lot-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
  flex-wrap: wrap;
  gap: 12px;
}

.lot-date {
  color: var(--text-muted);
}

.lot-notes {
  font-style: italic;
  flex-grow: 1;
  margin: 0 16px;
}

.lot-actions {
  display: flex;
  gap: 8px;
}

.btn-mini {
  padding: 4px 10px;
  font-size: 11px;
}

/* Slide Drawer Toggle Switches */
.toggle-switch {
  display: flex;
  background: var(--bg-input);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-sm);
  padding: 3px;
  margin-top: 6px;
}

.switch-option {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: var(--transition-fast);
}

.switch-option.active {
  background: var(--color-primary);
  color: var(--bg-main);
}

/* Audiobookshelf Exact Center Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Identical Audiobookshelf dimensions & style rules */
.abs-center-modal {
  width: 680px;
  max-width: 95vw;
  height: 520px;
  max-height: 92vh;
  background-color: var(--bg-modal);
  border: 1px solid var(--border-solid);
  border-radius: var(--radius-lg);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalScaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-title-bar {
  height: 60px;
  border-bottom: 1px solid var(--border-solid);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title-bar h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-heading);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.modal-close-x-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
}

.modal-close-x-btn:hover {
  color: var(--color-danger);
}

/* Horizontal Tabs Row matching ABS styling */
.modal-tabs-header-row {
  display: flex;
  background-color: #17181f; /* Deeper segment for tabs strip */
  border-bottom: 1px solid var(--border-solid);
  padding: 0 16px;
  flex-shrink: 0;
  overflow-x: auto;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 14px 18px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: var(--transition-fast);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--color-primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--color-primary);
}

/* Strict fixed-height body content window to prevent modal jumps */
.modal-tabs-body-content {
  flex-grow: 1;
  height: 340px;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--bg-modal);
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}
</style>
