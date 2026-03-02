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
    ChevronRight,
    RefreshCcw,
    AlertCircle,
    Edit2,
    Trash2,
    MessageSquare,
    DollarSign,
    Package,
    ShoppingBag
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const Authorizations = () => {
    const { user: admin } = useAuth();
    const [pendingOpenings, setPendingOpenings] = useState([]);
    const [pendingAdjustments, setPendingAdjustments] = useState([]);
    const [openingsHistory, setOpeningsHistory] = useState([]);
    const [adjustmentsHistory, setAdjustmentsHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('openings'); // 'openings' or 'adjustments'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [openingsRes, adjustmentsRes, openingsHistRes, adjustmentsHistRes] = await Promise.all([
                axios.get(`${API_URL}/sales/pending-openings`),
                axios.get(`${API_URL}/sales/pending-adjustments`),
                axios.get(`${API_URL}/sales/openings-history`),
                axios.get(`${API_URL}/sales/adjustments-history`)
            ]);
            setPendingOpenings(openingsRes.data);
            setPendingAdjustments(adjustmentsRes.data);
            setOpeningsHistory(openingsHistRes.data);
            setAdjustmentsHistory(adjustmentsHistRes.data);
        } catch (err) {
            if (!silent) toast.error('Error al cargar autorizaciones pendientes');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(true);
        }, 3000); // Polling cada 3 segundos (menos agresivo)
        return () => clearInterval(interval);
    }, []);

    const handleOpeningAction = async (id, status) => {
        try {
            await axios.post(`${API_URL}/sales/authorize-opening/${id}`, {
                status,
                adminId: admin.id
            });
            toast.success(status === 'authorized' ? 'Caja autorizada' : 'Solicitud rechazada');
            fetchData(true);
        } catch (err) {
            toast.error('Error al procesar la solicitud');
        }
    };

    const handleAdjustmentAction = async (id, status) => {
        try {
            await axios.post(`${API_URL}/sales/process-adjustment/${id}`, {
                status: status === 'approved' ? 'approved' : 'denied',
                adminId: admin.id
            });
            toast.success(status === 'approved' ? 'Solicitud aprobada' : 'Solicitud rechazada');
            fetchData(true);
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
                        Gestiona las solicitudes de apertura y ajustes de transacciones
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('openings')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: activeTab === 'openings' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'openings' ? '3px solid var(--primary)' : '3px solid transparent',
                        color: activeTab === 'openings' ? 'white' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Apertura de Caja
                    {pendingOpenings.length > 0 && (
                        <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
                            {pendingOpenings.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('adjustments')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: activeTab === 'adjustments' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'adjustments' ? '3px solid var(--primary)' : '3px solid transparent',
                        color: activeTab === 'adjustments' ? 'white' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Ajustes de Venta
                    {pendingAdjustments.length > 0 && (
                        <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
                            {pendingAdjustments.length}
                        </span>
                    )}
                </button>
            </div>

            {loading && pendingOpenings.length === 0 && pendingAdjustments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
                    <RefreshCcw size={48} className="spin" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Cargando solicitudes...</p>
                </div>
            ) : activeTab === 'openings' ? (
                <>
                    {pendingOpenings.length === 0 ? (
                        <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', opacity: 0.8 }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CheckCircle size={40} color="var(--primary)" style={{ opacity: 0.5 }} />
                            </div>
                            <h2>¡Todo al día!</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>No hay solicitudes de apertura pendientes.</p>
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
                                        <span className="status-badge pending">Pendiente</span>
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
                                            onClick={() => handleOpeningAction(opening.id, 'authorized')}
                                            className="btn btn-primary"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}
                                        >
                                            <CheckCircle size={18} />
                                            Autorizar
                                        </button>
                                        <button
                                            onClick={() => handleOpeningAction(opening.id, 'denied')}
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

                    {/* Historial de Aperturas */}
                    <div style={{ marginTop: '4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            <Clock size={24} color="var(--primary)" />
                            <h2 style={{ margin: 0 }}>Historial de Aperturas</h2>
                        </div>

                        <div className="glass-card" style={{ overflowX: 'auto', padding: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem' }}>Fecha/Hora</th>
                                        <th style={{ padding: '1rem' }}>Usuario</th>
                                        <th style={{ padding: '1rem' }}>Día de Venta</th>
                                        <th style={{ padding: '1rem' }}>Efectivo Inicial</th>
                                        <th style={{ padding: '1rem' }}>Estado</th>
                                        <th style={{ padding: '1rem' }}>Autorizado por</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {openingsHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay historial disponible</td>
                                        </tr>
                                    ) : (
                                        openingsHistory.map(opening => (
                                            <tr key={opening.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: '500' }}>{new Date(opening.openingTime).toLocaleDateString()}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(opening.openingTime).toLocaleTimeString()}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{opening.User?.name}</td>
                                                <td style={{ padding: '1rem' }}>{opening.SalesDay?.date ? new Date(opening.SalesDay.date + 'T00:00:00').toLocaleDateString() : '-'}</td>
                                                <td style={{ padding: '1rem' }}>₡{new Intl.NumberFormat('es-CR').format(opening.initialCash)}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`status-badge ${opening.status}`} style={{ fontSize: '0.7rem' }}>
                                                        {opening.status === 'authorized' ? 'Autorizado' :
                                                            opening.status === 'denied' ? 'Rechazado' :
                                                                opening.status === 'active' ? 'Activo' :
                                                                    opening.status === 'closed' ? 'Cerrado' : opening.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{opening.authorizer?.name || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {pendingAdjustments.length === 0 ? (
                        <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', opacity: 0.8 }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <CheckCircle size={40} color="var(--primary)" style={{ opacity: 0.5 }} />
                            </div>
                            <h2>¡Todo al día!</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>No hay solicitudes de ajuste pendientes.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' }}>
                            {pendingAdjustments.map(request => (
                                <div key={request.id} className="glass-card hover-glow" style={{ padding: '1.5rem', borderLeft: `4px solid ${request.type === 'deletion' ? '#ef4444' : 'var(--primary)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: request.type === 'deletion' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {request.type === 'deletion' ? <Trash2 size={24} color="#ef4444" /> : request.type === 'product_edit' ? <ShoppingBag size={24} color="#10b981" /> : <Edit2 size={24} color="var(--primary)" />}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0 }}>
                                                    {request.type === 'deletion' ? 'Eliminar Venta' : request.type === 'product_edit' ? 'Editar Productos' : 'Cambiar Pago'}
                                                </h3>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Solicitado por: {request.requester?.name}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '1.2rem' }}>
                                                ₡{new Intl.NumberFormat('es-CR').format(request.Transaction?.total || 0)}
                                            </span>
                                            <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.5 }}>Venta #{request.TransactionId}</p>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.8rem', marginBottom: '1.2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontSize: '0.85rem' }}>
                                            <MessageSquare size={16} color="var(--primary)" />
                                            <span style={{ fontWeight: '500' }}>Motivo:</span>
                                            <span style={{ fontStyle: 'italic', opacity: 0.8 }}>"{request.reason}"</span>
                                        </div>

                                        {request.type === 'payment_change' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem', pt: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                                <span style={{ opacity: 0.6 }}>Cambio solicitado:</span>
                                                <span style={{ textDecoration: 'line-through', opacity: 0.4 }}>{request.Transaction?.PaymentType?.name}</span>
                                                <ChevronRight size={14} />
                                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                                    {/* Necesitaríamos cargar los nombres de tipos de pago o enviarlos en el request */}
                                                    Nuevo Método (ID: {request.details?.newPaymentTypeId})
                                                </span>
                                            </div>
                                        )}

                                        {request.type === 'product_edit' && (
                                            <div style={{ fontSize: '0.85rem', pt: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                                <span style={{ opacity: 0.6, display: 'block', marginBottom: '0.5rem' }}>Cambios en productos:</span>
                                                {request.details?.items?.map(item => {
                                                    const sale = request.Transaction?.Sales?.find(s => s.id === item.saleId);
                                                    return (
                                                        <div key={item.saleId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                                            <span style={{ fontWeight: '500' }}>{sale?.Product?.name || 'Producto'}:</span>
                                                            <span style={{ textDecoration: 'line-through', opacity: 0.4 }}>{sale?.quantity}</span>
                                                            <ChevronRight size={14} />
                                                            <span style={{ fontWeight: 'bold', color: item.newQuantity === 0 ? '#ef4444' : 'var(--primary)' }}>
                                                                {item.newQuantity === 0 ? 'ELIMINAR' : item.newQuantity}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                                            {request.Transaction?.Sales?.map(sale => (
                                                <span key={sale.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.7rem' }}>
                                                    {sale.Product?.name} x{sale.quantity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => handleAdjustmentAction(request.id, 'approved')}
                                            className="btn btn-primary"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}
                                        >
                                            <CheckCircle size={18} />
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleAdjustmentAction(request.id, 'denied')}
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

                    {/* Historial de Ajustes */}
                    <div style={{ marginTop: '4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            <Clock size={24} color="var(--primary)" />
                            <h2 style={{ margin: 0 }}>Historial de Ajustes</h2>
                        </div>

                        <div className="glass-card" style={{ overflowX: 'auto', padding: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem' }}>Fecha/Hora</th>
                                        <th style={{ padding: '1rem' }}>Solicitante</th>
                                        <th style={{ padding: '1rem' }}>Tipo</th>
                                        <th style={{ padding: '1rem' }}>Venta</th>
                                        <th style={{ padding: '1rem' }}>Motivo</th>
                                        <th style={{ padding: '1rem' }}>Estado</th>
                                        <th style={{ padding: '1rem' }}>Autorizado por</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adjustmentsHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay historial disponible</td>
                                        </tr>
                                    ) : (
                                        adjustmentsHistory.map(request => (
                                            <tr key={request.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: '500' }}>{new Date(request.createdAt).toLocaleDateString()}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(request.createdAt).toLocaleTimeString()}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{request.requester?.name}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    {request.type === 'deletion' ? 'Eliminar Venta' : request.type === 'product_edit' ? 'Editar Productos' : 'Cambiar Pago'}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(request.Transaction?.total || 0)}</div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>ID: {request.TransactionId || '-'}</div>
                                                </td>
                                                <td style={{ padding: '1rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={request.reason}>
                                                    {request.reason}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`status-badge ${request.status}`} style={{ fontSize: '0.7rem' }}>
                                                        {request.status === 'approved' ? 'Aprobado' :
                                                            request.status === 'denied' ? 'Rechazado' : request.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{request.authorizer?.name || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )
            }
        </div>
    );
};

export default Authorizations;
