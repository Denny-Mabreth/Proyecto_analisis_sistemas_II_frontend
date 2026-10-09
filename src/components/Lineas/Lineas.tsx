import React, { useState, useEffect } from 'react';
import './Lineas.css';

interface Municipalidad {
  id: number;
  nombre: string;
  activo: boolean;
}

interface LineaEstacion {
  id: number;
  orden: number;
  estacion: {
    id: number;
    nombre: string;
  }
}

interface Linea {
  id: number;
  nombre: string;
  distancia_km: number;
  municipalidad?: Municipalidad;
  lineasEstaciones?: LineaEstacion[];
}

export const Lineas = () => {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [municipalidades, setMunicipalidades] = useState<Municipalidad[]>([]);
  const [estacionesGlobal, setEstacionesGlobal] = useState<any[]>([]);
  
  const [nombre, setNombre] = useState('');
  const [distancia, setDistancia] = useState('');
  const [municipalidadId, setMunicipalidadId] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado para la ruta expandida
  const [expandedLineaId, setExpandedLineaId] = useState<number | null>(null);
  const [newEstacionId, setNewEstacionId] = useState('');
  const [newOrden, setNewOrden] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchLineas = async () => {
    try {
      const response = await fetch(`${API_URL}/lineas`);
      const data = await response.json();
      setLineas(data);
    } catch (error) {
      console.error('Error fetching lineas:', error);
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

  const fetchEstacionesGlobal = async () => {
    try {
      const response = await fetch(`${API_URL}/estaciones`);
      const data = await response.json();
      setEstacionesGlobal(data);
    } catch (error) {
      console.error('Error fetching estaciones:', error);
    }
  };

  useEffect(() => {
    fetchLineas();
    fetchMunicipalidades();
    fetchEstacionesGlobal();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !municipalidadId) return;
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/lineas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          distancia_km: parseFloat(distancia) || 0,
          municipalidadId: parseInt(municipalidadId),
        }),
      });
      setNombre('');
      setDistancia('');
      setMunicipalidadId('');
      fetchLineas();
    } catch (error) {
      console.error('Error creating linea:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta línea?')) return;
    try {
      await fetch(`${API_URL}/lineas/${id}`, { method: 'DELETE' });
      fetchLineas();
    } catch (error) {
      console.error('Error deleting linea:', error);
    }
  };

  const handleAddEstacion = async (lineaId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstacionId || !newOrden) return;

    try {
      await fetch(`${API_URL}/lineas/${lineaId}/estaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estacionId: parseInt(newEstacionId),
          orden: parseInt(newOrden),
        }),
      });
      setNewEstacionId('');
      setNewOrden('');
      fetchLineas();
    } catch (error) {
      console.error('Error asignando estacion:', error);
    }
  };

  const handleRemoveEstacion = async (lineaId: number, estacionId: number) => {
    if (!window.confirm('¿Remover estación de esta ruta?')) return;
    try {
      await fetch(`${API_URL}/lineas/${lineaId}/estaciones/${estacionId}`, {
        method: 'DELETE',
      });
      fetchLineas();
    } catch (error) {
      console.error('Error quitando estacion:', error);
    }
  };

  return (
    <section className="lineas-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Líneas y Rutas</h2>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        <input type="text" className="input-field" placeholder="Nombre (ej. Línea 12)" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={loading} />
        <input type="number" step="0.1" className="input-field" placeholder="Distancia en km" value={distancia} onChange={(e) => setDistancia(e.target.value)} disabled={loading} />
        <select className="select-field" value={municipalidadId} onChange={(e) => setMunicipalidadId(e.target.value)} disabled={loading}>
          <option value="">Selecciona una Municipalidad...</option>
          {municipalidades.map(mun => (
            <option key={mun.id} value={mun.id}>{mun.nombre}</option>
          ))}
        </select>
        <button type="submit" className="btn" disabled={loading || !nombre.trim() || !municipalidadId}>
          {loading ? 'Agregando...' : 'Agregar Línea'}
        </button>
      </form>

      <div className="table-container">
        {lineas.length === 0 ? (
          <div className="empty-state">No hay líneas registradas.</div>
        ) : (
          <table className="minimal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Distancia</th>
                <th>Municipalidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <React.Fragment key={linea.id}>
                  <tr>
                    <td>#{linea.id}</td>
                    <td>{linea.nombre}</td>
                    <td>{linea.distancia_km} km</td>
                    <td>{linea.municipalidad ? linea.municipalidad.nombre : 'Sin asignar'}</td>
                    <td style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setExpandedLineaId(expandedLineaId === linea.id ? null : linea.id)}>
                        {expandedLineaId === linea.id ? 'Ocultar Ruta' : 'Ver Ruta'}
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(linea.id)}>Eliminar</button>
                    </td>
                  </tr>
                  {expandedLineaId === linea.id && (
                    <tr className="expanded-row">
                      <td colSpan={5} style={{ padding: '1rem', backgroundColor: 'var(--surface-color)' }}>
                        <div className="ruta-container">
                          <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Ruta de la {linea.nombre}</h4>
                          
                          <div className="ruta-list">
                            {(!linea.lineasEstaciones || linea.lineasEstaciones.length === 0) ? (
                              <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>No hay estaciones asignadas a esta ruta.</p>
                            ) : (
                              <ul style={{ listStyle: 'none', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {[...linea.lineasEstaciones].sort((a,b) => a.orden - b.orden).map(le => (
                                  <li key={le.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    <div>
                                      <strong style={{ marginRight: '1rem', color: 'var(--accent-color)' }}>Orden {le.orden}</strong> 
                                      {le.estacion?.nombre || 'Desconocida'}
                                    </div>
                                    <button className="delete-btn" onClick={() => handleRemoveEstacion(linea.id, le.estacion.id)}>Quitar</button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <form className="form-container" style={{ marginBottom: 0, padding: '1rem' }} onSubmit={(e) => handleAddEstacion(linea.id, e)}>
                            <select className="select-field" value={newEstacionId} onChange={e => setNewEstacionId(e.target.value)}>
                              <option value="">Seleccionar estación para agregar...</option>
                              {estacionesGlobal.map(est => (
                                <option key={est.id} value={est.id}>{est.nombre}</option>
                              ))}
                            </select>
                            <input type="number" className="input-field" placeholder="Orden (ej. 1)" style={{ maxWidth: '120px' }} value={newOrden} onChange={e => setNewOrden(e.target.value)} />
                            <button type="submit" className="btn" disabled={!newEstacionId || !newOrden}>Asignar a Ruta</button>
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
