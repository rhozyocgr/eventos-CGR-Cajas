import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, Package, Truck, Calendar, CreditCard, ShoppingCart, ChevronLeft, LogOut, Calculator, Users as UsersIcon, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import Events from './pages/Events';
import NewSale from './pages/NewSale';
import Cashier from './pages/Cashier';
import Users from './pages/Users';
import Authorizations from './pages/Authorizations';
import { version } from '../package.json';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log('Google Client ID (v2):', GOOGLE_CLIENT_ID);

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Cargando...</div>;

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" />;
    }

    return children;
};

// Placeholder Components
const Dashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Dashboard de Eventos</h1>

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
    const { user, logout } = useAuth();
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    if (!user || isLoginPage) {
        return <main style={{ minHeight: '100vh' }}>{children}</main>;
    }

    return (
        <div style={{ minHeight: '100vh' }}>
            <main className={`main-content ${isCollapsed ? 'full-width' : ''}`}>
                {children}
            </main>
            <nav className={`mobile-nav ${isCollapsed ? 'collapsed' : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    <button
                        className="collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expandir menú" : "Contraer menú"}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <NavItem to="/" icon={Home} label="Inicio" />
                    <NavItem to="/new-sale" icon={ShoppingCart} label="Vender" />

                    {user?.role === 'admin' && (
                        <>
                            {!isCollapsed && (
                                <p style={{
                                    paddingLeft: '1.25rem',
                                    fontSize: '0.65rem',
                                    color: 'var(--primary)',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginTop: '1.5rem',
                                    marginBottom: '0.5rem',
                                    opacity: 0.8
                                }}>
                                    Administración
                                </p>
                            )}
                            {isCollapsed && <div style={{ height: '1px', background: 'var(--glass-border)', margin: '1rem 0.5rem' }} />}

                            <NavItem to="/products" icon={Package} label="Productos" />
                            <NavItem to="/suppliers" icon={Truck} label="Proveedores" />
                            <NavItem to="/events" icon={Calendar} label="Eventos" />
                            <NavItem to="/payments" icon={Calculator} label="Cierre de cajas" />
                            <NavItem to="/authorizations" icon={ShieldCheck} label="Autorizaciones" />
                            <NavItem to="/users" icon={UsersIcon} label="Usuarios" />
                        </>
                    )}
                </div>

                <div style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--glass-border)',
                    width: '100%',
                    display: 'flex',
                    flexDirection: isCollapsed ? 'column' : 'row',
                    alignItems: 'center',
                    gap: isCollapsed ? '1rem' : '0.75rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid var(--primary)',
                        flexShrink: 0
                    }}>
                        <img
                            src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    {!isCollapsed && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                color: 'white',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }} title={user?.name}>
                                {user?.name}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        title="Cerrar sesión"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            color: '#ef4444',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                <div className="version-tag" style={{
                    padding: '0.75rem 0.25rem 0 0.25rem',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    opacity: 0.8
                }}>
                    <span style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-secondary)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        letterSpacing: '0.05em',
                        fontWeight: '500',
                        textTransform: 'uppercase'
                    }}>
                        {isCollapsed ? `v${version}` : `Versión ${version}`}
                    </span>
                </div>
            </nav>
        </div>
    );
};

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <Toaster
                    position="bottom-center"
                    toastOptions={{
                        style: {
                            background: '#1e293b',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            padding: '1.2rem 2rem',
                            fontSize: '1.1rem',
                            minWidth: '400px',
                            borderRadius: '1rem',
                            boxShadow: '0 15px 30px rgba(0,0,0,0.4)'
                        }
                    }}
                />
                <Router>
                    <MainLayout>
                        <Routes>
                            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/products" element={<ProtectedRoute adminOnly={true}><Products /></ProtectedRoute>} />
                            <Route path="/suppliers" element={<ProtectedRoute adminOnly={true}><Suppliers /></ProtectedRoute>} />
                            <Route path="/events" element={<ProtectedRoute adminOnly={true}><Events /></ProtectedRoute>} />
                            <Route path="/payments" element={<ProtectedRoute adminOnly={true}><Cashier /></ProtectedRoute>} />
                            <Route path="/authorizations" element={<ProtectedRoute adminOnly={true}><Authorizations /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute adminOnly={true}><Users /></ProtectedRoute>} />
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
