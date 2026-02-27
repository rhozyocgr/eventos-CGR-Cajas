import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingCart,
    Calendar,
    ArrowLeft,
    Plus,
    Minus,
    Trash2,
    CheckCircle,
    CreditCard,
    Banknote,
    Smartphone,
    Search,
    ChevronRight,
    LayoutGrid,
    Store,
    Clock,
    X,
    Receipt,
    RefreshCcw,
    AlertTriangle,
    Save,
    FileText,
    AlertCircle,
    XCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const NewSale = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [cashOpening, setCashOpening] = useState(null);
    const [showOpeningModal, setShowOpeningModal] = useState(false);
    const [initialCashInput, setInitialCashInput] = useState('');
    const [sessionTotal, setSessionTotal] = useState(0);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [showClosingModal, setShowClosingModal] = useState(false);

    useEffect(() => {
        if (location.state?.openPending) {
            setShowPendingModal(true);
        }
    }, [location.state]);

    const [eventDays, setEventDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeSupplier, setActiveSupplier] = useState('all');
    const [showCheckout, setShowCheckout] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [lastSaleTotal, setLastSaleTotal] = useState(0);
    const [lastPaymentType, setLastPaymentType] = useState('');
    const [observation, setObservation] = useState('');
    const [pendingSales, setPendingSales] = useState([]);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [selectedPendingSale, setSelectedPendingSale] = useState(null);
    const [isPendingActive, setIsPendingActive] = useState(false);
    const [deletingTransaction, setDeletingTransaction] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    const deleteReasons = [
        'Creado por error',
        'Pedido duplicado',
        'El cliente ya lo había pagado',
        'Otros'
    ];

    useEffect(() => {
        fetchInitialData();
        const savedEventId = localStorage.getItem('selectedEventId');
        const savedDayId = localStorage.getItem('selectedDayId');
        if (savedEventId) {
            fetchEventData(savedEventId, savedDayId);
        }
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [eventsRes, paymentRes, suppliersRes] = await Promise.all([
                axios.get(`${API_URL}/events`),
                axios.get(`${API_URL}/sales/payment-types`),
                axios.get(`${API_URL}/suppliers`)
            ]);
            setEvents(eventsRes.data);
            setPaymentTypes(paymentRes.data);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            toast.error('Error al cargar datos iniciales');
        } finally {
            setLoading(false);
        }
    };

    const fetchEventData = async (eventId, dayId = null) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/events/${eventId}/days`);
            setEventDays(res.data);

            if (dayId) {
                const day = res.data.find(d => d.id.toString() === dayId.toString());
                if (day) {
                    setSelectedDay(day);
                    fetchPendingSales(day.id);
                }
            } else {
                const today = new Date().toISOString().split('T')[0];
                const todayDay = res.data.find(d => d.date === today);
                if (todayDay) {
                    setSelectedDay(todayDay);
                    localStorage.setItem('selectedDayId', todayDay.id);
                    fetchPendingSales(todayDay.id);
                    checkCashOpening(todayDay.id);
                }
            }
        } catch (err) {
            toast.error('Error al cargar días del evento');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        let interval;
        if (selectedDay && cashOpening?.status === 'pending') {
            interval = setInterval(() => {
                checkCashOpening(selectedDay.id, true);
            }, 3000); // Verificar cada 3 segundos
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [cashOpening?.status, selectedDay]);

    const checkCashOpening = async (dayId, silent = false) => {
        if (!user || !dayId) return;

        if (!silent) {
            setCashOpening(null);
            setSessionTotal(0);
            setSessionSummary(null);
        }

        try {
            const res = await axios.get(`${API_URL}/sales/active-opening?salesDayId=${dayId}&userId=${user.id}`);
            if (res.data) {
                setCashOpening(res.data);
                fetchSessionTotal(dayId, res.data);
            }
        } catch (err) {
            console.error('Error checking cash opening', err);
        }
    };

    const fetchSessionTotal = async (dayId, opening = null) => {
        const activeOpening = opening || cashOpening;
        if (!user || !dayId || !activeOpening) return;
        try {
            // Enviamos el userId y la hora de apertura para que el total sea solo de esta sesión
            const res = await axios.get(`${API_URL}/sales/summary?salesDayId=${dayId}&userId=${user.id}&since=${activeOpening.openingTime}`);
            setSessionTotal(res.data.totalGeneral || 0);
            setSessionSummary(res.data);
        } catch (err) {
            console.error('Error fetching session total', err);
        }
    };

    const handleRequestOpening = async () => {
        if (!selectedDay || !user) return;
        try {
            const res = await axios.post(`${API_URL}/sales/open-cash`, {
                salesDayId: selectedDay.id,
                userId: user.id
            });
            setCashOpening(res.data);
            toast.success('Solicitud de apertura enviada');
        } catch (err) {
            toast.error('Error al solicitar apertura');
        }
    };

    const handleConfirmOpening = async () => {
        if (!cashOpening) return;
        try {
            const cleanValue = initialCashInput.replace(/\D/g, '');
            const initialCash = parseFloat(cleanValue) || 0;

            const res = await axios.post(`${API_URL}/sales/confirm-opening/${cashOpening.id}`, {
                initialCash
            });
            setCashOpening(res.data.opening);
            toast.success('Caja abierta correctamente');
            fetchSessionTotal(selectedDay.id, res.data.opening);
        } catch (err) {
            toast.error('Error al abrir la caja');
        }
    };

    const handleCloseCash = async () => {
        if (!cashOpening) return;
        try {
            setPaymentLoading(true);
            await axios.put(`${API_URL}/sales/close-cash/${cashOpening.id}`, {
                userId: user.id
            });
            toast.success('Caja cerrada con éxito');
            setCashOpening(null);
            setShowClosingModal(false);
            setSessionTotal(0);
            setSessionSummary(null);
            // Al limpiar cashOpening, el modal de apertura volverá a salir si el usuario sigue en la página,
            // o podemos redirigirlo/resetear el día.
            setSelectedDay(null);
            localStorage.removeItem('selectedDayId');
        } catch (err) {
            toast.error('Error al cerrar caja');
        } finally {
            setPaymentLoading(false);
        }
    };

    const formatInitialCash = (value) => {
        // Eliminar cualquier cosa que no sea número
        const cleanValue = value.replace(/\D/g, '');
        if (!cleanValue) return '';
        // Formatear con separadores de miles
        return new Intl.NumberFormat('es-CR').format(parseInt(cleanValue));
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        localStorage.setItem('selectedEventId', event.id);
        localStorage.removeItem('selectedDayId');
        setSelectedDay(null);
        setCashOpening(null);
        setSessionTotal(0);
        setSessionSummary(null);
        fetchEventData(event.id);
    };

    const handleSelectDay = (day) => {
        setSelectedDay(day);
        localStorage.setItem('selectedDayId', day.id);
        fetchPendingSales(day.id);
        checkCashOpening(day.id);
    };

    const fetchPendingSales = async (dayId) => {
        try {
            const res = await axios.get(`${API_URL}/sales/pending?salesDayId=${dayId}`);
            setPendingSales(res.data);
        } catch (err) {
            console.error('Error fetching pending sales', err);
        }
    };

    const handleReset = () => {
        localStorage.removeItem('selectedEventId');
        localStorage.removeItem('selectedDayId');
        setSelectedEvent(null);
        setSelectedDay(null);
        setCashOpening(null);
        setSessionTotal(0);
        setSessionSummary(null);
        setCart([]);
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.productId === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: 1
            }]);
        }
    };

    const updateQuantity = (productId, delta) => {
        const newCart = cart.map(item => {
            if (item.productId === productId) {
                return { ...item, quantity: item.quantity + delta };
            }
            return item;
        }).filter(item => item.quantity > 0);
        setCart(newCart);
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    const handleProcessSale = async (paymentTypeId) => {
        if (cart.length === 0) return;

        try {
            setPaymentLoading(true);
            await axios.post(`${API_URL}/sales`, {
                salesDayId: selectedDay.id,
                paymentTypeId: paymentTypeId,
                observation: observation,
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                userId: user.id
            });

            const pType = paymentTypes.find(t => t.id === paymentTypeId);
            setLastPaymentType(pType?.name || '');
            setLastSaleTotal(cartTotal);
            setCart([]);
            setObservation('');
            setShowCheckout(false);
            setShowSuccessOverlay(true);

            // Auto-hide overlay after 2 seconds
            setTimeout(() => {
                setShowSuccessOverlay(false);
            }, 2000);
            fetchPendingSales(selectedDay.id);
            fetchSessionTotal(selectedDay.id);
            setIsPendingActive(false); // Reset for next sale
        } catch (err) {
            toast.error('Error al procesar la venta');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleUpdatePayment = async (transactionId, paymentTypeId) => {
        try {
            setPaymentLoading(true);
            await axios.put(`${API_URL}/sales/${transactionId}/payment-type`, { paymentTypeId });
            toast.success('Cobro completado con éxito');
            setSelectedPendingSale(null);
            fetchPendingSales(selectedDay.id);
            fetchSessionTotal(selectedDay.id);
        } catch (err) {
            toast.error('Error al actualizar pago');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleDeletePending = async () => {
        if (!deletingTransaction || !deleteReason) return;
        try {
            setPaymentLoading(true);
            await axios.delete(`${API_URL}/sales/${deletingTransaction.id}`, {
                data: { reason: deleteReason }
            });
            toast.success('Venta eliminada con éxito');
            setDeletingTransaction(null);
            setDeleteReason('');
            fetchPendingSales(selectedDay.id);
            fetchSessionTotal(selectedDay.id);
        } catch (err) {
            toast.error('Error al eliminar la venta');
        } finally {
            setPaymentLoading(false);
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

    const filteredProducts = selectedDay?.Products?.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesSupplier = activeSupplier === 'all' || p.SupplierId?.toString() === activeSupplier;
        return matchesSearch && matchesSupplier;
    }) || [];

    const currentDaySuppliers = suppliers.filter(s =>
        selectedDay?.Products?.some(p => p.SupplierId === s.id)
    );

    if (!selectedEvent) {
        return (
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Ventas</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Selecciona el evento actual</p>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {events.map(ev => (
                        <div key={ev.id} className="glass-card hover-glow"
                            style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.5rem' }}
                            onClick={() => handleSelectEvent(ev)}>
                            {ev.logo ? (
                                <img src={ev.logo} alt="" style={{ width: '60px', height: '60px', borderRadius: '0.8rem', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '60px', height: '60px', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={30} color="var(--primary)" />
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0 }}>{ev.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                    {new Date(ev.startDate.split('T')[0] + 'T00:00:00').toLocaleDateString()}
                                </p>
                            </div>
                            <ChevronRight size={24} color="var(--glass-border)" />
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
                <h1 style={{ marginBottom: '1.5rem' }}>Día de Venta</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    {eventDays.map(day => (
                        <div key={day.id} className="glass-card hover-glow"
                            style={{ padding: '2rem 1rem', cursor: 'pointer', textAlign: 'center' }}
                            onClick={() => handleSelectDay(day)}>
                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{day.Products?.length || 0} productos</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    if (!cashOpening || cashOpening.status === 'pending') {
        const isPending = cashOpening?.status === 'pending';
        return (
            <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
                <div className="glass-card" style={{ padding: '3.5rem 2rem', maxWidth: '500px', margin: '0 auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        {isPending ? (
                            <div className="pulse-animation">
                                <Clock size={80} color="var(--primary)" />
                            </div>
                        ) : (
                            <AlertTriangle size={80} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.3))' }} />
                        )}
                    </div>
                    <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>
                        {isPending ? 'Esperando Autorización' : 'Caja no Iniciada'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                        {isPending
                            ? 'Tu solicitud de apertura ha sido enviada. Un administrador debe autorizar tu sesión para que puedas indicar el efectivo inicial.'
                            : 'Es necesario solicitar autorización a un administrador para poder abrir la caja.'}
                    </p>
                    {isPending ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.8rem', fontSize: '0.85rem', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 0.5rem 0', opacity: 0.6 }}>Detalles de sesión:</p>
                                <p style={{ margin: 0 }}><strong>Usuario:</strong> {user.name}</p>
                                <p style={{ margin: 0 }}><strong>Día:</strong> {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString()}</p>
                                <p style={{ margin: 0 }}><strong>Hora:</strong> {new Date(cashOpening.openingTime).toLocaleTimeString()}</p>
                            </div>
                            <button onClick={() => checkCashOpening(selectedDay.id)} className="btn btn-primary" style={{ width: '100%', padding: '1.2rem' }}>
                                <RefreshCcw size={18} style={{ marginRight: '0.5rem' }} /> Reintentar / Actualizar
                            </button>
                            <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                Cancelar y volver
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleRequestOpening}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                        >
                            <FileText size={22} /> Solicitar Autorización
                        </button>
                    )}
                    {!isPending && (
                        <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', marginTop: '2rem', opacity: 0.7 }}>
                            Volver a la selección
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (cashOpening && cashOpening.status === 'denied') {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
                <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <XCircle size={64} color="#ef4444" />
                    </div>
                    <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>Solicitud Denegada</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Tu solicitud de apertura de caja ha sido denegada por un administrador. <br />
                        Por favor, contacta a un supervisor para más información.
                    </p>
                    <button onClick={handleReset} className="btn btn-secondary" style={{ width: '100%', padding: '1rem' }}>
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    if (cashOpening && cashOpening.status === 'authorized') {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, padding: '1rem' }}>
                <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Store size={35} color="var(--primary)" />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Apertura de Caja</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        ¡Autorización concedida! <br />
                        Por favor, indica el monto de efectivo inicial para comenzar a vender.
                    </p>

                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Efectivo Inicial (₡)
                        </label>
                        <input
                            type="text"
                            autoFocus
                            placeholder="0"
                            value={initialCashInput}
                            onChange={(e) => setInitialCashInput(formatInitialCash(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '1.2rem',
                                borderRadius: '1rem',
                                border: '2px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                outline: 'none',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleConfirmOpening}
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            borderRadius: '1rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)',
                            marginBottom: '1rem'
                        }}
                    >
                        ABRIR CAJA
                    </button>
                    <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>
                        Salir
                    </button>
                </div>
            </div>
        );
    }

    if (cashOpening.status !== 'active') {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
                <RefreshCcw size={48} className="spin" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Cargando sesión...</p>
            </div>
        );
    }

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Nav POS */}
            <div className="glass-card" style={{ padding: '0.7rem 1rem', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <button onClick={handleReset} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{selectedEvent.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>

                {/* BOTÓN CERRAR CAJA EN EL CENTRO */}
                <button
                    onClick={() => setShowClosingModal(true)}
                    style={{
                        background: 'var(--primary)',
                        color: 'white',
                        padding: '0.7rem 2rem',
                        borderRadius: '0.8rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    <X size={18} /> CERRAR CAJA
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setShowPendingModal(true)}
                        style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}
                    >
                        <Clock size={16} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Pendientes</span>
                        {pendingSales.length > 0 && (
                            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', fontSize: '0.7rem', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid #0f172a' }}>
                                {pendingSales.length}
                            </span>
                        )}
                    </button>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total Sesión</p>
                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                ₡{new Intl.NumberFormat('es-CR').format(sessionTotal)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
                {/* Catalog */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {/* Filters & Search */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '2rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }} className="no-scrollbar">
                            <button
                                onClick={() => setActiveSupplier('all')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '2rem', whiteSpace: 'nowrap', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid',
                                    background: activeSupplier === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    borderColor: activeSupplier === 'all' ? 'var(--primary)' : 'var(--glass-border)',
                                    color: 'white'
                                }}
                            >
                                Todos
                            </button>
                            {currentDaySuppliers.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSupplier(s.id.toString())}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '2rem', whiteSpace: 'nowrap', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid',
                                        background: activeSupplier === s.id.toString() ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        borderColor: activeSupplier === s.id.toString() ? 'var(--primary)' : 'var(--glass-border)',
                                        color: 'white'
                                    }}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {Object.entries(
                            filteredProducts.reduce((acc, p) => {
                                const supplier = suppliers.find(s => s.id === p.SupplierId);
                                const type = supplier?.type || 'Otros';
                                if (!acc[type]) acc[type] = [];
                                acc[type].push(p);
                                return acc;
                            }, {})
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([type, products]) => (
                            <div key={type}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap', fontWeight: '900', opacity: 0.8 }}>
                                        {type}
                                    </h3>
                                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }}></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem' }}>
                                    {[...products].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                        <div key={p.id} className="glass-card hover-glow"
                                            onClick={() => addToCart(p)}
                                            style={{ padding: '1rem', cursor: 'pointer', textAlign: 'center', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.4rem' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '1rem', lineHeight: '1.2' }}>{p.name}</span>
                                            <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1rem' }}>₡{new Intl.NumberFormat('es-CR').format(p.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart Bar */}
                <div className="cart-sidebar" style={{ width: window.innerWidth < 768 ? '100%' : '350px' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>Carrito ({cart.length})</span>
                        <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}>Vaciar</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                        {cart.map(item => (
                            <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>{item.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent)' }}>₡{new Intl.NumberFormat('es-CR').format(item.price)}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => updateQuantity(item.productId, -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white' }}><Minus size={14} /></button>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white' }}><Plus size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>₡{new Intl.NumberFormat('es-CR').format(cartTotal)}</span>
                        </div>
                        <button
                            disabled={cart.length === 0}
                            onClick={() => setShowCheckout(true)}
                            style={{ width: '100%', padding: '1rem', borderRadius: '0.8rem', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}
                        >
                            PAGAR (₡{new Intl.NumberFormat('es-CR').format(cartTotal)})
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showCheckout && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{isPendingActive ? 'Detalle Pedido Pendiente' : 'Método de Pago'}</h2>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '1.5rem' }}>
                            ₡{new Intl.NumberFormat('es-CR').format(cartTotal)}
                        </div>

                        {isPendingActive ? (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                        Nota / Mesa / Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Ej: Nombre de la persona"
                                        value={observation}
                                        onChange={(e) => setObservation(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '0.8rem',
                                            border: '2px solid var(--primary)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            outline: 'none',
                                            fontSize: '1.1rem'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        Este campo es obligatorio para pedidos pendientes.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <button
                                        onClick={() => {
                                            if (!observation.trim()) {
                                                toast.error('Por favor, ingresa un nombre o referencia para el pendiente');
                                                return;
                                            }
                                            const pType = paymentTypes.find(t => t.name.toLowerCase().includes('pendiente'));
                                            handleProcessSale(pType.id);
                                        }}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '0.8rem', background: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
                                    >
                                        CONFIRMAR PENDIENTE
                                    </button>
                                    <button
                                        onClick={() => setIsPendingActive(false)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        Elegir otro método
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    {paymentTypes.map(type => (
                                        <button key={type.id}
                                            onClick={() => {
                                                if (type.name.toLowerCase().includes('pendiente')) {
                                                    setIsPendingActive(true);
                                                } else {
                                                    handleProcessSale(type.id);
                                                }
                                            }}
                                            style={{
                                                padding: '1.2rem 0.5rem',
                                                borderRadius: '1.2rem',
                                                background: type.name.toLowerCase().includes('pendiente') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                                                border: '1px solid',
                                                borderColor: type.name.toLowerCase().includes('pendiente') ? 'rgba(245, 158, 11, 0.3)' : 'var(--glass-border)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.6rem',
                                                transition: 'all 0.2s'
                                            }}
                                            className="hover-glow">
                                            <div style={{ color: type.name.toLowerCase().includes('pendiente') ? '#f59e0b' : 'inherit' }}>
                                                {getPaymentIcon(type.name)}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{type.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCheckout(false);
                                        setIsPendingActive(false);
                                        setObservation('');
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    Volver al carrito
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* PENDING TRANSACTIONS MODAL */}
            {showPendingModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '1rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <Clock size={24} color="#f59e0b" /> Ventas Pendientes
                            </h2>
                            <button onClick={() => setShowPendingModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {pendingSales.map(transaction => (
                                <div key={transaction.id} className="glass-card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                                <Receipt size={18} color="#f59e0b" />
                                                <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>Transacción #{transaction.id}</span>
                                            </div>
                                            {transaction.observation && (
                                                <p style={{ margin: '0.2rem 0', fontSize: '1rem', color: '#f59e0b', fontWeight: '700' }}>
                                                    📝 {transaction.observation}
                                                </p>
                                            )}
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '1.4rem', display: 'block' }}>₡{new Intl.NumberFormat('es-CR').format(transaction.total)}</span>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button
                                                    onClick={() => setDeletingTransaction(transaction)}
                                                    style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                                >
                                                    <Trash2 size={16} /> Eliminar
                                                </button>
                                                <button
                                                    onClick={() => setSelectedPendingSale(transaction)}
                                                    style={{ flex: 2, padding: '0.6rem', borderRadius: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    Cobrar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', padding: '0.8rem' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.5 }}>Detalle de productos:</p>
                                        {transaction.Sales?.map(sale => (
                                            <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem', paddingBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span>{sale.Product?.name} <span style={{ opacity: 0.6 }}>x{sale.quantity}</span></span>
                                                <span style={{ fontWeight: '500' }}>₡{new Intl.NumberFormat('es-CR').format(sale.total)}</span>
                                            </div>
                                        ))}
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
                            Cerrar
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
                                            disabled={!deleteReason || paymentLoading}
                                            onClick={handleDeletePending}
                                            style={{ flex: 1, padding: '0.8rem', borderRadius: '0.5rem', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', opacity: (!deleteReason || paymentLoading) ? 0.5 : 1 }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* CLOSE CASH MODAL (SUMMARY) */}
            {showClosingModal && sessionSummary && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6500, padding: '1rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <Clock size={30} color="#ef4444" />
                            </div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Resumen de Cierre</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Sesión de <span style={{ color: 'white' }}>{user?.name}</span>
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {[
                                { label: 'Efectivo Inicial', value: cashOpening?.initialCash, color: 'var(--text-secondary)' },
                                { label: 'Ventas en Efectivo', value: sessionSummary.totalEfectivo, color: 'white' },
                                { label: 'Ventas SINPE', value: sessionSummary.totalSinpe, color: 'white' },
                                { label: 'Ventas Tarjeta', value: sessionSummary.totalTarjeta, color: 'white' },
                                { label: 'Ventas Pendientes', value: sessionSummary.totalPendiente, color: '#f59e0b' }
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                    <span style={{ fontWeight: 'bold', color: item.color }}>₡{new Intl.NumberFormat('es-CR').format(item.value || 0)}</span>
                                </div>
                            ))}

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', marginTop: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>TOTAL VENDIDO</span>
                                <span style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--accent)' }}>₡{new Intl.NumberFormat('es-CR').format(sessionTotal)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowClosingModal(false)}
                                style={{ flex: 1, padding: '1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                                Seguir Vendiendo
                            </button>
                            <button
                                onClick={handleCloseCash}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    borderRadius: '0.8rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                CONFIRMAR CIERRE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT UPDATE MODAL */}
            {selectedPendingSale && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4500, padding: '1rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                            <button onClick={() => setSelectedPendingSale(null)} style={{ position: 'absolute', right: '-1rem', top: '-1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                            <h2 style={{ marginBottom: '0.5rem' }}>Cobrar Transacción</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>{selectedPendingSale.observation || `Pedido #${selectedPendingSale.id}`}</p>
                        </div>

                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '2.5rem' }}>
                            ₡{new Intl.NumberFormat('es-CR').format(selectedPendingSale.total)}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                            {paymentTypes.filter(t => t.name !== 'Pendiente').map(type => (
                                <button key={type.id} onClick={() => handleUpdatePayment(selectedPendingSale.id, type.id)}
                                    style={{ padding: '1.5rem 0.5rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}
                                    className="hover-glow">
                                    {getPaymentIcon(type.name)}
                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{type.name}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setSelectedPendingSale(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* FULL SCREEN SUCCESS OVERLAY */}
            {showSuccessOverlay && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: lastPaymentType.toLowerCase().includes('pendiente') ? '#f59e0b' : 'var(--accent)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 5000,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '50%', padding: '2rem',
                        marginBottom: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        {lastPaymentType.toLowerCase().includes('pendiente') ? (
                            <Clock size={100} color="#f59e0b" />
                        ) : (
                            <CheckCircle size={100} color="var(--accent)" />
                        )}
                    </div>
                    <h1 style={{ fontSize: '4rem', color: 'white', fontWeight: '900', margin: 0, textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                        {lastPaymentType.toLowerCase().includes('pendiente') ? 'VENTA PENDIENTE' : '¡VENTA ÉXITO!'}
                    </h1>
                    <div style={{ fontSize: '2.5rem', color: 'white', opacity: 0.9, marginTop: '1rem', fontWeight: '700' }}>
                        ₡{new Intl.NumberFormat('es-CR').format(lastSaleTotal)}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    70% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .cart-sidebar {
                    display: flex;
                    flex-direction: column;
                    background: rgba(30, 41, 59, 1);
                    border-left: 1px solid var(--glass-border);
                }
                @media (max-width: 767px) {
                    .cart-sidebar {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: auto;
                        max-height: 80%;
                        border-left: none;
                        border-top: 1px solid var(--glass-border);
                        transform: translateY(${cart.length === 0 && !showCheckout ? '90%' : '0'});
                        transition: transform 0.3s ease;
                    }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default NewSale;
