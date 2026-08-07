import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../StoreContext'
import './Munitions.css'

export default function Munitions() {
  const store = useStore()
  const [searchParams] = useSearchParams()

  // State caches
  const [lots, setLots] = useState([])
  const [cartridges, setCartridges] = useState([])
  const [projectiles, setProjectiles] = useState([])
  const [powders, setPowders] = useState([])
  const [factoryAmmoCatalog, setFactoryAmmoCatalog] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')

  // Modal controls
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [lotClass, setLotClass] = useState('factory') // 'factory' or 'handload'
  const [activeTab, setActiveTab] = useState('general')
  const [formDateFormatted, setFormDateFormatted] = useState('')

  const [form, setForm] = useState({
    id: 0,
    cartridgeId: 0,
    projectileId: null,
    powderId: null,
    powderChargeGrains: '',
    cartridgeOverallLength: '',
    factoryAmmoId: null,
    quantity: 100,
    lotNumber: '',
    dateLoaded: '',
    notes: ''
  })

  // Watch route query parameter 'type'
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam === 'factory' || typeParam === 'handload') {
      setFilterType(typeParam)
    } else {
      setFilterType('')
    }
  }, [searchParams])

  // Fetch collections
  const fetchMunitions = async () => {
    setLoading(true)
    setError('')
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

      if (lotsRes.ok) setLots(await lotsRes.json())
      if (cRes.ok) {
        const carts = await cRes.json()
        setCartridges(carts)
      }
      if (pRes.ok) setProjectiles(await pRes.json())
      if (pwRes.ok) setPowders(await pwRes.json())
      if (fRes.ok) setFactoryAmmoCatalog(await fRes.json())
    } catch (err) {
      setError('Failed to fetch munitions inventory.')
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchMunitions()
  }, [store.activeArsenalId])

  // Watch lotClass to reset active tab if ballistics was open
  useEffect(() => {
    if (lotClass === 'factory' && activeTab === 'ballistics') {
      setActiveTab('general')
    }
  }, [lotClass])

  // Filter listings
  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      const textMatch = !searchQuery ||
        [lot.lotNumber, lot.notes, lot.cartridge?.name, lot.factoryAmmo?.sku]
          .some(v => v && v.toLowerCase().includes(searchQuery.toLowerCase()))

      const typeMatch = !filterType ||
        (filterType === 'factory' && lot.factoryAmmoId !== null) ||
        (filterType === 'handload' && lot.factoryAmmoId === null)

      return textMatch && typeMatch
    })
  }, [lots, searchQuery, filterType])

  const filteredFactoryAmmo = useMemo(() => {
    if (form.cartridgeId === 0) return factoryAmmoCatalog
    return factoryAmmoCatalog.filter(f => f.cartridgeId === form.cartridgeId)
  }, [factoryAmmoCatalog, form.cartridgeId])

  const adjustStock = async (id, delta) => {
    try {
      const res = await fetch(`/api/munitions/${id}/adjust-quantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      })
      if (res.ok) {
        const data = await res.json()
        setLots(prev => prev.map(lot => lot.id === id ? { ...lot, quantity: data.quantity } : lot))
      }
    } catch (err) {
      console.error('Adjust stock failed', err)
    }
  }

  const openCreateModal = () => {
    setIsEditMode(false)
    setLotClass('factory')
    setActiveTab('general')

    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setFormDateFormatted(now.toISOString().slice(0, 16))

    setForm({
      id: 0,
      cartridgeId: cartridges.length ? cartridges[0].id : 0,
      projectileId: null,
      powderId: null,
      powderChargeGrains: '',
      cartridgeOverallLength: '',
      factoryAmmoId: null,
      quantity: 100,
      lotNumber: '',
      dateLoaded: '',
      notes: ''
    })
    setShowModal(true)
  }

  const openEditModal = (lot) => {
    setIsEditMode(true)
    setLotClass(lot.factoryAmmoId ? 'factory' : 'handload')
    setActiveTab('general')

    const d = new Date(lot.dateLoaded)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    setFormDateFormatted(d.toISOString().slice(0, 16))

    setForm({ 
      ...lot,
      projectileId: lot.projectileId || null,
      powderId: lot.powderId || null,
      powderChargeGrains: lot.powderChargeGrains || '',
      cartridgeOverallLength: lot.cartridgeOverallLength || '',
      factoryAmmoId: lot.factoryAmmoId || null
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      ...form,
      dateLoaded: new Date(formDateFormatted).toISOString(),
      projectileId: lotClass === 'factory' ? null : form.projectileId,
      powderId: lotClass === 'factory' ? null : form.powderId,
      powderChargeGrains: lotClass === 'factory' ? null : (parseFloat(form.powderChargeGrains) || null),
      cartridgeOverallLength: lotClass === 'factory' ? null : (parseFloat(form.cartridgeOverallLength) || null),
      factoryAmmoId: lotClass === 'factory' ? form.factoryAmmoId : null,
      quantity: parseInt(form.quantity) || 0,
      arsenalId: store.activeArsenalId
    }

    try {
      const url = isEditMode ? `/api/munitions/${form.id}` : '/api/munitions'
      const method = isEditMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        await fetchMunitions()
        const savedLot = await res.json()
        setIsEditMode(true)
        
        const d = new Date(savedLot.dateLoaded)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        setFormDateFormatted(d.toISOString().slice(0, 16))
        
        setForm({ 
          ...savedLot,
          projectileId: savedLot.projectileId || null,
          powderId: savedLot.powderId || null,
          powderChargeGrains: savedLot.powderChargeGrains || '',
          cartridgeOverallLength: savedLot.cartridgeOverallLength || '',
          factoryAmmoId: savedLot.factoryAmmoId || null
        })

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        alert('Save inventory lot failed.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this ammunition lot from inventory records? This is permanent.')) return
    try {
      const res = await fetch(`/api/munitions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLots(prev => prev.filter(l => l.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Consulting munitions logs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="error-msg">Failed to load munitions. {error}</p>
        <button onClick={fetchMunitions} className="btn btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="munitions-view">
      {/* Search and Filters Bar */}
      <section className="filter-bar">
        <div className="search-inputs">
          <input 
            type="text" 
            placeholder="Search cartridge types, lots, bullet SKU..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="factory">Factory Loads</option>
            <option value="handload">Custom Handloads</option>
          </select>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">Log Ammunition Lot</button>
      </section>

      {/* Ammunition Lots List */}
      {filteredLots.length === 0 ? (
        <div className="empty-state panel">
          <h3>No ammunition cache logs registered in this collection.</h3>
          <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>Click Log Ammunition Lot to track factory boxes or reloading recipes.</p>
        </div>
      ) : (
        <section className="lots-list">
          {filteredLots.map((lot) => {
            const isHandload = !lot.factoryAmmoId
            const bullet = isHandload ? lot.projectile : null
            const powderName = isHandload ? lot.powder?.name : null
            const brandLabel = isHandload 
              ? 'Handload Project' 
              : (lot.factoryAmmo?.manufacturer?.name || 'Factory Brand')

            return (
              <div key={lot.id} className={`lot-card ${isHandload ? 'handload-lot' : 'factory-lot'}`}>
                <div className="lot-side-color"></div>
                <div className="lot-content">
                  <div className="lot-header">
                    <div className="lot-title-grp">
                      <h4 className="lot-title">
                        {isHandload ? (
                          <span>{lot.cartridge?.name} Handload Batch</span>
                        ) : (
                          <span>{brandLabel} {lot.cartridge?.name}</span>
                        )}
                      </h4>
                      <span className="badge badge-success" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                        {isHandload ? 'Custom handload' : 'Factory'}
                      </span>
                    </div>

                    <div className="lot-stock-adjust">
                      <button onClick={() => adjustStock(lot.id, -20)} className="btn btn-secondary adjust-btn">-20</button>
                      <span className="lot-qty">
                        {formatNumber(lot.quantity)} <span className="qty-unit">rds</span>
                      </span>
                      <button onClick={() => adjustStock(lot.id, 20)} className="btn btn-secondary adjust-btn">+20</button>
                    </div>
                  </div>

                  <div className="lot-specs">
                    <div className="spec-col">
                      <span className="spec-label">Bullet / Bullet weight</span>
                      <span className="spec-value">
                        {isHandload ? (
                          bullet ? `${bullet.weightGrains}gr ${bullet.name}` : 'Custom Projectile'
                        ) : (
                          lot.factoryAmmo ? `${lot.factoryAmmo.projectileWeightGrains}gr ${lot.factoryAmmo.projectileType}` : 'Factory Spec'
                        )}
                      </span>
                    </div>

                    {isHandload ? (
                      <>
                        <div className="spec-col">
                          <span className="spec-label">Powder / Charge</span>
                          <span className="spec-value highlight-val">
                            {powderName ? `${powderName} (${lot.powderChargeGrains || 0}gr)` : 'N/A'}
                          </span>
                        </div>
                        <div className="spec-col">
                          <span className="spec-label">Length (COAL)</span>
                          <span className="spec-value text-mono">{lot.cartridgeOverallLength || 'N/A'}"</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="spec-col">
                          <span className="spec-label">SKU / Catalog code</span>
                          <span className="spec-value text-mono">{lot.factoryAmmo?.sku || 'N/A'}</span>
                        </div>
                        <div className="spec-col">
                          <span className="spec-label">Casing Classification</span>
                          <span className="spec-value">{lot.factoryAmmo?.brassCasing ? 'Brass casing' : 'Other'}</span>
                        </div>
                      </>
                    )}

                    <div className="spec-col">
                      <span className="spec-label">Lot number tag</span>
                      <span className="spec-value text-mono">{lot.lotNumber || 'No label'}</span>
                    </div>
                  </div>

                  <div className="lot-footer">
                    <span className="lot-date">Logged on {formatDate(lot.dateLoaded)}</span>
                    {lot.notes && <p className="lot-notes">"{lot.notes}"</p>}
                    <div className="lot-actions">
                      <button onClick={() => openEditModal(lot)} className="btn btn-secondary btn-mini">Edit specs</button>
                      <button onClick={() => handleDelete(lot.id)} className="btn btn-danger btn-mini">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Center Tabs Modal overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="abs-center-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-bar">
              <div className="title-left">
                <h3>{isEditMode ? 'Edit Munition Specs' : 'Log New Ammunition Lot'}</h3>
              </div>
              <button className="modal-close-x-btn" onClick={closeModal}>×</button>
            </div>

            {/* Modal Tabs Row */}
            <div className="modal-tabs-header-row">
              <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
              {lotClass === 'handload' && (
                <button className={`tab-btn ${activeTab === 'ballistics' ? 'active' : ''}`} onClick={() => setActiveTab('ballistics')}>Ballistics</button>
              )}
              <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
            </div>

            {/* Modal Content Drawer */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <div className="modal-tabs-body-content">
                {/* TAB 1: General specs */}
                {activeTab === 'general' && (
                  <div className="tab-pane">
                    <div className="form-grid-columns">
                      <div className="form-item full-row">
                        <label>Ammunition Classification</label>
                        <div className="toggle-switch">
                          <button 
                            type="button" 
                            className={`switch-option ${lotClass === 'factory' ? 'active' : ''}`}
                            onClick={() => setLotClass('factory')}
                          >
                            Factory Ammo Box
                          </button>
                          <button 
                            type="button" 
                            className={`switch-option ${lotClass === 'handload' ? 'active' : ''}`}
                            onClick={() => setLotClass('handload')}
                          >
                            Custom Handloaded Batch
                          </button>
                        </div>
                      </div>

                      <div className="form-item">
                        <label>Cartridge Caliber *</label>
                        <select 
                          value={form.cartridgeId} 
                          onChange={(e) => setForm({ ...form, cartridgeId: parseInt(e.target.value) || 0, factoryAmmoId: null })}
                          required
                        >
                          <option value="0">-- Select Caliber --</option>
                          {cartridges.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {lotClass === 'factory' ? (
                        <div className="form-item">
                          <label>Factory Bullet Model SKU</label>
                          <select 
                            value={form.factoryAmmoId || ''} 
                            onChange={(e) => setForm({ ...form, factoryAmmoId: parseInt(e.target.value) || null })}
                          >
                            <option value="">-- None Selected --</option>
                            {filteredFactoryAmmo.map(f => (
                              <option key={f.id} value={f.id}>
                                [{f.manufacturer?.name}] {f.projectileWeightGrains}gr {f.projectileType} (SKU: {f.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="form-item">
                          <label>Starting Quantity *</label>
                          <input 
                            type="number" 
                            value={form.quantity} 
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                            placeholder="0 rds" 
                            required 
                          />
                        </div>
                      )}

                      {lotClass === 'factory' && (
                        <div className="form-item">
                          <label>Starting Box Quantity *</label>
                          <input 
                            type="number" 
                            value={form.quantity} 
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                            placeholder="0 rds" 
                            required 
                          />
                        </div>
                      )}

                      <div className="form-item">
                        <label>Lot / Batch Number</label>
                        <input 
                          type="text" 
                          value={form.lotNumber || ''} 
                          onChange={(e) => setForm({ ...form, lotNumber: e.target.value })} 
                          placeholder="Lot identifier tag" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Ballistics recipes (Custom Reloads only) */}
                {activeTab === 'ballistics' && lotClass === 'handload' && (
                  <div className="tab-pane">
                    <div className="form-grid-columns">
                      <div className="form-item full-row">
                        <label>Reloading Projectile (Bullet)</label>
                        <select 
                          value={form.projectileId || ''} 
                          onChange={(e) => setForm({ ...form, projectileId: parseInt(e.target.value) || null })}
                        >
                          <option value="">-- None selected --</option>
                          {projectiles.map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.manufacturer?.name}] {p.weightGrains}gr {p.name} ({p.diameterInches}")
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Powder Selection</label>
                        <select 
                          value={form.powderId || ''} 
                          onChange={(e) => setForm({ ...form, powderId: parseInt(e.target.value) || null })}
                        >
                          <option value="">-- None selected --</option>
                          {powders.map(pw => (
                            <option key={pw.id} value={pw.id}>
                              {pw.manufacturer} - {pw.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>Charge Weight (Grains)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={form.powderChargeGrains || ''} 
                          onChange={(e) => setForm({ ...form, powderChargeGrains: e.target.value })} 
                          placeholder="e.g. 43.5" 
                        />
                      </div>

                      <div className="form-item">
                        <label>Overall Length (COAL)</label>
                        <input 
                          type="number" 
                          step="0.001" 
                          value={form.cartridgeOverallLength || ''} 
                          onChange={(e) => setForm({ ...form, cartridgeOverallLength: e.target.value })} 
                          placeholder="e.g. 2.800" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Notes logs */}
                {activeTab === 'notes' && (
                  <div className="tab-pane">
                    <div className="form-grid-columns">
                      <div className="form-item full-row">
                        <label>Logging / Loading Date</label>
                        <input 
                          type="datetime-local" 
                          value={formDateFormatted} 
                          onChange={(e) => setFormDateFormatted(e.target.value)} 
                        />
                      </div>
                      <div className="form-item full-row">
                        <label>Log Notes</label>
                        <textarea 
                          value={form.notes || ''} 
                          onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                          rows="4" 
                          placeholder="e.g. Grouping tests, chrono averages..." 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="modal-footer-row-container">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'}`}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved!' : isEditMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
