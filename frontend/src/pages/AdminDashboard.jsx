import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalQR: 0, usedQR: 0, unusedQR: 0, totalValue: 0 });
    const [submissions, setSubmissions] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('submissions'); // 'submissions' or 'inventory'
    const [filter, setFilter] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const navigate = useNavigate();
    const adminName = localStorage.getItem('admin') || 'Admin';

    useEffect(() => { fetchData(); }, [currentView]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        setLoading(true);
        try {
            const [statsRes, subRes, couponRes] = await Promise.all([
                axios.get('/api/admin/stats', { headers }),
                axios.get('/api/admin/submissions', { headers }),
                axios.get('/api/qr', { headers })
            ]);
            setStats(statsRes.data);
            setSubmissions(subRes.data);
            setCoupons(couponRes.data);
        } catch (err) {
            if (err.response?.status === 401) { localStorage.clear(); navigate('/admin/login'); }
        } finally { setLoading(false); }
    };

    const handleStatusUpdate = async (submissionId, status) => {
        const token = localStorage.getItem('token');
        try {
            await axios.patch('/api/admin/update-status', { submissionId, status }, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) { alert('Failed to update status'); }
    };

    const handleExport = () => {
        const token = localStorage.getItem('token');
        window.open(`http://localhost:5001/api/admin/export?token=${token}`, '_blank');
    };

    const handleLogout = () => { localStorage.clear(); navigate('/admin/login'); };

    // Filtering for Submissions
    const textFilteredSubmissions = submissions.filter(s =>
        s.name?.toLowerCase().includes(filter.toLowerCase()) ||
        s.mobile?.includes(filter) ||
        s.qrId?.uniqueCode?.includes(filter)
    );

    const filteredSubmissions = activeTab === 'all' ? textFilteredSubmissions : textFilteredSubmissions.filter(s => s.status === activeTab);

    // Filtering for Inventory
    const filteredCoupons = coupons.filter(c =>
        c.uniqueCode?.toLowerCase().includes(filter.toLowerCase()) ||
        c.value?.toString().includes(filter)
    ).filter(c => {
        if (activeTab === 'all') return true;
        if (activeTab === 'used') return c.isUsed;
        if (activeTab === 'unused') return !c.isUsed;
        return true;
    });

    const usagePercent = stats.totalQR > 0 ? Math.round((stats.usedQR / stats.totalQR) * 100) : 0;
    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const approvedCount = submissions.filter(s => s.status === 'approved').length;
    const paidCount = submissions.filter(s => s.status === 'paid').length;

    const today = new Date();
    const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const avatarColors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div className="spinner spinner-lg" />
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Loading your dashboard...</p>
        </div>
    );

    return (
        <div className="page-wrapper">
            {/* ====== SIDEBAR ====== */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="topbar-logo">C</div>
                    <span>CoupenX</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main</div>
                    <button
                        className={`sidebar-link ${currentView === 'submissions' ? 'active' : ''}`}
                        onClick={() => { setCurrentView('submissions'); setFilter(''); setActiveTab('all'); }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
                        Submissions
                    </button>
                    <button
                        className={`sidebar-link ${currentView === 'inventory' ? 'active' : ''}`}
                        onClick={() => { setCurrentView('inventory'); setFilter(''); setActiveTab('all'); }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" /><path d="M16 10a4 4 0 0 1 0 8" /><path d="M16 10v8" /><path d="M16 14h4" /></svg>
                        QR Inventory
                    </button>
                    <button className="sidebar-link" onClick={() => navigate('/admin/qr-generator')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" /></svg>
                        QR Generator
                    </button>

                    <div className="sidebar-section-label" style={{ marginTop: 24 }}>Data</div>
                    <button className="sidebar-link" onClick={handleExport}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Export CSV
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{adminName.charAt(0).toUpperCase()}</div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-900)' }}>{adminName}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Administrator</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', color: 'var(--gray-500)', marginTop: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ====== MAIN CONTENT ====== */}
            <main className="main-content">
                {/* Page Header */}
                <div className="fade-up" style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h1 style={{ marginBottom: 4 }}>{greeting}, {adminName}</h1>
                            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>{dateStr}</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => navigate('/admin/qr-generator')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            New Batch
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="stats-row fade-up-d1">
                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-title">Total Coupons</div>
                                <div className="stat-metric" style={{ marginTop: 8 }}>{stats.totalQR.toLocaleString()}</div>
                            </div>
                            <div className="stat-icon-wrap" style={{ background: 'var(--primary-25)', color: 'var(--primary-500)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 17v2M13 11v2" /></svg>
                            </div>
                        </div>
                        <div className="stat-sub" style={{ marginTop: 4 }}>
                            <span style={{ color: 'var(--success-500)', fontWeight: 600 }}>{stats.unusedQR}</span> available · {stats.usedQR} used
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-title">Redemption Rate</div>
                                <div className="stat-metric" style={{ marginTop: 8 }}>{usagePercent}<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--gray-400)' }}>%</span></div>
                            </div>
                            <div className="stat-icon-wrap" style={{ background: 'var(--blue-50)', color: 'var(--blue-500)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                            </div>
                        </div>
                        <div className="progress-bar" style={{ marginTop: 12 }}>
                            <div className="progress-fill" style={{ width: `${usagePercent}%` }} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-title">Value Distributed</div>
                                <div className="stat-metric" style={{ marginTop: 8 }}>₹{stats.totalValue.toLocaleString()}</div>
                            </div>
                            <div className="stat-icon-wrap" style={{ background: 'var(--success-50)', color: 'var(--success-500)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6" /></svg>
                            </div>
                        </div>
                        <div className="stat-sub" style={{ marginTop: 4 }}>
                            Across <span style={{ fontWeight: 600 }}>{submissions.length}</span> submissions
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="stat-title">Pending Review</div>
                                <div className="stat-metric" style={{ marginTop: 8, color: pendingCount > 0 ? 'var(--warning-500)' : 'var(--gray-900)' }}>{pendingCount}</div>
                            </div>
                            <div className="stat-icon-wrap" style={{ background: 'var(--warning-50)', color: 'var(--warning-500)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                        </div>
                        <div className="stat-sub" style={{ marginTop: 4 }}>
                            Requires your attention
                        </div>
                    </div>
                </div>

                {/* Submissions View */}
                {currentView === 'submissions' && (
                    <div className="card fade-up-d2" style={{ padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                                <h2 style={{ margin: 0 }}>Recent Submissions</h2>
                                <div className="search-wrap">
                                    <span className="search-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    </span>
                                    <input className="form-input search-input" type="text" placeholder="Search by name, mobile, or ID..." value={filter} onChange={(e) => setFilter(e.target.value)} />
                                </div>
                            </div>

                            <div className="tab-bar">
                                {[
                                    { key: 'all', label: 'All Claimants', count: submissions.length },
                                    { key: 'pending', label: 'Pending', count: pendingCount },
                                    { key: 'approved', label: 'Approved', count: approvedCount },
                                    { key: 'paid', label: 'Paid', count: paidCount },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        className={`tab-btn ${activeTab === tab.key ? 'tab-active' : ''}`}
                                        onClick={() => setActiveTab(tab.key)}
                                    >
                                        {tab.label}
                                        <span className="tab-count">{tab.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Claimant</th>
                                        <th>Payment Details</th>
                                        <th>Coupon Value</th>
                                        <th>Proof</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubmissions.length > 0 ? filteredSubmissions.map((s, i) => (
                                        <tr key={s._id}>
                                            <td>
                                                <div className="table-user">
                                                    <div className="table-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                                                        {s.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="table-name">{s.name}</div>
                                                        <div className="table-sub">{s.mobile}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', marginBottom: 2 }}>
                                                    {s.accountType?.replace('_', ' ')}
                                                </div>
                                                <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 13, color: 'var(--gray-700)', lineHeight: '1.4' }}>
                                                    {s.accountType === 'AccountNumber' ? (
                                                        <>
                                                            <div><span style={{ color: 'var(--gray-400)' }}>Bank:</span> {s.bankName}</div>
                                                            <div><span style={{ color: 'var(--gray-400)' }}>A/C:</span> {s.accountNumber}</div>
                                                            <div><span style={{ color: 'var(--gray-400)' }}>IFSC:</span> {s.ifsc}</div>
                                                        </>
                                                    ) : (
                                                        s.accountValue
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="table-amount">₹{s.qrId?.value || 0}</div>
                                                <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{s.qrId?.uniqueCode?.substring(0, 8)}</div>
                                            </td>
                                            <td>
                                                {s.qrImageUrl ? (
                                                    <a href={s.qrImageUrl} target="_blank" rel="noreferrer">
                                                        <img className="table-img" src={s.qrImageUrl} alt="proof" />
                                                    </a>
                                                ) : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${s.status}`}>
                                                    <span className="badge-dot" />
                                                    {s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <select
                                                    className="table-status-select form-select"
                                                    value={s.status}
                                                    onChange={(e) => handleStatusUpdate(s._id, e.target.value)}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approve</option>
                                                    <option value="rejected">Reject</option>
                                                    <option value="paid">Mark Paid</option>
                                                </select>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6">
                                                <div className="empty-state">
                                                    <div className="empty-icon">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 8V21H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>
                                                    </div>
                                                    <h3 style={{ marginBottom: 4 }}>No submissions yet</h3>
                                                    <p style={{ color: 'var(--gray-400)', fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
                                                        {filter ? 'No results match your search. Try a different term.' : 'When users scan QR codes and submit claims, they\'ll appear here.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* QR Inventory View */}
                {currentView === 'inventory' && (
                    <div className="card fade-up-d2" style={{ padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                                <h2 style={{ margin: 0 }}>QR Inventory</h2>
                                <div className="search-wrap">
                                    <span className="search-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    </span>
                                    <input className="form-input search-input" type="text" placeholder="Search by ID or value..." value={filter} onChange={(e) => setFilter(e.target.value)} />
                                </div>
                            </div>

                            <div className="tab-bar">
                                {[
                                    { key: 'all', label: 'All Coupons', count: coupons.length },
                                    { key: 'unused', label: 'Available', count: stats.unusedQR },
                                    { key: 'used', label: 'Redeemed', count: stats.usedQR },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        className={`tab-btn ${activeTab === tab.key ? 'tab-active' : ''}`}
                                        onClick={() => setActiveTab(tab.key)}
                                    >
                                        {tab.label}
                                        <span className="tab-count">{tab.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>QR Code ID</th>
                                        <th>Monetary Value</th>
                                        <th>Status</th>
                                        <th>Created Date</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCoupons.length > 0 ? filteredCoupons.map((c) => (
                                        <tr key={c._id}>
                                            <td>
                                                <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>{c.uniqueCode}</div>
                                            </td>
                                            <td>
                                                <div className="table-amount">₹{c.value}</div>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.isUsed ? 'badge-approved' : 'badge-pending'}`}>
                                                    <span className="badge-dot" />
                                                    {c.isUsed ? 'Redeemed' : 'Available'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                                                {new Date(c.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => window.open(`${window.location.origin}/coupon/${c.uniqueCode}`, '_blank')}
                                                >
                                                    View Link
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5">
                                                <div className="empty-state">
                                                    <div className="empty-icon">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /><path d="M17 17h.01" /></svg>
                                                    </div>
                                                    <h3 style={{ marginBottom: 4 }}>Inventory is empty</h3>
                                                    <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>You haven't generated any QR codes yet.</p>
                                                    <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/admin/qr-generator')}>
                                                        Go to Generator
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
