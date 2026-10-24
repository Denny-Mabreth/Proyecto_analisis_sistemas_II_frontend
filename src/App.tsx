import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Municipalidades } from './components/Municipalidades/Municipalidades';
import { Lineas } from './components/Lineas/Lineas';
import { Infraestructura } from './components/Infraestructura/Infraestructura';
import { Buses } from './components/Buses/Buses';
import { Personal } from './components/Personal/Personal';
import { Monitoreo } from './components/Monitoreo/Monitoreo';
import { Usuarios } from './components/Usuarios/Usuarios';
import { Login } from './components/Login/Login';
import { User } from './types/auth';

type TabKey =
  | 'municipalidades'
  | 'personal'
  | 'infraestructura'
  | 'buses'
  | 'lineas'
  | 'usuarios'
  | 'monitoreo';

const USER_STORAGE_KEY = 'transmetro_user';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  // Tab seleccionada
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (currentUser?.rol === 'Monitor') {
      return 'monitoreo';
    }
    return 'municipalidades';
  });

  // Sincronizar estado de ruta con URL y autenticación
  const syncRouteWithAuth = useCallback((user: User | null, pathname: string) => {
    const isDashboard = pathname.startsWith('/dashboard');

    if (!user) {
      // Si no está autenticado y se intenta acceder a /dashboard, redirigir a /
      if (isDashboard) {
        window.history.replaceState({}, '', '/');
        setCurrentPath('/');
      } else {
        setCurrentPath(pathname);
      }
    } else {
      // Si está autenticado y se encuentra en /, redirigir a /dashboard
      if (!isDashboard) {
        window.history.replaceState({}, '', '/dashboard');
        setCurrentPath('/dashboard');
      } else {
        setCurrentPath('/dashboard');
      }
    }
  }, []);

  // Escuchar navegación del navegador (atrás / adelante)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      syncRouteWithAuth(currentUser, path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, syncRouteWithAuth]);

  // Al montar o cambiar usuario, validar la ruta
  useEffect(() => {
    syncRouteWithAuth(currentUser, window.location.pathname);
  }, [currentUser, syncRouteWithAuth]);

  // Ajustar la pestaña activa si cambia el rol
  useEffect(() => {
    if (currentUser?.rol === 'Monitor') {
      setActiveTab('monitoreo');
    } else if (currentUser?.rol === 'Administrador' && activeTab === 'monitoreo') {
      setActiveTab('municipalidades');
    }
  }, [currentUser?.rol]); // eslint-disable-line react-hooks/exhaustive-deps

  // Verificar estado del backend
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/municipalidades/status`);
        if (response.ok) {
          setConnectionStatus('Conectado al Backend');
        } else {
          setConnectionStatus('Error de conexión');
        }
      } catch (error) {
        setConnectionStatus('Error de conexión');
      }
    };
    checkConnection();
  }, []);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    if (user.rol === 'Monitor') {
      setActiveTab('monitoreo');
    } else {
      setActiveTab('municipalidades');
    }
    window.history.pushState({}, '', '/dashboard');
    setCurrentPath('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentUser(null);
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  // Si no hay usuario autenticado o la ruta es la raíz, mostrar la pantalla de Login
  if (!currentUser || currentPath !== '/dashboard') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.rol === 'Administrador';
  const isMonitor = currentUser.rol === 'Monitor';

  const avatarInitial = currentUser.nombre
    ? currentUser.nombre.charAt(0).toUpperCase()
    : currentUser.username.charAt(0).toUpperCase();

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <h1 className="title">Transmetro</h1>
          <p className="subtitle">Sistema de Control Integrado</p>
        </div>

        <div className="header-right">
          {connectionStatus && (
            <div className={`status-badge ${connectionStatus.includes('Error') ? 'offline' : 'online'}`}>
              {connectionStatus}
            </div>
          )}

          <div className="user-profile-badge">
            <div className="user-avatar">{avatarInitial}</div>
            <div className="user-info">
              <span className="user-info-name">{currentUser.nombre}</span>
              <div className="user-info-role">
                <span className={`user-role-tag ${isAdmin ? 'admin' : 'monitor'}`}>
                  {currentUser.rol}
                </span>
                <span>@{currentUser.username}</span>
              </div>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Salir
          </button>
        </div>
      </header>

      <main>
        <div className="tabs-container">
          {/* Pestañas para Administrador */}
          {isAdmin && (
            <>
              <button
                className={`tab-btn ${activeTab === 'municipalidades' ? 'active' : ''}`}
                onClick={() => setActiveTab('municipalidades')}
              >
                Municipalidades
              </button>
              <button
                className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                Personal
              </button>
              <button
                className={`tab-btn ${activeTab === 'infraestructura' ? 'active' : ''}`}
                onClick={() => setActiveTab('infraestructura')}
              >
                Infraestructura
              </button>
              <button
                className={`tab-btn ${activeTab === 'buses' ? 'active' : ''}`}
                onClick={() => setActiveTab('buses')}
              >
                Buses
              </button>
              <button
                className={`tab-btn ${activeTab === 'lineas' ? 'active' : ''}`}
                onClick={() => setActiveTab('lineas')}
              >
                Líneas de Buses
              </button>
              <button
                className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
                onClick={() => setActiveTab('usuarios')}
              >
                Usuarios
              </button>
            </>
          )}

          {/* Pestaña para Monitor */}
          {isMonitor && (
            <button
              className={`tab-btn ${activeTab === 'monitoreo' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitoreo')}
            >
              Monitoreo
            </button>
          )}
        </div>

        {/* Contenido condicional por rol y pestaña activa */}
        {isAdmin && activeTab === 'municipalidades' && <Municipalidades />}
        {isAdmin && activeTab === 'infraestructura' && <Infraestructura />}
        {isAdmin && activeTab === 'lineas' && <Lineas />}
        {isAdmin && activeTab === 'buses' && <Buses />}
        {isAdmin && activeTab === 'personal' && <Personal />}
        {isAdmin && activeTab === 'usuarios' && <Usuarios />}
        {isMonitor && activeTab === 'monitoreo' && <Monitoreo />}
      </main>
    </div>
  );
}

export default App;
