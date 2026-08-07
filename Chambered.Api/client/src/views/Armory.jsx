import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useStore } from '../StoreContext'
import './Armory.css'

export default function Armory() {
    const store = useStore()
    const { enums } = store

    // Memoized dynamic enums strictly loaded from the database
    const actionTypes = useMemo(() => {
        if (enums && enums.actionTypes) {
            return enums.actionTypes.map(e => e.label);
        }
        return [];
    }, [enums]);

    const conditions = useMemo(() => {
        if (enums && enums.itemConditions) {
            return enums.itemConditions.map(e => e.label);
        }
        return [];
    }, [enums]);

    // State lists
    const [armoryItems, setArmoryItems] = useState([])
    const [vaultLocations, setVaultLocations] = useState([])
    const [ammoLots, setAmmoLots] = useState([])
    const [products, setProducts] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Filter conditions
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCaliber, setFilterCaliber] = useState('')
    const [filterAction, setFilterAction] = useState('')

    // Modal control & edit mode state
    const [showModal, setShowModal] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [activeTab, setActiveTab] = useState('general')


    // Form State
    const [form, setForm] = useState({
        id: 0,
        pewpewModelId: 0,
        arsenalId: '',
        manufacturer: '',
        model: '',
        caliber: '',
        barrelLengthInches: '',
        twistRate: '',
        actionType: '',
        serialNumber: '',
        notes: '',
        purchasePrice: '',
        purchaseDateString: '',
        currentValue: '',
        condition: '',
        imageUrl: '',
        roundCount: 0,
        beneficiary: '',
        beneficiaryId: '',
        storageLocation: '',
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
    const [showSerial, setShowSerial] = useState(false)
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
    const [saveSuccess, setSaveSuccess] = useState(false)

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

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/settings/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (err) {
            console.error('Failed to fetch users', err)
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

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products?type=PewPew')
            if (res.ok) {
                setProducts(await res.json())
            }
        } catch (err) {
            console.error('Failed to load products', err)
        }
    }


    useEffect(() => {
        fetchArmoryItems()
        fetchVaultLocations()
        fetchAmmoLots()
        fetchProducts()
        fetchUsers()
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
        return armoryItems.filter(item => {
            const textMatch = !searchQuery ||
                [item.manufacturer, item.model, item.serialNumber, item.caliber]
                    .some(v => v && v.toLowerCase().includes(searchQuery.toLowerCase()))

            const caliberMatch = !filterCaliber || item.caliber === filterCaliber
            const actionMatch = !filterAction || item.actionType === filterAction

            return textMatch && caliberMatch && actionMatch
        })
    }, [armoryItems, searchQuery, filterCaliber, filterAction])

    const filteredAmmoLots = useMemo(() => {
        if (!form.caliber) return []
        return ammoLots.filter(lot => {
            const lotCaliber = lot.caliber || lot.cartridge?.name || "";
            return lotCaliber.toLowerCase() === form.caliber.toLowerCase();
        })
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
                setArmoryItems(prev => prev.map(item => item.id === id ? { ...item, roundCount: data.roundCount } : item))
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
        setShowSerial(false)
        setCoverSourceType('web')
        setAccessoriesList([])
        setMaintenanceTasks([])
        setRangeSessions([])
        setAttachments([])

        setForm({
            id: 0,
            pewpewModelId: 0,
            arsenalId: store.activeArsenalId || (store.arsenals[0]?.id || 1),
            manufacturer: '',
            model: '',
            caliber: '',
            barrelLengthInches: '',
            twistRate: '',
            actionType: '',
            serialNumber: '',
            notes: '',
            purchasePrice: '',
            purchaseDateString: '',
            currentValue: '',
            condition: 'Good (90%)',
            imageUrl: '',
            roundCount: 0,
            owner: '',
            ownerId: '',
            beneficiary: '',
            beneficiaryId: '',
            storageLocation: '',
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

    const openEditModal = (item) => {
        setIsEditMode(true)
        setActiveTab('general')
        setCustomManufacturer('')
        setCustomModel('')
        setCoverSourceType('web')
        setShowSerial(false)

        let dateString = ''
        if (item.purchaseDate) {
            dateString = item.purchaseDate.split('T')[0]
        }

        setForm({
            ...item,
            pewpewModelId: item.pewpewModelId || 0,
            arsenalId: item.arsenalId || store.activeArsenalId || 1,
            purchaseDateString: dateString,
            owner: item.owner || '',
            ownerId: item.ownerId || '',
            beneficiary: item.beneficiary || '',
            beneficiaryId: item.beneficiaryId || '',
            storageLocation: item.storageLocation || '',
            notesMarkdown: item.notesMarkdown || '',
            opticManufacturer: item.opticManufacturer || '',
            opticModel: item.opticModel || '',
            opticReticle: item.opticReticle || '',
            opticSerial: item.opticSerial || '',
            opticBattery: item.opticBattery || '',
            isOpticMounted: item.isOpticMounted || false
        })

        try {
            setAccessoriesList(item.accessoriesListJson ? JSON.parse(item.accessoriesListJson) : [])
        } catch (err) {
            setAccessoriesList([])
        }

        try {
            setMaintenanceTasks(item.maintenanceTasksJson ? JSON.parse(item.maintenanceTasksJson) : [])
        } catch (err) {
            setMaintenanceTasks([])
        }

        try {
            setRangeSessions(item.rangeHistoryJson ? JSON.parse(item.rangeHistoryJson) : [])
        } catch (err) {
            setRangeSessions([])
        }

        setAttachments([])

        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
    }

    const handleProductSelectChange = (e) => {
        const prodId = parseInt(e.target.value) || 0
        if (prodId > 0) {
            const p = products.find(prod => prod.id === prodId)
            if (p) {
                setForm(prev => ({
                    ...prev,
                    pewpewModelId: p.id,
                    manufacturer: p.manufacturerName || '',
                    model: p.model || '',
                    caliber: p.caliberName || '',
                    actionType: p.actionType || ''
                }))
            }
        } else {
            setForm(prev => ({
                ...prev,
                pewpewModelId: 0,
                manufacturer: '',
                model: '',
                caliber: '',
                actionType: ''
            }))
        }
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
        if (!form.pewpewModelId || form.pewpewModelId <= 0) {
            alert('Please select a product before saving.')
            return
        }

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
                arsenalId: parseInt(form.arsenalId) || store.activeArsenalId,
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
                const savedItem = await res.json()
                setIsEditMode(true)

                let dateString = ''
                if (savedItem.purchaseDate) {
                    dateString = savedItem.purchaseDate.split('T')[0]
                }

                setForm({
                    ...savedItem,
                    purchaseDateString: dateString,
                    owner: savedItem.owner || '',
                    ownerId: savedItem.ownerId || '',
                    beneficiary: savedItem.beneficiary || '',
                    beneficiaryId: savedItem.beneficiaryId || '',
                    storageLocation: savedItem.storageLocation || '',
                    notesMarkdown: savedItem.notesMarkdown || '',
                    opticManufacturer: savedItem.opticManufacturer || '',
                    opticModel: savedItem.opticModel || '',
                    opticReticle: savedItem.opticReticle || '',
                    opticSerial: savedItem.opticSerial || '',
                    opticBattery: savedItem.opticBattery || '',
                    isOpticMounted: savedItem.isOpticMounted || false
                })

                try {
                    setAccessoriesList(savedItem.accessoriesListJson ? JSON.parse(savedItem.accessoriesListJson) : [])
                } catch (err) {
                    setAccessoriesList([])
                }

                try {
                    setMaintenanceTasks(savedItem.maintenanceTasksJson ? JSON.parse(savedItem.maintenanceTasksJson) : [])
                } catch (err) {
                    setMaintenanceTasks([])
                }

                try {
                    setRangeSessions(savedItem.rangeHistoryJson ? JSON.parse(savedItem.rangeHistoryJson) : [])
                } catch (err) {
                    setRangeSessions([])
                }

                setAttachments([])
                setCustomManufacturer('')
                setCustomModel('')

                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 2000)
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

    // Triggers when you click "Remove" on the card
    const handleDeleteClick = (id, e) => {
        e.stopPropagation()
        setDeleteConfirmId(id) // Stores the ID of the item you want to delete and opens the modal
    }

    // Triggers when you click "Yes, Delete" in the confirmation modal
    const handleDeleteConfirm = async () => {
        if (!deleteConfirmId) return
        try {
            const res = await fetch(`/api/armory/${deleteConfirmId}`, { method: 'DELETE' })
            if (res.ok) {
                setArmoryItems(prev => prev.filter(f => f.id !== deleteConfirmId))
            } else {
                alert('Delete failed.')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setDeleteConfirmId(null) // Resets state, closing the modal
        }
    }

    const isCompactUnit = (action) => {
        if (!action) return false
        const l = action.toLowerCase()
        return l.includes('pistol') || l.includes('revolver') || l.includes('sidearm') || l.includes('semi-automatic')
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
                <button onClick={openCreateModal} className="btn btn-primary">Add Item</button>
            </section>

            {/* Grid Display */}
            {filteredArmoryItems.length === 0 ? (
                <div className="empty-state panel">
                    <h3>You have no items in your Armory.</h3>
                    <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>Click 'Add Item' above to add your first item.</p>
                </div>
            ) : (
                <section className="items-grid">
                    {filteredArmoryItems.map((item) => (
                        <div key={item.id} className="item-card" onClick={() => openEditModal(item)}>
                            <div className="item-header-img">
                                <span className="item-action-type">{item.actionType}</span>
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} className="active-cover-img" alt={item.model} />
                                ) : (
                                    <div className="item-silhouette">
                                        {isCompactUnit(item.actionType) ? '🛡️' : '🛡️'}
                                    </div>
                                )}
                                <span className={`badge item-badge-condition ${getConditionClass(item.condition)}`}>
                                    {item.condition}
                                </span>
                            </div>

                            <div className="item-card-body">
                                <div className="item-title-row">
                                    <h4 className="item-title">{item.manufacturer} {item.model}</h4>
                                    <span className="item-caliber">{item.caliber}</span>
                                </div>

                                <div className="item-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Storage Hub</span>
                                        <span className="detail-value">{item.storageLocation || ''}</span>
                                    </div>
                                    {item.purchasePrice && (
                                        <div className="detail-row">
                                            <span className="detail-label">Valuation</span>
                                            <span className="detail-value gold-text">${formatCurrency(item.purchasePrice)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="item-card-actions">
                                    <button onClick={(e) => handleDeleteClick(item.id, e)} className="btn btn-danger btn-small">Remove</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Identical Audiobookshelf tabs modal overlay */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="armory-center-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title-bar">
                            <div className="title-left">
                                <span className="modal-title-icon">🔥</span>
                                <h3>{isEditMode ? 'Edit Item' : 'Add New Item'}</h3>
                            </div>
                            <button className="modal-close-x-btn" onClick={closeModal}>×</button>
                        </div>

                        {/* Modal Tabs strip */}
                        <div className="modal-tabs-header-row">
                            <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
                        </div>

                        {/* Scrollable Modal content wrapper */}
                        <div className="modal-tabs-body-content">
                            {/* TAB 1: General Specs */}
                            {activeTab === 'general' && (
                                <div className="tab-pane">
                                    <div className="form-grid-columns">
                                        <div className="form-item" style={{ gridColumn: 'span 2' }}>
                                            <label>Select product from Catalog</label>
                                            <select
                                                value={form.pewpewModelId || ''}
                                                onChange={handleProductSelectChange}
                                                style={{ border: form.pewpewModelId ? '1px solid var(--color-success)' : '1px solid var(--border-solid)' }}
                                            >
                                                <option value="">-- Choose product --</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.manufacturerName} {p.model} {p.partNumber ? `[PN: ${p.partNumber}]` : ''} ({p.caliberName}) — {p.actionType}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {form.pewpewModelId > 0 && (
                                            <div className="specifications-card" style={{ gridColumn: 'span 2', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginTop: '4px', marginBottom: '12px' }}>
                                                <h4 style={{ color: 'var(--color-primary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0', fontWeight: '700' }}>Product Specs</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '13px' }}>
                                                    <div><strong style={{ color: 'var(--text-muted)' }}>Manufacturer:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{form.manufacturer}</span></div>
                                                    <div><strong style={{ color: 'var(--text-muted)' }}>Model Name:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{form.model}</span></div>
                                                    <div><strong style={{ color: 'var(--text-muted)' }}>Caliber:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{form.caliber}</span></div>
                                                    <div><strong style={{ color: 'var(--text-muted)' }}>Action Type:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{form.actionType}</span></div>
                                                </div>
                                            </div>
                                        )}


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
                                            <label>Serial Number <span style={{ color: 'green' }}>(256-AES Encryption)</span></label>
                                            <div className="passcode-input-wrapper">
                                                <input
                                                    type={showSerial ? "text" : "password"}
                                                    className="passcode-field"
                                                    placeholder="Decrypted serial number..."
                                                    value={form.serialNumber || ''}
                                                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary passcode-reveal-btn"
                                                    onClick={() => setShowSerial(!showSerial)}
                                                >
                                                    {showSerial ? 'Hide 🔒' : 'Show 👁️'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-item">
                                            <label>Operation Condition</label>
                                            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                                                {conditions.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-item">
                                            <label>Vault</label>
                                            <select value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}>
                                                {vaultLocations.map(loc => (
                                                    <option key={loc.name} value={loc.name}>{loc.name} ({loc.securityLevel})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-item">
                                            <label>Arsenal</label>
                                            <select
                                                value={form.arsenalId || ''}
                                                onChange={(e) => setForm(prev => ({ ...prev, arsenalId: e.target.value }))}
                                                required
                                            >
                                                {store.arsenals.map(ars => (
                                                    <option key={ars.id} value={ars.id}>{ars.name}</option>
                                                ))}
                                            </select>
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
                                            <label>Designated Owner</label>
                                            <select
                                                value={form.ownerId || ''}
                                                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                                            >
                                                <option value="">-- No Owner Assigned --</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.username} ({u.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-item full-row">
                                            <label>Beneficiary</label>
                                            <select
                                                value={form.beneficiaryId || ''}
                                                onChange={(e) => setForm({ ...form, beneficiaryId: e.target.value })}
                                            >
                                                <option value="">-- No Beneficiary Assigned --</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.username} ({u.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="modal-footer-row-container">
                            <button className="btn btn-secondary" onClick={closeModal} disabled={isSaving}>Cancel</button>
                            <button className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'}`} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved!' : isEditMode ? 'Update' : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {deleteConfirmId && (
                <div className="modal-overlay">
                    <div className="modal-content confirmation-modal" style={{ maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '12px' }}>Are you sure?</h3>
                        <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                            This action will permanently delete this item from your armory. This cannot be undone.
                        </p>
                        <div className="modal-footer-row-container" style={{ marginTop: '0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteConfirm}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}