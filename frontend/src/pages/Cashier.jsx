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
    Percent,
    X,
    CreditCard,
    Smartphone,
    Banknote,
    Receipt,
    Trash2,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const Cashier = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDays, setEventDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [summary, setSummary] = useState(null);
    const [closings, setClosings] = useState([]);
    const [viewingClosing, setViewingClosing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingSales, setPendingSales] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [deletingTransaction, setDeletingTransaction] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [selectedPendingSale, setSelectedPendingSale] = useState(null);
    const [tooltipType, setTooltipType] = useState(null); // 'save' | 'final'
    const [showFinalConfirmModal, setShowFinalConfirmModal] = useState(false);

    const deleteReasons = ['Error de digitación', 'Cliente se arrepintió', 'Cambio de método de pago', 'Duplicado', 'Otro'];

    useEffect(() => {
        fetchEvents();
        fetchPaymentTypes();
        const savedEventId = localStorage.getItem('selectedEventId');
        const savedDayId = localStorage.getItem('selectedDayId');
        if (savedEventId) {
            loadInitialSelection(savedEventId, savedDayId);
        }
    }, []);

    const fetchPaymentTypes = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/payment-types`);
            setPaymentTypes(res.data);
        } catch (err) {
            console.error('Error fetching payment types:', err);
        }
    };

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

    const handleViewPending = async () => {
        if (!selectedDay) return;
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/sales/pending?salesDayId=${selectedDay.id}`);
            setPendingSales(res.data);
            setShowPendingModal(true);
        } catch (err) {
            toast.error('Error al cargar ventas pendientes');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePayment = async (transactionId, paymentTypeId) => {
        try {
            setProcessingPayment(true);
            await axios.put(`${API_URL}/sales/${transactionId}/payment-type`, {
                paymentTypeId
            });
            toast.success('Pago actualizado correctamente', {
                style: {
                    background: 'rgba(16, 185, 129, 0.15)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    borderRadius: '12px',
                    fontWeight: 'bold'
                }
            });
            // Refrescar lista de pendientes
            const res = await axios.get(`${API_URL}/sales/pending?salesDayId=${selectedDay.id}`);
            setPendingSales(res.data);
            setSelectedPendingSale(null);
            // Refrescar resumen de la página principal
            fetchSummary(selectedDay.id);
        } catch (err) {
            toast.error('Error al actualizar el pago', {
                style: {
                    background: 'rgba(239, 68, 68, 0.15)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: '12px'
                }
            });
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleDeletePending = async () => {
        if (!deletingTransaction || !deleteReason) return;
        try {
            setProcessingPayment(true);
            await axios.delete(`${API_URL}/sales/${deletingTransaction.id}`, {
                data: { reason: deleteReason }
            });
            toast.success('Venta eliminada con éxito');
            setDeletingTransaction(null);
            setDeleteReason('');
            const res = await axios.get(`${API_URL}/sales/pending?salesDayId=${selectedDay.id}`);
            setPendingSales(res.data);
            fetchSummary(selectedDay.id);
        } catch (err) {
            toast.error('Error al eliminar la venta');
        } finally {
            setProcessingPayment(false);
        }
    };

    const getPaymentIcon = (name) => {
        const n = name.toLowerCase();
        if (n.includes('efectivo')) return <Banknote size={24} />;
        if (n.includes('tarjeta')) return <CreditCard size={24} />;
        if (n.includes('sinpe')) return <Smartphone size={24} />;
        if (n.includes('pendiente')) return <Clock size={24} />;
        return <CheckCircle size={24} />;
    };

    const handlePrintReceipt = (transaction) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Por favor permite las ventanas emergentes para imprimir', {
                style: {
                    background: 'rgba(239, 68, 68, 0.15)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: '12px',
                    fontWeight: 'bold'
                }
            });
            return;
        }

        const totalFormatted = new Intl.NumberFormat('es-CR').format(transaction.total);
        const dateStr = new Date(transaction.timestamp).toLocaleString();

        let itemsHtml = '';
        transaction.Sales?.forEach(item => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px dotted #eee; padding-bottom: 3px;">
                    <div style="flex: 1;">${item.Product?.name}</div>
                    <div style="width: 40px; text-align: center;">x${item.quantity}</div>
                    <div style="width: 80px; text-align: right;">₡${new Intl.NumberFormat('es-CR').format(item.total)}</div>
                </div>
            `;
        });

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Justificante Pedido #${transaction.id}</title>
                    <style>
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            line-height: 1.2; 
                            width: 300px; 
                            padding: 10px;
                            margin: 0;
                            font-size: 14px;
                            color: #000;
                        }
                        .header { text-align: center; margin-bottom: 15px; }
                        .divider { border-top: 1px solid #000; margin: 10px 0; }
                        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                        @media print {
                            @page { margin: 0; }
                            body { margin: 0.5cm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2 style="margin: 0;">CGR - EVENTOS</h2>
                        <p style="margin: 5px 0;">JUSTIFICANTE DE PEDIDO</p>
                        <p style="margin: 0; font-size: 12px;">#${transaction.id}</p>
                    </div>
                    <div class="divider"></div>
                    <p style="margin: 5px 0;">Fecha: ${dateStr}</p>
                    ${transaction.observation ? `<p style="margin: 5px 0;"><strong>Cliente: ${transaction.observation}</strong></p>` : ''}
                    <div class="divider"></div>
                    <div style="font-weight: bold; display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="flex: 1;">Prod.</span>
                        <span style="width: 40px; text-align: center;">Cant.</span>
                        <span style="width: 80px; text-align: right;">Subt.</span>
                    </div>
                    ${itemsHtml}
                    <div class="total">TOTAL: ₡${totalFormatted}</div>
                    <div class="divider"></div>
                    <div class="footer">
                        <p>Favor de conservar este tiquete.</p>
                        <p>¡Muchas gracias!</p>
                    </div>
                    <script>
                        window.onload = function() { 
                            window.print(); 
                            setTimeout(function() { window.close(); }, 500);
                        }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleSaveClosing = async () => {
        if (!summary || !selectedDay) return;

        if (summary.totalPendiente > 0) {
            toast.error('No se puede realizar el corte: existen ventas pendientes de cobro');
            handleViewPending(); // Abrir el modal automáticamente para que los resuelva
            return;
        }

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
            toast.success('Cierre de caja registrado correctamente', {
                icon: '💰',
                style: {
                    background: 'rgba(16, 185, 129, 0.15)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)',
                    padding: '12px 20px',
                    fontWeight: 'bold'
                }
            });
            setSummary(null); // Clear local summary
            fetchSummary(selectedDay.id); // Refresh from server
            fetchClosings(selectedDay.id);
        } catch (err) {
            toast.error('Error al guardar el cierre de caja', {
                style: {
                    background: 'rgba(239, 68, 68, 0.15)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontWeight: 'bold'
                }
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveFinalClosing = async () => {
        if (!selectedDay) return;

        const needsFinal = closings.length > 0 && !closings[0].isFinal;

        if (!needsFinal) {
            const message = closings.length === 0
                ? 'No hay cortes parciales para consolidar.'
                : 'El corte definitivo ya ha sido realizado para todos los registros actuales.';

            toast.error(message, {
                icon: closings.length === 0 ? '🔎' : '✅',
                style: {
                    background: 'rgba(59, 130, 246, 0.2)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #3b82f6',
                    color: '#fff',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }
            });
            return;
        }

        if (summary?.totalGeneral > 0) {
            toast.error('No se puede realizar el corte definitivo: existen ventas actuales que deben ser cerradas primero.', {
                icon: '🚫',
                style: {
                    background: 'rgba(239, 68, 68, 0.2)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #ef4444',
                    color: '#fff',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }
            });
            return;
        }
        setShowFinalConfirmModal(true);
    };

    const executeFinalClosing = async () => {
        setShowFinalConfirmModal(false);
        try {
            setSaving(true);
            await axios.post(`${API_URL}/sales/final-closing`, {
                salesDayId: selectedDay.id,
                userId: user?.id
            });
            toast.success('Corte definitivo generado con éxito', {
                icon: '🏆',
                duration: 5000,
                style: {
                    background: 'rgba(16, 185, 129, 0.2)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #10b981',
                    color: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
                    padding: '16px 24px',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                }
            });
            fetchSummary(selectedDay.id);
            fetchClosings(selectedDay.id);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al generar corte definitivo', {
                style: {
                    background: 'rgba(239, 68, 68, 0.2)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #ef4444',
                    color: '#fff',
                    borderRadius: '12px'
                }
            });
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
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Cierre de cajas</h1>
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
                    <h1 style={{ marginBottom: '0.2rem' }}>Cierre de Caja</h1>
                    <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} /> {new Date(selectedDay.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        <span style={{ color: 'var(--glass-border)' }}>|</span>
                        <Users size={16} /> Usuario: {user?.name || 'Administrador'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>

                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (summary?.totalPendiente > 0) {
                                toast.error('Resuelva las ventas pendientes antes de cerrar', {
                                    icon: '⚠️',
                                    style: {
                                        background: 'rgba(245, 158, 11, 0.2)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid #f59e0b',
                                        color: '#fff',
                                        padding: '16px 24px',
                                        borderRadius: '16px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                                    }
                                });
                                handleViewPending();
                            } else {
                                handleSaveClosing();
                            }
                        }}
                        disabled={saving || !summary}
                        onMouseEnter={() => setTooltipType('save')}
                        onMouseLeave={() => setTooltipType(null)}
                        style={{
                            opacity: (saving || !summary || summary.totalPendiente > 0) ? 0.6 : 1,
                            position: 'relative',
                            cursor: (saving || !summary) ? 'wait' : 'pointer'
                        }}
                    >
                        <Save size={18} /> {saving ? 'Guardando...' : 'Registrar Corte'}

                        {/* PREMIUM TOOLTIP - Registrar Corte */}
                        {tooltipType === 'save' && summary?.totalPendiente > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '0',
                                marginTop: '15px',
                                background: 'rgba(10, 10, 10, 0.95)',
                                backdropFilter: 'blur(25px)',
                                border: '1px solid rgba(245, 158, 11, 0.5)',
                                color: '#fff',
                                padding: '14px 22px',
                                borderRadius: '16px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
                                zIndex: 5000,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                animation: 'fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    padding: '8px',
                                    borderRadius: '10px',
                                    color: '#000',
                                    display: 'flex',
                                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
                                }}>
                                    <Clock size={16} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: '#f59e0b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acción Bloqueada</span>
                                    <span>Resolver ventas pendientes antes de cerrar</span>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    right: '30px',
                                    width: '0',
                                    height: '0',
                                    borderLeft: '10px solid transparent',
                                    borderRight: '10px solid transparent',
                                    borderBottom: '10px solid rgba(10, 10, 10, 0.95)'
                                }}></div>
                            </div>
                        )}

                        {summary?.totalPendiente > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#f59e0b',
                                color: 'black',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)',
                                pointerEvents: 'none'
                            }}>!</span>
                        )}
                    </button>

                    <button
                        className="btn"
                        onClick={handleSaveFinalClosing}
                        disabled={saving || closings.length === 0 || (closings.length > 0 && closings[0].isFinal) || (summary && summary.totalGeneral > 0)}
                        onMouseEnter={() => setTooltipType('final')}
                        onMouseLeave={() => setTooltipType(null)}
                        style={{
                            background: (closings.length === 0 || (closings.length > 0 && closings[0].isFinal) || (summary && summary.totalGeneral > 0))
                                ? 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)'
                                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            color: 'white',
                            boxShadow: (closings.length === 0 || (closings.length > 0 && closings[0].isFinal) || (summary && summary.totalGeneral > 0))
                                ? 'none'
                                : '0 4px 15px rgba(16, 185, 129, 0.3)',
                            opacity: (saving || closings.length === 0 || (closings.length > 0 && closings[0].isFinal) || (summary && summary.totalGeneral > 0)) ? 0.6 : 1,
                            cursor: (saving || closings.length === 0 || (closings.length > 0 && closings[0].isFinal) || (summary && summary.totalGeneral > 0)) ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <CheckCircle2 size={18} /> {(closings.length > 0 && closings[0].isFinal) ? 'Corte Finalizado' : 'Corte Definitivo'}

                        {/* PREMIUM TOOLTIP - Corte Definitivo */}
                        {tooltipType === 'final' && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '0',
                                marginTop: '15px',
                                background: 'rgba(10, 10, 10, 0.95)',
                                backdropFilter: 'blur(25px)',
                                border: (summary?.totalGeneral > 0 || closings.length === 0 || (closings.length > 0 && closings[0].isFinal))
                                    ? '1px solid rgba(239, 68, 68, 0.5)'
                                    : '1px solid rgba(16, 185, 129, 0.5)',
                                color: '#fff',
                                padding: '14px 22px',
                                borderRadius: '16px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                boxShadow: `0 20px 50px rgba(0,0,0,0.7), 0 0 30px ${(summary?.totalGeneral > 0 || closings.length === 0 || (closings.length > 0 && closings[0].isFinal)) ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
                                zIndex: 5000,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                animation: 'fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                <div style={{
                                    background: (summary?.totalGeneral > 0 || closings.length === 0 || (closings.length > 0 && closings[0].isFinal))
                                        ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    padding: '8px',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    display: 'flex',
                                    boxShadow: `0 0 15px ${(summary?.totalGeneral > 0 || closings.length === 0 || (closings.length > 0 && closings[0].isFinal)) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                }}>
                                    {(summary?.totalGeneral > 0 || closings.length === 0 || (closings.length > 0 && closings[0].isFinal)) ? <X size={16} /> : <TrendingUp size={16} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: (summary?.totalGeneral > 0 || closings.length === 0 || (closings.length > 0 && closings[0].isFinal)) ? '#ef4444' : '#10b981', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {(closings.length > 0 && closings[0].isFinal) ? 'Cierre Completado' : ((summary?.totalGeneral > 0 || closings.length === 0) ? 'Acción Restringida' : 'Reporte Maestro')}
                                    </span>
                                    <span>
                                        {closings.length === 0
                                            ? 'No hay registros de cortes para consolidar'
                                            : ((closings.length > 0 && closings[0].isFinal)
                                                ? 'El día ya cuenta con un cierre definitivo'
                                                : (summary?.totalGeneral > 0
                                                    ? 'Primero cierre las ventas actuales con un corte normal'
                                                    : 'Consolidar todos los cortes en un reporte final del día'))
                                        }
                                    </span>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    right: '40px',
                                    width: '0',
                                    height: '0',
                                    borderLeft: '10px solid transparent',
                                    borderRight: '10px solid transparent',
                                    borderBottom: '10px solid rgba(10, 10, 10, 0.95)'
                                }}></div>
                            </div>
                        )}
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
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>COMISIONES DATAFONO</p>
                            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', color: '#ef4444' }}>
                                ₡{new Intl.NumberFormat('es-CR').format(summary.totalComisiones)}
                            </h3>
                        </div>
                        {summary.totalPendiente > 0 && (
                            <div className="glass-card hover-glow"
                                onClick={handleViewPending}
                                style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Clock size={14} /> VENTAS PENDIENTES
                                </p>
                                <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', color: '#f59e0b' }}>
                                    ₡{new Intl.NumberFormat('es-CR').format(summary.totalPendiente)}
                                </h3>
                                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.7rem', color: '#f59e0b', opacity: 0.8 }}>Click para resolver →</p>
                            </div>
                        )}
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
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>{supp.name}</h4>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '0.4rem', display: 'inline-block', marginTop: '0.3rem', fontWeight: '500' }}>
                                            {supp.type || 'General'}
                                        </div>
                                    </div>
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
                                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ventas Efectivo:</span>
                                                <span style={{ fontWeight: '500' }}>₡{new Intl.NumberFormat('es-CR').format(supp.cashTotal || 0)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ventas SINPE:</span>
                                                <span style={{ fontWeight: '500' }}>₡{new Intl.NumberFormat('es-CR').format(supp.sinpeTotal || 0)}</span>
                                            </div>
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
                                                <span>₡{new Intl.NumberFormat('es-CR').format(supp.total - (supp.cardCommission || 0))}</span>
                                            </div>
                                        </div>

                                        {supp.pendingTotal > 0 && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                padding: '0.8rem',
                                                borderRadius: '0.8rem',
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            }}>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>
                                                    ⚠️ Existen ventas pendientes por cobrar:
                                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                                                        ₡{new Intl.NumberFormat('es-CR').format(supp.pendingTotal)}
                                                    </span>
                                                </p>
                                                <button
                                                    onClick={handleViewPending}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#f59e0b',
                                                        fontSize: '0.75rem',
                                                        textDecoration: 'underline',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        padding: 0,
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Ver y cobrar pendientes →
                                                </button>
                                            </div>
                                        )}
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
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Total General</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Liquidación</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Ganancia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {closings.map((c, i) => {
                                    const details = typeof c.details === 'string' ? JSON.parse(c.details) : c.details;
                                    const totalGanancia = details?.totalGananciaGrupos || 0;
                                    const totalComisiones = details?.totalComisiones || 0;
                                    const totalLiquidacion = parseFloat(c.totalGeneral) - totalComisiones - totalGanancia;

                                    return (
                                        <tr key={c.id}
                                            style={{
                                                borderTop: '1px solid var(--glass-border)',
                                                cursor: 'pointer',
                                                background: c.isFinal ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                                                borderLeft: c.isFinal ? '4px solid #10b981' : 'none'
                                            }}
                                            className="hover-glow"
                                            onClick={() => setViewingClosing(c)}
                                        >
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: c.isFinal ? '#10b981' : 'var(--primary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {c.isFinal ? '★' : (c.User?.name?.charAt(0) || 'U')}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', color: c.isFinal ? '#10b981' : 'inherit' }}>
                                                            {c.isFinal ? 'CORTE DEFINITIVO' : (c.User?.name || 'Sistema')}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {c.isFinal ? 'Consolidación de día' : c.User?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: '500' }}>{new Date(c.timestamp).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                ₡{new Intl.NumberFormat('es-CR').format(c.totalGeneral)}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                ₡{new Intl.NumberFormat('es-CR').format(totalLiquidacion)}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                ₡{new Intl.NumberFormat('es-CR').format(totalGanancia)}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                            <button className="btn" onClick={() => setViewingClosing(null)} style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white'
                            }}>
                                <ArrowLeft size={18} /> Cerrar
                            </button>
                        </div>

                        <SummaryView summary={viewingClosing.details} />
                    </div>
                </div>
            )}
            {/* MODAL DE VENTAS PENDIENTES */}
            {showPendingModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '1rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <Clock size={24} color="#f59e0b" /> Ventas Pendientes
                            </h2>
                            <button onClick={() => setShowPendingModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {pendingSales.map(transaction => (
                                <div key={transaction.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.8rem', borderRadius: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Receipt size={24} color="#f59e0b" />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>Transacción #{transaction.id}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                                                    {transaction.observation && (
                                                        <span style={{ color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            📝 {transaction.observation}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                                                        {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent)', marginBottom: '0.8rem' }}>
                                                ₡{new Intl.NumberFormat('es-CR').format(transaction.total)}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
                                                <button
                                                    onClick={() => handlePrintReceipt(transaction)}
                                                    style={{
                                                        padding: '0.6rem',
                                                        borderRadius: '0.6rem',
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        color: 'white',
                                                        border: '1px solid var(--glass-border)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        title: 'Imprimir Justificante'
                                                    }}
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingTransaction(transaction)}
                                                    style={{
                                                        padding: '0.6rem 0.8rem',
                                                        borderRadius: '0.6rem',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    <Trash2 size={16} /> Eliminar
                                                </button>
                                                <button
                                                    onClick={() => setSelectedPendingSale(transaction)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.6rem 1rem',
                                                        borderRadius: '0.6rem',
                                                        background: '#6366f1',
                                                        color: 'white',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.9rem',
                                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                                    }}
                                                >
                                                    Cobrar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.8rem', padding: '1rem' }}>
                                        <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.7rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DETALLE DE PRODUCTOS:</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {transaction.Sales?.map(sale => (
                                                <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                                    <span style={{ color: 'white' }}>{sale.Product?.name} <span style={{ opacity: 0.5, marginLeft: '0.3rem' }}>x{sale.quantity}</span></span>
                                                    <span style={{ fontWeight: 'bold', color: 'white' }}>₡{new Intl.NumberFormat('es-CR').format(sale.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {pendingSales.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                    <Clock size={48} style={{ marginBottom: '1rem', margin: '0 auto' }} />
                                    <p>No hay ventas pendientes de pago.</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowPendingModal(false)}
                            style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                            Listo
                        </button>

                        {/* Delete confirmation sub-modal */}
                        {deletingTransaction && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '1rem' }}>
                                <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                                    <Trash2 size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ marginBottom: '0.5rem' }}>¿Eliminar Pendiente?</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                        Esta acción no se puede deshacer. Selecciona un motivo:
                                    </p>

                                    <select
                                        value={deleteReason}
                                        onChange={(e) => setDeleteReason(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', marginBottom: '1.5rem', fontSize: '1rem' }}
                                    >
                                        <option value="" style={{ background: '#1e293b' }}>-- Seleccionar motivo --</option>
                                        {deleteReasons.map(r => (
                                            <option key={r} value={r} style={{ background: '#1e293b' }}>{r}</option>
                                        ))}
                                    </select>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => {
                                                setDeletingTransaction(null);
                                                setDeleteReason('');
                                            }}
                                            style={{ flex: 1, padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            disabled={!deleteReason || processingPayment}
                                            onClick={handleDeletePending}
                                            style={{ flex: 1, padding: '0.8rem', borderRadius: '0.5rem', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', opacity: (!deleteReason || processingPayment) ? 0.5 : 1 }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Selection Sub-modal */}
                        {selectedPendingSale && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '1rem' }}>
                                <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                        <h2 style={{ marginBottom: '0.5rem' }}>Cobrar Transacción #{selectedPendingSale.id}</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            Total a cobrar: <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>₡{new Intl.NumberFormat('es-CR').format(selectedPendingSale.total)}</span>
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {paymentTypes.filter(t => t.name.toLowerCase() !== 'pendiente').map(type => (
                                            <button
                                                key={type.id}
                                                disabled={processingPayment}
                                                onClick={() => handleUpdatePayment(selectedPendingSale.id, type.id)}
                                                className="glass-card hover-glow"
                                                style={{
                                                    padding: '1.2rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1.5rem',
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: 'white',
                                                    transition: 'all 0.2s',
                                                    opacity: processingPayment ? 0.5 : 1
                                                }}
                                            >
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '1rem',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--primary)'
                                                }}>
                                                    {getPaymentIcon(type.name)}
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{type.name}</p>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confirmar pago en {type.name}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setSelectedPendingSale(null)}
                                        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', borderRadius: '0.8rem', background: 'none', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Final Confirmation Modal */}
            {showFinalConfirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 5000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => setShowFinalConfirmModal(false)}>
                    <div style={{
                        maxWidth: '500px',
                        width: '100%',
                        background: 'rgba(15, 15, 15, 0.95)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2.5rem',
                        textAlign: 'center',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(16, 185, 129, 0.1)',
                        animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            <AlertTriangle size={40} />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#fff' }}>¿Confirmar Corte Definitivo?</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                            Esta acción consolidará **todos los cortes individuales** de este día en un solo reporte maestro. Esta acción es definitiva para el cierre del evento.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn"
                                style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                                onClick={() => setShowFinalConfirmModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)'
                                }}
                                onClick={executeFinalClosing}
                                disabled={saving}
                            >
                                {saving ? 'Procesando...' : 'Confirmar Corte'}
                            </button>
                        </div>
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
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>{supp.name}</h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.9, marginTop: '0.2rem', fontWeight: '500' }}>
                                    {supp.type || 'General'}
                                </div>
                            </div>
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
