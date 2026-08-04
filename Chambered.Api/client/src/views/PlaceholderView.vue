<template>
  <div class="placeholder-view">
    <div class="coming-soon-card">
      <h2 class="coming-soon-title">{{ title }}</h2>
      <p class="coming-soon-subtitle">Under Construction</p>
      
      <div class="divider-line"></div>
      
      <div class="coming-soon-details">
        <p>This section is a part of the premium <strong>Chambered</strong> suite expansion.</p>
        <p>Our development team is actively engineering this module to include fully integrated, data logging, custom reporting, and real-time synchronizations.</p>
      </div>
      
      <div class="interactive-progress">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <span class="progress-text">Planned Module — Status: In Development Queue</span>
      </div>

      <router-link to="/" class="btn btn-primary back-home-btn">
        Return to Dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const details = computed(() => {
  const path = route.path
  if (path.includes('/bench/load-data')) {
    return { title: 'Chambered Bench: Load Data', icon: '' }
  } else if (path.includes('/bench/components')) {
    return { title: 'Chambered Bench: Components', icon: '' }
  } else if (path.includes('/range/trips')) {
    return { title: 'Chambered Range: Trips', icon: '' }
  } else if (path.includes('/range/targets')) {
    return { title: 'Chambered Range: Targets', icon: '' }
  } else if (path.includes('/range/training')) {
    return { title: 'Chambered Range: Training', icon: '' }
  } else if (path.includes('/vaults/locations')) {
    return { title: 'Chambered Vaults: Locations', icon: '' }
  }
  return { title: 'Chambered Expansion Module', icon: '' }
})

const title = computed(() => details.value.title)
const icon = computed(() => details.value.icon)
</script>

<style scoped>
.placeholder-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.coming-soon-card {
  width: 100%;
  max-width: 580px;
  background: var(--bg-panel);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 40px;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.coming-soon-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float-anim 3s ease-in-out infinite;
}

.coming-soon-title {
  font-family: var(--font-heading);
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

.coming-soon-subtitle {
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 24px;
}

.divider-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-solid), transparent);
  margin-bottom: 24px;
}

.coming-soon-details {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.interactive-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-solid);
  margin-bottom: 32px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-input);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  width: 35%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #ffd700);
  border-radius: 3px;
  animation: loading-bar-anim 1.5s ease-in-out infinite alternate;
}

.progress-text {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.back-home-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

@keyframes float-anim {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes loading-bar-anim {
  0% { width: 10%; margin-left: 0; }
  100% { width: 50%; margin-left: 50%; }
}
</style>
