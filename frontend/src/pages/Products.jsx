import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Loader2, Edit2, Trash2, X, Save, Search, ChevronDown, FileUp, Info } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import Papa from 'papaparse';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [isSupplierListOpen, setIsSupplierListOpen] = useState(false);
    const [showImportHelp, setShowImportHelp] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const fileInputRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        SupplierId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, suppRes] = await Promise.all([
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/suppliers`)
            ]);
            setProducts(prodRes.data);
            setSuppliers(suppRes.data);
        } catch (err) {
            setError('Error al cargar datos. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price,
                SupplierId: product.SupplierId || ''
            });
            setSupplierSearch(product.Supplier?.name || '');
        } else {
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: '', SupplierId: '' });
            setSupplierSearch('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                const res = await axios.put(`${API_URL}/products/${editingProduct.id}`, formData);
                setProducts(products.map(p => p.id === editingProduct.id ? res.data : p));
                toast.success('Producto actualizado');
            } else {
                const res = await axios.post(`${API_URL}/products`, formData);
                setProducts([...products, res.data]);
                toast.success('Producto creado');
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error('Error al guardar el producto');
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontWeight: '500' }}>¿Estás seguro de eliminar este producto?</p>
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
                                await axios.delete(`${API_URL}/products/${id}`);
                                setProducts(products.filter(p => p.id !== id));
                                toast.success('Producto eliminado');
                            } catch (err) {
                                toast.error('Error al eliminar el producto');
                            }
                        }}
                        style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const importedData = results.data;
                const productsToCreate = importedData.map(row => {
                    // Match supplier by name (case insensitive)
                    const supplier = suppliers.find(s =>
                        s.name.trim().toLowerCase() === (row.proveedor || row.Proveedor || '').trim().toLowerCase()
                    );

                    return {
                        name: row.nombre || row.Nombre,
                        description: row.descripcion || row.Descripcion,
                        price: parseFloat(row.precio || row.Precio || 0),
                        SupplierId: supplier ? supplier.id : null
                    };
                }).filter(p => p.name); // Basic validation: must have a name

                if (productsToCreate.length === 0) {
                    toast.error('No se encontraron productos válidos en el archivo.');
                    return;
                }

                try {
                    setLoading(true);
                    await axios.post(`${API_URL}/products/bulk`, { products: productsToCreate });
                    await fetchData(); // Refresh list
                    toast.success(`¡Éxito! Se importaron ${productsToCreate.length} productos.`);
                } catch (err) {
                    console.error(err);
                    toast.error('Error al importar productos.');
                } finally {
                    setLoading(false);
                    e.target.value = ''; // Reset input
                }
            }
        });
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSupplier = filterSupplier === '' || p.SupplierId?.toString() === filterSupplier;

        return matchesSearch && matchesSupplier;
    });

    return (
        <div className="container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1>Productos</h1>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', position: 'relative' }}>
                        <button
                            className="btn"
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0.5rem' }}
                            onMouseEnter={() => setShowImportHelp(true)}
                            onMouseLeave={() => setShowImportHelp(false)}
                            onClick={() => setShowImportHelp(!showImportHelp)}
                        >
                            <Info size={20} />
                        </button>

                        {showImportHelp && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                width: '280px',
                                background: 'rgba(30, 41, 59, 1)',
                                border: '1px solid var(--accent)',
                                padding: '1rem',
                                borderRadius: '0.8rem',
                                fontSize: '0.8rem',
                                zIndex: 1000,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                marginTop: '0.5rem',
                                animation: 'fadeIn 0.2s'
                            }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--accent)' }}>Formato CSV Requerido:</p>
                                <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '0.3rem', display: 'block', marginBottom: '0.5rem' }}>
                                    nombre, descripcion, precio, proveedor
                                </code>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    * El nombre del proveedor debe coincidir exactamente con los que ya tienes registrados.
                                </p>
                            </div>
                        )}

                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                        <button className="btn" style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }} onClick={() => fileInputRef.current.click()}>
                            <FileUp size={20} /> Importar CSV
                        </button>
                        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                            <Plus size={20} /> Nuevo Producto
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o descripción..."
                            style={{
                                width: '100%',
                                padding: '0.8rem 0.8rem 0.8rem 3rem',
                                borderRadius: '2rem',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                outline: 'none'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        style={{
                            padding: '0.8rem 1rem',
                            borderRadius: '2rem',
                            border: '1px solid var(--glass-border)',
                            background: 'rgba(30, 41, 59, 1)',
                            color: 'white',
                            outline: 'none',
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredProducts.map(p => (
                        <div key={p.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ color: 'var(--primary)' }}>{p.name}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            {p.description && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{p.description}</p>
                            )}
                            <NumericFormat
                                value={p.price}
                                displayType="text"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="₡"
                                style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                            />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                Proveedor: <span style={{ color: 'var(--accent)' }}>{p.Supplier?.name || 'No asignado'}</span>
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal - Could be improved with a dedicated component */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    padding: '1rem'
                }}>
                    <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label>Nombre del Producto</label>
                                <input
                                    type="text"
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label>Descripción</label>
                                <textarea
                                    style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '80px', resize: 'vertical' }}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label>Precio (Colones)</label>
                                <NumericFormat
                                    required
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="₡"
                                    style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                    value={formData.price}
                                    onValueChange={(values) => setFormData({ ...formData, price: values.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                                <label>Proveedor</label>
                                <div
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--glass-border)'
                                    }}
                                >
                                    <Search size={18} style={{ position: 'absolute', left: '0.8rem', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar proveedor..."
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 2.5rem 0.8rem 2.5rem',
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                        value={supplierSearch}
                                        onChange={(e) => {
                                            setSupplierSearch(e.target.value);
                                            setIsSupplierListOpen(true);
                                        }}
                                        onFocus={() => setIsSupplierListOpen(true)}
                                    />
                                    <ChevronDown
                                        size={20}
                                        style={{
                                            position: 'absolute',
                                            right: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            transform: isSupplierListOpen ? 'rotate(180deg)' : 'none',
                                            transition: 'transform 0.3s'
                                        }}
                                        onClick={() => setIsSupplierListOpen(!isSupplierListOpen)}
                                    />
                                </div>

                                {isSupplierListOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'rgba(30, 41, 59, 1)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        marginTop: '0.3rem',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        zIndex: 3000,
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                    }}>
                                        {suppliers
                                            .filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                                            .map(s => (
                                                <div
                                                    key={s.id}
                                                    style={{
                                                        padding: '0.8rem 1rem',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        background: formData.SupplierId === s.id ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onClick={() => {
                                                        setFormData({ ...formData, SupplierId: s.id });
                                                        setSupplierSearch(s.name);
                                                        setIsSupplierListOpen(false);
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                                    onMouseLeave={(e) => e.target.style.background = formData.SupplierId === s.id ? 'rgba(16, 185, 129, 0.2)' : 'transparent'}
                                                >
                                                    {s.name}
                                                </div>
                                            ))
                                        }
                                        {suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 && (
                                            <div style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                                No se encontraron proveedores
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                                <Save size={20} /> Guardar Cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
