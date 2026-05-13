import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminLogin() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await axios.post('/api/auth/login', form);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('admin', res.data.username);
            nav('/admin/dashboard');
        } catch { setError('Invalid username or password.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="login-page">
            <div className="login-card animate-in">
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 48, height: 48, background: 'var(--brand)',
                        borderRadius: 12, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 16px',
                        fontSize: 22, fontWeight: 900, color: '#fff'
                    }}>C</div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Welcome back</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Sign in to CoupenX Admin</p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div className="form-field">
                        <label className="form-label">Username</label>
                        <input className="form-input" type="text" placeholder="Enter username" required
                            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} autoFocus />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="Enter password" required
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                        {loading ? <><div className="spinner" />&nbsp;Signing in…</> : 'Sign in'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: 'var(--text-3)' }}>
                    CoupenX Management Portal · v3.0
                </p>
            </div>
        </div>
    );
}
