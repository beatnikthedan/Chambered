import React, { useState, useEffect, useMemo } from 'react'
import { useStore } from '../StoreContext'
import './Dashboard.css'

interface CaliberBreakdownItem {
  caliber: string;
  count: number;
}

interface ArmoryActionBreakdownItem {
  actionType: string;
  count: number;
}

interface RecentActivityItem {
  title: string;
  description: string;
  date: string;
}

interface DashboardStats {
  totalArmoryItems: number;
  totalRounds: number;
  handloadedRounds: number;
  factoryRounds: number;
  totalArmoryValue: number;
  cumulativeRoundsFired: number;
  caliberBreakdown?: CaliberBreakdownItem[];
  armoryActionBreakdown?: ArmoryActionBreakdownItem[];
  recentActivities?: RecentActivityItem[];
}

export default function Dashboard() {
  const store = useStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const maxCaliberCount = useMemo(() => {
    if (!stats || !stats.caliberBreakdown || !stats.caliberBreakdown.length) return 1
    return Math.max(...stats.caliberBreakdown.map(c => c.count))
  }, [stats])

  const calculateBarWidth = (count: number, max: number) => {
    if (max === 0) return 0
    const pct = count / max
    return Math.max(10, Math.floor(pct * 270)) // max width 270px in our SVG viewbox
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const url = store.activeArsenalId 
        ? `/api/dashboard?arsenalId=${store.activeArsenalId}` 
        : '/api/dashboard'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        setError(`Server returned code ${res.status}`)
      }
    } catch (err: any) {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [store.activeArsenalId])

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Consulting inventory logs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="error-msg">Failed to load dashboard metrics. {error}</p>
        <button onClick={fetchStats} className="btn btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="dashboard-view">
      {stats && (
        <div className="dashboard-content">
          {/* 1. Stats Grid Cards */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <h3 className="stat-label">Armory Vault</h3>
                <p className="stat-value">{stats.totalArmoryItems}</p>
                <span className="stat-subtext">Active operational units</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <h3 className="stat-label">Ammunition Cache</h3>
                <p className="stat-value">{formatNumber(stats.totalRounds)}</p>
                <span className="stat-subtext">
                  {formatNumber(stats.handloadedRounds)} handloads / {formatNumber(stats.factoryRounds)} factory
                </span>
              </div>
            </div>

            <div className="stat-card gold-border">
              <div className="stat-info">
                <h3 className="stat-label">Arsenal Valuation</h3>
                <p className="stat-value gold-text">${formatCurrency(stats.totalArmoryValue)}</p>
                <span className="stat-subtext">Estimated net worth</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <h3 className="stat-label">Total Rounds Logged</h3>
                <p className="stat-value">{formatNumber(stats.cumulativeRoundsFired)}</p>
                <span className="stat-subtext">Cumulative operational cycles</span>
              </div>
            </div>
          </section>

          {/* 2. Breakdown Visualizations */}
          <section className="breakdowns-section">
            {/* Caliber Distribution Chart */}
            <div className="panel chart-panel">
              <h3 className="panel-title">Ammunition Stocks by Caliber</h3>
              {stats.caliberBreakdown && stats.caliberBreakdown.length > 0 ? (
                <div className="chart-container">
                  {/* Inline SVG Custom Bar Chart */}
                  <svg className="bar-chart" viewBox="0 0 400 240">
                    {stats.caliberBreakdown.map((item, idx) => (
                      <g key={item.caliber}>
                        {/* Bar label */}
                        <text x="10" y={30 + idx * 45} className="chart-text label-text">{item.caliber}</text>
                        {/* Bar value count */}
                        <text x="390" y={30 + idx * 45} className="chart-text value-text" textAnchor="end">
                          {formatNumber(item.count)} rds
                        </text>
                        {/* Background track */}
                        <rect x="110" y={18 + idx * 45} width="270" height="12" rx="6" className="chart-bar-bg" />
                        {/* Filled bar progress */}
                        <rect 
                          x="110" 
                          y={18 + idx * 45} 
                          width={calculateBarWidth(item.count, maxCaliberCount)} 
                          height="12" 
                          rx="6" 
                          className="chart-bar-fill" 
                        />
                      </g>
                    ))}
                  </svg>
                </div>
              ) : (
                <div className="empty-chart">
                  <p>No ammunition inventory on record.</p>
                </div>
              )}
            </div>

            {/* Armory Action Breakdown */}
            <div className="panel chart-panel">
              <h3 className="panel-title">Armory Action Distribution</h3>
              {stats.armoryActionBreakdown && stats.armoryActionBreakdown.length > 0 ? (
                <div className="chart-container">
                  <svg className="donut-chart" viewBox="0 0 200 200">
                    {/* Radial ring slices */}
                    <circle cx="100" cy="100" r="70" className="donut-bg" />
                  </svg>
                  <div className="action-legend">
                    {stats.armoryActionBreakdown.map((item) => (
                      <div key={item.actionType} className="legend-item">
                        <span className="legend-dot"></span>
                        <span className="legend-name">{item.actionType}</span>
                        <span className="legend-count">({item.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-chart">
                  <p>No armory items in local database.</p>
                </div>
              )}
            </div>
          </section>

          {/* 3. Recent Cache Activities */}
          <section className="panel activity-panel">
            <h3 className="panel-title">Recent Inventory Operations</h3>
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="activity-list">
                {stats.recentActivities.map((act, idx) => (
                  <div key={idx} className="activity-row">
                    <div className="activity-bullet"></div>
                    <div className="activity-info">
                      <h4 className="activity-title">{act.title}</h4>
                      <p className="activity-desc">{act.description}</p>
                    </div>
                    <div className="activity-date">{formatDate(act.date)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-activity">No recent inventory changes recorded.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
