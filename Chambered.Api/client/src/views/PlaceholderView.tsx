import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './PlaceholderView.css'

export default function PlaceholderView() {
  const location = useLocation()

  const details = useMemo(() => {
    const path = location.pathname
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
  }, [location.pathname])

  return (
    <div className="placeholder-view">
      <div className="coming-soon-card">
        <h2 className="coming-soon-title">{details.title}</h2>
        <p className="coming-soon-subtitle">Under Construction</p>
        
        <div className="divider-line"></div>
        
        <div className="coming-soon-details">
          <p>This section is a part of the premium <strong>Chambered</strong> suite expansion.</p>
          <p>Our development team is actively engineering this module to include fully integrated, data logging, custom reporting, and real-time synchronizations.</p>
        </div>
        
        <div className="interactive-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <span className="progress-text">Planned Module — Status: In Development Queue</span>
        </div>

        <Link to="/" className="btn btn-primary back-home-btn">
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
