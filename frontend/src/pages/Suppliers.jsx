import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axios.get(`${API_URL}/suppliers`);
                setSuppliers(response.data);
            } catch (err) {
                setError('Error al cargar proveedores. Asegúrate de que el backend esté corriendo.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, []);

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Proveedores</h1>
                <button className="btn btn-primary">
                    <Plus size={20} /> Nuevo Proveedor
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                </div>
            ) : error ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    {error}
                </div>
            ) : suppliers.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No hay proveedores registrados aún.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {suppliers.map(s => (
                        <div key={s.id} className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ color: 'var(--primary)' }}>{s.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{s.contact}</p>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.875rem' }}>
                                📞 {s.phone || 'No disponible'}
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    );
};

export default Suppliers;
