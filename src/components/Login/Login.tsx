import React, { useState, useRef } from 'react';
import './Login.css';
import { User } from '../../types/auth';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleIconClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 3) {
      setShowCredentials((show) => !show);
      clickCountRef.current = 0;
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      // Intentar login en el endpoint del backend
      let response = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      // Si falla por 404, fallback al endpoint alternativo /auth/login
      if (response.status === 404) {
        response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Usuario o contraseña incorrectos.');
      }

      const userData: User = await response.json();
      onLoginSuccess(userData);
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (userType: 'admin' | 'monitor') => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('1234');
    } else {
      setUsername('monitor');
      setPassword('1234');
    }
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon" onClick={handleIconClick} title="Transmetro">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="15" rx="3" />
              <circle cx="8" cy="15" r="1.5" />
              <circle cx="16" cy="15" r="1.5" />
              <path d="M7 8h10" />
              <path d="M9 18l-2 3" />
              <path d="M15 18l2 3" />
            </svg>
          </div>
          <h1 className="login-title">Transmetro</h1>
          <p className="login-subtitle">Sistema de Control Integrado</p>
        </div>

        {error && (
          <div className="login-alert error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="username">
              Nombre de Usuario
            </label>
            <div className="login-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="ej. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">
              Contraseña
            </label>
            <div className="login-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="login-btn-submit" disabled={loading}>
            {loading ? (
              <>Iniciando sesión...</>
            ) : (
              <>
                Ingresar al Sistema
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        {showCredentials && (
          <div className="login-credentials-box">
            <p>
              <strong>Accesos preconfigurados:</strong> Usuarios de prueba disponibles:
            </p>
            <div className="login-credentials-tags" style={{ marginBottom: '0.4rem' }}>
              <span className="credential-chip">Admin: admin / 1234</span>
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00913f',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Autocompletar Admin
              </button>
            </div>
            <div className="login-credentials-tags">
              <span className="credential-chip">Monitor: monitor / 1234</span>
              <button
                type="button"
                onClick={() => handleFillDemo('monitor')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00913f',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Autocompletar Monitor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
