import React, { useState, useEffect } from 'react';
import './App.css';
import { Municipalidades } from './components/Municipalidades/Municipalidades';
import { Lineas } from './components/Lineas/Lineas';
import { Infraestructura } from './components/Infraestructura/Infraestructura';
import { Buses } from './components/Buses/Buses';
import { Personal } from './components/Personal/Personal';
import { Monitoreo } from './components/Monitoreo/Monitoreo';

function App() {
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'municipalidades' | 'infraestructura' | 'lineas' | 'buses' | 'personal' | 'monitoreo'>('municipalidades');

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
            className={`tab-btn ${activeTab === 'monitoreo' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoreo')}
          >
            Monitoreo
          </button>
        </div>

        {activeTab === 'municipalidades' && <Municipalidades />}
        {activeTab === 'infraestructura' && <Infraestructura />}
        {activeTab === 'lineas' && <Lineas />}
        {activeTab === 'buses' && <Buses />}
        {activeTab === 'personal' && <Personal />}
        {activeTab === 'monitoreo' && <Monitoreo />}
      </main>
    </div>
  );
}

export default App;
