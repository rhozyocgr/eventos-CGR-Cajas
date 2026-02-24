import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Package, Truck, Calendar, CreditCard, ShoppingCart } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Suppliers from './pages/Suppliers';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return null;
    if (!user) return <Login />;
    if (adminOnly && !isAdmin) return <div className="container"><h1>Acceso Denegado</h1><p>Esta sección es solo para administradores.</p></div>;

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
                    <span style={{ fontSize: '0.875rem' }}>{user?.name} ({user?.role})</span>
                    <button onClick={logout} className="btn" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.75rem' }}>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3>Ventas Hoy</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '1rem' }}>$0.00</p>
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

const Products = () => <div className="container"><h1>Productos</h1><p>Gestión de inventario próximamente...</p></div>;
const SalesDays = () => <div className="container"><h1>Días de Venta</h1><p>Calendario de eventos próximamente...</p></div>;
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
    const { user } = useAuth();
    if (!user) return <Login />;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
            {children}
            <nav className="mobile-nav">
                <NavItem to="/" icon={Home} label="Inicio" />
                <NavItem to="/new-sale" icon={ShoppingCart} label="Vender" />
                <NavItem to="/products" icon={Package} label="Prods" />
                <NavItem to="/suppliers" icon={Truck} label="Prov" />
                <NavItem to="/sales-days" icon={Calendar} label="Días" />
                <NavItem to="/payments" icon={CreditCard} label="Pago" />
            </nav>
        </div>
    );
};

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <Router>
                    <MainLayout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                            <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                            <Route path="/sales-days" element={<ProtectedRoute><SalesDays /></ProtectedRoute>} />
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
