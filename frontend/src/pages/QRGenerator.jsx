import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';

function Sidebar({ active, onNav, adminName, onLogout }) {
    const links = [
        { key: 'dashboard', label: 'Dashboard', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
        { key: 'submissions', label: 'Submissions', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> },
        { key: 'inventory', label: 'QR Inventory', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3M14 20h3"/></svg> },
        { key: 'generator', label: 'QR Generator', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">C</div>
                <span className="sidebar-logo-name">CoupenX</span>
                <span className="sidebar-logo-badge">ADMIN</span>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-label">Menu</div>
                {links.map(l => (
                    <button key={l.key} className={`nav-item ${active === l.key ? 'active' : ''}`}
                        onClick={() => onNav(l.key)}>
                        {l.icon}{l.label}
                    </button>
                ))}
            </div>

            <div className="sidebar-section" style={{ marginTop: 8 }}>
                <div className="sidebar-section-label">Data</div>
                <button className="nav-item" onClick={() => {
                    const t = localStorage.getItem('token');
                    window.open(`/api/admin/export?token=${t}`, '_blank');
                }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Export CSV
                </button>
            </div>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="avatar" style={{ background: '#6366f1' }}>{adminName[0].toUpperCase()}</div>
                    <div>
                        <div className="sidebar-user-name">{adminName}</div>
                        <div className="sidebar-user-role">Administrator</div>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Sign out
                </button>
            </div>
        </aside>
    );
}

const PRINT_LAYOUTS = [
    { id: 'thermal', label: 'Thermal', cols: '1fr', note: '80mm roll' },
    { id: 'compact', label: 'Compact', cols: 'repeat(6,1fr)', note: '6 per row' },
    { id: 'small', label: 'Small', cols: 'repeat(5,1fr)', note: '5 per row' },
    { id: 'medium', label: 'Medium', cols: 'repeat(3,1fr)', note: '3 per row' },
    { id: 'large', label: 'Large', cols: 'repeat(2,1fr)', note: '2 per row' },
];

export default function QRGenerator() {
    const [count, setCount] = useState(10);
    const [value, setValue] = useState(50);
    const [batch, setBatch] = useState([]);
    const [loading, setLoading] = useState(false);
    const [printLayout, setPrintLayout] = useState(null);
    const [dlCount, setDlCount] = useState('');
    const nav = useNavigate();
    const adminName = localStorage.getItem('admin') || 'Admin';

    const generate = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('/api/qr/generate', { count, value }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const withImg = await Promise.all(res.data.map(async qr => {
                const url = `${window.location.origin}/coupon/${qr.uniqueCode}`;
                const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#0f172a' } });
                return { ...qr, dataUrl };
            }));
            setBatch(withImg);
        } catch (e) {
            if (e.response?.status === 401) { localStorage.clear(); nav('/admin/login'); }
            else alert('Generation failed. Please try again.');
        } finally { setLoading(false); }
    };

    const onNav = (k) => {
        if (k === 'generator') return;
        if (k === 'inventory') nav('/admin/dashboard?view=inventory');
        else if (k === 'submissions') nav('/admin/dashboard?view=submissions');
        else nav('/admin/dashboard');
    };

    const layout = PRINT_LAYOUTS.find(l => l.id === printLayout) || PRINT_LAYOUTS[3];

    if (printLayout !== null) return (
        <div style={{ background: '#fff', minHeight: '100vh' }}>
            <div className="print-toolbar no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPrintLayout(null)}>← Back</button>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{batch.length} coupons · {layout.note}</span>
                    <div className="print-layout-btn">
                        {PRINT_LAYOUTS.map(l => (
                            <button key={l.id} className={printLayout === l.id ? 'active' : ''} onClick={() => setPrintLayout(l.id)}>{l.label}</button>
                        ))}
                    </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print
                </button>
            </div>
            <div className="print-sheet" style={{
                display: 'grid',
                gridTemplateColumns: layout.cols,
                gap: layout.id === 'thermal' ? 32 : 14,
                width: layout.id === 'thermal' ? '80mm' : '100%',
                margin: layout.id === 'thermal' ? '0 auto' : 0,
            }}>
                {batch.map(qr => (
                    <div key={qr._id} className="print-coupon">
                        <div className="print-coupon-brand">Scan &amp; Win</div>
                        <img src={qr.dataUrl} alt="QR" style={{ width: '100%', maxWidth: layout.id === 'large' ? 160 : layout.id === 'compact' ? 60 : 110 }} />
                        <div className="print-coupon-value">₹{qr.value}</div>
                        <div className="print-coupon-code">{qr.uniqueCode}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="app-shell">
            <Sidebar active="generator" onNav={onNav} adminName={adminName} onLogout={() => { localStorage.clear(); nav('/admin/login'); }} />
            
            <main className="main animate-in">
                {/* Premium Header */}
                <div className="page-header" style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--brand-bg)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
                        </div>
                        <div>
                            <div className="page-title" style={{ fontSize: 28 }}>QR Generator</div>
                            <div className="page-subtitle">Mint unique reward batches for physical distribution</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
                    {/* Main Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Configure New Batch</span>
                            </div>
                            <div className="card-body" style={{ padding: '32px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div className="form-field">
                                        <label className="form-label">Batch Quantity</label>
                                        <div style={{ position: 'relative' }}>
                                            <input className="form-input" type="number" min="1" max="500" value={count}
                                                onChange={e => setCount(Number(e.target.value))} style={{ paddingLeft: 40 }} />
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                        </div>
                                        <div className="form-hint">Number of unique coupons to create (Max 500)</div>
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">Reward Amount (₹)</label>
                                        <div style={{ position: 'relative' }}>
                                            <input className="form-input" type="number" min="1" value={value}
                                                onChange={e => setValue(Number(e.target.value))} style={{ paddingLeft: 40 }} />
                                            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontWeight: 700 }}>₹</span>
                                        </div>
                                        <div className="form-hint">Value assigned to each QR scan</div>
                                    </div>
                                </div>

                                <div className="divider" style={{ margin: '32px 0' }} />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>Ready to Mint</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Batch verified &amp; secure</div>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-lg" onClick={generate} disabled={loading} style={{ minWidth: 200 }}>
                                        {loading ? <><div className="spinner" />Minting Batch…</> : 'Generate Batch →'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Batch Preview Results */}
                        {batch.length > 0 && (
                            <div className="card animate-in">
                                <div className="card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span className="card-title">Batch Preview</span>
                                        <span className="badge badge-approved" style={{ fontSize: 11 }}>{batch.length} MINTED</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setPrintLayout('medium')}>
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                                            Print Sheet
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={() => nav('/admin/dashboard?view=inventory')}>View in Inventory</button>
                                    </div>
                                </div>
                                <div className="card-body" style={{ background: 'var(--surface-2)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                                        {batch.map(qr => (
                                            <div key={qr._id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', position: 'relative', display: 'flex', flexDirection: 'column' }}>

                                                {/* TOP — Company Name */}
                                                <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '14px 16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                    <div style={{ width: 22, height: 22, background: 'var(--brand)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'white', flexShrink: 0 }}>C</div>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>CoupenX</div>
                                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1 }}>Scan &amp; Win</div>
                                                    </div>
                                                </div>

                                                {/* Perforated separator */}
                                                <div style={{ position: 'relative', height: 1, background: 'var(--border)' }}>
                                                    <div style={{ position: 'absolute', left: -10, top: -9, width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                                                    <div style={{ position: 'absolute', right: -10, top: -9, width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                                                </div>

                                                {/* MIDDLE — QR Code */}
                                                <div style={{ padding: '18px 16px', textAlign: 'center', flex: 1, background: 'white' }}>
                                                    <img src={qr.dataUrl} alt="QR" style={{ width: '100%', maxWidth: 140, margin: '0 auto', display: 'block' }} />
                                                </div>

                                                {/* Perforated separator */}
                                                <div style={{ position: 'relative', height: 1, background: 'var(--border)', borderTop: '1px dashed var(--border-2)' }}>
                                                    <div style={{ position: 'absolute', left: -10, top: -9, width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                                                    <div style={{ position: 'absolute', right: -10, top: -9, width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                                                </div>

                                                {/* BOTTOM — ID + Amount */}
                                                <div style={{ background: '#f8fafc', padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                        <div>
                                                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Code</div>
                                                            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '0.08em' }}>{qr.uniqueCode}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reward</div>
                                                            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand)', letterSpacing: '-0.02em' }}>₹{qr.value}</div>
                                                        </div>
                                                    </div>
                                                    <a href={qr.dataUrl} download={`coupon-${qr.uniqueCode}.png`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', borderRadius: 8, background: 'var(--brand-bg)', fontSize: 11, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
                                                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l4-4m-4 4L8 8"/></svg>
                                                        Save PNG
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="card" style={{ border: 'none', background: 'var(--sidebar-bg)', color: 'white' }}>
                            <div className="card-body" style={{ padding: '24px' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--sidebar-text)', letterSpacing: '0.1em', marginBottom: 20 }}>Batch Summary</div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: 13, color: 'var(--sidebar-text)' }}>Quantity</div>
                                        <div style={{ fontSize: 20, fontWeight: 700 }}>{count} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--sidebar-text)' }}>Units</span></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: 13, color: 'var(--sidebar-text)' }}>Unit Value</div>
                                        <div style={{ fontSize: 20, fontWeight: 700 }}>₹{value}</div>
                                    </div>
                                    <div className="divider" style={{ background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                                    <div>
                                        <div style={{ fontSize: 12, color: 'var(--sidebar-text)', marginBottom: 4 }}>Total Exposure</div>
                                        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand-light)' }}>₹{(count * value).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header"><span className="card-title">Download Pack</span></div>
                            <div className="card-body">
                                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Download as a high-resolution ZIP for professional printing.</p>
                                <div className="form-field">
                                    <label className="form-label">Specific Count</label>
                                    <input className="form-input" type="number" placeholder="All coupons" value={dlCount}
                                        onChange={e => setDlCount(e.target.value)} />
                                </div>
                                <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => {
                                    const t = localStorage.getItem('token');
                                    const c = dlCount ? `&count=${dlCount}` : '';
                                    window.open(`/api/qr/download-zip?token=${t}${c}`, '_blank');
                                }}>
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    Export ZIP Archive
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
