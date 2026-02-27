import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Loader2, Edit2, Trash2, X, Save, Phone, Mail, CreditCard, Percent, Search, Tag } from 'lucide-react';
import { PatternFormat } from 'react-number-format';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        type: 'Alimentación',
        phone: '',
        email: '',
        hasDataphone: false,
        dataphoneCommission: 0,
        commission: 0
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/suppliers`);
            setSuppliers(response.data);
        } catch (err) {
            setError('Error al cargar proveedores.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                type: supplier.type || 'Alimentación',
                phone: supplier.phone || '',
                email: supplier.email || '',
                hasDataphone: !!supplier.hasDataphone,
                dataphoneCommission: supplier.dataphoneCommission || 0,
                commission: supplier.commission || 0
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                type: 'Alimentación',
                phone: '',
                email: '',
                hasDataphone: false,
                dataphoneCommission: 0,
                commission: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                const res = await axios.put(`${API_URL}/suppliers/${editingSupplier.id}`, formData);
                setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? res.data : s));
                toast.success('Proveedor actualizado');
            } else {
                const res = await axios.post(`${API_URL}/suppliers`, formData);
                setSuppliers([...suppliers, res.data]);
                toast.success('Proveedor creado');
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error('Error al guardar el proveedor');
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontWeight: '500' }}>
                    ¿Estás seguro de eliminar este proveedor?<br />
                    <small style={{ opacity: 0.7 }}>Esto podría afectar a los productos vinculados.</small>
                </p>
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
                                await axios.delete(`${API_URL}/suppliers/${id}`);
                                setSuppliers(suppliers.filter(s => s.id !== id));
                                toast.success('Proveedor eliminado');
                            } catch (err) {
                                toast.error('Error al eliminar el proveedor');
                            }
                        }}
                        style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        ), { duration: 6000, position: 'top-center' });
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.type && s.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1>Proveedores</h1>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} /> Nuevo Proveedor
                    </button>
                </div>

                <div style={{ position: 'relative', maxWidth: '500px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o correo..."
                        style={{
                            width: '100%',
                            padding: '0.8rem 0.8rem 0.8rem 3rem',
                            borderRadius: '2rem',
                            border: '1px solid var(--glass-border)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                </div>
            ) : error ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    {error}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredSuppliers.map(s => (
                        <div key={s.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--primary)' }}>{s.name}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleOpenModal(s)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '1rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    marginBottom: '0.5rem'
                                }}>
                                    <Tag size={12} style={{ marginRight: '0.3rem' }} />
                                    {s.type}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                    <Phone size={16} /> {s.phone || 'Sin teléfono'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                    <Mail size={16} /> {s.email || 'Sin correo'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: s.hasDataphone ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                    <CreditCard size={16} />
                                    {s.hasDataphone ? `Tiene Datáfono (${s.dataphoneCommission}%)` : 'Sin Datáfono'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                    <Percent size={16} color="var(--primary)" /> Com. General: {s.commission}%
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
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Nombre del Proveedor</label>
                                <input
                                    type="text" required
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tipo de Proveedor</label>
                                <select
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(30, 41, 59, 1)', color: 'white', appearance: 'none' }}
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Alimentación">Alimentación</option>
                                    <option value="Dulcería">Dulcería</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <PatternFormat
                                        format="####-####"
                                        mask="_"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                        value={formData.phone}
                                        onValueChange={(values) => setFormData({ ...formData, phone: values.formattedValue })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Comisión (%)</label>
                                    <input
                                        type="number" step="0.01"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                        value={formData.commission}
                                        onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Correo Electrónico</label>
                                <input
                                    type="email"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0' }}>
                                <input
                                    type="checkbox"
                                    id="hasDataphone"
                                    style={{ width: '20px', height: '20px' }}
                                    checked={formData.hasDataphone}
                                    onChange={(e) => setFormData({ ...formData, hasDataphone: e.target.checked })}
                                />
                                <label htmlFor="hasDataphone">¿Tiene datáfono propio?</label>
                            </div>

                            {formData.hasDataphone && (
                                <div className="form-group" style={{
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid var(--accent)',
                                    animation: 'fadeIn 0.3s'
                                }}>
                                    <label>Comisión de Datáfono (%)</label>
                                    <input
                                        type="number" step="0.01"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', marginTop: '0.5rem' }}
                                        value={formData.dataphoneCommission}
                                        onChange={(e) => setFormData({ ...formData, dataphoneCommission: e.target.value })}
                                    />
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                                <Save size={20} /> Guardar Proveedor
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
