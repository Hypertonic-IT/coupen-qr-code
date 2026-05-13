import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CustomerDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, [id]);

    const load = async () => {
        const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        try {
            const res = await axios.get(`/api/admin/submissions/${id}`, { headers: h });
            setSub(res.data);
        } catch (e) {
            if (e.response?.status === 401) { localStorage.clear(); nav('/admin/login'); }
        } finally { setLoading(false); }
    };

    const updateStatus = async (status) => {
        setSaving(true);
        const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        try {
            await axios.patch('/api/admin/update-status', { submissionId: id, status }, { headers: h });
            load();
        } catch { alert('Update failed'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading details…</p>
        </div>
    );

    if (!sub) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-in" style={{ padding: '48px', textAlign: 'center', maxWidth: 400 }}>
                <h2>Not Found</h2>
                <p style={{ margin: '12px 0 24px' }}>This submission could not be found.</p>
                <button className="btn btn-primary" onClick={() => nav('/admin/dashboard')}>Back to Dashboard</button>
            </div>
        </div>
    );

    const date = new Date(sub.createdAt).toLocaleString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const STATUS_ACTIONS = [
        { status: 'approved', label: 'Approve Claim', color: 'var(--blue)' },
        { status: 'paid', label: 'Mark as Paid', color: 'var(--green)' },
        { status: 'rejected', label: 'Reject Claim', color: 'var(--red)' },
    ];

    return (
        <div className="app-shell" style={{ background: 'var(--bg)' }}>
            {/* Minimal sidebar for back nav */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">C</div>
                    <span className="sidebar-logo-name">CoupenX</span>
                </div>
                <div className="sidebar-section">
                    <div className="sidebar-section-label">Navigation</div>
                    <button className="nav-item" onClick={() => nav('/admin/dashboard')}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Back to Dashboard
                    </button>
                </div>
            </aside>

            <main className="main animate-in">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <div className="page-title">Claim Details</div>
                        <div className="page-subtitle">Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{id}</span></div>
                    </div>
                    <span className={`badge badge-${sub.status}`} style={{ fontSize: 13, padding: '6px 14px' }}>
                        <span className="badge-dot" />{sub.status.toUpperCase()}
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
                    {/* Left */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="card animate-in">
                            <div className="card-header"><span className="card-title">Customer Information</span></div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Full Name</div>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>{sub.name}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Mobile</div>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>{sub.mobile}</div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Submitted On</div>
                                        <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{date}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card animate-in">
                            <div className="card-header"><span className="card-title">Payment Destination</span></div>
                            <div className="card-body">
                                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                                        {sub.accountType?.replace('_', ' ')}
                                    </div>
                                    {sub.accountType === 'AccountNumber' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                            {[['Bank', sub.bankName], ['Account No.', sub.accountNumber], ['IFSC', sub.ifsc]].map(([l, v]) => (
                                                <div key={l}>
                                                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>{l}</div>
                                                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>{v}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 20 }}>{sub.accountValue}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="card animate-in">
                            <div className="card-header"><span className="card-title">Coupon Reward</span></div>
                            <div className="card-body" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--brand)', letterSpacing: '-0.04em', marginBottom: 4 }}>₹{sub.qrId?.value || 0}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Prize Amount</div>
                                <div className="divider" />
                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Coupon Code</div>
                                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, letterSpacing: '0.1em' }}>{sub.qrId?.uniqueCode}</div>
                                <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}
                                    onClick={() => window.open(`/coupon/${sub.qrId?.uniqueCode}`, '_blank')}>
                                    Test Coupon Link ↗
                                </button>
                            </div>
                        </div>

                        <div className="card animate-in">
                            <div className="card-header"><span className="card-title">Update Status</span></div>
                            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {STATUS_ACTIONS.map(a => (
                                    <button key={a.status} className="btn btn-secondary"
                                        style={{ justifyContent: 'flex-start', color: a.color, borderColor: 'var(--border)' }}
                                        disabled={saving || sub.status === a.status}
                                        onClick={() => updateStatus(a.status)}>
                                        {a.label}
                                        {sub.status === a.status && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>Current</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
