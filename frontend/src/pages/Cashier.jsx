import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Calculator,
    Calendar,
    Clock,
    Download,
    Printer,
    RefreshCcw,
    Save,
    TrendingUp,
    Users,
    Package,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    Percent
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const Cashier = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDays, setEventDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [summary, setSummary] = useState(null);
    const [closings, setClosings] = useState([]);
    const [viewingClosing, setViewingClosing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchEvents();
        const savedEventId = localStorage.getItem('selectedEventId');
        const savedDayId = localStorage.getItem('selectedDayId');
        if (savedEventId) {
            loadInitialSelection(savedEventId, savedDayId);
        }
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`${API_URL}/events`);
            setEvents(res.data);
        } catch (err) {
            toast.error('Error al cargar eventos');
        }
    };

    const loadInitialSelection = async (eventId, dayId) => {
        try {
            const res = await axios.get(`${API_URL}/events/${eventId}/days`);
            setEventDays(res.data);
            const event = events.find(e => e.id.toString() === eventId) || res.data[0]?.Event;
            setSelectedEvent(event);

            if (dayId) {
                const day = res.data.find(d => d.id.toString() === dayId.toString());
                if (day) {
                    setSelectedDay(day);
                    fetchSummary(day.id);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSummary = async (dayId) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/sales/summary?salesDayId=${dayId}`);
            setSummary(res.data);
            fetchClosings(dayId);
        } catch (err) {
            toast.error('Error al cargar resumen de ventas');
        } finally {
            setLoading(false);
        }
    };

    const fetchClosings = async (dayId) => {
        try {
            const res = await axios.get(`${API_URL}/sales/closings?salesDayId=${dayId}`);
            setClosings(res.data);
        } catch (err) {
            console.error('Error fetching closings:', err);
        }
    };

    const handleSelectEvent = async (event) => {
        setSelectedEvent(event);
        localStorage.setItem('selectedEventId', event.id);
        const res = await axios.get(`${API_URL}/events/${event.id}/days`);
        setEventDays(res.data);
        setSelectedDay(null);
        setSummary(null);
    };

    const handleSelectDay = (day) => {
        setSelectedDay(day);
        localStorage.setItem('selectedDayId', day.id);
        fetchSummary(day.id);
    };

    const handleSaveClosing = async () => {
        if (!summary || !selectedDay) return;

        if (summary.totalGeneral <= 0) {
            toast.error('No hay ventas registradas para realizar el corte');
            return;
        }

        try {
            setSaving(true);
            await axios.post(`${API_URL}/sales/closing`, {
                salesDayId: selectedDay.id,
                userId: user?.id || 1, // Fallback for dev
                summary: summary
            });
            toast.success('Cierre de caja registrado correctamente');
            setSummary(null); // Clear local summary
            fetchSummary(selectedDay.id); // Refresh from server
            fetchClosings(selectedDay.id);
        } catch (err) {
            toast.error('Error al guardar el cierre de caja');
        } finally {
            setSaving(false);
        }
    };

    if (!selectedEvent) {
        return (
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '1rem',
                        borderRadius: '1.5rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--primary)',
                        marginBottom: '1rem'
                    }}>
                        <Calculator size={40} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Cajas</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Selecciona el evento para realizar el corte</p>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {events.map(ev => (
                        <div key={ev.id} className="glass-card hover-glow"
                            style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.5rem' }}
                            onClick={() => handleSelectEvent(ev)}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {ev.logo ? <img src={ev.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Calendar size={30} color="var(--primary)" />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0 }}>{ev.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                    {new Date(ev.startDate).toLocaleDateString()} - {new Date(ev.endDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!selectedDay) {
        return (
            <div className="container" style={{ maxWidth: '800px' }}>
                <button onClick={() => setSelectedEvent(null)} className="btn" style={{ background: 'none', color: 'var(--text-secondary)', marginBottom: '1.5rem', padding: 0 }}>
                    <ArrowLeft size={18} /> Cambiar Evento
                </button>
                <h1 style={{ marginBottom: '1.5rem' }}>Elegir Día para el Corte</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {eventDays.map(day => (
                        <div key={day.id} className="glass-card hover-glow"
                            style={{ padding: '2rem 1.5rem', cursor: 'pointer', textAlign: 'center' }}
                            onClick={() => handleSelectDay(day)}>
                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Haga clic para ver resumen</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <button onClick={() => setSelectedDay(null)} className="btn" style={{ background: 'none', color: 'var(--text-secondary)', marginBottom: '0.5rem', padding: 0, fontSize: '0.8rem' }}>
                        <ArrowLeft size={14} /> Volver a días
                    </button>
                    <h1 style={{ marginBottom: '0.2rem' }}>Corte de Caja</h1>
                    <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} /> {new Date(selectedDay.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        <span style={{ color: 'var(--glass-border)' }}>|</span>
                        <Users size={16} /> Usuario: {user?.name || 'Administrador'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>

                    <button
                        className="btn btn-primary"
                        onClick={handleSaveClosing}
                        disabled={saving || !summary}
                    >
                        <Save size={18} /> {saving ? 'Guardando...' : 'Registrar Corte'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>
                    <RefreshCcw className="animate-spin" size={40} color="var(--primary)" />
                    <p style={{ marginTop: '1rem' }}>Calculando totales...</p>
                </div>
            ) : (summary && summary.totalGeneral > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Header Totals */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>TOTAL GENERAL</p>
                            <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: 'var(--accent)' }}>
                                ₡{new Intl.NumberFormat('es-CR').format(summary.totalGeneral)}
                            </h2>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>EFECTIVO</p>
                            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem' }}>
                                ₡{new Intl.NumberFormat('es-CR').format(summary.totalEfectivo)}
                            </h3>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TARJETA</p>
                            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem' }}>
                                ₡{new Intl.NumberFormat('es-CR').format(summary.totalTarjeta)}
                            </h3>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SINPE</p>
                            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem' }}>
                                ₡{new Intl.NumberFormat('es-CR').format(summary.totalSinpe)}
                            </h3>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>COMISIONES DATA.</p>
                            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', color: '#ef4444' }}>
                                ₡{new Intl.NumberFormat('es-CR').format(summary.totalComisiones)}
                            </h3>
                        </div>
                    </div>

                    {/* Breakdown by Supplier */}
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <TrendingUp size={20} color="var(--primary)" /> Resumen por Proveedor
                        </h3>

                        {Object.values(summary.bySupplier).map((supp, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.2rem 1.5rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderBottom: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>{supp.name}</h4>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SUBTOTAL</p>
                                        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(supp.total)}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                                    {/* Products Detail */}
                                    <div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Package size={14} /> DETALLE DE PRODUCTOS
                                        </p>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                                    <th style={{ padding: '0.5rem 0' }}>Producto</th>
                                                    <th style={{ padding: '0.5rem 0', textAlign: 'center' }}>Cant.</th>
                                                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.values(supp.products).map((prod, pIdx) => (
                                                    <tr key={pIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                        <td style={{ padding: '0.8rem 0' }}>{prod.name}</td>
                                                        <td style={{ padding: '0.8rem 0', textAlign: 'center' }}>{prod.quantity}</td>
                                                        <td style={{ padding: '0.8rem 0', textAlign: 'right' }}>₡{new Intl.NumberFormat('es-CR').format(prod.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Financial Summary */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.8rem', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ventas Tarjeta:</span>
                                                <span style={{ fontWeight: '500' }}>₡{new Intl.NumberFormat('es-CR').format(supp.cardTotal)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                                                <span style={{ fontSize: '0.8rem' }}>Comisión datafono:</span>
                                                <span style={{ fontWeight: 'bold' }}>- ₡{new Intl.NumberFormat('es-CR').format(supp.cardCommission)}</span>
                                            </div>
                                            <div style={{ mt: '1rem', pt: '0.5rem', borderTop: '1px dashed var(--glass-border)', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                <span>A Liquidar:</span>
                                                <span>₡{new Intl.NumberFormat('es-CR').format(supp.total - supp.cardCommission)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                    <TrendingUp size={60} style={{ marginBottom: '1rem' }} />
                    <p>No hay transacciones nuevas para liquidar en este momento.</p>
                </div>
            )}

            {/* Closings History - Alway visible if closings exist */}
            {closings.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Clock size={20} color="var(--primary)" /> Historial de Cortes Registrados
                    </h3>
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '1rem 1.5rem' }}>Usuario</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Fecha/Hora</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Total Efectivo</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Total General</th>
                                </tr>
                            </thead>
                            <tbody>
                                {closings.map((c, i) => (
                                    <tr key={c.id}
                                        style={{ borderTop: '1px solid var(--glass-border)', cursor: 'pointer' }}
                                        className="hover-glow"
                                        onClick={() => setViewingClosing(c)}
                                    >
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                    {c.User?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{c.User?.name || 'Sistema'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.User?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: '500' }}>{new Date(c.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                            ₡{new Intl.NumberFormat('es-CR').format(c.totalEfectivo)}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent)' }}>
                                            ₡{new Intl.NumberFormat('es-CR').format(c.totalGeneral)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Historical Detail Overlay */}
            {viewingClosing && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => setViewingClosing(null)}>
                    <div style={{
                        width: '100%',
                        maxWidth: '1200px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: 'var(--bg-dark)',
                        borderRadius: '1.5rem',
                        border: '1px solid var(--glass-border)',
                        padding: '2.5rem',
                        position: 'relative',
                        boxShadow: '0 0 50px rgba(99, 102, 241, 0.2)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Detalle de Corte Histórico</h2>
                                <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} /> Registrado el {new Date(viewingClosing.timestamp).toLocaleString()}
                                    <span style={{ color: 'var(--glass-border)' }}>|</span>
                                    <Users size={16} /> Por: {viewingClosing.User?.name}
                                </p>
                            </div>
                            <button className="btn" onClick={() => setViewingClosing(null)} style={{ background: 'rgba(237, 32, 32, 0.05)' }}>
                                <ArrowLeft size={18} /> Cerrar
                            </button>
                        </div>

                        <SummaryView summary={viewingClosing.details} />
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper component to render the summary structure
const SummaryView = ({ summary }) => {
    if (!summary) return null;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL GENERAL</p>
                    <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', color: 'var(--accent)' }}>
                        ₡{new Intl.NumberFormat('es-CR').format(summary.totalGeneral)}
                    </h2>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>EFECTIVO</p>
                    <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem' }}>
                        ₡{new Intl.NumberFormat('es-CR').format(summary.totalEfectivo)}
                    </h3>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TARJETA</p>
                    <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem' }}>
                        ₡{new Intl.NumberFormat('es-CR').format(summary.totalTarjeta)}
                    </h3>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SINPE</p>
                    <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem' }}>
                        ₡{new Intl.NumberFormat('es-CR').format(summary.totalSinpe)}
                    </h3>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>COMISIONES</p>
                    <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', color: '#ef4444' }}>
                        ₡{new Intl.NumberFormat('es-CR').format(summary.totalComisiones)}
                    </h3>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>GANANCIA GRUPO</p>
                    <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', color: 'var(--primary)' }}>
                        ₡{new Intl.NumberFormat('es-CR').format(summary.totalGananciaGrupos || 0)}
                    </h2>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {Object.values(summary.bySupplier).map((supp, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{
                            padding: '1rem 1.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>{supp.name}</h4>
                            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(supp.total)}</p>
                        </div>
                        <div style={{ padding: '1.2rem 1.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', opacity: 0.6 }}>
                                        <th style={{ paddingBottom: '0.5rem' }}>Producto</th>
                                        <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>Cant.</th>
                                        <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(supp.products).map((prod, pIdx) => (
                                        <tr key={pIdx}>
                                            <td style={{ padding: '0.6rem 0' }}>{prod.name}</td>
                                            <td style={{ padding: '0.6rem 0', textAlign: 'center' }}>{prod.quantity}</td>
                                            <td style={{ padding: '0.6rem 0', textAlign: 'right' }}>₡{new Intl.NumberFormat('es-CR').format(prod.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '1rem',
                                marginTop: '1.5rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>EFECTIVO</p>
                                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(supp.cashTotal || 0)}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TARJETA</p>
                                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(supp.cardTotal || 0)}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SINPE</p>
                                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(supp.sinpeTotal || 0)}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#ef4444' }}>COMISIÓN BANCO</p>
                                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', color: '#ef4444' }}>-₡{new Intl.NumberFormat('es-CR').format(supp.cardCommission || 0)}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>TOTAL A REPARTIR</p>
                                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(supp.total - (supp.cardCommission || 0))}</p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginTop: '1.5rem',
                                marginBottom: '1rem'
                            }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                    Liquidación
                                </span>
                                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--glass-border) 0%, transparent 100%)' }}></div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '1rem'
                            }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--accent)' }}>A LIQUIDAR PROVEEDOR</p>
                                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1rem' }}>₡{new Intl.NumberFormat('es-CR').format(supp.total - (supp.cardCommission || 0) - (supp.groupProfit || 0))}</p>
                                </div>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--primary)' }}>GANANCIA GRUPO</p>
                                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', color: 'var(--primary)' }}>₡{new Intl.NumberFormat('es-CR').format(supp.groupProfit || 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Cashier;
