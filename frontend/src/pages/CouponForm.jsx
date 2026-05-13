import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function CouponForm() {
    const { uniqueId } = useParams();
    const [coupon, setCoupon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', mobile: '', accountType: 'UPI_ID', accountValue: '', accountNumber: '', ifsc: '', bankName: '' });

    useEffect(() => { fetchCoupon(); }, [uniqueId]);

    const fetchCoupon = async () => {
        try {
            const res = await axios.get(`/api/qr/${uniqueId}`);
            setCoupon(res.data);
            if (res.data.isUsed) {
                alert('This coupon has already been used.');
                setError('already_used');
            }
        } catch { setError('invalid'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (coupon?.isUsed) return;
        // Basic Validation
        if (!/^\d{10}$/.test(form.mobile)) {
            return alert('Please enter a valid 10-digit mobile number');
        }
        if (form.accountType === 'UPI_ID' && !form.accountValue.includes('@')) {
            return alert('Please enter a valid UPI ID (e.g. name@bank)');
        }

        setSubmitting(true); setError('');
        const payload = { name: form.name, mobile: form.mobile, accountType: form.accountType, uniqueCode: uniqueId };
        if (form.accountType === 'AccountNumber') {
            payload.accountNumber = form.accountNumber;
            payload.ifsc = form.ifsc;
            payload.bankName = form.bankName;
        } else { payload.accountValue = form.accountValue; }
        try {
            await axios.post('/api/submit/submit', payload);
            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) { setError(err.response?.data?.message || 'Submission failed. Please try again.'); }
        finally { setSubmitting(false); }
    };

    const inp = e => setForm({ ...form, [e.target.name]: e.target.value });

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', flexDirection: 'column', gap: 16 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Verifying coupon…</p>
        </div>
    );

    if (error === 'already_used') return (
        <div className="coupon-page">
            <div className="coupon-card animate-in" style={{ textAlign: 'center' }}>
                <div style={{ padding: '48px 32px' }}>
                    <div className="status-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>⚠</div>
                    <h2 style={{ marginBottom: 8 }}>Already Redeemed</h2>
                    <p style={{ marginBottom: 28 }}>This coupon has already been used and cannot be claimed again.</p>
                    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{uniqueId}</div>
                </div>
            </div>
        </div>
    );

    if (error === 'invalid') return (
        <div className="coupon-page">
            <div className="coupon-card animate-in" style={{ textAlign: 'center' }}>
                <div style={{ padding: '48px 32px' }}>
                    <div className="status-card-icon" style={{ background: '#fee2e2', color: '#dc2626', fontSize: 32 }}>✕</div>
                    <h2 style={{ marginBottom: 8 }}>Invalid Coupon</h2>
                    <p style={{ marginBottom: 28 }}>This coupon link is invalid or has expired.</p>
                </div>
            </div>
        </div>
    );

    if (success) return (
        <div className="coupon-page">
            <div className="coupon-card animate-in" style={{ textAlign: 'center' }}>
                <div style={{ background: 'linear-gradient(135deg,#059669,#10b981)', padding: '40px 28px', color: '#fff' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>✓</div>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Claim Submitted!</div>
                    <div style={{ opacity: 0.85, fontSize: 14, marginTop: 6 }}>Your reward is being processed</div>
                </div>
                <div style={{ padding: '28px' }}>
                    <p style={{ fontSize: 14, marginBottom: 24 }}>Your reward of <strong>₹{coupon?.value}</strong> has been registered. Expected credit within <strong>2–3 business days</strong>.</p>
                    <div className="divider" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.08em' }}>Reference ID</div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em' }}>{uniqueId?.substring(0, 8).toUpperCase()}</div>
                        </div>
                        <span className="badge badge-pending"><span className="badge-dot" />Processing</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="coupon-page">
            <div className="coupon-card animate-in">
                <div className="coupon-header">
                    <div className="coupon-brand">🎁 Reward Coupon</div>
                    <div className="coupon-amount">₹{coupon?.value}</div>
                    <div className="coupon-amount-label">Scan &amp; Claim Your Prize</div>
                </div>

                <div className="coupon-body">
                    <h2 style={{ textAlign: 'center', marginBottom: 4 }}>Claim Your Reward</h2>
                    <p style={{ textAlign: 'center', fontSize: 13, marginBottom: 24 }}>Enter your details to receive the payment</p>

                    {typeof error === 'string' && error && error !== 'invalid' && error !== 'already_used' && (
                        <div className="alert alert-error">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-field">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" name="name" placeholder="Your name" required value={form.name} onChange={inp} />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Mobile Number</label>
                                <input className="form-input" name="mobile" type="tel" placeholder="10-digit number" required value={form.mobile} onChange={inp} />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="form-label">Payment Method</label>
                            <select className="form-select" name="accountType" value={form.accountType} onChange={inp}>
                                <option value="UPI_ID">UPI ID</option>
                                <option value="UPI_Number">UPI Mobile Number</option>
                                <option value="AccountNumber">Bank Account</option>
                            </select>
                        </div>

                        {form.accountType === 'UPI_ID' && (
                            <div className="form-field">
                                <label className="form-label">UPI ID</label>
                                <input className="form-input" name="accountValue" placeholder="yourname@okicici" required value={form.accountValue} onChange={inp} />
                            </div>
                        )}

                        {form.accountType === 'UPI_Number' && (
                            <div className="form-field">
                                <label className="form-label">UPI Mobile Number</label>
                                <input className="form-input" name="accountValue" type="tel" placeholder="9876543210" required value={form.accountValue} onChange={inp} />
                            </div>
                        )}

                        {form.accountType === 'AccountNumber' && (
                            <div className="animate-in">
                                <div className="form-field">
                                    <label className="form-label">Bank Name</label>
                                    <input className="form-input" name="bankName" placeholder="e.g. State Bank of India" required value={form.bankName} onChange={inp} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                                    <div className="form-field">
                                        <label className="form-label">Account Number</label>
                                        <input className="form-input" name="accountNumber" placeholder="Account number" required value={form.accountNumber} onChange={inp} />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">IFSC Code</label>
                                        <input className="form-input" name="ifsc" placeholder="SBIN0001234" required value={form.ifsc} onChange={inp} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
                            {submitting ? <><div className="spinner" />Submitting…</> : 'Submit Claim →'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-3)' }}>🔒 Secured &amp; encrypted · Your data is safe</p>
                </div>
            </div>
        </div>
    );
}
