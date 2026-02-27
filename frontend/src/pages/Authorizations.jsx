import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck,
    User,
    Clock,
    Calendar,
    CheckCircle,
    XCircle,
    RefreshCcw,
    AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const Authorizations = () => {
    const { user: admin } = useAuth();
    const [pendingOpenings, setPendingOpenings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingOpenings();
    }, []);

    const fetchPendingOpenings = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/sales/pending-openings`);
            setPendingOpenings(res.data);
        } catch (err) {
            toast.error('Error al cargar autorizaciones pendientes');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await axios.post(`${API_URL}/sales/authorize-opening/${id}`, {
                status,
                adminId: admin.id
            });

            toast.success(status === 'authorized' ? 'Caja autorizada' : 'Solicitud rechazada');
            fetchPendingOpenings();
        } catch (err) {
            toast.error('Error al procesar la solicitud');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <ShieldCheck size={32} color="var(--primary)" />
                        Autorizaciones
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        Valida y autoriza el inicio de sesión de los cajeros
                    </p>
                </div>
                <button
                    onClick={fetchPendingOpenings}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCcw size={18} className={loading ? 'spin' : ''} />
                    Actualizar
                </button>
            </div>

            {loading && pendingOpenings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
                    <RefreshCcw size={48} className="spin" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Cargando solicitudes...</p>
                </div>
            ) : pendingOpenings.length === 0 ? (
                <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', opacity: 0.8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <CheckCircle size={40} color="var(--primary)" style={{ opacity: 0.5 }} />
                    </div>
                    <h2>¡Todo al día!</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>No hay solicitudes de apertura pendientes en este momento.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {pendingOpenings.map(opening => (
                        <div key={opening.id} className="glass-card hover-glow" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <User size={24} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{opening.User.name}</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>{opening.User.email}</p>
                                    </div>
                                </div>
                                <span style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: '#f59e0b',
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    Pendiente
                                </span>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                                    <Calendar size={16} color="var(--primary)" />
                                    <span>{new Date(opening.SalesDay?.date + 'T00:00:00').toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                                    <Clock size={16} color="var(--primary)" />
                                    <span>{new Date(opening.openingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', pt: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ opacity: 0.6 }}>Efectivo Inicial:</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₡{new Intl.NumberFormat('es-CR').format(opening.initialCash)}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => handleAction(opening.id, 'authorized')}
                                    className="btn btn-primary"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}
                                >
                                    <CheckCircle size={18} />
                                    Autorizar
                                </button>
                                <button
                                    onClick={() => handleAction(opening.id, 'denied')}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', color: '#ef4444' }}
                                >
                                    <XCircle size={18} />
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Authorizations;
