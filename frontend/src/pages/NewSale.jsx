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
    LogOut,
    Receipt,
    RefreshCcw,
    AlertTriangle,
    Save,
    FileText,
    AlertCircle,
    XCircle,
    History,
    Edit2,
    ShoppingBag,
    MessageSquare
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
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [showRecentModal, setShowRecentModal] = useState(false);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [adjustingTransaction, setAdjustingTransaction] = useState(null);
    const [adjustmentType, setAdjustmentType] = useState('payment_change'); // 'payment_change', 'deletion', 'product_edit'
    const [newPaymentTypeId, setNewPaymentTypeId] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [editingProducts, setEditingProducts] = useState([]);
    const [transactionSearchQuery, setTransactionSearchQuery] = useState('');

    const deleteReasons = [
        'Creado por error',
        'Pedido duplicado',
        'El cliente ya lo había pagado',
        'Otros'
    ];

    useEffect(() => {
        fetchInitialData();
        const savedDayId = localStorage.getItem('selectedDayId');
        const savedEventId = localStorage.getItem('selectedEventId');
        if (savedEventId) {
            fetchEventData(savedEventId, savedDayId);
        }
    }, []);

    useEffect(() => {
        if (events.length > 0 && !selectedEvent) {
            const savedEventId = localStorage.getItem('selectedEventId');
            if (savedEventId) {
                const ev = events.find(e => e.id.toString() === savedEventId.toString());
                if (ev) setSelectedEvent(ev);
            }
        }
    }, [events, selectedEvent]);

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
                    checkCashOpening(day.id);
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
            }, 1000); // Verificar cada 1 segundo
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
            const errorMsg = err.response?.data?.error || err.message;
            toast.error('Error al abrir la caja: ' + errorMsg);
        }
    };

    const handleCloseCash = async () => {
        if (!cashOpening) return;
        try {
            setPaymentLoading(true);
            await axios.put(`${API_URL}/sales/close-cash/${cashOpening.id}`, {
                userId: user.id,
                summary: sessionSummary
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
            const res = await axios.get(`${API_URL}/sales/pending?salesDayId=${dayId}&userId=${user?.id}`);
            setPendingSales(res.data);
        } catch (err) {
            console.error('Error fetching pending sales', err);
        }
    };

    const fetchRecentTransactions = async () => {
        if (!selectedDay) return;
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/sales/recent?salesDayId=${selectedDay.id}&userId=${user.id}`);
            setRecentTransactions(res.data);
        } catch (err) {
            toast.error('Error al cargar ventas recientes');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = recentTransactions.filter(t => {
        if (!transactionSearchQuery) return true;
        const query = transactionSearchQuery.toLowerCase();

        // Search by ID
        if (t.id.toString().includes(query)) return true;

        // Search by Total
        if (t.total.toString().includes(query)) return true;
        if (new Intl.NumberFormat('es-CR').format(t.total).includes(query)) return true;

        // Search by Payment Type
        if (t.PaymentType?.name.toLowerCase().includes(query)) return true;

        // Search by Products
        const hasProduct = t.Sales?.some(s => s.Product?.name.toLowerCase().includes(query));
        if (hasProduct) return true;

        // Search by User/Cashier
        if (t.User?.name.toLowerCase().includes(query)) return true;

        // Search by observation (if exists)
        if (t.observation?.toLowerCase().includes(query)) return true;

        return false;
    });

    const handleRequestAdjustment = async () => {
        if (!adjustingTransaction || !adjustmentReason) {
            toast.error('Por favor indica el motivo');
            return;
        }
        if (adjustmentType === 'payment_change' && !newPaymentTypeId) {
            toast.error('Selecciona el nuevo método de pago');
            return;
        }
        if (adjustmentType === 'product_edit' && editingProducts.every(p => p.newQuantity === p.quantity)) {
            toast.error('No has realizado ningún cambio en los productos');
            return;
        }

        try {
            setPaymentLoading(true);
            let details = {};
            if (adjustmentType === 'payment_change') {
                details = { newPaymentTypeId: parseInt(newPaymentTypeId) };
            } else if (adjustmentType === 'product_edit') {
                details = {
                    items: editingProducts
                        .filter(p => p.newQuantity !== p.quantity)
                        .map(p => ({ saleId: p.id, newQuantity: p.newQuantity }))
                };
            }

            await axios.post(`${API_URL}/sales/adjustment-request`, {
                transactionId: adjustingTransaction.id,
                type: adjustmentType,
                reason: adjustmentReason,
                details,
                requesterId: user.id
            });
            toast.success('Solicitud enviada al administrador');
            setShowAdjustmentModal(false);
            setAdjustingTransaction(null);
            setAdjustmentReason('');
            setNewPaymentTypeId('');
            setEditingProducts([]);
        } catch (err) {
            toast.error('Error al enviar la solicitud');
        } finally {
            setPaymentLoading(false);
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
                            style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.5rem', transition: 'all 0.3s' }}
                            onClick={() => handleSelectEvent(ev)}>
                            {ev.logo ? (
                                <img src={ev.logo} alt="" style={{ width: '80px', height: '80px', borderRadius: '1rem', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={40} color="var(--primary)" />
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{ev.name}</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Calendar size={14} />
                                        <span>{new Date(ev.startDate.split('T')[0] + 'T00:00:00').toLocaleDateString()}</span>
                                    </div>
                                    <ChevronRight size={14} style={{ opacity: 0.3 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Clock size={14} />
                                        <span>{new Date(ev.endDate.split('T')[0] + 'T00:00:00').toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {ev.description && (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {ev.description}
                                    </p>
                                )}
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '50%' }}>
                                <ChevronRight size={20} color="var(--primary)" />
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
                <button onClick={() => setSelectedEvent(null)} className="btn" style={{ background: 'none', color: 'var(--text-secondary)', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={18} /> Cambiar Evento
                </button>

                <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                        {selectedEvent.logo ? (
                            <img src={selectedEvent.logo} alt="" style={{ width: '80px', height: '80px', borderRadius: '1rem', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={40} color="var(--primary)" />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>{selectedEvent.name}</h1>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Calendar size={14} />
                                    <span>Inicio: {new Date(selectedEvent.startDate.split('T')[0] + 'T00:00:00').toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Clock size={14} />
                                    <span>Final: {new Date(selectedEvent.endDate.split('T')[0] + 'T00:00:00').toLocaleDateString()}</span>
                                </div>
                            </div>
                            {selectedEvent.description && (
                                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    {selectedEvent.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', opacity: 0.8 }}>Selecciona el Día de Venta</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    {eventDays.map(day => (
                        <div key={day.id} className="glass-card hover-glow"
                            style={{ padding: '2rem 1rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            onClick={() => handleSelectDay(day)}>
                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{day.Products?.length || 0} productos habilitados</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    if (!cashOpening || cashOpening.status === 'pending' || cashOpening.status === 'closed') {
        const isPending = cashOpening?.status === 'pending';
        const isClosed = cashOpening?.status === 'closed';
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
                        {isPending ? 'Esperando Autorización' : (isClosed ? 'Caja Cerrada' : 'Caja no Iniciada')}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                        {isPending
                            ? 'Tu solicitud de apertura ha sido enviada. Un administrador debe autorizar tu sesión para que puedas indicar el efectivo inicial.'
                            : (isClosed ? 'Tu sesión para este día ha finalizado. Si necesitas abrir la caja nuevamente, solicita una nueva autorización.' : 'Es necesario solicitar autorización a un administrador para poder abrir la caja.')}
                    </p>
                    {isPending ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.8rem', fontSize: '0.85rem', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 0.5rem 0', opacity: 0.6 }}>Detalles de sesión:</p>
                                <p style={{ margin: 0 }}><strong>Usuario:</strong> {user.name}</p>
                                <p style={{ margin: 0 }}><strong>Día:</strong> {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString()}</p>
                                <p style={{ margin: 0 }}><strong>Hora:</strong> {new Date(cashOpening.openingTime).toLocaleTimeString()}</p>
                            </div>
                            <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '1rem' }}>
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
        <div className="pos-layout">
            {/* Nav POS */}
            <div className="pos-nav">
                <div className="pos-nav-left">
                    <button onClick={handleReset} className="btn-icon-sm">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="pos-event-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={{ margin: 0 }}>{selectedEvent.name}</h4>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                                {new Date(selectedEvent.startDate.split('T')[0] + 'T00:00:00').toLocaleDateString([], { day: 'numeric', month: 'short' })} - {new Date(selectedEvent.endDate.split('T')[0] + 'T00:00:00').toLocaleDateString([], { day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', opacity: 0.8, color: 'var(--primary)' }}>
                            <span style={{ textTransform: 'capitalize' }}>
                                {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="pos-nav-right">
                    <button
                        onClick={() => setShowClosingModal(true)}
                        className="btn-refresh"
                        title="Cerrar Caja"
                        style={{ border: '1px solid rgba(99, 102, 241, 0.5)', background: 'rgba(99, 102, 241, 0.1)' }}
                    >
                        <LogOut size={18} color="var(--primary)" />
                    </button>

                    <button
                        onClick={() => {
                            setShowRecentModal(true);
                            fetchRecentTransactions();
                        }}
                        className="btn-refresh"
                        title="Ventas Recientes"
                        style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: 'var(--primary)' }}
                    >
                        <History size={16} />
                    </button>

                    <button
                        onClick={() => setShowPendingModal(true)}
                        className="btn-refresh"
                        style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b', position: 'relative' }}
                    >
                        <Clock size={16} />
                        {pendingSales.length > 0 && (
                            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.6rem', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {pendingSales.length}
                            </span>
                        )}
                    </button>

                    <div className="pos-total-info">
                        <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
                            <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Sesión</p>
                        </div>
                        <p className="pos-total-val">
                            ₡{new Intl.NumberFormat('es-CR').format(sessionTotal)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="pos-main">
                {/* Catalog */}
                <div className="pos-catalog">
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
                <div className={`pos-cart ${isCartExpanded ? 'expanded' : ''}`} style={{ height: window.innerWidth < 768 ? (isCartExpanded ? '60%' : '60px') : '100%', maxHeight: window.innerWidth < 768 ? (isCartExpanded ? '70vh' : '60px') : '100%' }}>
                    <div
                        onClick={() => window.innerWidth < 768 && setIsCartExpanded(!isCartExpanded)}
                        style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingCart size={18} color="var(--primary)" />
                            <span style={{ fontWeight: 'bold' }}>Carrito ({cart.length})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {isCartExpanded && <button onClick={(e) => { e.stopPropagation(); setCart([]); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}>Vaciar</button>}
                            <div style={{ display: window.innerWidth >= 768 ? 'none' : 'block' }}>
                                {isCartExpanded ? <X size={20} /> : <Plus size={20} color="var(--primary)" />}
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: (!isCartExpanded && window.innerWidth < 768) ? 'none' : 'block' }}>
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

                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--glass-border)', display: (!isCartExpanded && window.innerWidth < 768) ? 'none' : 'block' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>₡{new Intl.NumberFormat('es-CR').format(cartTotal)}</span>
                        </div>
                        <button
                            disabled={cart.length === 0}
                            onClick={() => setShowCheckout(true)}
                            className="btn-primary"
                            style={{ width: '100%', padding: '1rem', borderRadius: '0.8rem', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', opacity: cart.length === 0 ? 0.5 : 1, boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {pendingSales.map(transaction => (
                                <div key={transaction.id} className="glass-card" style={{
                                    padding: window.innerWidth < 768 ? '1rem' : '1.2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    background: 'rgba(245, 158, 11, 0.05)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: window.innerWidth < 500 ? 'column' : 'row',
                                        justifyContent: 'space-between',
                                        alignItems: window.innerWidth < 500 ? 'flex-start' : 'center',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                                <Receipt size={18} color="#f59e0b" />
                                                <span style={{ fontWeight: '900', fontSize: window.innerWidth < 768 ? '1rem' : '1.1rem' }}>#{transaction.id}</span>
                                            </div>
                                            {transaction.observation && (
                                                <p style={{
                                                    margin: '0.2rem 0',
                                                    fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem',
                                                    color: '#f59e0b',
                                                    fontWeight: '700',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    📝 {transaction.observation}
                                                </p>
                                            )}
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div style={{
                                            textAlign: window.innerWidth < 500 ? 'left' : 'right',
                                            width: window.innerWidth < 500 ? '100%' : 'auto',
                                            display: 'flex',
                                            flexDirection: window.innerWidth < 500 ? 'row-reverse' : 'column',
                                            justifyContent: 'space-between',
                                            alignItems: window.innerWidth < 500 ? 'center' : 'flex-end',
                                            gap: '0.5rem'
                                        }}>
                                            <span style={{
                                                fontWeight: '900',
                                                color: 'var(--accent)',
                                                fontSize: window.innerWidth < 768 ? '1.2rem' : '1.4rem'
                                            }}>
                                                ₡{new Intl.NumberFormat('es-CR').format(transaction.total)}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setDeletingTransaction(transaction)}
                                                    className="btn-refresh"
                                                    style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedPendingSale(transaction)}
                                                    style={{
                                                        padding: '0.6rem 1.5rem',
                                                        borderRadius: '2rem',
                                                        background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontWeight: '800',
                                                        fontSize: '0.85rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6500, padding: '0.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', width: '100%', maxWidth: '550px', maxHeight: '95vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Clock size={24} color="#ef4444" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Resumen de Cierre</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                                    Sesión de <span style={{ color: 'white' }}>{user?.name}</span>
                                </p>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            {[
                                { label: 'Efectivo Inicial', value: cashOpening?.initialCash, color: 'var(--text-secondary)' },
                                { label: 'Ventas en Efectivo', value: sessionSummary.totalEfectivo, color: 'white' },
                                { label: 'Ventas SINPE', value: sessionSummary.totalSinpe, color: 'white' },
                                { label: 'Ventas Tarjeta', value: sessionSummary.totalTarjeta, color: 'white' },
                                { label: 'Ventas Pendientes', value: sessionSummary.totalPendiente, color: '#f59e0b' },
                                {
                                    label: 'Cierre Efectivo',
                                    value: (Number(cashOpening?.initialCash) || 0) + (Number(sessionSummary.totalEfectivo) || 0),
                                    color: '#10b981',
                                    isTotal: true
                                }
                            ].map((item, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.6rem 0.8rem',
                                    borderRadius: '0.6rem',
                                    background: item.isTotal ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)',
                                    border: item.isTotal ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--glass-border)'
                                }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: item.color }}>₡{new Intl.NumberFormat('es-CR').format(item.value || 0)}</span>
                                </div>
                            ))}

                            <div style={{
                                gridColumn: '1 / -1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                borderRadius: '0.8rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid var(--primary)',
                                marginTop: '0.2rem'
                            }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>TOTAL VENDIDO HOY</span>
                                <span style={{ fontWeight: '900', fontSize: '1.4rem', color: 'var(--accent)' }}>₡{new Intl.NumberFormat('es-CR').format(sessionTotal)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowClosingModal(false)}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleCloseCash}
                                style={{
                                    flex: 1.5,
                                    padding: '0.8rem',
                                    borderRadius: '0.8rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
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
                    backgroundColor: lastPaymentType.toLowerCase().includes('pendiente') ? '#f59e0b' : '#10b981',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 10000,
                    animation: 'fadeIn 0.3s ease',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '50%', padding: window.innerWidth < 768 ? '1.5rem' : '2rem',
                        marginBottom: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {lastPaymentType.toLowerCase().includes('pendiente') ? (
                            <Clock size={window.innerWidth < 768 ? 60 : 100} color="#f59e0b" />
                        ) : (
                            <CheckCircle size={window.innerWidth < 768 ? 60 : 100} color="#10b981" />
                        )}
                    </div>
                    <h1 style={{
                        fontSize: window.innerWidth < 768 ? '2.5rem' : '4rem',
                        color: 'white',
                        fontWeight: '900',
                        margin: 0,
                        textShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        lineHeight: 1.1
                    }}>
                        {lastPaymentType.toLowerCase().includes('pendiente') ? 'VENTA PENDIENTE' : '¡VENTA EXITOSA!'}
                    </h1>
                    <div style={{
                        fontSize: window.innerWidth < 768 ? '1.8rem' : '2.5rem',
                        color: 'white',
                        opacity: 0.9,
                        marginTop: '1rem',
                        fontWeight: '700'
                    }}>
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
            {/* RECENT TRANSACTIONS MODAL */}
            {showRecentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '1rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: 0 }}>
                                    <History size={24} color="var(--primary)" />
                                    Historial Completo
                                </h2>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {recentTransactions.length} ventas en esta sesión
                                </span>
                            </div>
                            <button onClick={() => {
                                setShowRecentModal(false);
                                setTransactionSearchQuery('');
                            }} className="btn-icon-sm"><X size={20} /></button>
                        </div>

                        {/* PREMIUM SEARCH BAR */}
                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            <Search
                                size={20}
                                style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, color: transactionSearchQuery ? 'var(--primary)' : 'white' }}
                            />
                            <input
                                type="text"
                                placeholder="Búsqueda inteligente: ID, productos, montos, métodos de pago..."
                                value={transactionSearchQuery}
                                onChange={(e) => setTransactionSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1.4rem 1.4rem 1.4rem 3.8rem',
                                    borderRadius: '1.2rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    outline: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: transactionSearchQuery ? '0 0 20px rgba(99, 102, 241, 0.15), inset 0 2px 4px rgba(0,0,0,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                            {transactionSearchQuery && (
                                <div style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', background: 'rgba(99, 102, 241, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '0.5rem' }}>
                                        {filteredTransactions.length} encontrados
                                    </span>
                                    <button
                                        onClick={() => setTransactionSearchQuery('')}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                            {filteredTransactions.map(transaction => (
                                <div key={transaction.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s ease' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.05)', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900', color: 'var(--primary)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                #{transaction.id}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Receipt size={12} /> {transaction.PaymentType?.name} • Cajero: {transaction.User?.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ margin: 0, fontWeight: '900', color: 'var(--accent)', fontSize: '1.3rem', letterSpacing: '0.5px' }}>
                                                    ₡{new Intl.NumberFormat('es-CR').format(transaction.total)}
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                <button
                                                    onClick={() => {
                                                        setAdjustingTransaction(transaction);
                                                        setAdjustmentType('product_edit');
                                                        setEditingProducts(transaction.Sales.map(s => ({ ...s, newQuantity: s.quantity })));
                                                        setShowAdjustmentModal(true);
                                                    }}
                                                    className="btn-refresh"
                                                    title="Modificar Productos"
                                                    style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                                >
                                                    <ShoppingBag size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAdjustingTransaction(transaction);
                                                        setAdjustmentType('payment_change');
                                                        setShowAdjustmentModal(true);
                                                    }}
                                                    className="btn-refresh"
                                                    title="Modificar Pago"
                                                    style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAdjustingTransaction(transaction);
                                                        setAdjustmentType('deletion');
                                                        setShowAdjustmentModal(true);
                                                    }}
                                                    className="btn-refresh"
                                                    title="Eliminar Venta"
                                                    style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '0.8rem',
                                        padding: '1rem',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                        gap: '0.8rem'
                                    }}>
                                        {transaction.Sales?.map(sale => {
                                            const isMatch = transactionSearchQuery && sale.Product?.name.toLowerCase().includes(transactionSearchQuery.toLowerCase());
                                            return (
                                                <div key={sale.id} style={{
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    color: isMatch ? 'var(--primary)' : 'white',
                                                    fontWeight: isMatch ? 'bold' : 'normal',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: isMatch ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                                }}>
                                                    <span>• {sale.Product?.name}</span>
                                                    <span style={{ opacity: 0.6 }}>x{sale.quantity}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {transaction.observation && (
                                        <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', gap: '0.5rem' }}>
                                            <MessageSquare size={12} /> {transaction.observation}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filteredTransactions.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.5 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <Search size={30} />
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                                        {transactionSearchQuery ? 'Sin resultados' : 'Historial vacío'}
                                    </p>
                                    <p style={{ fontSize: '0.9rem' }}>
                                        {transactionSearchQuery
                                            ? `No se encontraron ventas que coincidan con "${transactionSearchQuery}"`
                                            : 'Aún no se han realizado ventas en esta sesión.'}
                                    </p>
                                    {transactionSearchQuery && (
                                        <button
                                            onClick={() => setTransactionSearchQuery('')}
                                            style={{ marginTop: '1.5rem', background: 'none', border: '1px solid var(--glass-border)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                        >
                                            Limpiar búsqueda
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ADJUSTMENT REQUEST MODAL */}
            {showAdjustmentModal && adjustingTransaction && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4500, padding: '1rem' }}>
                    <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '450px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ background: adjustmentType === 'deletion' ? 'rgba(239, 68, 68, 0.1)' : adjustmentType === 'product_edit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                {adjustmentType === 'deletion' ? <Trash2 size={30} color="#ef4444" /> : adjustmentType === 'product_edit' ? <ShoppingBag size={30} color="#10b981" /> : <Edit2 size={30} color="var(--primary)" />}
                            </div>
                            <h2>Solicitar {adjustmentType === 'deletion' ? 'Eliminación' : 'Modificación'}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Venta #{adjustingTransaction.id} por <span style={{ color: 'white', fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(adjustingTransaction.total)}</span>
                            </p>
                        </div>

                        {adjustmentType === 'payment_change' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                    Nuevo Método de Pago
                                </label>
                                <select
                                    value={newPaymentTypeId}
                                    onChange={(e) => setNewPaymentTypeId(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
                                >
                                    <option value="" style={{ background: '#1e293b' }}>-- Seleccionar --</option>
                                    {paymentTypes.filter(t => t.id !== adjustingTransaction.PaymentTypeId && t.name !== 'Pendiente').map(type => (
                                        <option key={type.id} value={type.id} style={{ background: '#1e293b' }}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {adjustmentType === 'product_edit' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                    Modificar Cantidades
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {editingProducts.map((p, idx) => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                                            <span style={{ fontSize: '0.9rem', flex: 1 }}>{p.Product?.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <button
                                                    onClick={() => {
                                                        const newArr = [...editingProducts];
                                                        newArr[idx].newQuantity = Math.max(0, newArr[idx].newQuantity - 1);
                                                        setEditingProducts(newArr);
                                                    }}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px', width: '24px', height: '24px' }}
                                                >
                                                    -
                                                </button>
                                                <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{p.newQuantity}</span>
                                                <button
                                                    onClick={() => {
                                                        const newArr = [...editingProducts];
                                                        newArr[idx].newQuantity = newArr[idx].newQuantity + 1;
                                                        setEditingProducts(newArr);
                                                    }}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px', width: '24px', height: '24px' }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Motivo de la Solicitud
                            </label>
                            <textarea
                                value={adjustmentReason}
                                onChange={(e) => setAdjustmentReason(e.target.value)}
                                placeholder="Explica por qué es necesario este cambio..."
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', minHeight: '100px', resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setShowAdjustmentModal(false);
                                    setAdjustingTransaction(null);
                                }}
                                style={{ flex: 1, padding: '1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRequestAdjustment}
                                disabled={paymentLoading}
                                style={{
                                    flex: 1.5,
                                    padding: '1rem',
                                    borderRadius: '0.8rem',
                                    background: adjustmentType === 'deletion' ? '#ef4444' : 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    opacity: paymentLoading ? 0.7 : 1
                                }}
                            >
                                {paymentLoading ? 'Enviando...' : 'ENVIAR SOLICITUD'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewSale;
