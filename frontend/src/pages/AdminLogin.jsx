import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('admin', res.data.username);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid username or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card fade-up">
                <div className="login-logo">C</div>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 24, marginBottom: 8 }}>Welcome back</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Log in to your CoupenX admin account</p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3M8 10.5h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email or Username</label>
                        <input
                            className="form-input"
                            type="text"
                            name="username"
                            placeholder="Enter your username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: 4 }}
                        disabled={loading}
                    >
                        {loading ? <><div className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in...</> : 'Sign in'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--gray-400)' }}>
                    CoupenX Admin Panel · v2.1
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
