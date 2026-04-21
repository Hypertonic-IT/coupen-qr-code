import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CouponForm from './pages/CouponForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import QRGenerator from './pages/QRGenerator';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/admin/login" />;
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* User Routes */}
                <Route path="/coupon/:uniqueId" element={<CouponForm />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin/qr-generator" element={
                    <ProtectedRoute>
                        <QRGenerator />
                    </ProtectedRoute>
                } />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/admin/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
