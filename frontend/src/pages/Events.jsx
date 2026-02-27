import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Loader2, Edit2, Trash2, X, Save, Calendar, Search, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const Events = () => {
    const [events, setEvents] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isDaysModalOpen, setIsDaysModalOpen] = useState(false);
    const [selectedEventDays, setSelectedEventDays] = useState([]);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [isDayEditingModalOpen, setIsDayEditingModalOpen] = useState(false);
    const [editingDay, setEditingDay] = useState(null);
    const [dayFormData, setDayFormData] = useState({ productIds: [] });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        logo: '',
        productIds: []
    });

    const [productSearch, setProductSearch] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [eventsRes, productsRes, suppliersRes] = await Promise.all([
                axios.get(`${API_URL}/events`),
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/suppliers`)
            ]);
            setEvents(eventsRes.data);
            setProducts(productsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                name: event.name,
                description: event.description || '',
                startDate: event.startDate.split('T')[0],
                endDate: event.endDate.split('T')[0],
                logo: event.logo || '',
                productIds: event.Products ? event.Products.map(p => p.id) : []
            });
        } else {
            setEditingEvent(null);
            setFormData({
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                logo: '',
                productIds: []
            });
        }
        setProductSearch('');
        setFilterSupplier('');
        setIsModalOpen(true);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleProduct = (productId) => {
        const newProductIds = formData.productIds.includes(productId)
            ? formData.productIds.filter(id => id !== productId)
            : [...formData.productIds, productId];
        setFormData({ ...formData, productIds: newProductIds });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                const res = await axios.put(`${API_URL}/events/${editingEvent.id}`, formData);
                setEvents(events.map(ev => ev.id === editingEvent.id ? res.data : ev));
                toast.success('Evento actualizado');
            } else {
                const res = await axios.post(`${API_URL}/events`, formData);
                setEvents([...events, res.data]);
                toast.success('Evento creado');
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar el evento');
        }
    };

    const toggleSupplierProducts = (supplierId, select) => {
        const supplierProducts = products.filter(p => p.SupplierId === supplierId).map(p => p.id);
        let newProductIds;
        if (select) {
            newProductIds = [...new Set([...formData.productIds, ...supplierProducts])];
        } else {
            newProductIds = formData.productIds.filter(id => !supplierProducts.includes(id));
        }
        setFormData({ ...formData, productIds: newProductIds });
    };

    const fetchEventDays = async (eventId) => {
        try {
            const res = await axios.get(`${API_URL}/events/${eventId}/days`);
            setSelectedEventDays(res.data);
        } catch (err) {
            toast.error('Error al cargar los días del evento');
        }
    };

    const handleOpenDaysModal = async (event) => {
        setCurrentEvent(event);
        await fetchEventDays(event.id);
        setIsDaysModalOpen(true);
    };

    const handleOpenDayEdit = (day) => {
        setEditingDay(day);
        setDayFormData({
            productIds: day.Products ? day.Products.map(p => p.id) : []
        });
        setProductSearch('');
        setFilterSupplier('');
        setIsDayEditingModalOpen(true);
    };

    const toggleDayProduct = (productId) => {
        const newProductIds = dayFormData.productIds.includes(productId)
            ? dayFormData.productIds.filter(id => id !== productId)
            : [...dayFormData.productIds, productId];
        setDayFormData({ ...dayFormData, productIds: newProductIds });
    };

    const toggleSupplierDayProducts = (supplierId, select) => {
        const supplierProducts = products.filter(p => p.SupplierId === supplierId).map(p => p.id);
        let newProductIds;
        if (select) {
            newProductIds = [...new Set([...dayFormData.productIds, ...supplierProducts])];
        } else {
            newProductIds = dayFormData.productIds.filter(id => !supplierProducts.includes(id));
        }
        setDayFormData({ ...dayFormData, productIds: newProductIds });
    };

    const handleSaveDayProducts = async () => {
        try {
            await axios.put(`${API_URL}/events/days/${editingDay.id}/products`, dayFormData);
            toast.success('Productos del día actualizados');
            await fetchEventDays(currentEvent.id);
            setIsDayEditingModalOpen(false);
        } catch (err) {
            toast.error('Error al guardar productos del día');
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontWeight: '500' }}>¿Estás seguro de eliminar este evento?</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await axios.delete(`${API_URL}/events/${id}`);
                                setEvents(events.filter(ev => ev.id !== id));
                                toast.success('Evento eliminado');
                            } catch (err) {
                                toast.error('Error al eliminar el evento');
                            }
                        }}
                        style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        ), { position: 'top-center' });
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Eventos</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Nuevo Evento
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {events.map(ev => (
                        <div key={ev.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                {ev.logo ? (
                                    <img src={ev.logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '60px', height: '60px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImageIcon size={30} color="var(--text-secondary)" />
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ color: 'var(--primary)' }}>{ev.name}</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleOpenModal(ev)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(ev.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {formatDate(ev.startDate)} - {formatDate(ev.endDate)}
                                    </p>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{ev.description}</p>
                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {ev.Products?.slice(0, 5).map(p => (
                                        <span key={p.id} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                                            {p.name}
                                        </span>
                                    ))}
                                    {ev.Products?.length > 5 && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>+{ev.Products.length - 5} más</span>
                                    )}
                                </div>
                            </div>
                            <button
                                className="btn"
                                style={{ width: '100%', marginTop: '1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                                onClick={() => handleOpenDaysModal(ev)}
                            >
                                <Calendar size={18} /> Gestionar Días de Venta
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    padding: '1rem'
                }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {formData.logo ? (
                                                <img src={formData.logo} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <ImageIcon size={30} color="var(--text-secondary)" />
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{formData.logo ? 'Cambiar' : 'Logo'}</span>
                                        <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
                                    </label>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Nombre del Evento</label>
                                        <input
                                            type="text" required
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label>Fecha Inicio</label>
                                            <input
                                                type="date" required
                                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(30,41,59,1)', color: 'white' }}
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Fecha Fin</label>
                                            <input
                                                type="date" required
                                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(30,41,59,1)', color: 'white' }}
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '80px', resize: 'vertical' }}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {editingEvent && (
                                <div className="form-group" style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '1.5rem',
                                    borderRadius: '0.8rem',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <label style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>📍 Productos por Proveedor ({formData.productIds.length})</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, productIds: products.map(p => p.id) })}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Seleccionar Todo
                                            </button>
                                            <span style={{ color: 'var(--glass-border)' }}>|</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, productIds: [] })}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Limpiar Todo
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre..."
                                                style={{
                                                    width: '100%',
                                                    padding: '0.8rem 0.8rem 0.8rem 2.8rem',
                                                    borderRadius: '2rem',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    outline: 'none',
                                                    fontSize: '0.9rem'
                                                }}
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            style={{
                                                padding: '0.8rem 1rem',
                                                borderRadius: '2rem',
                                                border: '1px solid var(--glass-border)',
                                                background: 'rgba(30,41,59,1)',
                                                color: 'white',
                                                outline: 'none',
                                                fontSize: '0.9rem',
                                                minWidth: '200px'
                                            }}
                                            value={filterSupplier}
                                            onChange={(e) => setFilterSupplier(e.target.value)}
                                        >
                                            <option value="">Todos los Proveedores</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        {suppliers
                                            .filter(s => !filterSupplier || s.id.toString() === filterSupplier)
                                            .map(s => {
                                                const supplierProducts = products.filter(p =>
                                                    p.SupplierId === s.id &&
                                                    p.name.toLowerCase().includes(productSearch.toLowerCase())
                                                );

                                                if (supplierProducts.length === 0) return null;

                                                const allSelected = supplierProducts.every(p => formData.productIds.includes(p.id));

                                                return (
                                                    <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{s.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleSupplierProducts(s.id, !allSelected)}
                                                                style={{
                                                                    background: allSelected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                                    border: '1px solid ' + (allSelected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)'),
                                                                    color: allSelected ? '#ef4444' : 'var(--primary)',
                                                                    fontSize: '0.7rem',
                                                                    padding: '0.3rem 0.6rem',
                                                                    borderRadius: '0.4rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
                                                            {supplierProducts.map(p => (
                                                                <div
                                                                    key={p.id}
                                                                    onClick={() => toggleProduct(p.id)}
                                                                    style={{
                                                                        padding: '0.8rem',
                                                                        borderRadius: '0.5rem',
                                                                        fontSize: '0.85rem',
                                                                        cursor: 'pointer',
                                                                        border: '1px solid',
                                                                        borderColor: formData.productIds.includes(p.id) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                        background: formData.productIds.includes(p.id) ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                        transition: 'all 0.2s',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: '0.2rem'
                                                                    }}
                                                                >
                                                                    <span style={{ fontWeight: formData.productIds.includes(p.id) ? 'bold' : 'normal' }}>{p.name}</span>
                                                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                                        ₡{new Intl.NumberFormat('es-CR').format(p.price)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {/* Productos sin proveedor - Solo mostrar si no hay filtro de proveedor o si el filtro es vacío */}
                                        {!filterSupplier && products.filter(p => !p.SupplierId && p.name.toLowerCase().includes(productSearch.toLowerCase())).length > 0 && (
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <p style={{ fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Otros / Sin Proveedor</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
                                                    {products
                                                        .filter(p => !p.SupplierId && p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                                        .map(p => (
                                                            <div
                                                                key={p.id}
                                                                onClick={() => toggleProduct(p.id)}
                                                                style={{
                                                                    padding: '0.8rem',
                                                                    borderRadius: '0.5rem',
                                                                    fontSize: '0.85rem',
                                                                    cursor: 'pointer',
                                                                    border: '1px solid',
                                                                    borderColor: formData.productIds.includes(p.id) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                    background: formData.productIds.includes(p.id) ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '0.2rem'
                                                                }}
                                                            >
                                                                <span>{p.name}</span>
                                                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                                    ₡{new Intl.NumberFormat('es-CR').format(p.price)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {products.length === 0 && (
                                        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '2rem' }}>
                                            No hay productos registrados para asociar.
                                        </p>
                                    )}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                                <Save size={20} /> {editingEvent ? 'Actualizar Evento' : 'Crear Evento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {isDaysModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
                    alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000,
                    padding: '2rem 1rem', overflowY: 'auto'
                }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '1000px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ marginBottom: '0.2rem' }}>Días de Venta: {currentEvent?.name}</h2>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Configura los productos disponibles para cada día del evento</p>
                            </div>
                            <button onClick={() => setIsDaysModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={28} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {selectedEventDays.map(day => (
                                <div key={day.id} className="glass-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: 'var(--primary)' }}>
                                            {new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </h4>
                                        <button
                                            onClick={() => handleOpenDayEdit(day)}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <p style={{ marginBottom: '0.2rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.3rem' }}>
                                            Productos ({day.Products?.length || 0}):
                                        </p>
                                        <div style={{ paddingRight: '0.5rem' }}>
                                            {suppliers.map(s => {
                                                const supplierDayProducts = day.Products?.filter(p => p.SupplierId === s.id);
                                                if (!supplierDayProducts || supplierDayProducts.length === 0) return null;
                                                return (
                                                    <div key={s.id} style={{ marginBottom: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>{s.name}</span>
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>{s.type || 'Otros'}</span>
                                                            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }}></div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                            {supplierDayProducts.map(p => (
                                                                <span key={p.id} style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.8rem', fontSize: '0.65rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                                                    {p.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {day.Products?.filter(p => !p.SupplierId).length > 0 && (
                                                <div style={{ marginBottom: '0.6rem' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '0.2rem' }}>Otros</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                        {day.Products.filter(p => !p.SupplierId).map(p => (
                                                            <span key={p.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '0.8rem', fontSize: '0.65rem' }}>
                                                                {p.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {day.Products?.length === 0 && (
                                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.75rem' }}>Sin productos asignados</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isDayEditingModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex',
                    alignItems: 'flex-start', justifyContent: 'center', zIndex: 2100,
                    padding: '2rem 1rem', overflowY: 'auto'
                }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '800px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Gestionar Productos - {new Date(editingDay?.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Selecciona los productos de este día</p>
                            </div>
                            <button onClick={() => setIsDayEditingModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="form-group" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.8rem', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <label style={{ margin: 0, fontWeight: 'bold' }}>Productos ({dayFormData.productIds.length})</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {/* Solo mostramos productos que están asociados al EVENTO general para este día? 
                                        O mostramos todos los productos del sistema? 
                                        Normalmente se restringe a los del evento, pero permitamos todos por flexibilidad de momento */}
                                    <button
                                        type="button"
                                        onClick={() => setDayFormData({ ...dayFormData, productIds: products.map(p => p.id) })}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', cursor: 'pointer' }}
                                    >
                                        Todos
                                    </button>
                                    <span style={{ color: 'var(--glass-border)' }}>|</span>
                                    <button
                                        type="button"
                                        onClick={() => setDayFormData({ ...dayFormData, productIds: [] })}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        placeholder="Filtrar..."
                                        style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.4rem', borderRadius: '2rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.8rem' }}
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem', border: '1px solid var(--glass-border)', background: 'rgba(30,41,59,1)', color: 'white', fontSize: '0.8rem' }}
                                    value={filterSupplier}
                                    onChange={(e) => setFilterSupplier(e.target.value)}
                                >
                                    <option value="">Proveedores</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {suppliers
                                    .filter(s => !filterSupplier || s.id.toString() === filterSupplier)
                                    .map(s => {
                                        const supplierProducts = products.filter(p => p.SupplierId === s.id && p.name.toLowerCase().includes(productSearch.toLowerCase()));
                                        if (supplierProducts.length === 0) return null;
                                        const allSelected = supplierProducts.every(p => dayFormData.productIds.includes(p.id));
                                        return (
                                            <div key={s.id}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.8rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>{s.name}</span>
                                                        <button onClick={() => toggleSupplierDayProducts(s.id, !allSelected)} style={{ background: 'none', border: 'none', color: allSelected ? '#ef4444' : 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                            {allSelected ? 'Quitar todos' : 'Poner todos'}
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                                                            {s.type || 'Otros'}
                                                        </span>
                                                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }}></div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.4rem' }}>
                                                    {[...supplierProducts].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => toggleDayProduct(p.id)}
                                                            style={{
                                                                padding: '0.5rem', borderRadius: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid',
                                                                borderColor: dayFormData.productIds.includes(p.id) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                background: dayFormData.productIds.includes(p.id) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                                color: dayFormData.productIds.includes(p.id) ? 'white' : 'var(--text-secondary)'
                                                            }}
                                                        >
                                                            {p.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                {!filterSupplier && products.filter(p => !p.SupplierId && p.name.toLowerCase().includes(productSearch.toLowerCase())).length > 0 && (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sin Proveedor</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.4rem' }}>
                                            {products.filter(p => !p.SupplierId && p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                                <div key={p.id} onClick={() => toggleDayProduct(p.id)} style={{ padding: '0.5rem', borderRadius: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid', borderColor: dayFormData.productIds.includes(p.id) ? 'var(--primary)' : 'rgba(255,255,255,0.05)', background: dayFormData.productIds.includes(p.id) ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}>{p.name}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
                            onClick={handleSaveDayProducts}
                        >
                            <Save size={18} /> Guardar Cambios del Día
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
