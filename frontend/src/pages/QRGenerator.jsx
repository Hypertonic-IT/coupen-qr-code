import React, { useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';

const QRGenerator = () => {
    const [count, setCount] = useState(10);
    const [value, setValue] = useState(50);
    const [generatedQRs, setGeneratedQRs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [printLayout, setPrintLayout] = useState(false);
    const navigate = useNavigate();
    const adminName = localStorage.getItem('admin') || 'Admin';

    const handleGenerate = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('/api/qr/generate', { count, value }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const qrsWithImages = await Promise.all(res.data.map(async (qr) => {
                const url = `${window.location.origin}/coupon/${qr.uniqueCode}`;
                const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#1d2939' } });
                return { ...qr, dataUrl };
            }));
            setGeneratedQRs(qrsWithImages);
        } catch (err) {
            alert('Generation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/admin/login'); };

    /* Print Layout */
    if (printLayout) {
        return (
            <div className="print-area">
                <div className="no-print" style={{ padding: '12px 24px', background: 'var(--white)', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPrintLayout(false)}>← Back</button>
                    <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Print A4 Sheets</button>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{generatedQRs.length} coupons in this batch</span>
                </div>
                <div className="print-grid">
                    {generatedQRs.map(qr => (
                        <div key={qr._id} className="print-item">
                            <img src={qr.dataUrl} alt="qr" />
                            <div className="print-item-val">₹{qr.value}</div>
                            <div className="print-item-code">{qr.uniqueCode}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

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
                    <button className="sidebar-link" onClick={() => navigate('/admin/dashboard')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
                        Submissions
                    </button>
                    <button className="sidebar-link" onClick={() => navigate('/admin/dashboard')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" /><path d="M16 10a4 4 0 0 1 0 8" /><path d="M16 10v8" /><path d="M16 14h4" /></svg>
                        QR Inventory
                    </button>
                    <button className="sidebar-link active">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" /></svg>
                        QR Generator
                    </button>

                    <div className="sidebar-section-label" style={{ marginTop: 24 }}>Data</div>
                    <button className="sidebar-link" onClick={() => {
                        const token = localStorage.getItem('token');
                        window.open(`http://localhost:5001/api/admin/export?token=${token}`, '_blank');
                    }}>
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
                {/* Header */}
                <div className="fade-up" style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <div>
                            <h1 style={{ marginBottom: 4 }}>QR Generator</h1>
                            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Create and mint new coupon batches</p>
                        </div>
                        <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
                            View Inventory
                        </button>
                    </div>
                </div>

                {/* Generator Form */}
                <div className="card fade-up-d1" style={{ marginBottom: 32 }}>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr) auto', gap: 20, alignItems: 'end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Quantity</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    min="1"
                                    max="500"
                                />
                                <div className="form-hint">Codes to generate</div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Amount (₹)</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(Number(e.target.value))}
                                    min="1"
                                />
                                <div className="form-hint">Value per coupon</div>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleGenerate}
                                disabled={loading}
                                style={{ height: 44, padding: '0 24px' }}
                            >
                                {loading ? <><div className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Minting...</> : `Generate Batch`}
                            </button>
                        </div>

                        {/* Batch summary */}
                        <div style={{ marginTop: 24, padding: '16px', background: 'var(--primary-25)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary-100)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="stat-icon-wrap" style={{ background: 'white', color: 'var(--primary-500)', width: 32, height: 32 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67Z" /><path d="m3.09 8.84 12.35 6.61a1.93 1.93 0 0 0 1.81 0l3.65-1.9a2.12 2.12 0 0 0 .05-3.69l-12.22-6.93a2 2 0 0 0-1.94 0L3 5.37a2.12 2.12 0 0 0 .09 3.47Z" /><path d="M3.1 13.23 7.65 15.3a1.93 1.93 0 0 0 1.81 0l11.44-6.13a2.12 2.12 0 0 1 .1 3.5l-12.22 6.93a2 2 0 0 1-1.94 0l-3.84-2.1a2.12 2.12 0 0 1 .1-3.67Z" /><path d="M3.1 17.69 7.65 19.76a1.93 1.93 0 0 0 1.81 0l11.44-6.13a2.12 2.12 0 0 1 .1 3.5l-12.22 6.93a2 2 0 0 1-1.94 0l-3.84-2.1a2.12 2.12 0 0 1 .1-3.67Z" /></svg>
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--primary-700)' }}>Batch Total Value</span>
                            </div>
                            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-700)' }}>₹{(count * value).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {generatedQRs.length > 0 && (
                    <div className="fade-up-d2">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h2 style={{ marginBottom: 2 }}>Batch Preview ({generatedQRs.length})</h2>
                                <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Minted on {new Date().toLocaleDateString()}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => {
                                    const token = localStorage.getItem('token');
                                    window.open(`http://localhost:5001/api/qr/download-zip?token=${token}`, '_blank');
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                    ZIP Pack
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setPrintLayout(true)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                                    Print Sheets
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/dashboard')}>
                                    Go to Inventory
                                </button>
                            </div>
                        </div>

                        <div className="qr-grid">
                            {generatedQRs.map(qr => (
                                <div key={qr._id} className="qr-card-item">
                                    <img src={qr.dataUrl} alt="QR Code" style={{ background: 'white' }} />
                                    <div className="qr-val">₹{qr.value}</div>
                                    <div className="qr-code-id" style={{ fontSize: 9 }}>{qr.uniqueCode}</div>
                                    <a href={qr.dataUrl} download={`coupon-${qr.uniqueCode.substring(0, 8)}.png`} className="qr-download-link">
                                        Save PNG
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default QRGenerator;
