import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Loader2, Edit2, Trash2, X, Save, Calendar, Search, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        logo: '',
        productIds: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [eventsRes, productsRes] = await Promise.all([
                axios.get(`${API_URL}/events`),
                axios.get(`${API_URL}/products`)
            ]);
            setEvents(eventsRes.data);
            setProducts(productsRes.data);
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
            toast.error('Error al guardar el evento');
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
                                        {ev.startDate} - {ev.endDate}
                                    </p>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{ev.description}</p>
                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Productos ({ev.Products?.length || 0}):</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {ev.Products?.map(p => (
                                        <span key={p.id} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                                            {p.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
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

                            <div className="form-group">
                                <label style={{ marginBottom: '1rem', display: 'block' }}>Productos Asociados</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: '0.5rem',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '0.5rem'
                                }}>
                                    {products.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => toggleProduct(p.id)}
                                            style={{
                                                padding: '0.5rem',
                                                borderRadius: '0.4rem',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                borderColor: formData.productIds.includes(p.id) ? 'var(--primary)' : 'var(--glass-border)',
                                                background: formData.productIds.includes(p.id) ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                                <Save size={20} /> {editingEvent ? 'Actualizar Evento' : 'Crear Evento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
