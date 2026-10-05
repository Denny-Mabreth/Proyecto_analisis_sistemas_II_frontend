import React, { useState, useEffect } from 'react';
import './App.css';
import { Municipalidades } from './components/Municipalidades/Municipalidades';

function App() {
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

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
        <Municipalidades />
      </main>
    </div>
  );
}

export default App;
