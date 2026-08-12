import React from 'react'

export default function BatteryTracker({ hasBattery, form, setForm }) {
    if (!hasBattery) return null

    return (
        <div className="form-item-group-container" style={{ gridColumn: 'span 2', background: 'rgba(58, 190, 240, 0.03)', border: '1px solid rgba(58, 190, 240, 0.15)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginTop: '4px', marginBottom: '12px' }}>
            <h4 style={{ color: '#3abef0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px 0', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>🔋</span> Power & Battery Specifications
            </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                {/* 2. Battery Last Changed */}
                <div className="form-item">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Battery Last Changed</label>
                    <input
                        type="date"
                        value={form.batteryLastChangedDate || ''}
                                            onChange={(e) => setForm(prev => ({ ...prev, batteryLastChangedDate: e.target.value }))}
                    />
                </div>

                {/* 3. Battery Expiration Date */}
                <div className="form-item">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Battery Expiration Date</label>
                    <input
                        type="date"
                        value={form.batteryExpirationDate || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, batteryExpirationDate: e.target.value }))}
                    />
                </div>

            </div>
        </div>
    )
}