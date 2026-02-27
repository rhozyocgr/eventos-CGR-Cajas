import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users as UsersIcon, Shield, ShieldAlert, Trash2, Search, UserCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        setModalConfig({
            isOpen: true,
            title: 'Cambiar Rol de Usuario',
            message: `¿Estás seguro de que deseas cambiar el rol de ${user.name} a ${newRole === 'admin' ? 'Administrador' : 'Usuario'}?`,
            confirmText: 'Actualizar',
            type: 'warning',
            onConfirm: async () => {
                try {
                    await axios.patch(`${API_URL}/users/${user.id}/role`, { role: newRole });
                    toast.success(`Rol actualizado para ${user.name}`);
                    fetchUsers();
                } catch (error) {
                    console.error('Error updating role:', error);
                    toast.error(error.response?.data?.error || 'Error al actualizar el rol');
                }
            }
        });
    };

    const handleDeleteUser = (user) => {
        setModalConfig({
            isOpen: true,
            title: 'Eliminar Usuario',
            message: `¿Estás seguro de que deseas eliminar permanentemente a ${user.name}? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_URL}/users/${user.id}`);
                    toast.success('Usuario eliminado');
                    fetchUsers();
                } catch (error) {
                    console.error('Error deleting user:', error);
                    toast.error(error.response?.data?.error || 'Error al eliminar usuario');
                }
            }
        });
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="container"><h2>Cargando usuarios...</h2></div>;

    return (
        <div className="container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <UsersIcon size={32} color="var(--primary)" />
                        Gestión de Usuarios
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Administra los roles y permisos de acceso al sistema.
                    </p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search
                        size={20}
                        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 3rem',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--glass-border)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                </div>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Usuario</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Correo</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Rol</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: user.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: user.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)'
                                            }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                                        {user.email}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '2rem',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            background: user.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                                            color: user.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                                            border: user.role === 'admin' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem'
                                        }}>
                                            {user.role === 'admin' ? <ShieldAlert size={14} /> : <UserCheck size={14} />}
                                            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleToggleRole(user)}
                                                title={user.role === 'admin' ? "Quitar Admin" : "Hacer Admin"}
                                                style={{
                                                    background: user.role === 'admin' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    border: 'none',
                                                    color: user.role === 'admin' ? '#f59e0b' : '#10b981',
                                                    padding: '0.5rem',
                                                    borderRadius: '0.5rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {user.role === 'admin' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                title="Eliminar usuario"
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    padding: '0.5rem',
                                                    borderRadius: '0.5rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No se encontraron usuarios que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                type={modalConfig.type}
            />
        </div>
    );
};

export default Users;
