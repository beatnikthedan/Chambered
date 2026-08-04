<template>
  <div class="dashboard-view">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Consulting inventory logs...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-msg">Failed to load dashboard metrics. {{ error }}</p>
      <button @click="fetchStats" class="btn btn-primary">Retry</button>
    </div>

    <div v-else class="dashboard-content">
      <!-- 1. Stats Grid Cards -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <h3 class="stat-label">Armory Vault</h3>
            <p class="stat-value">{{ stats.totalArmoryItems }}</p>
            <span class="stat-subtext">Active operational units</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <h3 class="stat-label">Ammunition Cache</h3>
            <p class="stat-value">{{ formatNumber(stats.totalRounds) }}</p>
            <span class="stat-subtext">{{ formatNumber(stats.handloadedRounds) }} handloads / {{ formatNumber(stats.factoryRounds) }} factory</span>
          </div>
        </div>

        <div class="stat-card gold-border">
          <div class="stat-info">
            <h3 class="stat-label">Arsenal Valuation</h3>
            <p class="stat-value gold-text">${{ formatCurrency(stats.totalArmoryValue) }}</p>
            <span class="stat-subtext">Estimated net worth</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <h3 class="stat-label">Total Rounds Logged</h3>
            <p class="stat-value">{{ formatNumber(stats.cumulativeRoundsFired) }}</p>
            <span class="stat-subtext">Cumulative operational cycles</span>
          </div>
        </div>
      </section>

      <!-- 2. Breakdown Visualizations -->
      <section class="breakdowns-section">
        <!-- Caliber Distribution Chart -->
        <div class="panel chart-panel">
          <h3 class="panel-title">Ammunition Stocks by Caliber</h3>
          <div class="chart-container" v-if="stats.caliberBreakdown && stats.caliberBreakdown.length">
            <!-- Inline SVG Custom Bar Chart -->
            <svg class="bar-chart" viewBox="0 0 400 240">
              <g v-for="(item, idx) in stats.caliberBreakdown" :key="item.caliber">
                <!-- Bar label -->
                <text x="10" :y="30 + idx * 45" class="chart-text label-text">{{ item.caliber }}</text>
                <!-- Bar value count -->
                <text x="390" :y="30 + idx * 45" class="chart-text value-text" text-anchor="end">{{ formatNumber(item.count) }} rds</text>
                <!-- Background track -->
                <rect x="110" :y="18 + idx * 45" width="270" height="12" rx="6" class="chart-bar-bg" />
                <!-- Filled bar progress -->
                <rect 
                  x="110" 
                  :y="18 + idx * 45" 
                  :width="calculateBarWidth(item.count, maxCaliberCount)" 
                  height="12" 
                  rx="6" 
                  class="chart-bar-fill" 
                />
              </g>
            </svg>
          </div>
          <div v-else class="empty-chart">
            <p>No ammunition inventory on record.</p>
          </div>
        </div>

        <!-- Armory Action Breakdown -->
        <div class="panel chart-panel">
          <h3 class="panel-title">Armory Action Distribution</h3>
          <div class="chart-container" v-if="stats.armoryActionBreakdown && stats.armoryActionBreakdown.length">
            <svg class="donut-chart" viewBox="0 0 200 200">
              <!-- Radial ring slices -->
              <circle cx="100" cy="100" r="70" class="donut-bg" />
              <!-- Render legend underneath or right side -->
            </svg>
            <div class="action-legend">
              <div v-for="item in stats.armoryActionBreakdown" :key="item.actionType" class="legend-item">
                <span class="legend-dot"></span>
                <span class="legend-name">{{ item.actionType }}</span>
                <span class="legend-count">({{ item.count }})</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-chart">
            <p>No armory items in local database.</p>
          </div>
        </div>
      </section>

      <!-- 3. Recent Cache Activities -->
      <section class="panel activity-panel">
        <h3 class="panel-title">Recent Inventory Operations</h3>
        <div class="activity-list" v-if="stats.recentActivities && stats.recentActivities.length">
          <div v-for="(act, idx) in stats.recentActivities" :key="idx" class="activity-row">
            <div class="activity-bullet"></div>
            <div class="activity-info">
              <h4 class="activity-title">{{ act.title }}</h4>
              <p class="activity-desc">{{ act.description }}</p>
            </div>
            <div class="activity-date">{{ formatDate(act.date) }}</div>
          </div>
        </div>
        <p v-else class="empty-activity">No recent inventory changes recorded.</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { store } from '../store'

