import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, Package, Truck, Calendar, CreditCard, ShoppingCart, ChevronLeft, LogOut, Calculator, Users as UsersIcon, ShieldCheck, History, FileText } from 'lucide-react';
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
import MyClosings from './pages/MyClosings';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
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

const NavItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} />
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
                <div className="nav-menu-container">
                    <button
                        className="collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expandir menú" : "Contraer menú"}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <NavItem to="/" icon={Home} label="Inicio" />
                    <NavItem to="/new-sale" icon={ShoppingCart} label="Vender" />
                    <NavItem to="/my-closings" icon={History} label="Mis Cierres" />

                    {user?.role === 'admin' && (
                        <>
                            {!isCollapsed && (
                                <p className="admin-label">
                                    Administración
                                </p>
                            )}
                            {isCollapsed && <div className="admin-divider" />}

                            <NavItem to="/products" icon={Package} label="Productos" />
                            <NavItem to="/suppliers" icon={Truck} label="Proveedores" />
                            <NavItem to="/events" icon={Calendar} label="Eventos" />
                            <NavItem to="/payments" icon={Calculator} label="Cierre de cajas" />
                            <NavItem to="/authorizations" icon={ShieldCheck} label="Autorizaciones" />
                            <NavItem to="/transactions" icon={FileText} label="Transacciones" />
                            <NavItem to="/users" icon={UsersIcon} label="Usuarios" />
                        </>
                    )}
                </div>

                <div className={`nav-profile-container ${isCollapsed ? 'collapsed' : ''}`} style={{ position: 'relative' }}>
                    <div className="version-tag" style={{
                        position: 'absolute',
                        top: '-24px',
                        left: isCollapsed ? '50%' : '56px',
                        transform: isCollapsed ? 'translateX(-50%)' : 'none',
                        width: 'auto',
                        zIndex: 10,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        <span style={{
                            fontSize: '0.7rem',
                            color: 'white',
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            backgroundImage: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                            backdropFilter: 'blur(4px)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '2rem',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            letterSpacing: '0.05em',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                        }}>
                            <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>VER</span> {version}
                        </span>
                    </div>
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
                            <Route path="/transactions" element={<ProtectedRoute adminOnly={true}><Transactions /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute adminOnly={true}><Users /></ProtectedRoute>} />
                            <Route path="/new-sale" element={<ProtectedRoute><NewSale /></ProtectedRoute>} />
                            <Route path="/my-closings" element={<ProtectedRoute><MyClosings /></ProtectedRoute>} />
                            <Route path="/login" element={<Login />} />
                        </Routes>
                    </MainLayout>
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
