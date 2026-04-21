import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CouponForm = () => {
    const { uniqueId } = useParams();
    const [coupon, setCoupon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        accountType: 'UPI_ID',
        accountValue: '',   // Used for UPI ID and UPI Number
        accountNumber: '',
        ifsc: '',
        bankName: '',
        qrImage: null
    });

    useEffect(() => { fetchCouponDetails(); }, [uniqueId]);

    const fetchCouponDetails = async () => {
        try {
            const res = await axios.get(`/api/qr/${uniqueId}`);
            setCoupon(res.data);
            if (res.data.isUsed) setError('This coupon has already been redeemed.');
        } catch (err) {
            setError('Invalid or expired coupon link.');
        } finally { setLoading(false); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, qrImage: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (coupon?.isUsed) return;
        setSubmitting(true);
        setError('');

        const data = new FormData();
        data.append('name', formData.name);
        data.append('mobile', formData.mobile);
        data.append('accountType', formData.accountType);
        data.append('qrImage', formData.qrImage);
        data.append('uniqueCode', uniqueId);

        if (formData.accountType === 'AccountNumber') {
            data.append('accountNumber', formData.accountNumber);
            data.append('ifsc', formData.ifsc);
            data.append('bankName', formData.bankName);
        } else {
            data.append('accountValue', formData.accountValue);
        }

        try {
            await axios.post('/api/submit/submit', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally { setSubmitting(false); }
    };

    /* ====== LOADING ====== */
    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: 'var(--gray-50)' }}>
            <div className="spinner spinner-lg" />
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Verifying coupon...</p>
        </div>
    );

    /* ====== SUCCESS ====== */
    if (success) return (
        <div className="success-page">
            <div className="success-card fade-up">
                <div className="success-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 style={{ marginBottom: 8, fontSize: 22 }}>Claim Submitted</h2>
                <p style={{ color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 24 }}>
                    Your reward of <strong style={{ color: 'var(--success-700)' }}>₹{coupon?.value}</strong> has been registered successfully.
                    The amount will be credited to your account within <strong>2–3 business days</strong>.
                </p>
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, fontSize: 13 }}>
                    <div>
                        <div style={{ color: 'var(--gray-400)', fontWeight: 500, marginBottom: 2 }}>Reference</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--gray-700)' }}>{uniqueId.substring(0, 8).toUpperCase()}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--gray-400)', fontWeight: 500, marginBottom: 2 }}>Status</div>
                        <span className="badge badge-pending"><span className="badge-dot" />Processing</span>
                    </div>
                </div>
            </div>
        </div>
    );

    /* ====== ERROR — No coupon ====== */
    if (error && !coupon) return (
        <div className="success-page">
            <div className="success-card fade-up">
                <div className="success-icon" style={{ background: 'var(--error-50)', borderColor: 'rgba(240,68,56,0.2)', color: 'var(--error-500)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
                </div>
                <h2 style={{ marginBottom: 8, fontSize: 22 }}>Invalid Coupon</h2>
                <p style={{ color: 'var(--gray-500)', lineHeight: 1.6 }}>{error}</p>
            </div>
        </div>
    );

    /* ====== MAIN FORM ====== */
    return (
        <div className="coupon-page">
            <div className="coupon-card fade-up">
                <div className="value-banner">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 17v2M13 11v2" /></svg>
                        <span className="value-label" style={{ marginTop: 0 }}>Coupon Reward</span>
                    </div>
                    <div className="value-amount">₹{coupon?.value}</div>
                </div>

                <div className="coupon-form-body">
                    <h2 style={{ marginBottom: 4, textAlign: 'center' }}>Claim Your Reward</h2>
                    <p style={{ color: 'var(--gray-500)', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
                        Fill in your details to receive the payment
                    </p>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 20 }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3M8 10.5h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" type="text" name="name" placeholder="Your full name" required value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mobile Number</label>
                                <input className="form-input" type="tel" name="mobile" placeholder="+91 XXXXXXXXXX" required value={formData.mobile} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Payment Method</label>
                            <select className="form-input form-select" name="accountType" value={formData.accountType} onChange={handleInputChange}>
                                <option value="UPI_ID">UPI ID</option>
                                <option value="UPI_Number">UPI Mobile Number</option>
                                <option value="AccountNumber">Bank Account Details</option>
                            </select>
                        </div>

                        {/* Conditional Fields: UPI ID */}
                        {formData.accountType === 'UPI_ID' && (
                            <div className="form-group">
                                <label className="form-label">UPI ID</label>
                                <input className="form-input" type="text" name="accountValue" placeholder="e.g. yourname@okicici" required value={formData.accountValue} onChange={handleInputChange} />
                            </div>
                        )}

                        {/* Conditional Fields: UPI Number */}
                        {formData.accountType === 'UPI_Number' && (
                            <div className="form-group">
                                <label className="form-label">UPI Mobile Number</label>
                                <input className="form-input" type="tel" name="accountValue" placeholder="e.g. 9876543210" required value={formData.accountValue} onChange={handleInputChange} />
                            </div>
                        )}

                        {/* Conditional Fields: Bank Account */}
                        {formData.accountType === 'AccountNumber' && (
                            <div className="fade-up" style={{ animationDuration: '0.3s' }}>
                                <div className="form-group">
                                    <label className="form-label">Bank Name</label>
                                    <input className="form-input" type="text" name="bankName" placeholder="e.g. State Bank of India" required value={formData.bankName} onChange={handleInputChange} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Account Number</label>
                                        <input className="form-input" type="text" name="accountNumber" placeholder="Enter account number" required value={formData.accountNumber} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">IFSC Code</label>
                                        <input className="form-input" type="text" name="ifsc" placeholder="e.g. SBIN0001234" required value={formData.ifsc} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">QR Code Photo</label>
                            <input className="form-input" type="file" accept="image/*" required onChange={handleFileChange} />
                            <div className="form-hint">Upload a clear photo of the QR code you scanned</div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 4 }}
                            disabled={submitting}
                        >
                            {submitting ? <><div className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Submitting...</> : 'Submit Claim'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--gray-400)' }}>
                        🔒 Your data is secure and encrypted
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CouponForm;
