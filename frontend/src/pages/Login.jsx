import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSuccess = async (googleResponse) => {
        try {
            const res = await axios.post(`${API_URL}/auth/google`, {
                token: googleResponse.credential
            });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            alert('Error al iniciar sesión. Inténtalo de nuevo.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '2rem'
        }}>
            <div className="glass-card" style={{
                padding: '3rem',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%'
            }}>
                <h1 style={{ marginBottom: '1rem' }}>Bienvenido</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Inicia sesión para gestionar el evento
                </p>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => console.log('Login Failed')}
                        useOneTap
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
