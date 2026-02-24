import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoCGR from '../resources/Logotipo-CGR-transp.png';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

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
                padding: '4rem 3rem',
                textAlign: 'center',
                maxWidth: '550px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <img
                    src={logoCGR}
                    alt="CGR Logo"
                    style={{
                        width: '280px',
                        height: 'auto',
                        marginBottom: '1.5rem',
                        filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.15))'
                    }}
                />

                <h1 style={{
                    marginBottom: '1rem',
                    fontSize: '2.2rem',
                    fontWeight: '800',
                    lineHeight: '1.2',
                    background: 'linear-gradient(to right, #fff, var(--primary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Gestión de Eventos <br /> Grupos de Proyección
                </h1>

                <p style={{
                    color: 'var(--text-secondary)',
                    marginBottom: '3rem',
                    fontSize: '1.1rem',
                    maxWidth: '80%'
                }}>
                    Inicia sesión para gestionar los eventos
                </p>

                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => console.log('Login Failed')}
                        theme="filled_blue"
                        size="large"
                        text="continue_with"
                        shape="pill"
                        width="320"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
