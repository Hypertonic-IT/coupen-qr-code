import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import { writeBluetoothChunks, buildCouponPrintJob } from '../utils/thermalPrinter';

const COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

function QRCodeCanvas({ value, variant = 'medium' }) {
    const [imgUrl, setImgUrl] = React.useState('');

    const sizeMap = {
        thermal: 110,
        compact: 55,
        small: 70,
        medium: 95,
        large: 125,
    };
    const size = sizeMap[variant] || 95;

    React.useEffect(() => {
        let active = true;
        QRCode.toDataURL(value, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }).then(url => {
            if (active) setImgUrl(url);
        }).catch(err => {
            console.error(err);
        });
        return () => { active = false; };
    }, [value]);

    if (!imgUrl) {
        return <div style={{ display: 'block', margin: '6px auto', width: `${size}px`, height: `${size}px`, background: '#f1f5f9', borderRadius: '4px' }} />;
    }

    return (
        <img
            src={imgUrl}
            alt="QR"
            style={{
                display: 'block',
                margin: '6px auto',
                width: `${size}px`,
                height: `${size}px`,
                objectFit: 'contain'
            }}
        />
    );
}

// ── Time Helpers ──
function getRelativeTime(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays/7)>1?'s':''} ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getTimeGroup(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (diffMins < 5) return '🟢 Last 5 minutes';
    if (diffMins < 30) return '🕐 Last 30 minutes';
    if (diffHours < 1) return '🕐 Last hour';
    if (isToday) return '📅 Today';
    if (isYesterday) return '📅 Yesterday';
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 7) return '📆 This Week';
    if (diffDays < 30) return '🗓 This Month';
    return '🗂 Older';
}

const TIME_FILTERS = [
    { key: 'all', label: 'All Time' },
    { key: '5min', label: 'Last 5 Min' },
    { key: '30min', label: 'Last 30 Min' },
    { key: '1hr', label: 'Last Hour' },
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
];

function applyTimeFilter(coupons, key) {
    if (key === 'all') return coupons;
    const now = new Date();
    return coupons.filter(c => {
        const date = new Date(c.createdAt);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        if (key === '5min') return diffMins < 5;
        if (key === '30min') return diffMins < 30;
        if (key === '1hr') return diffHours < 1;
        if (key === 'today') return date.toDateString() === now.toDateString();
        if (key === 'yesterday') return date.toDateString() === yesterday.toDateString();
        if (key === 'week') return diffDays < 7;
        if (key === 'month') return diffDays < 30;
        return true;
    });
}

