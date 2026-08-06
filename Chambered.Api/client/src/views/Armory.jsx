import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useStore } from '../StoreContext'
import './Armory.css'

// Preset lists matching original Vue code
const manufacturerPresets = [
  "Glock", "Ruger", "Smith & Wesson", "Sig Sauer", "Springfield Armory", 
  "Colt", "Winchester", "Remington", "Beretta", "Taurus", "CZ", 
  "Browning", "Savage Arms", "Walther", "Henry Repeating Arms"
]

const modelPresets = {
  "Glock": ["19 Gen 5", "17 Gen 5", "43X", "34 Gen 5", "20 Gen 5"],
  "Ruger": ["10/22", "Mark IV", "LCP MAX", "American Rifle", "GP100"],
  "Smith & Wesson": ["M&P 9 Shield Plus", "Model 686", "M&P 15-22", "Model 29"],
  "Sig Sauer": ["P320", "P365", "M17", "P226", "MCX Virtus"],
  "Springfield Armory": ["Hellcat", "Echelon", "M1A", "110 Mil-Spec"],
  "Colt": ["Python", "M4 Carbine", "1911 Gold Cup", "Anaconda"],
  "Winchester": ["Model 1894", "Model 70", "SXP Defender"],
  "Remington": ["Model 870", "Model 700"],
  "Beretta": ["M9A4", "92FS", "A300 Patrol", "APX A1"],
  "Taurus": ["G3c", "Judge", "TX22", "Model 856"],
  "CZ": ["P-10 C", "75 B", "Shadow 2", "457 Training"],
  "Browning": ["BAR", "Citori", "Buck Mark"],
  "Savage Arms": ["Model 110", "A22"],
  "Walther": ["PDP", "PPQ", "PPK"],
  "Henry Repeating Arms": ["Golden Boy", "Big Boy Brass"],
  "Custom": ["Other Model..."]
}

const caliberPresets = [
  "9mm Luger", ".22 LR", ".45 ACP", ".357 Magnum", ".38 Special", 
  ".223 Remington", "5.56x45mm NATO", ".308 Winchester", "7.62x39mm", 
  "12 Gauge", "20 Gauge", "6.5 Creedmoor", "300 AAC Blackout", "10mm Auto"
]

const actionTypePresets = [
  "Semi-Automatic", "Bolt Action", "Lever Action", "Revolver", "Break Action", "Pump Action", "Single Shot"
]

const conditionPresets = [
  "New / Unfired (100%)", "Excellent (98%)", "Very Good (95%)", "Good (90%)", "Fair (80%)", "Poor (60%)"
]

const attachmentCategoryPresets = [
  "Owner's Manual", "Purchase Receipt", "Target Sheet", "Warranty Certificate", "Schematic Diagram", "Other Document"
]

