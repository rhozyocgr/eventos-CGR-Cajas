import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Search,
    Calendar,
    User,
    Filter,
    FileText,
    ChevronDown,
    ChevronUp,
    CreditCard,
    Smartphone,
    Banknote,
    Clock,
    RefreshCcw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState('all');
    const [filterEvent, setFilterEvent] = useState('all');
    const [filterPayment, setFilterPayment] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/sales/transactions`);
            setTransactions(res.data);
        } catch (err) {
            toast.error('Error al cargar transacciones');
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const users = [...new Set(transactions.map(t => t.User?.name))].filter(Boolean).sort();
    const events = [...new Set(transactions.map(t => t.SalesDay?.Event?.name))].filter(Boolean).sort();
    const paymentTypes = [...new Set(transactions.map(t => t.PaymentType?.name))].filter(Boolean).sort();

    const filteredTransactions = transactions.filter(t => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            t.id.toString().includes(searchLower) ||
            t.User?.name?.toLowerCase().includes(searchLower) ||
            t.Sales?.some(s => s.Product?.name?.toLowerCase().includes(searchLower)) ||
            t.total.toString().includes(searchLower);

        const matchesUser = filterUser === 'all' || t.User?.name === filterUser;
        const matchesEvent = filterEvent === 'all' || t.SalesDay?.Event?.name === filterEvent;
        const matchesPayment = filterPayment === 'all' || t.PaymentType?.name === filterPayment;

        const tDate = new Date(t.createdAt).toISOString().split('T')[0];
        const matchesStart = !startDate || tDate >= startDate;
        const matchesEnd = !endDate || tDate <= endDate;

        return matchesSearch && matchesUser && matchesEvent && matchesPayment && matchesStart && matchesEnd;
    });

    const getPaymentIcon = (name) => {
        const n = name?.toLowerCase() || '';
        if (n.includes('efectivo')) return <Banknote size={16} />;
        if (n.includes('tarjeta')) return <CreditCard size={16} />;
        if (n.includes('sinpe')) return <Smartphone size={16} />;
        return <Clock size={16} />;
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <FileText size={32} color="var(--primary)" />
                        Transacciones
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        Historial completo de todas las ventas del sistema
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={fetchTransactions} className="btn-refresh" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.6rem 1.2rem', borderRadius: '0.8rem' }}>
                        <RefreshCcw size={18} className={loading ? 'spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Filtros Inteligentes */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {/* Buscador Principal */}
                    <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Búsqueda General</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="text"
                                placeholder="ID, cajero, producto o monto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Fecha Desde */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Desde</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Fecha Hasta */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hasta</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Usuario */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Cajero</label>
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.8rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all">Todos los Usuarios</option>
                            {users.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    {/* Evento */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Evento</label>
                        <select
                            value={filterEvent}
                            onChange={(e) => setFilterEvent(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.8rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all">Todos los Eventos</option>
                            {events.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>

                    {/* Método de Pago */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Método de Pago</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={filterPayment}
                                onChange={(e) => setFilterPayment(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.8rem', background: '#1e293b', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="all">Todos los Pagos</option>
                                {paymentTypes.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Limpiar Filtros */}
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterUser('all');
                                setFilterEvent('all');
                                setFilterPayment('all');
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <RefreshCcw size={16} /> Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Listado de Transacciones */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1.2rem' }}>ID</th>
                                <th style={{ padding: '1.2rem' }}>Fecha/Hora</th>
                                <th style={{ padding: '1.2rem' }}>Usuario</th>
                                <th style={{ padding: '1.2rem' }}>Evento</th>
                                <th style={{ padding: '1.2rem' }}>Método</th>
                                <th style={{ padding: '1.2rem', textAlign: 'right' }}>Total</th>
                                <th style={{ padding: '1.2rem', width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '4rem', textAlign: 'center' }}>
                                        <RefreshCcw size={32} className="spin" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <p style={{ opacity: 0.5 }}>Cargando transacciones...</p>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                                        No se encontraron transacciones con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map(t => (
                                    <React.Fragment key={t.id}>
                                        <tr
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                                background: expandedRows.has(t.id) ? 'rgba(99,102,241,0.05)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => toggleRow(t.id)}
                                            className="hover-row"
                                        >
                                            <td style={{ padding: '1.2rem' }}>
                                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>#{t.id}</span>
                                            </td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <div style={{ fontWeight: '500' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(t.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <div style={{ width: '28px', height: '28px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <User size={14} color="var(--primary)" />
                                                    </div>
                                                    <span>{t.User?.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <Calendar size={14} style={{ opacity: 0.4 }} />
                                                    <span>{t.SalesDay?.Event?.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                                                    <span style={{ opacity: 0.7 }}>{getPaymentIcon(t.PaymentType?.name)}</span>
                                                    {t.PaymentType?.name}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                                                <span style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '1.1rem' }}>
                                                    ₡{new Intl.NumberFormat('es-CR').format(t.total)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem' }}>
                                                {expandedRows.has(t.id) ? <ChevronUp size={20} style={{ opacity: 0.4 }} /> : <ChevronDown size={20} style={{ opacity: 0.4 }} />}
                                            </td>
                                        </tr>
                                        {expandedRows.has(t.id) && (
                                            <tr style={{ background: 'rgba(99,102,241,0.02)' }}>
                                                <td colSpan="7" style={{ padding: '1.5rem 3rem' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                                        {t.Sales?.map(sale => (
                                                            <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <span style={{ fontWeight: '500' }}>{sale.Product?.name}</span>
                                                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                                                    <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>x{sale.quantity}</span>
                                                                    <span style={{ fontWeight: 'bold', color: 'white' }}>₡{new Intl.NumberFormat('es-CR').format(sale.total)}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {t.observation && (
                                                        <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(245,158,11,0.05)', borderRadius: '0.8rem', borderLeft: '4px solid #f59e0b', fontSize: '0.85rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: '#f59e0b', fontWeight: 'bold' }}>
                                                                <Clock size={14} /> Observación
                                                            </div>
                                                            <div style={{ opacity: 0.8, fontStyle: 'italic' }}>"{t.observation}"</div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .hover-row:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
            `}</style>
        </div>
    );
};

// Necesario importar React para Fragment
import React from 'react';

export default Transactions;
