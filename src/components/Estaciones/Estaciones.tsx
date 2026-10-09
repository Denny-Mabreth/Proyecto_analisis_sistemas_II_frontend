import React, { useState, useEffect } from 'react';
import './Estaciones.css';

interface Municipalidad {
  id: number;
  nombre: string;
  activo: boolean;
}

interface Estacion {
  id: number;
  nombre: string;
  municipalidad?: Municipalidad;
  parqueos?: { id: number, nombre: string }[];
}

export const Estaciones = () => {
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [municipalidades, setMunicipalidades] = useState<Municipalidad[]>([]);
  const [parqueosGlobal, setParqueosGlobal] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [municipalidadId, setMunicipalidadId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [expandedEstacionId, setExpandedEstacionId] = useState<number | null>(null);
  const [newParqueoId, setNewParqueoId] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchEstaciones = async () => {
    try {
      const response = await fetch(`${API_URL}/estaciones`);
      const data = await response.json();
      setEstaciones(data);
    } catch (error) {
      console.error('Error fetching estaciones:', error);
    }
  };

  const fetchMunicipalidades = async () => {
    try {
      const response = await fetch(`${API_URL}/municipalidades`);
      const data = await response.json();
      setMunicipalidades(data);
    } catch (error) {
      console.error('Error fetching municipalidades:', error);
    }
  };

  const fetchParqueosGlobal = async () => {
    try {
      const response = await fetch(`${API_URL}/parqueos`);
      const data = await response.json();
      if (Array.isArray(data)) setParqueosGlobal(data);
    } catch (error) { console.error('Error:', error); }
  };

  useEffect(() => {
    fetchEstaciones();
    fetchMunicipalidades();
    fetchParqueosGlobal();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !municipalidadId) return;
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/estaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          municipalidadId: parseInt(municipalidadId),
        }),
      });
      setNombre('');
      setMunicipalidadId('');
      fetchEstaciones();
    } catch (error) {
      console.error('Error creating estacion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta estación?')) return;
    
    try {
      await fetch(`${API_URL}/estaciones/${id}`, {
        method: 'DELETE',
      });
      fetchEstaciones();
    } catch (error) {
      console.error('Error deleting estacion:', error);
    }
  };

  const handleAssignParqueo = async (estacionId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!newParqueoId) return;

    try {
      await fetch(`${API_URL}/parqueos/${newParqueoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estacionId }),
      });
      setNewParqueoId('');
      fetchEstaciones();
      fetchParqueosGlobal();
    } catch (error) {
      console.error('Error asignando parqueo:', error);
    }
  };

  const handleUnassignParqueo = async (parqueoId: number) => {
    if (!window.confirm('¿Desasignar este parqueo de la estación?')) return;
    try {
      await fetch(`${API_URL}/parqueos/${parqueoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estacionId: null }),
      });
      fetchEstaciones();
      fetchParqueosGlobal();
    } catch (error) {
      console.error('Error desasignando parqueo:', error);
    }
  };

  return (
    <section className="estaciones-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Estaciones</h2>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input-field"
          placeholder="Nombre (ej. Estación Central)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
        />
        <select 
          className="select-field" 
          value={municipalidadId}
          onChange={(e) => setMunicipalidadId(e.target.value)}
          disabled={loading}
        >
          <option value="">Selecciona una Municipalidad...</option>
          {municipalidades.map(mun => (
            <option key={mun.id} value={mun.id}>{mun.nombre}</option>
          ))}
        </select>

        <button type="submit" className="btn" disabled={loading || !nombre.trim() || !municipalidadId}>
          {loading ? 'Agregando...' : 'Agregar'}
        </button>
      </form>

      <div className="table-container">
        {estaciones.length === 0 ? (
          <div className="empty-state">No hay estaciones registradas. ¡Agrega la primera!</div>
        ) : (
          <table className="minimal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Municipalidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estaciones.map((estacion) => (
                <React.Fragment key={estacion.id}>
                <tr>
                  <td>#{estacion.id}</td>
                  <td>{estacion.nombre}</td>
                  <td>{estacion.municipalidad ? estacion.municipalidad.nombre : 'Sin asignar'}</td>
                  <td style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#666' }} onClick={() => setExpandedEstacionId(expandedEstacionId === estacion.id ? null : estacion.id)}>
                      {expandedEstacionId === estacion.id ? 'Ocultar Parqueos' : 'Parqueos'}
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(estacion.id)}>Eliminar</button>
                  </td>
                </tr>
                {expandedEstacionId === estacion.id && (
                  <tr className="expanded-row">
                    <td colSpan={4} style={{ padding: '1rem', backgroundColor: 'var(--surface-color)' }}>
                      <div className="ruta-container">
                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Parqueos en {estacion.nombre}</h4>
                        <div className="ruta-list">
                          {(!estacion.parqueos || estacion.parqueos.length === 0) ? (
                            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>No hay parqueos en esta estación.</p>
                          ) : (
                            <ul style={{ listStyle: 'none', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {estacion.parqueos.map(parqueo => (
                                <li key={parqueo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                  <span>{parqueo.nombre}</span>
                                  <button className="delete-btn" onClick={() => handleUnassignParqueo(parqueo.id)}>Desasignar</button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <form className="form-container" style={{ marginBottom: 0, padding: '1rem' }} onSubmit={(e) => handleAssignParqueo(estacion.id, e)}>
                          <select className="select-field" value={newParqueoId} onChange={e => setNewParqueoId(e.target.value)}>
                            <option value="">Selecciona un parqueo sin asignar...</option>
                            {parqueosGlobal.filter(p => !p.estacion || p.estacion.id === null).map(p => (
                              <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                          </select>
                          <button type="submit" className="btn" disabled={!newParqueoId}>Asignar Parqueo</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