export default function Armory() {
  const store = useStore()

  // State lists
  const [armoryItems, setArmoryItems] = useState([])
  const [vaultLocations, setVaultLocations] = useState([])
  const [ammoLots, setAmmoLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter conditions
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCaliber, setFilterCaliber] = useState('')
  const [filterAction, setFilterAction] = useState('')

  // Modal control & edit mode state
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Form State
  const [form, setForm] = useState({
    id: 0,
    manufacturer: 'Glock',
    model: '19 Gen 5',
    caliber: '9mm Luger',
    barrelLengthInches: 4.02,
    twistRate: '1:10',
    actionType: 'Semi-Automatic',
    serialNumber: '',
    notes: '',
    purchasePrice: '',
    purchaseDateString: '',
    currentValue: '',
    condition: 'Good (90%)',
    imageUrl: '',
    roundCount: 0,
    beneficiary: '',
    storageLocation: 'Main Vault',
    notesMarkdown: '',
    opticManufacturer: '',
    opticModel: '',
    opticReticle: '',
    opticSerial: '',
    opticBattery: '',
    isOpticMounted: false
  })

  // Dynamic lists inside the modal
  const [customManufacturer, setCustomManufacturer] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [coverSourceType, setCoverSourceType] = useState('web')
  const [accessoriesList, setAccessoriesList] = useState([])
  const [maintenanceTasks, setMaintenanceTasks] = useState([])
  const [rangeSessions, setRangeSessions] = useState([])
  const [attachments, setAttachments] = useState([])
  const [activeAccordionId, setActiveAccordionId] = useState(null)

  // Maintenance Task inputs
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Clean')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskNotification, setNewTaskNotification] = useState(false)
  const [taskFilterStatus, setTaskFilterStatus] = useState('All')
  const [taskFilterCategory, setTaskFilterCategory] = useState('All')

  // Accessories inputs
  const [newAccessoryName, setNewAccessoryName] = useState('')

  // Ref for markdown toolbar manipulations
  const markdownTextareaRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load backend collections
  const fetchArmoryItems = async () => {
    setLoading(true)
    setError('')
    try {
      const url = store.activeArsenalId 
        ? `/api/armory?arsenalId=${store.activeArsenalId}` 
        : '/api/armory'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setArmoryItems(data)
      } else {
        setError(`Error loading: ${res.status}`)
      }
    } catch (err) {
      setError('Failed to fetch armory items.')
    } finally {
      setLoading(false)
    }
  }

  const fetchVaultLocations = async () => {
    try {
      const url = store.activeArsenalId 
        ? `/api/vaults/locations?arsenalId=${store.activeArsenalId}` 
        : '/api/vaults/locations'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setVaultLocations(data)
      }
    } catch (err) {
      console.error('Failed to load vault locations', err)
    }
  }

  const fetchAmmoLots = async () => {
    try {
      const res = await fetch('/api/settings/ammo-lots')
      if (res.ok) {
        setAmmoLots(await res.json())
      } else {
        const altRes = await fetch('/api/munitions')
        if (altRes.ok) {
          setAmmoLots(await altRes.json())
        }
      }
    } catch (err) {
      console.error('Ammo lots loading bypassed.', err)
    }
  }

  useEffect(() => {
    fetchArmoryItems()
    fetchVaultLocations()
    fetchAmmoLots()
  }, [store.activeArsenalId])

  // Computed / filtered helpers
  const uniqueCalibers = useMemo(() => {
    const cals = armoryItems.map(f => f.caliber).filter(Boolean)
    return [...new Set(cals)].sort()
  }, [armoryItems])

  const uniqueActions = useMemo(() => {
    const acts = armoryItems.map(f => f.actionType).filter(Boolean)
    return [...new Set(acts)].sort()
  }, [armoryItems])

  const filteredArmoryItems = useMemo(() => {
    return armoryItems.filter(gun => {
      const textMatch = !searchQuery || 
        [gun.manufacturer, gun.model, gun.serialNumber, gun.caliber]
          .some(v => v && v.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const caliberMatch = !filterCaliber || gun.caliber === filterCaliber
      const actionMatch = !filterAction || gun.actionType === filterAction

      return textMatch && caliberMatch && actionMatch
    })
  }, [armoryItems, searchQuery, filterCaliber, filterAction])

  const filteredAmmoLots = useMemo(() => {
    if (!form.caliber) return []
    return ammoLots.filter(lot => lot.caliber.toLowerCase() === form.caliber.toLowerCase())
  }, [ammoLots, form.caliber])

  const filteredTasks = useMemo(() => {
    return maintenanceTasks.filter(task => {
      const statusMatch = taskFilterStatus === 'All' || 
        (taskFilterStatus === 'Active' && !task.isCompleted) || 
        (taskFilterStatus === 'Completed' && task.isCompleted)

      const categoryMatch = taskFilterCategory === 'All' || task.category === taskFilterCategory
      return statusMatch && categoryMatch
    })
  }, [maintenanceTasks, taskFilterStatus, taskFilterCategory])

  // Event handlers
  const quickIncrementRounds = async (id, e) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/armory/${id}/increment-rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 50 })
      })
      if (res.ok) {
        const data = await res.json()
        setArmoryItems(prev => prev.map(gun => gun.id === id ? { ...gun, roundCount: data.roundCount } : gun))
      }
    } catch (err) {
      console.error('Increment rounds error', err)
    }
  }

  const openCreateModal = () => {
    setIsEditMode(false)
    setActiveTab('general')
    setCustomManufacturer('')
    setCustomModel('')
    setCoverSourceType('web')
    setAccessoriesList([])
    setMaintenanceTasks([])
    setRangeSessions([])
    setAttachments([
      { id: 101, filename: "Glock_19_Gen5_Manual.pdf", category: "Owner's Manual", size: "3.4 MB", dateAdded: "2026-08-01" },
      { id: 102, filename: "Glock_Promo_Flyer.png", category: "Other Document", size: "1.2 MB", dateAdded: "2026-08-01" }
    ])

    setForm({
      id: 0,
      manufacturer: 'Glock',
      model: '19 Gen 5',
      caliber: '9mm Luger',
      barrelLengthInches: 4.02,
      twistRate: '1:10',
      actionType: 'Semi-Automatic',
      serialNumber: '',
      notes: '',
      purchasePrice: '',
      purchaseDateString: '',
      currentValue: '',
      condition: 'Good (90%)',
      imageUrl: '',
      roundCount: 0,
      beneficiary: '',
      storageLocation: 'Main Vault',
      notesMarkdown: '',
      opticManufacturer: '',
      opticModel: '',
      opticReticle: '',
      opticSerial: '',
      opticBattery: '',
      isOpticMounted: false
    })
    setShowModal(true)
  }

  const openEditModal = (gun) => {
    setIsEditMode(true)
    setActiveTab('general')
    setCustomManufacturer('')
    setCustomModel('')
    setCoverSourceType('web')

    let dateString = ''
    if (gun.purchaseDate) {
      dateString = gun.purchaseDate.split('T')[0]
    }

    setForm({ 
      ...gun, 
      purchaseDateString: dateString,
      beneficiary: gun.beneficiary || '',
      storageLocation: gun.storageLocation || 'Main Vault',
      notesMarkdown: gun.notesMarkdown || '',
      opticManufacturer: gun.opticManufacturer || '',
      opticModel: gun.opticModel || '',
      opticReticle: gun.opticReticle || '',
      opticSerial: gun.opticSerial || '',
      opticBattery: gun.opticBattery || '',
      isOpticMounted: gun.isOpticMounted || false
    })

    try {
      setAccessoriesList(gun.accessoriesListJson ? JSON.parse(gun.accessoriesListJson) : [])
    } catch (err) {
      setAccessoriesList([])
    }

    try {
      setMaintenanceTasks(gun.maintenanceTasksJson ? JSON.parse(gun.maintenanceTasksJson) : [])
    } catch (err) {
      setMaintenanceTasks([])
    }

    try {
      setRangeSessions(gun.rangeHistoryJson ? JSON.parse(gun.rangeHistoryJson) : [])
    } catch (err) {
      setRangeSessions([])
    }

    setAttachments([
      { id: 101, filename: "Glock_19_Gen5_Manual.pdf", category: "Owner's Manual", size: "3.4 MB", dateAdded: "2026-08-01" },
      { id: 102, filename: "Glock_Promo_Flyer.png", category: "Other Document", size: "1.2 MB", dateAdded: "2026-08-01" }
    ])

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  // Model selection dependency helper
  const handleManufacturerChange = (e) => {
    const mfg = e.target.value
    setForm(prev => ({
      ...prev,
      manufacturer: mfg,
      model: modelPresets[mfg] ? modelPresets[mfg][0] : 'Custom'
    }))
  }

  // Sub-items lists management
  const addAccessoryItem = () => {
    const name = newAccessoryName.trim()
    if (!name) return
    if (!accessoriesList.includes(name)) {
      setAccessoriesList([...accessoriesList, name])
    }
    setNewAccessoryName('')
  }

  const removeAccessoryItem = (index) => {
    setAccessoriesList(prev => prev.filter((_, idx) => idx !== index))
  }

  const addMaintenanceTaskItem = () => {
    const desc = newTaskText.trim()
    if (!desc) return

    setMaintenanceTasks([...maintenanceTasks, {
      id: Date.now(),
      description: desc,
      category: newTaskCategory,
      dueDate: newTaskDueDate || null,
      enableNotifications: newTaskNotification,
      isCompleted: false
    }])

    setNewTaskText('')
    setNewTaskDueDate('')
    setNewTaskNotification(false)
  }

  const toggleTaskStatus = (id) => {
    setMaintenanceTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
  }

  const removeTaskItem = (id) => {
    setMaintenanceTasks(prev => prev.filter(t => t.id !== id))
  }

  const removeAttachmentFile = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  // Formatting Notes helpers
  const insertMarkdownTag = (syntax) => {
    const box = markdownTextareaRef.current
    if (!box) return

    const start = box.selectionStart
    const end = box.selectionEnd
    const origText = form.notesMarkdown || ''
    const selectedText = origText.substring(start, end)
    
    let result = ''
    if (syntax === '- ' || syntax === '> ') {
      result = origText.substring(0, start) + '\n' + syntax + selectedText + origText.substring(end)
    } else {
      result = origText.substring(0, start) + syntax + selectedText + syntax + origText.substring(end)
    }

    setForm(prev => ({ ...prev, notesMarkdown: result }))
    
    setTimeout(() => {
      box.focus()
      const offset = start + syntax.length
      box.setSelectionRange(offset, offset + selectedText.length)
    }, 50)
  }

  const renderMarkdown = (text) => {
    if (!text) return '<p style="color: var(--text-muted); font-style: italic;">No formatted logs created yet. Use formatting bar options above.</p>'
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>")

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(/__(.*?)__/g, '<u>$1</u>')
    html = html.replace(/^&gt;\s+(.*?)(?:<br>|$)/gm, '<blockquote style="border-left: 3px solid var(--color-primary); padding-left: 10px; margin: 6px 0; color: var(--text-secondary);">$1</blockquote>')
    html = html.replace(/^-\s+(.*?)(?:<br>|$)/gm, '<li style="margin-left: 18px; color: var(--text-primary);">$1</li>')
    html = html.replace(/`(.*?)`/g, '<code style="background-color: #17181f; padding: 2px 6px; border-radius: 4px; font-family: monospace; border: 1px solid var(--border-solid); color: #e5c158;">$1</code>')

    return html
  }

  // CRUD actions
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const url = isEditMode ? `/api/armory/${form.id}` : '/api/armory'
      const method = isEditMode ? 'PUT' : 'POST'
      
      let finalMfg = form.manufacturer
      if (finalMfg === 'Custom' && customManufacturer) {
        finalMfg = customManufacturer.trim()
      }
      
      let finalMod = form.model
      if (finalMod === 'Custom' && customModel) {
        finalMod = customModel.trim()
      }

      const payload = {
        ...form,
        manufacturer: finalMfg,
        model: finalMod,
        barrelLengthInches: parseFloat(form.barrelLengthInches) || 0,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
        currentValue: form.currentValue ? parseFloat(form.currentValue) : null,
        purchaseDate: form.purchaseDateString ? new Date(form.purchaseDateString).toISOString() : null,
        arsenalId: store.activeArsenalId,
        accessoriesListJson: JSON.stringify(accessoriesList),
        maintenanceTasksJson: JSON.stringify(maintenanceTasks),
        rangeHistoryJson: JSON.stringify(rangeSessions)
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        await fetchArmoryItems()
        closeModal()
      } else {
        const text = await res.text()
        alert(`Save failed: ${text || res.statusText}`)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to connect to the backend server.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you absolutely sure you want to delete this armory item from inventory? This action is permanent.')) return
    
    try {
      const res = await fetch(`/api/armory/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArmoryItems(prev => prev.filter(f => f.id !== id))
      } else {
        alert('Delete failed.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const isHandgun = (action) => {
    if (!action) return false
    const l = action.toLowerCase()
    return l.includes('pistol') || l.includes('revolver') || l.includes('handgun') || l.includes('semi-automatic')
  }

  const getConditionClass = (cond) => {
    if (!cond) return 'badge-success'
    const c = cond.toLowerCase()
    if (c.includes('unfired') || c.includes('excel') || c.includes('very')) return 'badge-success'
    if (c.includes('good') || c.includes('fair')) return 'badge-warning'
    return 'badge-danger'
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
  }

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
        <p className="error-msg">Failed to load armory inventory. {error}</p>
        <button onClick={fetchArmoryItems} className="btn btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="armory-view">
      {/* Search and Filters Bar */}
      <section className="filter-bar">
        <div className="search-inputs">
          <input 
            type="text" 
            placeholder="Search manufacturers, models, serial numbers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select 
            value={filterCaliber} 
            onChange={(e) => setFilterCaliber(e.target.value)}
            className="filter-select"
          >
            <option value="">All Calibers</option>
            {uniqueCalibers.map(cal => (
              <option key={cal} value={cal}>{cal}</option>
            ))}
          </select>
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            className="filter-select"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">Add Armory Unit</button>
      </section>

      {/* Grid Display */}
      {filteredArmoryItems.length === 0 ? (
        <div className="empty-state panel">
          <h3>No armory units registered in this collection.</h3>
          <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>Click Add Armory Unit above to log your first weapon.</p>
        </div>
      ) : (
        <section className="firearms-grid">
          {filteredArmoryItems.map((gun) => (
            <div key={gun.id} className="gun-card" onClick={() => openEditModal(gun)}>
              <div className="gun-header-img">
                <span className="gun-action-type">{gun.actionType}</span>
                {gun.imageUrl ? (
                  <img src={gun.imageUrl} className="active-cover-img" alt={gun.model} />
                ) : (
                  <div className="gun-silhouette">
                    {isHandgun(gun.actionType) ? '🔫' : '🔫'}
                  </div>
                )}
                <span className={`badge gun-badge-condition ${getConditionClass(gun.condition)}`}>
                  {gun.condition}
                </span>
              </div>

              <div className="gun-card-body">
                <div className="gun-title-row">
                  <h4 className="gun-title">{gun.manufacturer} {gun.model}</h4>
                  <span className="gun-caliber">{gun.caliber}</span>
                </div>

                <div className="gun-details">
                  <div className="detail-row">
                    <span className="detail-label">Storage Hub</span>
                    <span className="detail-value">{gun.storageLocation || 'Main Vault'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Twist Rate</span>
                    <span className="detail-value text-mono">{gun.twistRate || '1:10'}</span>
                  </div>
                  {gun.purchasePrice && (
                    <div className="detail-row">
                      <span className="detail-label">Valuation</span>
                      <span className="detail-value gold-text">${formatCurrency(gun.purchasePrice)}</span>
                    </div>
                  )}
                  <div className="detail-row tracker-row">
                    <span className="detail-label">Rounds Fired</span>
                    <div className="tracker-controls">
                      <span className="highlight-text">{gun.roundCount}</span>
                      <button 
                        onClick={(e) => quickIncrementRounds(gun.id, e)} 
                        className="btn btn-secondary btn-mini" 
                        title="Add 50 rounds"
                      >
                        +50
                      </button>
                    </div>
                  </div>
                </div>

                <div className="gun-card-actions">
                  <button onClick={(e) => { e.stopPropagation(); openEditModal(gun); }} className="btn btn-secondary btn-small">Edit Specs</button>
                  <button onClick={(e) => handleDelete(gun.id, e)} className="btn btn-danger btn-small">Deregister</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Identical Audiobookshelf tabs modal overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="abs-center-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-bar">
              <div className="title-left">
                <span className="modal-title-icon">🔥</span>
                <h3>{isEditMode ? 'Edit Weapon Specifications' : 'New Armory Registration'}</h3>
              </div>
              <button className="modal-close-x-btn" onClick={closeModal}>×</button>
            </div>

            {/* Modal Tabs strip */}
            <div className="modal-tabs-header-row">
              <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
              <button className={`tab-btn ${activeTab === 'optics' ? 'active' : ''}`} onClick={() => setActiveTab('optics')}>Optics</button>
              <button className={`tab-btn ${activeTab === 'attachments' ? 'active' : ''}`} onClick={() => setActiveTab('attachments')}>Documents</button>
              <button className={`tab-btn ${activeTab === 'accessories' ? 'active' : ''}`} onClick={() => setActiveTab('accessories')}>Accessories</button>
              <button className={`tab-btn ${activeTab === 'loads' ? 'active' : ''}`} onClick={() => setActiveTab('loads')}>Matching Lots</button>
              <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Custom Logs</button>
              <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>Maintenance</button>
              <button className={`tab-btn ${activeTab === 'range' ? 'active' : ''}`} onClick={() => setActiveTab('range')}>Range History</button>
            </div>

            {/* Scrollable Modal content wrapper */}
            <div className="modal-tabs-body-content">
              {/* TAB 1: General Specs */}
              {activeTab === 'general' && (
                <div className="tab-pane">
                  <div className="form-grid-columns">
                    <div className="form-item">
                      <label>Manufacturer</label>
                      <select value={form.manufacturer} onChange={handleManufacturerChange}>
                        {manufacturerPresets.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="Custom">Custom Override...</option>
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Model</label>
                      {form.manufacturer === 'Custom' ? (
                        <input 
                          type="text" 
                          placeholder="e.g. Model 1911" 
                          value={customModel} 
                          onChange={(e) => setCustomModel(e.target.value)} 
                        />
                      ) : (
                        <select 
                          value={form.model} 
                          onChange={(e) => setForm({ ...form, model: e.target.value })}
                        >
                          {(modelPresets[form.manufacturer] || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                          <option value="Custom">Custom Override...</option>
                        </select>
                      )}
                    </div>

                    {form.manufacturer === 'Custom' && (
                      <div className="form-item">
                        <label>Custom Manufacturer Name</label>
                        <input 
                          type="text" 
                          placeholder="Brand Name" 
                          value={customManufacturer} 
                          onChange={(e) => setCustomManufacturer(e.target.value)} 
                        />
                      </div>
                    )}

                    {form.model === 'Custom' && form.manufacturer !== 'Custom' && (
                      <div className="form-item">
                        <label>Custom Model Name</label>
                        <input 
                          type="text" 
                          placeholder="Model Name" 
                          value={customModel} 
                          onChange={(e) => setCustomModel(e.target.value)} 
                        />
                      </div>
                    )}

                    <div className="form-item">
                      <label>Primary Caliber</label>
                      <select value={form.caliber} onChange={(e) => setForm({ ...form, caliber: e.target.value })}>
                        {caliberPresets.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Action Classification</label>
                      <select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })}>
                        {actionTypePresets.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Barrel Length (Inches)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={form.barrelLengthInches || ''} 
                        onChange={(e) => setForm({ ...form, barrelLengthInches: e.target.value })} 
                      />
                    </div>

                    <div className="form-item">
                      <label>Twist Rate</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1:10" 
                        value={form.twistRate || ''} 
                        onChange={(e) => setForm({ ...form, twistRate: e.target.value })} 
                      />
                    </div>

                    <div className="form-item">
                      <label>Serial Number</label>
                      <input 
                        type="text" 
                        placeholder="Unique identification code" 
                        value={form.serialNumber || ''} 
                        onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} 
                      />
                    </div>

                    <div className="form-item">
                      <label>Operation Condition</label>
                      <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                        {conditionPresets.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Storage Vault Location</label>
                      <select value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}>
                        {vaultLocations.map(loc => (
                          <option key={loc.name} value={loc.name}>{loc.name} ({loc.securityLevel})</option>
                        ))}
                        <option value="Main Vault">Main Vault</option>
                      </select>
                    </div>

                    <div className="form-item">
                      <label>Beneficiary / Legal Heir</label>
                      <input 
                        type="text" 
                        placeholder="Name of inheritor" 
                        value={form.beneficiary || ''} 
                        onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} 
                      />
                    </div>

                    <div className="form-item">
                      <label>Purchase Price</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Price paid" 
                        value={form.purchasePrice || ''} 
                        onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} 
                      />
                    </div>

                    <div className="form-item">
                      <label>Purchase Date</label>
                      <input 
                        type="date" 
                        value={form.purchaseDateString || ''} 
                        onChange={(e) => setForm({ ...form, purchaseDateString: e.target.value })} 
                      />
                    </div>

                    <div className="form-item full-row">
                      <div className="cover-selection-container">
                        <span className="section-sub-label">Cover Image Setup</span>
                        <div className="cover-flex-row">
                          <div className="cover-preview-box">
                            {form.imageUrl ? (
                              <img src={form.imageUrl} className="active-cover-img" alt="Cover URL Preview" />
                            ) : (
                              <div className="no-cover-svg">
                                <span>🖼️</span>
                                <p>NO COVER</p>
                              </div>
                            )}
                          </div>

                          <div className="cover-inputs">
                            <div className="source-select-row">
                              <label className="radio-label">
                                <input 
                                  type="radio" 
                                  checked={coverSourceType === 'web'} 
                                  onChange={() => setCoverSourceType('web')} 
                                />
                                <span>Web Link Address</span>
                              </label>
                            </div>
                            <div className="cover-url-row">
                              <input 
                                type="text" 
                                placeholder="http://domain/image.png" 
                                value={form.imageUrl || ''} 
                                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} 
                              />
                            </div>
                            <span className="field-hint">Paste standard web addresses to render silhouettes.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Optics configurations */}
              {activeTab === 'optics' && (
                <div className="tab-pane">
                  <div className="tab-intro">
                    <h4>Optic Configurations</h4>
                    <p>Register attachments like scopes, holographic reticles, or iron-sights connected to the receiver rails.</p>
                  </div>

                  <div className="form-item">
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={form.isOpticMounted} 
                        onChange={(e) => setForm({ ...form, isOpticMounted: e.target.checked })} 
                      />
                      <span className="checkmark"></span>
                      <span>Optic is currently mounted to this armory unit</span>
                    </label>
                  </div>

                  {form.isOpticMounted && (
                    <div className="form-grid-columns">
                      <div className="form-item">
                        <label>Optic Manufacturer</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Trijicon, Vortex" 
                          value={form.opticManufacturer} 
                          onChange={(e) => setForm({ ...form, opticManufacturer: e.target.value })} 
                        />
                      </div>
                      <div className="form-item">
                        <label>Optic Model</label>
                        <input 
                          type="text" 
                          placeholder="e.g. RMR, Venom" 
                          value={form.opticModel} 
                          onChange={(e) => setForm({ ...form, opticModel: e.target.value })} 
                        />
                      </div>
                      <div className="form-item">
                        <label>Reticle Spec</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 3.25 MOA Red Dot" 
                          value={form.opticReticle} 
                          onChange={(e) => setForm({ ...form, opticReticle: e.target.value })} 
                        />
                      </div>
                      <div className="form-item">
                        <label>Optic Serial Number</label>
                        <input 
                          type="text" 
                          placeholder="Serial Code" 
                          value={form.opticSerial} 
                          onChange={(e) => setForm({ ...form, opticSerial: e.target.value })} 
                        />
                      </div>
                      <div className="form-item">
                        <label>Battery Specification</label>
                        <input 
                          type="text" 
                          placeholder="e.g. CR2032" 
                          value={form.opticBattery} 
                          onChange={(e) => setForm({ ...form, opticBattery: e.target.value })} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Attachments (O owners manual pdfs / targets) */}
              {activeTab === 'attachments' && (
                <div className="tab-pane">
                  <div className="tab-intro">
                    <h4>Document Attachments</h4>
                    <p>Store manuals, purchase receipts, or PDF target groups connected to this firearm.</p>
                  </div>

                  <div className="uploads-panel">
                    <div className="upload-controls-row">
                      <div className="upload-file-selector">
                        <span className="selected-file-name">No file selected</span>
                      </div>
                      <button className="btn btn-secondary btn-mini-inline" onClick={() => alert('Local document upload simulated.')}>Browse</button>
                    </div>

                    <div className="attachments-list-section">
                      <span className="list-title">Uploaded Files</span>
                      {attachments.length === 0 ? (
                        <div className="empty-list-placeholder">No document attachments uploaded.</div>
                      ) : (
                        <table className="attachments-table">
                          <thead>
                            <tr>
                              <th>File Name</th>
                              <th>Category</th>
                              <th>Size</th>
                              <th>Date Added</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attachments.map(att => (
                              <tr key={att.id}>
                                <td>
                                  <a href="#" onClick={(e) => { e.preventDefault(); alert(`Downloading file: ${att.filename}`); }} className="clickable-attachment-link">
                                    {att.filename}
                                  </a>
                                </td>
                                <td>{att.category}</td>
                                <td>{att.size}</td>
                                <td>{att.dateAdded}</td>
                                <td className="action-cell">
                                  <button onClick={() => removeAttachmentFile(att.id)} className="btn btn-danger btn-mini-inline">Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Custom Accessories dynamic insertion */}
              {activeTab === 'accessories' && (
                <div className="tab-pane">
                  <div className="tab-intro">
                    <h4>Accessories Ledger</h4>
                    <p>Register flashlights, lasers, triggers, or grips physically attached to this unit.</p>
                  </div>

                  <div className="add-accessory-form-row">
                    <input 
                      type="text" 
                      placeholder="Grip, Flashlight model..." 
                      value={newAccessoryName} 
                      onChange={(e) => setNewAccessoryName(e.target.value)} 
                      className="flex-grow-input"
                      onKeyDown={(e) => { if (e.key === 'Enter') addAccessoryItem(); }}
                    />
                    <button className="btn btn-primary" onClick={addAccessoryItem}>Add Attachment</button>
                  </div>

                  <div className="accessories-dynamic-list-section">
                    <span className="list-title">Equipped Accessories ({accessoriesList.length})</span>
                    {accessoriesList.length === 0 ? (
                      <div className="empty-list-placeholder">No aftermarket attachments logged.</div>
                    ) : (
                      <div className="accessories-scroll-box">
                        {accessoriesList.map((acc, idx) => (
                          <div key={idx} className="accessory-dynamic-card">
                            <div className="card-left">
                              <span className="bullet-dot">♦</span>
                              <span className="accessory-item-text">{acc}</span>
                            </div>
                            <button className="btn btn-danger btn-mini-inline" onClick={() => removeAccessoryItem(idx)}>Deregister</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: Matching Ammo Lots list */}
              {activeTab === 'loads' && (
                <div className="tab-pane">
                  <div className="tab-intro">
                    <h4>Compatible Ammunition Lots</h4>
                    <p>Ammunition on record matching this unit's primary caliber ({form.caliber}).</p>
                  </div>

                  <div className="lots-list-display">
                    {filteredAmmoLots.length === 0 ? (
                      <div className="empty-list-placeholder">No matching caliber lots on record in your Munitions cache.</div>
                    ) : (
                      <table className="lots-compact-table">
                        <thead>
                          <tr>
                            <th>Lot Brand / Recipe</th>
                            <th>Caliber Spec</th>
                            <th>Stock Level</th>
                            <th>Classification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAmmoLots.map(lot => (
                            <tr key={lot.id}>
                              <td>
                                <strong>{lot.brandName || lot.recipeName}</strong>
                                {lot.notes && <span className="lot-row-notes-tag" title={lot.notes}>info</span>}
                              </td>
                              <td className="text-mono">{lot.caliber}</td>
                              <td className="gold-text">{lot.roundsRemaining} rds</td>
                              <td>{lot.isHandload ? 'Handload' : 'Factory'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: Notes editor split panel */}
              {activeTab === 'notes' && (
                <div className="tab-pane">
                  <div className="tab-intro">
                    <h4>Internal Range Logs</h4>
                    <p>Formulate log narratives, technical specs, zero-ranges, or custom triggers using simple formatting tools.</p>
                  </div>

                  <div className="markdown-editor-pane">
                    <div className="markdown-toolbar">
                      <button className="toolbar-btn" onClick={() => insertMarkdownTag('**')}>Bold</button>
                      <button className="toolbar-btn" onClick={() => insertMarkdownTag('*')}>Italic</button>
                      <button className="toolbar-btn" onClick={() => insertMarkdownTag('__')}>Underline</button>
                      <button className="toolbar-btn" onClick={() => insertMarkdownTag('- ')}>Bullet List</button>
                      <button className="toolbar-btn" onClick={() => insertMarkdownTag('&gt; ')}>Quote</button>
                      <button className="toolbar-btn" onClick={() => insertMarkdownTag('`')}>Code Block</button>
                      <span className="text-format-indicator">Rich Editor Active</span>
                    </div>

                    <div className="markdown-split-panel">
                      <div className="editor-col">
                        <textarea 
                          id="markdown-textarea-box"
                          ref={markdownTextareaRef}
                          value={form.notesMarkdown || ''}
                          onChange={(e) => setForm({ ...form, notesMarkdown: e.target.value })}
                          placeholder="Register technical specifications, bullet groups, or barrel histories..."
                        />
                      </div>
                      <div className="preview-col">
                        <span className="preview-tag-title">Rendered Output</span>
                        <div 
                          className="markdown-rendered-view"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(form.notesMarkdown) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: Maintenance tasks schedule list */}
              {activeTab === 'maintenance' && (
                <div className="tab-pane">
                  <div className="tab-intro">
                    <h4>Maintenance Schedules</h4>
                    <p>Log actions like detailing, action lubricating, or custom installations to ensure active reliability.</p>
                  </div>

                  <div className="task-insertion-panel">
                    <div className="task-form-row">
                      <div className="task-item-input-col flex-grow-input">
                        <label>Action / Detailing Needed</label>
                        <input 
                          type="text" 
                          placeholder="Detonator detailing, barrel clean, parts replace..." 
                          value={newTaskText} 
                          onChange={(e) => setNewTaskText(e.target.value)} 
                          onKeyDown={(e) => { if (e.key === 'Enter') addMaintenanceTaskItem(); }}
                        />
                      </div>
                      <div className="task-item-input-col">
                        <label>Category</label>
                        <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)} className="mini-cat-select">
                          <option value="Clean">Detail Cleaning</option>
                          <option value="Inspection">Inspect Parts</option>
                          <option value="Repair">Replace Parts</option>
                          <option value="Lubrication">Lubrication</option>
                          <option value="Upgrade">Mod Upgrade</option>
                        </select>
                      </div>
                      <div className="task-item-input-col">
                        <label>Target Date</label>
                        <input 
                          type="date" 
                          value={newTaskDueDate} 
                          onChange={(e) => setNewTaskDueDate(e.target.value)} 
                        />
                      </div>
                      <div className="task-item-input-col align-center-checkbox">
                        <label className="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={newTaskNotification} 
                            onChange={(e) => setNewTaskNotification(e.target.checked)} 
                          />
                          <span className="checkmark"></span>
                          <span>Notify</span>
                        </label>
                      </div>
                      <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={addMaintenanceTaskItem}>Schedule</button>
                    </div>
                  </div>

                  <div className="listings-header-row">
                    <h5>Registered Tasks ({filteredTasks.length})</h5>
                    <div className="listings-filter-controls">
                      <select value={taskFilterStatus} onChange={(e) => setTaskFilterStatus(e.target.value)} className="mini-table-filter">
                        <option value="All">All Statuses</option>
                        <option value="Active">Active Scheduled</option>
                        <option value="Completed">Completed Logs</option>
                      </select>
                      <select value={taskFilterCategory} onChange={(e) => setTaskFilterCategory(e.target.value)} className="mini-table-filter">
                        <option value="All">All Categories</option>
                        <option value="Clean">Cleaning</option>
                        <option value="Inspection">Inspections</option>
                        <option value="Repair">Repairs</option>
                        <option value="Lubrication">Lubrication</option>
                        <option value="Upgrade">Upgrades</option>
                      </select>
                    </div>
                  </div>

                  {filteredTasks.length === 0 ? (
                    <div className="empty-list-placeholder">No maintenance logs matches your active search filters.</div>
                  ) : (
                    <table className="tasks-master-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>Mark</th>
                          <th>Action Description</th>
                          <th>Group</th>
                          <th>Target Date</th>
                          <th>Alert</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map(task => (
                          <tr key={task.id} className={task.isCompleted ? 'completed' : ''}>
                            <td>
                              <input 
                                type="checkbox" 
                                checked={task.isCompleted} 
                                onChange={() => toggleTaskStatus(task.id)} 
                                className="task-row-checkbox"
                              />
                            </td>
                            <td className="task-text-cell">{task.description}</td>
                            <td>{task.category}</td>
                            <td>{task.dueDate || 'No Date'}</td>
                            <td>{task.enableNotifications ? '🔔 Active' : 'Off'}</td>
                            <td>
                              <button onClick={() => removeTaskItem(task.id)} className="btn btn-danger btn-mini-inline">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 8: Range history logs accordion list */}
              {activeTab === 'range' && (
                <div className="tab-pane">
                  <div className="tab-intro">
                    <h4>Range History</h4>
                    <p>Interactive catalog of range trips, target groupings, and operational rounds fired.</p>
                  </div>

                  <div className="range-history-panel-scroll">
                    {rangeSessions.length === 0 ? (
                      <div className="empty-list-placeholder">No range shooting sessions on record. Record targets at your local bench.</div>
                    ) : (
                      <div className="expandable-accordion-list">
                        {rangeSessions.map(session => (
                          <div key={session.id} className="accordion-item-box">
                            <div className="accordion-header-trigger" onClick={() => toggleAccordion(session.id)}>
                              <div className="trigger-left">
                                <span className="expand-icon">{activeAccordionId === session.id ? '▼' : '►'}</span>
                                <span className="session-date-tag">{session.dateString}</span>
                                <span className="session-location-tag">{session.location}</span>
                              </div>
                              <span className="gold-text">{session.roundsFired} rds fired</span>
                            </div>

                            {activeAccordionId === session.id && (
                              <div className="accordion-content">
                                <div className="session-stats-grid">
                                  <div className="stat-bubble">
                                    <span>Rounds</span>
                                    <strong>{session.roundsFired}</strong>
                                  </div>
                                  <div className="stat-bubble">
                                    <span>Average Speed</span>
                                    <strong>{session.velocityAvg || 'N/A'} fps</strong>
                                  </div>
                                  <div className="stat-bubble">
                                    <span>Spread Group</span>
                                    <strong>{session.groupSizeInches || 'N/A'} in</strong>
                                  </div>
                                  <div className="stat-bubble">
                                    <span>Distance</span>
                                    <strong>{session.distanceYards || 'N/A'} yds</strong>
                                  </div>
                                </div>

                                {session.notes && (
                                  <div className="session-notes-box">
                                    <label>Trip Observations</label>
                                    <p>{session.notes}</p>
                                  </div>
                                )}

                                {session.targetCards && session.targetCards.length > 0 && (
                                  <div className="session-targets-row">
                                    <label>Target Groups Records</label>
                                    <div className="targets-preview-flex">
                                      {session.targetCards.map(t => (
                                        <div key={t.id} className="target-mock-preview-card" onClick={() => alert(`Previewing grouping target [${t.name}]`)}>
                                          🎯 {t.name}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer-row-container">
              <button className="btn btn-secondary" onClick={closeModal} disabled={isSaving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving specifications...' : 'Save Unit Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
