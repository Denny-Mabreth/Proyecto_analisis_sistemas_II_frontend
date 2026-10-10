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
  buses?: { id: number; placa: string }[];
  es_circuito?: boolean;
}

export const Lineas = () => {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [municipalidades, setMunicipalidades] = useState<Municipalidad[]>([]);
  const [estacionesGlobal, setEstacionesGlobal] = useState<any[]>([]);
  const [busesGlobal, setBusesGlobal] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Modal Creador / Editor de Línea (Wizard) ---
  const [editingLineaId, setEditingLineaId] = useState<number | null>(null);

  // --- Modal Mapa Visual --- 
  const [mapaLineaId, setMapaLineaId] = useState<number | null>(null);

  // --- Modal Creador de Línea (Wizard) ---
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderNombre, setBuilderNombre] = useState('');
  const [builderDistancia, setBuilderDistancia] = useState('');
  const [builderEsCircuito, setBuilderEsCircuito] = useState(false);
  const [builderMunId, setBuilderMunId] = useState('');

  const [builderEstaciones, setBuilderEstaciones] = useState<{ estacionId: number, nombre: string, orden: number }[]>([]);
  const [builderBuses, setBuilderBuses] = useState<{ id: number, placa: string }[]>([]);

  const [builderTempEstacionId, setBuilderTempEstacionId] = useState('');
  const [builderTempBusId, setBuilderTempBusId] = useState('');

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

  const fetchBusesGlobal = async () => {
    try {
      const response = await fetch(`${API_URL}/buses`);
      const data = await response.json();
      setBusesGlobal(data);
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  useEffect(() => {
    fetchLineas();
    fetchMunicipalidades();
    fetchEstacionesGlobal();
    fetchBusesGlobal();
  }, []);

  // --- CREAR LÍNEA WIZARD LOGIC ---
  const openBuilder = (lineaId?: number) => {
    if (lineaId) {
      const linea = lineas.find(l => l.id === lineaId);
      if (linea) {
        setEditingLineaId(linea.id);
        setBuilderNombre(linea.nombre);
        setBuilderDistancia(linea.distancia_km.toString());
        setBuilderMunId(linea.municipalidad ? linea.municipalidad.id.toString() : '');
        setBuilderEsCircuito(!!linea.es_circuito);
        setBuilderEstaciones([...(linea.lineasEstaciones || [])].sort((a,b) => a.orden - b.orden).map(le => ({ estacionId: le.estacion.id, nombre: le.estacion.nombre, orden: le.orden })));
        setBuilderBuses([...(linea.buses || [])].map(b => ({ id: b.id, placa: b.placa })));
      }
    } else {
      setEditingLineaId(null);
      setBuilderNombre('');
      setBuilderDistancia('');
      setBuilderMunId('');
      setBuilderEsCircuito(false);
      setBuilderEstaciones([]);
      setBuilderBuses([]);
    }
    setBuilderTempEstacionId('');
    setBuilderTempBusId('');
    setErrorMessage(null);
    setIsBuilderOpen(true);
  };

  const closeBuilder = () => {
    setIsBuilderOpen(false);
    setErrorMessage(null);
  };

  const handleAddBuilderEstacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderTempEstacionId) return;
    const est = estacionesGlobal.find(e => e.id.toString() === builderTempEstacionId);
    if (!est) return;

    // Auto asignar el siguiente orden
    const orden = builderEstaciones.length + 1;
    setBuilderEstaciones([...builderEstaciones, { estacionId: est.id, nombre: est.nombre, orden }]);
    setBuilderTempEstacionId('');
  };

  const handleRemoveBuilderEstacion = (indexToRemove: number) => {
    const newList = builderEstaciones.filter((_, i) => i !== indexToRemove);
    // Reordenar automáticamente
    const reordered = newList.map((est, i) => ({ ...est, orden: i + 1 }));
    setBuilderEstaciones(reordered);
  };

  const handleMoveBuilderEstacion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === builderEstaciones.length - 1) return;
    
    const newList = [...builderEstaciones];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newList[index];
    newList[index] = newList[swapIndex];
    newList[swapIndex] = temp;
    
    // Recalculate order
    const reordered = newList.map((est, i) => ({ ...est, orden: i + 1 }));
    setBuilderEstaciones(reordered);
  };

  const handleAddBuilderBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderTempBusId) return;
    const bus = busesGlobal.find(b => b.id.toString() === builderTempBusId);
    if (!bus) return;
    setBuilderBuses([...builderBuses, { id: bus.id, placa: bus.placa }]);
    setBuilderTempBusId('');
  };

  const handleRemoveBuilderBus = (busId: number) => {
    setBuilderBuses(builderBuses.filter(b => b.id !== busId));
  };

  const minBusesRequired = builderEstaciones.length;
  const maxBusesAllowed = builderEstaciones.length > 0 ? builderEstaciones.length * 2 : 0;

  const isBuilderValid =
    builderNombre.trim() !== '' &&
    builderDistancia.trim() !== '' &&
    builderMunId !== '' &&
    builderEstaciones.length >= 2 &&
    builderBuses.length >= minBusesRequired &&
    builderBuses.length <= maxBusesAllowed;

  const submitFullLinea = async () => {
    if (!isBuilderValid) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      let lineaIdToUse = editingLineaId;
      if (editingLineaId) {
        // Actualizar línea existente
        const resLinea = await fetch(`${API_URL}/lineas/${editingLineaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: builderNombre,
            distancia_km: parseFloat(builderDistancia),
            municipalidadId: parseInt(builderMunId),
            es_circuito: builderEsCircuito,
          }),
        });
        if (!resLinea.ok) throw new Error('Error al actualizar línea');

        const existingLinea = lineas.find(l => l.id === editingLineaId);
        if (existingLinea?.lineasEstaciones) {
          for (const le of existingLinea.lineasEstaciones) {
            await fetch(`${API_URL}/lineas/${editingLineaId}/estaciones/${le.estacion.id}`, { method: 'DELETE' });
          }
        }
        if (existingLinea?.buses) {
          for (const bus of existingLinea.buses) {
            await fetch(`${API_URL}/buses/${bus.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lineaId: null }) });
          }
        }
      } else {
        // Crear línea nueva
        const resLinea = await fetch(`${API_URL}/lineas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: builderNombre,
            distancia_km: parseFloat(builderDistancia),
            municipalidadId: parseInt(builderMunId),
            es_circuito: builderEsCircuito,
          }),
        });
        const dataLinea = await resLinea.json();
        if (!resLinea.ok) throw new Error(dataLinea.message || 'Error al crear línea');
        lineaIdToUse = dataLinea.id;
      }

      // Asignar estaciones (nuevas o reordenadas)
      for (const est of builderEstaciones) {
        await fetch(`${API_URL}/lineas/${lineaIdToUse}/estaciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estacionId: est.estacionId, orden: est.orden }),
        });
      }

      // Asignar buses
      for (const bus of builderBuses) {
        await fetch(`${API_URL}/buses/${bus.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineaId: lineaIdToUse }),
        });
      }

      closeBuilder();
      fetchLineas();
      fetchBusesGlobal();
    } catch (error: any) {
      setErrorMessage(error.message);
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

  return (
    <section className="lineas-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Líneas y Rutas</h2>
      </div>

      <div className="action-bar">
        <button className="btn" onClick={() => openBuilder()}>+ Crear Nueva Línea</button>
      </div>

      <div className="table-container">
        {lineas.length === 0 ? (
          <div className="empty-state">No hay líneas registradas.</div>
        ) : (
          <table className="data-table">
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
                <tr key={linea.id}>
                  <td>#{linea.id}</td>
                  <td>{linea.nombre}</td>
                  <td>{linea.distancia_km} km</td>
                  <td>{linea.municipalidad ? linea.municipalidad.nombre : 'Sin asignar'}</td>
                  <td className="actions-cell">
                    <button className="btn btn-small" style={{ backgroundColor: 'var(--accent-color)', marginRight: '0.5rem' }} onClick={() => setMapaLineaId(linea.id)}>
                      Ver Mapa
                    </button>
                    <button className="btn btn-small" onClick={() => openBuilder(linea.id)}>
                      Editar Detalles
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(linea.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL CREADOR DE LÍNEA (WIZARD) ================= */}
      {isBuilderOpen && (
        <div className="modal-overlay" onClick={closeBuilder}>
          <div className="modal-container" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLineaId ? 'Edición de Línea y Ruta' : 'Configuración de Nueva Línea'}</h3>
              <button className="modal-close" onClick={closeBuilder}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {errorMessage && <div className="error-message">{errorMessage}</div>}

              {/* 1. DATOS GENERALES */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--accent-color)', display: 'inline-block' }}>1. Datos Generales</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <input type="text" className="input-field" placeholder="Nombre (ej. Línea 12)" value={builderNombre} onChange={(e) => setBuilderNombre(e.target.value)} disabled={loading} required />
                  <input type="number" step="0.1" className="input-field" placeholder="Distancia en km" value={builderDistancia} onChange={(e) => setBuilderDistancia(e.target.value)} disabled={loading} required />
                  <select className="select-field" value={builderMunId} onChange={(e) => setBuilderMunId(e.target.value)} disabled={loading} required>
                    <option value="">Municipalidad...</option>
                    {municipalidades.map(mun => <option key={mun.id} value={mun.id}>{mun.nombre}</option>)}
                  </select>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={builderEsCircuito} onChange={e => setBuilderEsCircuito(e.target.checked)} disabled={loading} style={{ width: '1.2rem', height: '1.2rem' }} />
                    Es un Circuito (Regresa a la estación origen al terminar)
                  </label>
                </div>
              </div>

              <div className="linea-detalles-grid">
                {/* 2. ESTACIONES */}
                <div className="linea-detalles-section">
                  <h4>2. Agregar Estaciones</h4>
                  <div className="linea-list" style={{ minHeight: '150px' }}>
                    {builderEstaciones.length < 2 && (
                      <div className="empty-text" style={{ color: '#856404', fontSize: '0.9rem' }}>⚠️ Agrega al menos <strong>2 estaciones</strong> para conformar una ruta válida.</div>
                    )}
                    {builderEstaciones.map((est, i) => (
                      <li key={i} className="linea-list-item">
                        <div>
                          <strong style={{ color: 'var(--accent-color)', marginRight: '0.5rem' }}>{est.orden}.</strong>
                          {est.nombre}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" className="btn btn-small" style={{ padding: '0.2rem 0.5rem' }} disabled={i === 0} onClick={() => handleMoveBuilderEstacion(i, 'up')}>↑</button>
                          <button type="button" className="btn btn-small" style={{ padding: '0.2rem 0.5rem' }} disabled={i === builderEstaciones.length - 1} onClick={() => handleMoveBuilderEstacion(i, 'down')}>↓</button>
                          <button type="button" className="delete-btn" onClick={() => handleRemoveBuilderEstacion(i)}>Quitar</button>
                        </div>
                      </li>
                    ))}
                  </div>
                  <form className="form-container" style={{ margin: 0 }} onSubmit={handleAddBuilderEstacion}>
                    <select className="select-field flex-1" value={builderTempEstacionId} onChange={e => setBuilderTempEstacionId(e.target.value)}>
                      <option value="">Seleccionar estación...</option>
                      {estacionesGlobal.filter(est => !builderEstaciones.find(be => be.estacionId === est.id)).map(est => (
                        <option key={est.id} value={est.id}>{est.nombre}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn" disabled={!builderTempEstacionId}>+</button>
                  </form>
                </div>

                {/* 3. BUSES */}
                <div className="linea-detalles-section">
                  <h4>3. Asignar Buses</h4>

                  {/* Feedback de validación en vivo */}
                  <div style={{ padding: '0.75rem', background: isBuilderValid ? '#d4edda' : '#fff3cd', color: isBuilderValid ? '#155724' : '#856404', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {builderEstaciones.length < 2 ? (
                      <strong>Esperando mínimo 2 estaciones para calcular límites...</strong>
                    ) : (
                      <>
                        <strong>Condiciones de la Línea:</strong><br />
                        - Mínimo requerido: {minBusesRequired} buses.<br />
                        - Máximo permitido: {maxBusesAllowed} buses.<br />
                        <strong>Buses actuales: {builderBuses.length}</strong>
                      </>
                    )}
                  </div>

                  <div className="linea-list" style={{ minHeight: '80px' }}>
                    {builderBuses.length === 0 ? (
                      <p className="empty-text">No has asignado buses todavía.</p>
                    ) : (
                      builderBuses.map(bus => (
                        <li key={bus.id} className="linea-list-item">
                          <div><strong style={{ color: 'var(--accent-color)' }}>Placa {bus.placa}</strong></div>
                          <button className="delete-btn" onClick={() => handleRemoveBuilderBus(bus.id)}>Quitar</button>
                        </li>
                      ))
                    )}
                  </div>
                  <form className="form-container" style={{ margin: 0 }} onSubmit={handleAddBuilderBus}>
                    <select className="select-field flex-1" value={builderTempBusId} onChange={e => setBuilderTempBusId(e.target.value)}>
                      <option value="">Seleccionar bus disponible...</option>
                      {busesGlobal.filter(b => !b.linea && !builderBuses.find(x => x.id === b.id)).map(b => (
                        <option key={b.id} value={b.id}>{b.placa}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn" disabled={!builderTempBusId || builderBuses.length >= maxBusesAllowed}>+</button>
                  </form>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn flex-1" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={submitFullLinea} disabled={!isBuilderValid || loading}>
                  {loading ? 'Procesando...' : (editingLineaId ? 'Guardar Cambios' : 'Confirmar y Crear Línea Completa')}
                </button>
                <button className="btn btn-secondary" onClick={closeBuilder}>Cancelar</button>
              </div>

            </div>
          </div>
        </div>
      )}




      {/* ================= MODAL MAPA VISUAL ================= */}
      {mapaLineaId !== null && (() => {
        const mapaLinea = lineas.find(l => l.id === mapaLineaId);
        if (!mapaLinea) return null;
        const estacionesOrdenadas = [...(mapaLinea.lineasEstaciones || [])].sort((a,b) => a.orden - b.orden);
        return (
          <div className="modal-overlay" onClick={() => setMapaLineaId(null)}>
            <div className="modal-container" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Mapa de la Ruta: {mapaLinea.nombre}</h3>
                <button className="modal-close" onClick={() => setMapaLineaId(null)}>&times;</button>
              </div>
              <div className="modal-body">
                {estacionesOrdenadas.length === 0 ? (
                  <div className="empty-state">Esta línea no tiene estaciones asignadas todavía.</div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    overflowX: 'auto', 
                    padding: '3rem 1rem', 
                    background: '#f9fafb', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {estacionesOrdenadas.map((le, idx, arr) => (
                      <React.Fragment key={le.id}>
                        {/* NODO ESTACION */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                          <div style={{ 
                            width: '45px', 
                            height: '45px', 
                            borderRadius: '50%', 
                            background: 'var(--accent-color)', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: '3px solid white'
                          }}>
                            {le.orden}
                          </div>
                          <span style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-color)' }}>{le.estacion.nombre}</span>
                        </div>

                        {/* CONECTOR FLECHA */}
                        {idx < arr.length - 1 && (
                          <div style={{ flex: 1, minWidth: '50px', height: '4px', background: 'var(--accent-color)', position: 'relative' }}>
                            <div style={{ 
                              position: 'absolute', 
                              right: '-2px', 
                              top: '-6px', 
                              width: '0', 
                              height: '0', 
                              borderTop: '8px solid transparent', 
                              borderBottom: '8px solid transparent', 
                              borderLeft: '12px solid var(--accent-color)' 
                            }}></div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}

                    {/* NODO DE RETORNO AL CIRCUITO */}
                    {mapaLinea.es_circuito && estacionesOrdenadas.length > 0 && (
                      <React.Fragment>
                        <div style={{ flex: 1, minWidth: '50px', height: '4px', background: 'var(--accent-color)', position: 'relative', opacity: 0.6 }}>
                          <div style={{ position: 'absolute', right: '-2px', top: '-6px', width: '0', height: '0', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '12px solid var(--accent-color)' }}></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px', opacity: 0.6 }}>
                          <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--text-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '3px solid white', borderStyle: 'dashed' }}>
                            {estacionesOrdenadas[0].orden}
                          </div>
                          <span style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{estacionesOrdenadas[0].estacion.nombre} (Retorno)</span>
                        </div>
                      </React.Fragment>
                    )}
                  </div>
                )}
                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                  <button className="btn" onClick={() => setMapaLineaId(null)}>Cerrar Mapa</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
