import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Package, Truck, Calendar, CreditCard, ShoppingCart, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import Events from './pages/Events';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    return children;
};

// Placeholder Components
const Dashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Dashboard de Eventos</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>Desarrollador (Admin)</span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3>Ventas Hoy</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '1rem' }}>₡0.00</p>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3>Productos</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)', marginTop: '1rem' }}>0</p>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3>Proveedores</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '1rem' }}>0</p>
                </div>
            </div>
        </div>
    );
};

const Payments = () => <div className="container"><h1>Tipos de Pago</h1><p>Configuración de pagos próximamente...</p></div>;
const NewSale = () => <div className="container"><h1>Nueva Venta</h1><p>Terminal de punto de venta próximamente...</p></div>;

const NavItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={24} />
            <span>{label}</span>
        </Link>
    );
};

const MainLayout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div style={{ minHeight: '100vh' }}>
            <main className={`main-content ${isCollapsed ? 'full-width' : ''}`}>
                {children}
            </main>
            <nav className={`mobile-nav ${isCollapsed ? 'collapsed' : ''}`}>
                <button
                    className="collapse-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expandir menú" : "Contraer menú"}
                >
                    <ChevronLeft size={18} />
                </button>
                <NavItem to="/" icon={Home} label="Inicio" />
                <NavItem to="/new-sale" icon={ShoppingCart} label="Vender" />
                <NavItem to="/products" icon={Package} label="Productos" />
                <NavItem to="/suppliers" icon={Truck} label="Proveedores" />
                <NavItem to="/events" icon={Calendar} label="Eventos" />
                <NavItem to="/payments" icon={CreditCard} label="Cajas" />
            </nav>
        </div>
    );
};

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1e293b',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)'
                        }
                    }}
                />
                <Router>
                    <MainLayout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                            <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                            <Route path="/payments" element={<ProtectedRoute adminOnly={true}><Payments /></ProtectedRoute>} />
                            <Route path="/new-sale" element={<ProtectedRoute><NewSale /></ProtectedRoute>} />
                            <Route path="/login" element={<Login />} />
                        </Routes>
                    </MainLayout>
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
