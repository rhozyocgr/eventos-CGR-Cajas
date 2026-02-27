import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import {
    TrendingUp,
    Package,
    Truck,
    DollarSign,
    ShoppingBag,
    RefreshCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/sales/dashboard-stats`);
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <RefreshCcw className="spin" size={40} style={{ opacity: 0.2 }} />
            </div>
        );
    }

    return (
        <div className="container dashboard-container">
            <div className="dashboard-header">
                <div className="title-section">
                    <h1>Panel de Control</h1>
                    <p>Bienvenido, {user?.name}</p>
                </div>
                <button onClick={fetchStats} className="btn-refresh" title="Actualizar datos">
                    <RefreshCcw size={20} className={loading ? 'spin' : ''} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="glass-card hover-glow" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                        <DollarSign size={80} />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Ventas Hoy</span>
                    <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', color: 'var(--primary)', fontWeight: '900' }}>
                        ₡{new Intl.NumberFormat('es-CR').format(stats?.summary?.totalToday || 0)}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.9rem' }}>
                        <TrendingUp size={16} />
                        <span>{stats?.summary?.countToday} transacciones</span>
                    </div>
                </div>

                <div className="glass-card hover-glow" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                        <Package size={80} />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Productos Activos</span>
                    <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', color: 'var(--accent)', fontWeight: '900' }}>
                        {stats?.summary?.productCount}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>En catálogo total</p>
                </div>

                <div className="glass-card hover-glow" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                        <Truck size={80} />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Proveedores</span>
                    <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', color: '#f59e0b', fontWeight: '900' }}>
                        {stats?.summary?.supplierCount}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Registrados en el sistema</p>
                </div>
            </div>

            <div className="charts-grid">
                {/* Top Products Chart */}
                <div className="glass-card chart-card">
                    <h3 className="chart-title">
                        <ShoppingBag size={20} color="var(--primary)" />
                        Top 10 Productos
                    </h3>
                    <div className="chart-container">
                        {stats?.topProducts?.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart data={stats?.topProducts} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={120}
                                        style={{ fontSize: '0.75rem', fill: 'var(--text-secondary)' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{
                                            background: 'rgba(30, 41, 59, 0.9)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '0.8rem',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        itemStyle={{ color: 'white' }}
                                    />
                                    <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                                        {stats?.topProducts?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                <p>No hay datos de ventas disponibles</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Methods Distribution */}
                <div className="glass-card chart-card">
                    <h3 className="chart-title">
                        <DollarSign size={20} color="var(--accent)" />
                        Ventas por Pago
                    </h3>
                    <div className="chart-container-pie">
                        {stats?.paymentStats?.length > 0 ? (
                            <>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={stats?.paymentStats}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats?.paymentStats?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => `₡${new Intl.NumberFormat('es-CR').format(value)}`}
                                            contentStyle={{
                                                background: 'rgba(30, 41, 59, 0.9)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '0.8rem',
                                                backdropFilter: 'blur(10px)'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                                    {stats?.paymentStats?.map((entry, index) => (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.name}</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>₡{new Intl.NumberFormat('es-CR').format(entry.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ opacity: 0.3 }}>
                                <p>No hay ventas hoy aún</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
