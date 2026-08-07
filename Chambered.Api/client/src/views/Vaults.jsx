import React, { useState, useEffect, useMemo } from 'react'
import { useStore } from '../StoreContext'
import './Vaults.css'

export default function Vaults() {
    const store = useStore()
    const { enums } = store

    const lockTypePresets = useMemo(() => {
        if (enums && enums.lockTypes) {
            return enums.lockTypes.map(e => e.label);
        }
        return [
            "Electronic Keypad",
            "Mechanical Dial",
            "Biometric Scanner",
            "Dual Key System",
            "Physical Key Lock",
            "RFID Transponder",
            "None / Cabinet"
        ];
    }, [enums]);

    const [vaults, setVaults] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // View state
    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'tree'
    const [expandedNodes, setExpandedNodes] = useState({}) // track expanded nodes in tree view

    // Form & modal state
    const [showModal, setShowModal] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [activeTab, setActiveTab] = useState('general') // 'general' | 'security' | 'inventory'
    const [showPassword, setShowPassword] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Form state
    const [form, setForm] = useState({
        id: 0,
        name: '',
        description: '',
        arsenalId: '',
        securityLevel: 'Standard',
        vaultCategoryId: '',
        parentVaultId: '',
        passcode: '',
        passcodeHint: '',
        backupKeyLocation: '',
        lockBatteryLastChanged: '',
        hasDehumidifier: false,
        dehumidifierLastServiced: '',
        targetMaxHumidityPercent: 45,
        storedItems: []
    })

    // Fetch all vaults and categories
    const fetchVaults = async () => {
        setLoading(true)
        setError('')
        try {
            const url = store.activeArsenalId
                ? `/api/vaults/locations?arsenalId=${store.activeArsenalId}`
                : '/api/vaults/locations'
            const res = await fetch(url)
            if (res.ok) {
                setVaults(await res.json())
            } else {
                setError(`Failed to load vaults: ${res.status}`)
            }
        } catch (err) {
            setError('Failed to fetch vaults.')
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/vaults/locations/categories')
            if (res.ok) {
                setCategories(await res.json())
            }
        } catch (err) {
            console.error('Failed to load categories', err)
        }
    }

    useEffect(() => {
        fetchVaults()
        fetchCategories()
    }, [store.activeArsenalId])

    // Map flat vault list to a hierarchical tree
    const vaultTree = useMemo(() => {
        const map = {}
        vaults.forEach(v => {
            map[v.id] = { ...v, children: [] }
        })

        const roots = []
        vaults.forEach(v => {
            const node = map[v.id]
            if (v.parentVaultId && map[v.parentVaultId]) {
                map[v.parentVaultId].children.push(node)
            } else {
                roots.push(node)
            }
        })
        return roots
    }, [vaults])

    // Filter out current vault and its descendants from the parent vault options list to prevent circular reference loops
    const eligibleParentVaults = useMemo(() => {
        if (!isEditMode) return vaults

        const getDescendantIds = (vaultId) => {
            const ids = []
            const children = vaults.filter(v => v.parentVaultId === vaultId)
            children.forEach(c => {
                ids.push(c.id)
                ids.push(...getDescendantIds(c.id))
            })
            return ids
        }

        const forbiddenIds = [form.id, ...getDescendantIds(form.id)]
        return vaults.filter(v => !forbiddenIds.includes(v.id))
    }, [vaults, isEditMode, form.id])

    // Node toggle helpers
    const toggleNode = (id) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const openCreateModal = () => {
        setIsEditMode(false)
        setActiveTab('general')
        setShowPassword(false)
        setForm({
            id: 0,
            name: '',
            description: '',
            arsenalId: store.activeArsenalId || (store.arsenals[0]?.id || 1),
            securityLevel: 'Electronic Keypad',
            vaultCategoryId: categories[0]?.id || '',
            parentVaultId: '',
            passcode: '',
            passcodeHint: '',
            backupKeyLocation: '',
            lockBatteryLastChanged: '',
            hasDehumidifier: false,
            dehumidifierLastServiced: '',
            targetMaxHumidityPercent: 45,
            storedItems: []
        })
        setShowModal(true)
    }

    const openEditModal = (vault) => {
        setIsEditMode(true)
        setActiveTab('general')
        setShowPassword(false)

        let batteryDate = ''
        if (vault.lockBatteryLastChanged) {
            batteryDate = vault.lockBatteryLastChanged.split('T')[0]
        }

        let dehumidifierDate = ''
        if (vault.dehumidifierLastServiced) {
            dehumidifierDate = vault.dehumidifierLastServiced.split('T')[0]
        }

        setForm({
            id: vault.id,
            name: vault.name,
            description: vault.description || '',
            arsenalId: vault.arsenalId,
            securityLevel: vault.securityLevel || 'Standard',
            vaultCategoryId: vault.vaultCategoryId || '',
            parentVaultId: vault.parentVaultId || '',
            passcode: vault.passcode || '',
            passcodeHint: vault.passcodeHint || '',
            backupKeyLocation: vault.backupKeyLocation || '',
            lockBatteryLastChanged: batteryDate,
            hasDehumidifier: vault.hasDehumidifier || false,
            dehumidifierLastServiced: dehumidifierDate,
            targetMaxHumidityPercent: vault.targetMaxHumidityPercent || 45,
            storedItems: vault.storedItems || []
        })
        setShowModal(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) return

        setIsSaving(true)
        const payload = {
            ...form,
            parentVaultId: form.parentVaultId ? parseInt(form.parentVaultId) : null,
            vaultCategoryId: form.vaultCategoryId ? parseInt(form.vaultCategoryId) : null,
            lockBatteryLastChanged: form.lockBatteryLastChanged ? new Date(form.lockBatteryLastChanged).toISOString() : null,
            dehumidifierLastServiced: form.dehumidifierLastServiced ? new Date(form.dehumidifierLastServiced).toISOString() : null,
            targetMaxHumidityPercent: form.hasDehumidifier ? parseInt(form.targetMaxHumidityPercent) : null
        }

        try {
            const url = isEditMode ? `/api/vaults/locations/${form.id}` : '/api/vaults/locations'
            const method = isEditMode ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                fetchVaults()
                const savedItem = await res.json()
                setIsEditMode(true)

                let batteryDate = ''
                if (savedItem.lockBatteryLastChanged) {
                    batteryDate = savedItem.lockBatteryLastChanged.split('T')[0]
                }
                let dehumidifierDate = ''
                if (savedItem.dehumidifierLastServiced) {
                    dehumidifierDate = savedItem.dehumidifierLastServiced.split('T')[0]
                }

                setForm({
                    id: savedItem.id,
                    name: savedItem.name,
                    description: savedItem.description || '',
                    arsenalId: savedItem.arsenalId,
                    securityLevel: savedItem.securityLevel || 'Standard',
                    vaultCategoryId: savedItem.vaultCategoryId || '',
                    parentVaultId: savedItem.parentVaultId || '',
                    passcode: savedItem.passcode || '',
                    passcodeHint: savedItem.passcodeHint || '',
                    backupKeyLocation: savedItem.backupKeyLocation || '',
                    lockBatteryLastChanged: batteryDate,
                    hasDehumidifier: savedItem.hasDehumidifier || false,
                    dehumidifierLastServiced: dehumidifierDate,
                    targetMaxHumidityPercent: savedItem.targetMaxHumidityPercent || 45,
                    storedItems: savedItem.storedItems || []
                })

                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 2000)
            } else {
                const txt = await res.text()
                alert(`Save failed: ${txt}`)
            }
        } catch (err) {
            console.error('Error saving vault', err)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteClick = (id, e) => {
        e.stopPropagation()
        setDeleteConfirmId(id)
    }

    const handleDeleteConfirm = async () => {
        try {
            const res = await fetch(`/api/vaults/locations/${deleteConfirmId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                fetchVaults()
                setDeleteConfirmId(null)
            } else {
                alert('Failed to delete vault. Make sure no items or other sub-vaults depend on it.')
            }
        } catch (err) {
            console.error('Error deleting vault', err)
        }
    }

    // Warning calculations
    const needsBatteryChange = (dateStr) => {
        if (!dateStr) return false
        const changeDate = new Date(dateStr)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        return changeDate < oneYearAgo
    }

    return (
        <div className="vaults-container">
            {/* View Header */}
            <header className="vaults-header">
                <div className="header-left">
                    <span className="section-title-icon">🔒</span>
                    <h2>Vaults</h2>
                </div>
                <div className="header-actions">
                    <div className="view-toggle-buttons">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Card Grid View"
                        >
                            Grid
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'tree' ? 'active' : ''}`}
                            onClick={() => setViewMode('tree')}
                            title="Hierarchy Tree View"
                        >
                            Tree View
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        Add Item
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            {loading ? (
                <div className="loading-spinner-box">
                    <div className="spinner"></div>
                    <p>Analyzing storage hubs...</p>
                </div>
            ) : error ? (
                <div className="vaults-error-card">
                    <span className="err-icon">⚠️</span>
                    <p>{error}</p>
                    <button className="btn btn-secondary btn-small" onClick={fetchVaults}>Retry</button>
                </div>
            ) : vaults.length === 0 ? (
                <div className="vaults-empty-state">
                    <div className="empty-state-symbol">🔒</div>
                    <h3>No Vaults Configured</h3>
                    <p>Setup safe rooms, portable lockboxes, or heavy steel safes to securely track where inventory items and reloading components reside.</p>
                    <button className="btn btn-primary" onClick={openCreateModal}>Configure Your First Vault</button>
                </div>
            ) : (
                <>
                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <section className="vaults-grid-layout">
                            {vaults.map((vault) => {
                                const isBatteryLow = needsBatteryChange(vault.lockBatteryLastChanged)
                                return (
                                    <div key={vault.id} className="vault-card-node" onClick={() => openEditModal(vault)}>

                                        <div className="vault-card-contents">
                                            <h4 className="vault-name">
                                                <span className="v-symbol">📂</span> {vault.name}
                                            </h4>
                                            <p className="vault-desc">{vault.description || ''}</p>

                                            <div className="vault-meta-metrics">
                                                {vault.parentVaultName && (
                                                    <div className="metric-row">
                                                        <span className="met-lbl">Parent Vault</span>
                                                        <span className="met-val text-muted">🔗 {vault.parentVaultName}</span>
                                                    </div>
                                                )}
                                                <div className="metric-row">
                                                    <span className="met-lbl">Access Lock</span>
                                                    <span className="met-val">{vault.securityLevel}</span>
                                                </div>
                                                <div className="metric-row">
                                                    <span className="met-lbl">Stored Items</span>
                                                    <span className="met-val gold-text font-bold">
                                                        {vault.storedItems?.length || 0} items
                                                    </span>
                                                </div>
                                                {vault.hasDehumidifier && (
                                                    <div className="metric-row">
                                                        <span className="met-lbl">Desiccant</span>
                                                        <span className="met-val active-green">Active (Max {vault.targetMaxHumidityPercent}%)</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Warnings Banner */}
                                            {(isBatteryLow || (vault.hasDehumidifier && !vault.dehumidifierLastServiced)) && (
                                                <div className="vault-card-alerts">
                                                    {isBatteryLow && (
                                                        <div className="v-alert warning">
                                                            🔋 Lock battery requires replacement! (Over 1 yr)
                                                        </div>
                                                    )}
                                                    {vault.hasDehumidifier && !vault.dehumidifierLastServiced && (
                                                        <div className="v-alert info">
                                                            💨 Dehumidifier needs service log check!
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="vault-card-actions">
                                                <button
                                                    className="btn btn-secondary btn-small"
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(vault); }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    onClick={(e) => handleDeleteClick(vault.id, e)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </section>
                    )}

                    {/* TREE VIEW (Hierarchy) */}
                    {viewMode === 'tree' && (
                        <div className="vaults-tree-sheet">
                            <div className="tree-sheet-header">
                                <h3>Nested Storage Topology</h3>
                                <p>Visual mapping of safe rooms, steel containers, and modular lockboxes.</p>
                            </div>
                            <div className="tree-topology-container">
                                {vaultTree.map(root => renderTreeNode(root, 0))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* MODULAR FORM DIALOG */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="armory-center-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="modal-title-bar">
                            <div className="title-left">
                                <h3>{isEditMode ? `${form.name}` : 'Add New Vault'}</h3>
                            </div>
                            <button className="modal-close-x-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        {/* Tabs Row */}
                        <div className="modal-tabs-header-row">
                            <button
                                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                General
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                Security & Climate
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                                onClick={() => setActiveTab('inventory')}
                                disabled={!isEditMode}
                                title={!isEditMode ? 'Save vault to view inventory list.' : ''}
                            >
                                Inventory ({form.storedItems?.length || 0})
                            </button>
                        </div>

                        {/* Tab Contents */}
                        <div className="modal-tabs-body-content">
                            {activeTab === 'general' && (
                                <div className="tab-pane">
                                    <div className="form-grid-columns">
                                        <div className="form-item full-row">
                                            <label>Name <span className="req">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Bedside Gun Box, Basement Safe, Truck Vault"
                                                value={form.name}
                                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>

                                        <div className="form-item full-row">
                                            <label>Description</label>
                                            <textarea
                                                rows="3"
                                                placeholder="Describe where it is hidden or physical details..."
                                                value={form.description}
                                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                        </div>

                                        <div className="form-item">
                                            <label>Arsenal</label>
                                            <select
                                                value={form.arsenalId}
                                                onChange={(e) => setForm(prev => ({ ...prev, arsenalId: e.target.value }))}
                                                required
                                            >
                                                {store.arsenals.map(ars => (
                                                    <option key={ars.id} value={ars.id}>{ars.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-item">
                                            <label>Category</label>
                                            <select
                                                value={form.vaultCategoryId}
                                                onChange={(e) => setForm(prev => ({ ...prev, vaultCategoryId: e.target.value }))}
                                                required
                                            >
                                                <option value="">-- Choose Category --</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-item full-row">
                                            <label>Parent Vault</label>
                                            <select
                                                value={form.parentVaultId}
                                                onChange={(e) => setForm(prev => ({ ...prev, parentVaultId: e.target.value }))}
                                            >
                                                <option value="">None</option>
                                                {eligibleParentVaults.map(v => (
                                                    <option key={v.id} value={v.id}>🔗 {v.name} ({v.vaultCategoryName})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="tab-pane">
                                    <div className="form-grid-columns">
                                        <div className="form-item">
                                            <label>Security Type</label>
                                            <select
                                                value={form.securityLevel}
                                                onChange={(e) => setForm(prev => ({ ...prev, securityLevel: e.target.value }))}
                                            >
                                                {lockTypePresets.map(preset => (
                                                    <option key={preset} value={preset}>{preset}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-item">
                                            <label>Combination/Passcode<span style={{ color: 'green' }}>(Encrypted)</span></label>
                                            <div className="passcode-input-wrapper">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="passcode-field"
                                                    placeholder="Decrypted key preview..."
                                                    value={form.passcode}
                                                    onChange={(e) => setForm(prev => ({ ...prev, passcode: e.target.value }))}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary passcode-reveal-btn"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? 'Hide 🔒' : 'Show 👁️'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-item">
                                            <label>Passcode Reminder Hint</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Anniversary or zip..."
                                                value={form.passcodeHint}
                                                onChange={(e) => setForm(prev => ({ ...prev, passcodeHint: e.target.value }))}
                                            />
                                        </div>

                                        <div className="form-item">
                                            <label>Backup Keys Location</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Safe deposit box, hidden hook..."
                                                value={form.backupKeyLocation}
                                                onChange={(e) => setForm(prev => ({ ...prev, backupKeyLocation: e.target.value }))}
                                            />
                                        </div>

                                        <div className="form-item">
                                            <label>Battery Last Replaced</label>
                                            <input
                                                type="date"
                                                value={form.lockBatteryLastChanged}
                                                onChange={(e) => setForm(prev => ({ ...prev, lockBatteryLastChanged: e.target.value }))}
                                            />
                                        </div>

                                        {/* ENVIRONMENT / DEHUMIDIFIER */}
                                        <div className="form-item full-row env-boundary-decorator">
                                            <div className="checkbox-toggle-switch-row">
                                                <input
                                                    type="checkbox"
                                                    id="hasDehumidifier"
                                                    checked={form.hasDehumidifier}
                                                    onChange={(e) => setForm(prev => ({ ...prev, hasDehumidifier: e.target.checked }))}
                                                />
                                                <label htmlFor="hasDehumidifier" className="checkbox-switch-label">
                                                    <strong>Active Environment Control</strong> (Has active dehumidifier or silica desiccant packs)
                                                </label>
                                            </div>
                                        </div>

                                        {form.hasDehumidifier && (
                                            <>
                                                <div className="form-item">
                                                    <label>Desiccant Last Replaced / Serviced</label>
                                                    <input
                                                        type="date"
                                                        value={form.dehumidifierLastServiced}
                                                        onChange={(e) => setForm(prev => ({ ...prev, dehumidifierLastServiced: e.target.value }))}
                                                    />
                                                </div>

                                                <div className="form-item">
                                                    <label>Alert Max Humidity: <strong className="gold-text">{form.targetMaxHumidityPercent}%</strong></label>
                                                    <input
                                                        type="range"
                                                        min="25"
                                                        max="65"
                                                        className="form-range-slider"
                                                        value={form.targetMaxHumidityPercent}
                                                        onChange={(e) => setForm(prev => ({ ...prev, targetMaxHumidityPercent: e.target.value }))}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'inventory' && (
                                <div className="tab-pane">
                                    <div className="vault-inventory-wrapper">
                                        <h4 className="inventory-subheading">Inventory</h4>
                                        {form.storedItems && form.storedItems.length > 0 ? (
                                            <div className="inventory-grid-table">
                                                <div className="table-header-row">
                                                    <span>Manufacturer</span>
                                                    <span>Model</span>
                                                    <span>Caliber</span>
                                                    <span>Serial Number</span>
                                                </div>
                                                {form.storedItems.map((item) => (
                                                    <div key={item.id} className="table-body-row">
                                                        <strong>{item.manufacturer}</strong>
                                                        <span>{item.model}</span>
                                                        <span className="badge badge-caliber">{item.caliber}</span>
                                                        <span className="serial-mono font-mono">{item.serialNumber || 'N/A'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-inventory-box">
                                                <span className="empty-box-symbol">🛡️</span>
                                                <h5>No Stored Items</h5>
                                                <p>To inventory an item here, select this safe as the "Storage Hub" on the item's armory card form.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="modal-footer-row-container">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowModal(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'}`}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved!' : isEditMode ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE DIALOG */}
            {deleteConfirmId && (
                <div className="modal-overlay">
                    <div className="modal-content confirmation-modal" style={{ maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '12px' }}>Delete Vault?</h3>
                        <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                            This action will permanently delete this vault. Any items assigned here will be homeless.
                        </p>
                        <div className="modal-footer-row-container" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteConfirm}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    // Recursive Tree Node Renderer
    function renderTreeNode(node, depth = 0) {
        const isExpanded = expandedNodes[node.id] !== false // default to expanded
        const hasChildren = node.children && node.children.length > 0

        return (
            <div
                key={node.id}
                className="tree-node-wrapper"
                style={{ marginLeft: `${depth * 24}px`, borderLeft: depth > 0 ? '1px dashed var(--border-color)' : 'none' }}
            >
                <div className="tree-node-strip" onClick={() => openEditModal(node)}>
                    <div className="tree-node-toggle-col">
                        {hasChildren ? (
                            <button
                                type="button"
                                className="btn-toggle-tree"
                                onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                            >
                                {isExpanded ? '▼' : '►'}
                            </button>
                        ) : (
                            <span className="leaf-bullet">•</span>
                        )}
                    </div>

                    <div className="tree-node-info-col">
                        <span className="tree-hub-icon">
                            {node.vaultCategoryName === 'Heavy Safe' ? '🔒' : '📦'}
                        </span>
                        <span className="tree-hub-name">{node.name}</span>
                        <span className="tree-hub-cat">({node.vaultCategoryName})</span>
                        {node.storedItems?.length > 0 && (
                            <span className="tree-hub-inventory-count">
                                🎯 {node.storedItems.length} stored items
                            </span>
                        )}
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="tree-node-children-subgroup">
                        {node.children.map(child => renderTreeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }
}