const stats = ref(null)
const loading = ref(true)
const error = ref('')

const maxCaliberCount = computed(() => {
  if (!stats.value || !stats.value.caliberBreakdown || !stats.value.caliberBreakdown.length) return 1
  return Math.max(...stats.value.caliberBreakdown.map(c => c.count))
})

const calculateBarWidth = (count, max) => {
  if (max === 0) return 0
  const pct = count / max
  return Math.max(10, Math.floor(pct * 270)) // max width 270px in our SVG viewbox
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchStats = async () => {
  loading.value = true
  error.value = ''
  try {
    const url = store.activeArsenalId 
      ? `/api/dashboard?arsenalId=${store.activeArsenalId}` 
      : '/api/dashboard'
    const res = await fetch(url)
    if (res.ok) {
      stats.value = await res.json()
    } else {
      error.value = `Server returned code ${res.status}`
    }
  } catch (err) {
    error.value = 'Network error.'
  } finally {
    loading.value = false
  }
}

watch(() => store.activeArsenalId, () => {
  fetchStats()
})

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  color: var(--text-secondary);
}

.error-msg {
  color: var(--color-danger);
  font-weight: 500;
}

/* Stats Cards styling */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: var(--transition-normal);
}
.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-glow);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.gold-border {
  border-color: rgba(204, 164, 59, 0.35);
  box-shadow: 0 4px 20px rgba(204, 164, 59, 0.05);
}
.gold-border:hover {
  border-color: var(--color-primary);
}

.stat-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-solid);
}

.gold-text {
  color: var(--color-primary);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
}

.stat-subtext {
  font-size: 11px;
  color: var(--text-muted);
}

/* Breakdowns section styling */
.breakdowns-section {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 24px;
}

@media (max-width: 960px) {
  .breakdowns-section {
    grid-template-columns: 1fr;
  }
}

.chart-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-title {
  font-size: 16px;
  font-family: var(--font-heading);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 12px;
  letter-spacing: 0.02em;
}

.chart-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Custom SVG Bar Chart */
.bar-chart {
  width: 100%;
  height: auto;
}

.chart-text {
  fill: var(--text-primary);
  font-family: var(--font-body);
  font-size: 11px;
}

.label-text {
  font-weight: 600;
  fill: var(--text-secondary);
}

.value-text {
  font-weight: 500;
  fill: var(--color-primary);
}

.chart-bar-bg {
  fill: var(--bg-input);
}

.chart-bar-fill {
  fill: var(--color-primary);
  filter: drop-shadow(0 0 2px rgba(204, 164, 59, 0.4));
}

/* Donut Chart and legend */
.donut-chart {
  max-width: 120px;
  margin: 0 auto;
}

.donut-bg {
  fill: none;
  stroke: var(--bg-input);
  stroke-width: 16;
}

.action-legend {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 8px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.legend-name {
  color: var(--text-secondary);
  font-weight: 500;
  flex-grow: 1;
}

.legend-count {
  color: var(--color-primary);
  font-weight: 600;
}

.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: var(--text-muted);
  font-size: 13px;
}

/* Activity logs */
.activity-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  gap: 16px;
}

.activity-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 6px var(--color-primary);
  flex-shrink: 0;
}

.activity-info {
  flex-grow: 1;
}

.activity-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.activity-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.activity-date {
  font-size: 11px;
  color: var(--text-muted);
}

.empty-activity {
  color: var(--text-muted);
  font-size: 13px;
  padding: 24px;
  text-align: center;
}
</style>
