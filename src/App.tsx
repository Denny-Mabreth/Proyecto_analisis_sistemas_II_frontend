import React, { useState, useEffect } from 'react';
import './App.css';
import { Municipalidades } from './components/Municipalidades/Municipalidades';
import { Lineas } from './components/Lineas/Lineas';
import { Estaciones } from './components/Estaciones/Estaciones';
import { Parqueos } from './components/Parqueos/Parqueos';
import { Buses } from './components/Buses/Buses';
import { Pilotos } from './components/Pilotos/Pilotos';

function App() {
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'municipalidades' | 'lineas' | 'estaciones' | 'parqueos' | 'buses' | 'pilotos'>('municipalidades');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/municipalidades/status`);
        if (response.ok) {
          setConnectionStatus('Conectado al Backend');
        }
      } catch (error) {
        setConnectionStatus('Error de conexión');
      }
    };
    checkConnection();
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1 className="title">Transmetro</h1>
          <p className="subtitle">Sistema de Control Integrado</p>
        </div>

        {connectionStatus && (
          <div className={`status-badge ${connectionStatus.includes('Error') ? 'offline' : 'online'}`}>
            {connectionStatus}
          </div>
        )}
      </header>

      <main>
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'municipalidades' ? 'active' : ''}`}
            onClick={() => setActiveTab('municipalidades')}
          >
            Municipalidades
          </button>
          <button
            className={`tab-btn ${activeTab === 'estaciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('estaciones')}
          >
            Estaciones
          </button>
          <button
            className={`tab-btn ${activeTab === 'parqueos' ? 'active' : ''}`}
            onClick={() => setActiveTab('parqueos')}
          >
            Parqueos
          </button>
          <button
            className={`tab-btn ${activeTab === 'lineas' ? 'active' : ''}`}
            onClick={() => setActiveTab('lineas')}
          >
            Líneas de Buses
          </button>
          <button
            className={`tab-btn ${activeTab === 'buses' ? 'active' : ''}`}
            onClick={() => setActiveTab('buses')}
          >
            Buses
          </button>
          <button
            className={`tab-btn ${activeTab === 'pilotos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pilotos')}
          >
            Pilotos
          </button>
        </div>

        {activeTab === 'municipalidades' && <Municipalidades />}
        {activeTab === 'estaciones' && <Estaciones />}
        {activeTab === 'lineas' && <Lineas />}
        {activeTab === 'parqueos' && <Parqueos />}
        {activeTab === 'buses' && <Buses />}
        {activeTab === 'pilotos' && <Pilotos />}
      </main>
    </div>
  );
}

export default App;