function Sidebar({ active, onNav, adminName, onLogout }) {
    const links = [
        { key: 'dashboard', label: 'Dashboard', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
        { key: 'submissions', label: 'Submissions', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> },
        { key: 'inventory', label: 'QR Inventory', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3M14 20h3"/></svg> },
        { key: 'generator', label: 'QR Generator', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> },
        { key: 'settings', label: 'Settings', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
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

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalQR: 0, usedQR: 0, printedQR: 0, unusedQR: 0, totalValue: 0 });
    const [submissions, setSubmissions] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'submissions', 'inventory'
    const [filter, setFilter] = useState('');
    const [tab, setTab] = useState('all');
    const [selected, setSelected] = useState([]);
    const [previewQR, setPreviewQR] = useState(null);
    const [printData, setPrintData] = useState(null);
    const [printSize, setPrintSize] = useState('medium');
    const location = useLocation();
    const nav = useNavigate();
    const [adminName, setAdminName] = useState(localStorage.getItem('admin') || 'Admin');
    const [timeFilter, setTimeFilter] = useState('all');
    const [newProfile, setNewProfile] = useState({ username: '', password: '' });
    const [profileUpdating, setProfileUpdating] = useState(false);

    // ── Web Bluetooth Direct Print States ──
    const [bleDevice, setBleDevice] = useState(null);
    const [bleChar, setBleChar] = useState(null);
    const [connectingBle, setConnectingBle] = useState(false);
    const [isPrintingBle, setIsPrintingBle] = useState(false);

    const connectBluetooth = async () => {
        setConnectingBle(true);
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
                    { namePrefix: 'Printer' },
                    { namePrefix: 'POS' },
                    { namePrefix: 'MTP' },
                    { namePrefix: 'ZJ' }
                ],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const characteristics = await service.getCharacteristics();
            const writeChar = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

            if (!writeChar) {
                throw new Error('Could not find a writeable channel on this printer.');
            }

            setBleDevice(device);
            setBleChar(writeChar);

            device.addEventListener('gattserverdisconnected', () => {
                setBleDevice(null);
                setBleChar(null);
            });

            alert(`Connected to thermal printer: ${device.name}`);
        } catch (e) {
            console.error(e);
            if (e.name !== 'NotFoundError') {
                alert('Bluetooth printer connection failed: ' + e.message);
            }
        } finally {
            setConnectingBle(false);
        }
    };

    const disconnectBluetooth = () => {
        if (bleDevice && bleDevice.gatt.connected) {
            bleDevice.gatt.disconnect();
        }
        setBleDevice(null);
        setBleChar(null);
    };

    const printViaBluetooth = async (items) => {
        if (!bleChar) return alert('Please connect a Bluetooth thermal printer first!');
        setIsPrintingBle(true);
        try {
            const printBytes = buildCouponPrintJob(items, printSize);
            await writeBluetoothChunks(bleChar, printBytes);
            alert('Direct print job sent successfully to thermal printer!');
            
            // Mark them as printed in backend
            const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
            await axios.post('/api/qr/mark-printed', { ids: items.map(c => c._id) }, { headers: h });
            
            load();
            setSelected([]);
        } catch (e) {
            console.error(e);
            alert('Printing failed: ' + e.message);
        } finally {
            setIsPrintingBle(false);
        }
    };

    useEffect(() => {
        const p = new URLSearchParams(location.search).get('view');
        if (p === 'inventory') setView('inventory');
        else if (p === 'submissions') setView('submissions');
        else if (p === 'settings') setView('settings');
        else setView('dashboard');
    }, [location]);

    useEffect(() => { load(); }, [view]);

    const load = async (silent = false) => {
        const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        if (!silent) setLoading(true);
        try {
            const [s, sub, qr] = await Promise.all([
                axios.get('/api/admin/stats', { headers: h }),
                axios.get('/api/admin/submissions', { headers: h }),
                axios.get('/api/qr', { headers: h }),
            ]);
            setStats(s.data); setSubmissions(sub.data); setCoupons(qr.data);
        } catch (e) {
            if (e.response?.status === 401) { localStorage.clear(); nav('/admin/login'); }
        } finally { if (!silent) setLoading(false); }
    };

    // Auto-refresh data every 10 seconds for real-time feel
    useEffect(() => {
        const interval = setInterval(() => {
            load(true); // Silent reload
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleExport = () => {
        const t = localStorage.getItem('token');
        window.open(`/api/admin/export?token=${t}`, '_blank');
    };

    const updateStatus = async (id, status) => {
        const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        await axios.patch('/api/admin/update-status', { submissionId: id, status }, { headers: h });
        load();
    };

    const deleteOne = async (id) => {
        if (!confirm('Delete this coupon and its submissions?')) return;
        const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        await axios.delete(`/api/qr/${id}`, { headers: h });
        load();
    };

    const bulkDelete = async () => {
        if (!confirm(`Delete ${selected.length} coupons?`)) return;
        const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        await axios.post('/api/qr/bulk-delete', { ids: selected }, { headers: h });
        setSelected([]); load();
    };

    const showQR = async (code) => {
        const url = `${window.location.origin}/coupon/${code}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 400 });
        setPreviewQR({ code, dataUrl });
    };

    const doPrint = () => {
        const items = coupons.filter(c => selected.includes(c._id));
        if (!items.length) return alert('Select coupons first');
        setPrintData(items);
    };

    const downloadSelected = () => {
        const t = localStorage.getItem('token');
        window.open(`/api/qr/download-zip?token=${t}&ids=${selected.join(',')}`, '_blank');
        setTimeout(() => {
            load();
            setSelected([]);
        }, 1500);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!newProfile.username && !newProfile.password) return alert('Please enter a new username or password');
        
        setProfileUpdating(true);
        const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        try {
            const res = await axios.patch('/api/admin/profile', newProfile, { headers: h });
            if (newProfile.username) {
                localStorage.setItem('admin', newProfile.username);
                setAdminName(newProfile.username);
            }
            alert(res.data.message || 'Profile updated successfully!');
            setNewProfile({ username: '', password: '' });
        } catch (err) {
            console.error('Update error:', err);
            if (err.response?.status === 401) {
                localStorage.clear();
                nav('/admin/login');
                return;
            }
            alert(err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setProfileUpdating(false);
        }
    };

    const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll = list => setSelected(selected.length === list.length ? [] : list.map(c => c._id));

    const pending = submissions.filter(s => s.status === 'pending').length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const paid = submissions.filter(s => s.status === 'paid').length;
    const usagePct = stats.totalQR > 0 ? Math.round((stats.usedQR / stats.totalQR) * 100) : 0;

    const today = new Date();
    const hour = today.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const filteredSubs = submissions
        .filter(s => s.name?.toLowerCase().includes(filter.toLowerCase()) || s.mobile?.includes(filter) || s.qrId?.uniqueCode?.includes(filter))
        .filter(s => tab === 'all' ? true : s.status === tab);

    const filteredCoupons = applyTimeFilter(
        coupons
            .filter(c => c.uniqueCode?.toLowerCase().includes(filter.toLowerCase()) || c.value?.toString().includes(filter))
            .filter(c => {
                if (tab === 'all') return true;
                if (tab === 'used') return c.isUsed;
                if (tab === 'printed') return c.isDownloaded && !c.isUsed;
                if (tab === 'unused') return !c.isDownloaded && !c.isUsed;
                return true;
            }),
        timeFilter
    );

    // Group by time period
    const groupedCoupons = filteredCoupons.reduce((acc, c) => {
        const group = getTimeGroup(c.createdAt);
        if (!acc[group]) acc[group] = [];
        acc[group].push(c);
        return acc;
    }, {});
    const groupOrder = ['🟢 Last 5 minutes','🕐 Last 30 minutes','🕐 Last hour','📅 Today','📅 Yesterday','📆 This Week','🗓 This Month','🗂 Older'];
    const sortedGroups = groupOrder.filter(g => groupedCoupons[g]);

    const cols = printSize === 'thermal' ? '1fr' : printSize === 'compact' ? 'repeat(6,1fr)' : printSize === 'small' ? 'repeat(5,1fr)' : printSize === 'large' ? 'repeat(2,1fr)' : 'repeat(3,1fr)';

    const onNav = (k) => {
        setFilter(''); setTab('all');
        if (k === 'generator') nav('/admin/qr-generator');
        else if (k === 'inventory') nav('/admin/dashboard?view=inventory');
        else if (k === 'submissions') nav('/admin/dashboard?view=submissions');
        else if (k === 'settings') nav('/admin/dashboard?view=settings');
        else nav('/admin/dashboard');
    };

    if (printData) return (
        <div style={{ background: '#fff', minHeight: '100vh' }}>
            <div className="print-toolbar no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPrintData(null)}>← Back</button>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{printData.length} coupons</span>
                    <div className="print-layout-btn">
                        {['thermal','compact','small','medium','large'].map(s => (
                            <button key={s} className={printSize === s ? 'active' : ''} onClick={() => setPrintSize(s)}
                                style={{ textTransform: 'capitalize' }}>{s}</button>
                        ))}
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {bleDevice ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 8px var(--green)' }} />
                                Connected: {bleDevice.name}
                            </span>
                            <button className="btn btn-secondary btn-sm" onClick={disconnectBluetooth} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                                Disconnect
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => printViaBluetooth(printData)} disabled={isPrintingBle} style={{ background: 'var(--green)', borderColor: 'var(--green)' }}>
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                {isPrintingBle ? 'Printing...' : 'Direct Print (BLE)'}
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-secondary btn-sm" onClick={connectBluetooth} disabled={connectingBle}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m-3 0h3"/></svg>
                            {connectingBle ? 'Connecting...' : 'Connect Thermal Printer'}
                        </button>
                    )}

                    <button className="btn btn-primary btn-sm" onClick={async () => {
                        window.print();
                        try {
                            const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
                            await axios.post('/api/qr/mark-printed', { ids: printData.map(c => c._id) }, { headers: h });
                            load();
                        } catch (e) {
                            console.error("Failed to mark printed:", e);
                        }
                    }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Standard Print
                    </button>
                </div>
            </div>
            <div className="print-sheet" style={{ display: 'grid', gridTemplateColumns: cols, gap: printSize === 'thermal' ? 32 : 12, width: printSize === 'thermal' ? '80mm' : '100%', margin: printSize === 'thermal' ? '0 auto' : 0 }}>
                {printData.map(qr => (
                    <div key={qr._id} className="print-coupon">
                        <div className="print-coupon-brand">Scan &amp; Win</div>
                        <QRCodeCanvas value={`${window.location.origin}/coupon/${qr.uniqueCode}`} variant={printSize} />
                        <div className="print-coupon-value">₹{qr.value}</div>
                        <div className="print-coupon-code">{qr.uniqueCode}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading dashboard…</p>
        </div>
    );

    return (
        <div className="app-shell">
            <Sidebar active={view} onNav={onNav} adminName={adminName} onLogout={() => { localStorage.clear(); nav('/admin/login'); }} />

            <main className="main animate-in">
                {/* Header */}
                {/* Header & Stats (Hide in Settings) */}
                {view !== 'settings' && (
                    <>
                        <div className="page-header">
                            <div>
                                <div className="page-title">{greeting}, {adminName} 👋</div>
                                <div className="page-subtitle">{today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                            <button className="btn btn-primary" onClick={() => nav('/admin/qr-generator')}>
                                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                                New Batch
                            </button>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 000 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 000-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2z"/></svg></div>
                                <div className="stat-label">Total Coupons</div>
                                <div className="stat-value">{stats.totalQR.toLocaleString()}</div>
                                <div className="stat-meta"><strong style={{ color: 'var(--green)' }}>{stats.unusedQR}</strong> available · <strong style={{ color: 'var(--blue, #3b82f6)' }}>{stats.printedQR || 0}</strong> printed · {stats.usedQR} used</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div>
                                <div className="stat-label">Redemption Rate</div>
                                <div className="stat-value">{usagePct}<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-3)' }}>%</span></div>
                                <div className="progress-bar"><div className="progress-fill" style={{ width: `${usagePct}%` }} /></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8M12 18V6"/></svg></div>
                                <div className="stat-label">Value Distributed</div>
                                <div className="stat-value">₹{stats.totalValue.toLocaleString()}</div>
                                <div className="stat-meta">Across {submissions.length} claims</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                                <div className="stat-label">Pending Claims</div>
                                <div className="stat-value" style={{ color: pending > 0 ? 'var(--amber)' : 'var(--text-1)' }}>{pending}</div>
                                <div className="stat-meta">{pending > 0 ? 'Requires attention' : 'All caught up ✓'}</div>
                            </div>
                        </div>
                    </>
                )}

                {/* Dashboard View */}
                {view === 'dashboard' && (
                    <div className="animate-in">
                        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24 }}>
                            {/* Left Col: Welcome + Recent Activity */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div className="card" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', padding: '32px' }}>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: 'white' }}>Welcome to CoupenX Admin</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, maxWidth: '400px' }}>
                                        Manage your QR campaigns, track redemptions, and process rewards in one place.
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => nav('/admin/qr-generator')}>+ Generate New QR</button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} onClick={handleExport}>Download CSV</button>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header">
                                        <span className="card-title">Recent Activity</span>
                                        <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/dashboard?view=submissions')}>View All</button>
                                    </div>
                                    <div className="card-body" style={{ padding: 0 }}>
                                        {submissions.slice(0, 5).map((s, i) => (
                                            <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: i === 4 ? 'none' : '1px solid var(--border)' }}>
                                                <div className="avatar" style={{ background: COLORS[i % COLORS.length], width: 36, height: 36 }}>{s.name?.[0]?.toUpperCase()}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name} <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 13 }}>claimed</span> ₹{s.qrId?.value}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{getRelativeTime(s.createdAt)}</div>
                                                </div>
                                                <span className={`badge badge-${s.status}`} style={{ fontSize: 10 }}>{s.status}</span>
                                            </div>
                                        ))}
                                        {submissions.length === 0 && (
                                            <div className="empty-state" style={{ padding: '40px' }}>
                                                <p>No recent activity</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Quick Stats & Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div className="card">
                                    <div className="card-header"><span className="card-title">Quick Actions</span></div>
                                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <button className="nav-item" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }} onClick={() => nav('/admin/qr-generator')}>
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
                                            Generate New Batch
                                        </button>
                                        <button className="nav-item" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }} onClick={() => nav('/admin/dashboard?view=inventory')}>
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                                            Manage Inventory
                                        </button>
                                        <button className="nav-item" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }} onClick={handleExport}>
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4"/></svg>
                                            Download Reports
                                        </button>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header"><span className="card-title">System Health</span></div>
                                    <div className="card-body">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Redemption Load</span>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{usagePct}%</span>
                                        </div>
                                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${usagePct}%` }} /></div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, marginTop: 24 }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Pending Verification</span>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{pending}</span>
                                        </div>
                                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(100, (pending/submissions.length || 0)*100)}%`, background: 'var(--amber)' }} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submissions */}
                {view === 'submissions' && (
                    <div className="card animate-in">
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flex: 1 }}>
                                <span className="card-title">Recent Submissions</span>
                                <div className="tabs">
                                    {[['all','All',submissions.length],['pending','Pending',pending],['approved','Approved',approved],['paid','Paid',paid]].map(([k,l,c]) => (
                                        <button key={k} className={`tab-btn ${tab===k?'active':''}`} onClick={() => setTab(k)}>
                                            {l}<span className="tab-count">{c}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="search-box" style={{ width: 240 }}>
                                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                <input className="form-input" placeholder="Search…" value={filter} onChange={e => setFilter(e.target.value)} />
                            </div>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Claimant</th>
                                        <th>Payment</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubs.length > 0 ? filteredSubs.map((s, i) => (
                                        <tr key={s._id} onClick={() => nav(`/admin/customer/${s._id}`)}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar" style={{ background: COLORS[i % COLORS.length] }}>{s.name?.[0]?.toUpperCase()}</div>
                                                    <div>
                                                        <div className="user-name">{s.name}</div>
                                                        <div className="user-sub">{s.mobile}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 2 }}>{s.accountType?.replace('_',' ')}</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                                                    {s.accountType === 'AccountNumber' ? `${s.bankName} · ${s.accountNumber}` : s.accountValue}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="amount-cell">₹{s.qrId?.value || 0}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{s.qrId?.uniqueCode}</div>
                                            </td>
                                            <td style={{ color: 'var(--text-3)', fontSize: 13 }}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <span className={`badge badge-${s.status}`}>
                                                    <span className="badge-dot" />{s.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                <select className="form-select" style={{ width: 'auto', fontSize: 12, padding: '5px 28px 5px 10px' }}
                                                    value={s.status} onChange={e => updateStatus(s._id, e.target.value)}>
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approve</option>
                                                    <option value="rejected">Reject</option>
                                                    <option value="paid">Mark Paid</option>
                                                </select>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6">
                                            <div className="empty-state">
                                                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--border-2)" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                                                <h3>No submissions found</h3>
                                                <p>Try a different filter or search term.</p>
                                            </div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Inventory */}
                {view === 'inventory' && (
                    <div className="card animate-in">
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flex: 1 }}>
                                <span className="card-title">QR Inventory</span>
                                {/* BLE Printer Pill */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: bleDevice ? 'var(--green)' : 'var(--text-3)', display: 'inline-block', boxShadow: bleDevice ? '0 0 8px var(--green)' : 'none' }} />
                                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)' }}>
                                        {bleDevice ? `Printer: ${bleDevice.name}` : 'BT Printer Offline'}
                                    </span>
                                    <button onClick={bleDevice ? disconnectBluetooth : connectBluetooth} style={{ background: 'transparent', color: bleDevice ? 'var(--red)' : 'var(--brand)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', paddingLeft: 4 }}>
                                        {bleDevice ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                                <div className="tabs" style={{ marginLeft: 8 }}>
                                    {[['all','All',coupons.length],['unused','Available',stats.unusedQR],['printed','Printed',stats.printedQR || 0],['used','Redeemed',stats.usedQR]].map(([k,l,c]) => (
                                        <button key={k} className={`tab-btn ${tab===k?'active':''}`} onClick={() => setTab(k)}>
                                            {l}<span className="tab-count">{c}</span>
                                        </button>
                                    ))}
                                </div>
                                {selected.length > 0 && (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={downloadSelected}>↓ ZIP ({selected.length})</button>
                                        <button className="btn btn-secondary btn-sm" onClick={doPrint}>Print Preview</button>
                                        {bleChar ? (
                                            <button className="btn btn-primary btn-sm" onClick={() => printViaBluetooth(coupons.filter(c => selected.includes(c._id)))} disabled={isPrintingBle} style={{ background: 'var(--green)', borderColor: 'var(--green)' }}>
                                                Direct Print (BLE) ({selected.length})
                                            </button>
                                        ) : (
                                            <button className="btn btn-secondary btn-sm" onClick={connectBluetooth} disabled={connectingBle}>
                                                Connect Printer &amp; Print Direct
                                            </button>
                                        )}
                                        <button className="btn btn-danger btn-sm" onClick={bulkDelete}>Delete</button>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <div className="search-box" style={{ width: 200 }}>
                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                    <input className="form-input" placeholder="Search codes…" value={filter} onChange={e => setFilter(e.target.value)} />
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => nav('/admin/qr-generator')}>+ New</button>
                            </div>
                        </div>

                        {/* Time Filter Bar */}
                        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface-2)' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>Period:</span>
                            {TIME_FILTERS.map(tf => (
                                <button key={tf.key}
                                    onClick={() => setTimeFilter(tf.key)}
                                    style={{
                                        padding: '4px 10px', borderRadius: 'var(--radius-full)',
                                        fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                                        borderColor: timeFilter === tf.key ? 'var(--brand)' : 'var(--border)',
                                        background: timeFilter === tf.key ? 'var(--brand-bg)' : 'var(--surface)',
                                        color: timeFilter === tf.key ? 'var(--brand)' : 'var(--text-2)',
                                        transition: 'all 0.15s',
                                    }}>
                                    {tf.label}
                                </button>
                            ))}
                            {timeFilter !== 'all' && (
                                <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--text-3)' }}>
                                    {filteredCoupons.length} result{filteredCoupons.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: 40 }}>
                                            <input type="checkbox" checked={selected.length > 0 && selected.length === filteredCoupons.length}
                                                onChange={() => toggleAll(filteredCoupons)} />
                                        </th>
                                        <th>Code</th>
                                        <th>Value</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCoupons.length > 0 ? sortedGroups.map(group => (
                                        <React.Fragment key={group}>
                                            <tr>
                                                <td colSpan="6" style={{
                                                    padding: '8px 16px', background: 'var(--surface-2)',
                                                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                                    letterSpacing: '0.08em', color: 'var(--text-3)',
                                                    borderBottom: '1px solid var(--border)'
                                                }}>
                                                    {group}
                                                    <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--text-3)', textTransform: 'none', letterSpacing: 0 }}>· {groupedCoupons[group].length} coupon{groupedCoupons[group].length !== 1 ? 's' : ''}</span>
                                                </td>
                                            </tr>
                                            {groupedCoupons[group].map(c => (
                                                <tr key={c._id} className={selected.includes(c._id) ? 'row-selected' : ''} onClick={() => toggle(c._id)}>
                                                    <td onClick={e => e.stopPropagation()}>
                                                        <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggle(c._id)} />
                                                    </td>
                                                    <td className="code-cell">{c.uniqueCode}</td>
                                                    <td className="amount-cell">₹{c.value}</td>
                                                    <td>
                                                        <span className={`badge ${c.isUsed ? 'badge-redeemed' : 'badge-available'}`}>
                                                            <span className="badge-dot" />{c.isUsed ? 'Redeemed' : 'Available'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{getRelativeTime(c.createdAt)}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => showQR(c.uniqueCode)}>View QR</button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => deleteOne(c._id)}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    )) : (
                                        <tr><td colSpan="6">
                                            <div className="empty-state">
                                                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--border-2)" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                                <h3>No coupons found</h3>
                                                <p>{timeFilter !== 'all' ? 'No coupons match this time range.' : 'Generate a new batch to get started.'}</p>
                                                {timeFilter !== 'all'
                                                    ? <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setTimeFilter('all')}>Show All Time</button>
                                                    : <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => nav('/admin/qr-generator')}>Generate Now</button>
                                                }
                                            </div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* Settings View */}
                {view === 'settings' && (
                    <div className="animate-in">
                        <div className="page-header">
                            <div>
                                <div className="page-title">Account Settings</div>
                                <div className="page-subtitle">Manage your administrator credentials</div>
                            </div>
                        </div>
                        
                        <div className="card" style={{ maxWidth: 500, margin: '20px auto' }}>
                            <div className="card-header">
                                <span className="card-title">Account Settings</span>
                            </div>
                            <div className="card-body" style={{ padding: 32 }}>
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="form-field">
                                        <label className="form-label">Update Admin Username</label>
                                        <div style={{ position: 'relative' }}>
                                            <input className="form-input" placeholder={adminName} value={newProfile.username} onChange={e => setNewProfile({...newProfile, username: e.target.value})} style={{ paddingLeft: 40 }} />
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                        </div>
                                    </div>
                                    <div className="form-field" style={{ marginTop: 24 }}>
                                        <label className="form-label">New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input className="form-input" type="password" placeholder="••••••••" value={newProfile.password} onChange={e => setNewProfile({...newProfile, password: e.target.value})} style={{ paddingLeft: 40 }} />
                                            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                        </div>
                                        <div className="form-hint">Leave blank to keep current password</div>
                                    </div>
                                    <div style={{ marginTop: 32 }}>
                                        <button className="btn btn-primary btn-lg" type="submit" disabled={profileUpdating} style={{ width: '100%' }}>
                                            {profileUpdating ? 'Updating...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* QR Preview Modal */}
            {previewQR && (
                <div className="modal-overlay" onClick={() => setPreviewQR(null)}>
                    <div className="modal animate-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="card-title">QR Code Preview</span>
                            <button className="btn btn-ghost btn-sm" onClick={() => setPreviewQR(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center' }}>
                            <img src={previewQR.dataUrl} alt="QR" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
                            <div style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.1em' }}>{previewQR.code}</div>
                        </div>
                        <div className="modal-footer">
                            <a href={previewQR.dataUrl} download={`qr-${previewQR.code}.png`} className="btn btn-secondary btn-sm">Download PNG</a>
                            <button className="btn btn-primary btn-sm" onClick={() => setPreviewQR(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
