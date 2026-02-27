import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
    History,
    Calendar,
    Clock,
    Banknote,
    Smartphone,
    CreditCard,
    ChevronRight,
    Search,
    RefreshCcw,
    FileText
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const MyClosings = () => {
    const { user } = useAuth();
    const [closings, setClosings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        if (user) {
            fetchMyClosings();
        }
    }, [user]);

    const fetchMyClosings = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/sales/closings?userId=${user.id}`);
            setClosings(res.data);
        } catch (err) {
            toast.error('Error al cargar tus cierres');
        } finally {
            setLoading(false);
        }
    };

    const filteredClosings = closings.filter(c => {
        if (!filterDate) return true;
        const closingDate = new Date(c.timestamp).toISOString().split('T')[0];
        return closingDate === filterDate;
    });

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: 0 }}>
                        <History size={32} color="var(--primary)" />
                        Mis Cierres de Caja
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        Consulta el historial de tus sesiones y cierres realizados
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.8rem',
                                borderRadius: '0.8rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        onClick={fetchMyClosings}
                        className="btn btn-secondary"
                        style={{ padding: '0.6rem' }}
                    >
                        <RefreshCcw size={20} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {loading && closings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                    <RefreshCcw size={48} className="spin" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Cargando historial...</p>
                </div>
            ) : filteredClosings.length === 0 ? (
                <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', opacity: 0.8 }}>
                    <FileText size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                    <h3>No se encontraron cierres</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>{filterDate ? 'No hay registros para la fecha seleccionada.' : 'Aún no has realizado ningún cierre de caja.'}</p>
                    {filterDate && (
                        <button onClick={() => setFilterDate('')} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                            Ver todos mis cierres
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {filteredClosings.map(closing => (
                        <div key={closing.id} className="glass-card hover-glow" style={{ padding: '1.5rem', borderTop: closing.isFinal ? '4px solid var(--accent)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{closing.SalesDay?.Event?.name || 'Evento'}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                        <Calendar size={14} />
                                        <span>{new Date(closing.SalesDay?.date + 'T00:00:00').toLocaleDateString()}</span>
                                        <span style={{ opacity: 0.3 }}>|</span>
                                        <Clock size={14} />
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                            {new Date(closing.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                {closing.isFinal && (
                                    <span style={{ background: 'var(--accent)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                        Cierre Final
                                    </span>
                                )}
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.8rem',
                                background: 'rgba(255,255,255,0.03)',
                                padding: '1rem',
                                borderRadius: '0.8rem',
                                marginBottom: '1.2rem'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Efectivo</span>
                                    <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Banknote size={14} color="#10b981" />
                                        ₡{new Intl.NumberFormat('es-CR').format(closing.totalEfectivo)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>SINPE</span>
                                    <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Smartphone size={14} color="#3b82f6" />
                                        ₡{new Intl.NumberFormat('es-CR').format(closing.totalSinpe)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tarjeta</span>
                                    <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <CreditCard size={14} color="#f59e0b" />
                                        ₡{new Intl.NumberFormat('es-CR').format(closing.totalTarjeta)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pendiente</span>
                                    <span style={{ fontWeight: 'bold', color: '#64748b' }}>
                                        ₡{new Intl.NumberFormat('es-CR').format(closing.details?.totalPendiente || 0)}
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px solid var(--glass-border)',
                                paddingTop: '1rem'
                            }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>TOTAL CERRADO</span>
                                <span style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--accent)' }}>
                                    ₡{new Intl.NumberFormat('es-CR').format(closing.totalGeneral)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    opacity: 0.5;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default MyClosings;
