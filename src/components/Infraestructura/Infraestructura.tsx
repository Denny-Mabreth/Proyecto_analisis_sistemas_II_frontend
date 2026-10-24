import React, { useState, useEffect } from 'react';
import './Infraestructura.css';
import { downloadExcel, getFormattedDate } from '../../utils/excelExport';

interface Municipalidad {
  id: number;
  nombre: string;
}

interface Guardia {
  id: number;
  nombre: string;
  dpi: string;
  acceso?: { id: number; nombre: string } | null;
}

interface Acceso {
  id: number;
  nombre: string;
  guardias?: Guardia[];
  estacion?: { id: number; nombre: string };
}

interface Parqueo {
  id: number;
  nombre: string;
  estacion?: { id: number, nombre: string };
}

interface Estacion {
  id: number;
  nombre: string;
  municipalidad?: Municipalidad;
  parqueos?: Parqueo[];
  accesos?: Acceso[];
}

export const Infraestructura = () => {
  const [activeSubTab, setActiveSubTab] = useState<'estaciones' | 'parqueos' | 'accesos'>('estaciones');

  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [municipalidades, setMunicipalidades] = useState<Municipalidad[]>([]);
  const [parqueos, setParqueos] = useState<Parqueo[]>([]);
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [guardias, setGuardias] = useState<Guardia[]>([]);

  // Modals
  const [isParqueoModalOpen, setIsParqueoModalOpen] = useState(false);
  const [isAccesoModalOpen, setIsAccesoModalOpen] = useState(false);

  // Builder Estacion (Wizard)
  const [isBuilderEstacionOpen, setIsBuilderEstacionOpen] = useState(false);
  const [builderEstacionNombre, setBuilderEstacionNombre] = useState('');
  const [builderEstacionMunId, setBuilderEstacionMunId] = useState('');
  const [builderEstacionParqueos, setBuilderEstacionParqueos] = useState<{ id: number, nombre: string }[]>([]);
  const [builderTempParqueoId, setBuilderTempParqueoId] = useState('');

  // Modal Detalles Estacion
  const [selectedEstacionId, setSelectedEstacionId] = useState<number | null>(null);
  const [editEstacionNombre, setEditEstacionNombre] = useState('');

  // Parqueo Form
  const [nombreParqueo, setNombreParqueo] = useState('');

  // Builder Acceso (Wizard)
  const [isBuilderAccesoOpen, setIsBuilderAccesoOpen] = useState(false);
  const [builderAccesoNombre, setBuilderAccesoNombre] = useState('');
  const [builderAccesoEstacionId, setBuilderAccesoEstacionId] = useState('');
  const [builderAccesoGuardias, setBuilderAccesoGuardias] = useState<{ id: number, nombre: string, dpi: string }[]>([]);
  const [builderTempGuardiaId, setBuilderTempGuardiaId] = useState('');

  // Modal Detalles Acceso
  const [selectedAccesoId, setSelectedAccesoId] = useState<number | null>(null);

  // Assignments (in line)
  const [newParqueoIdForEstacion, setNewParqueoIdForEstacion] = useState('');
  const [newGuardiaIdForAcceso, setNewGuardiaIdForAcceso] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchData = async () => {
    try {
      const [resEst, resMun, resParq, resAcc, resGuard] = await Promise.all([
        fetch(`${API_URL}/estaciones`),
        fetch(`${API_URL}/municipalidades`),
        fetch(`${API_URL}/parqueos`),
        fetch(`${API_URL}/accesos`),
        fetch(`${API_URL}/guardias`)
      ]);

      const dataEst = await resEst.json();
      const dataMun = await resMun.json();
      const dataParq = await resParq.json();
      const dataAcc = await resAcc.json();
      const dataGuard = await resGuard.json();

      if (Array.isArray(dataMun)) setMunicipalidades(dataMun);
      if (Array.isArray(dataParq)) setParqueos(dataParq);
      if (Array.isArray(dataGuard)) setGuardias(dataGuard);
      if (Array.isArray(dataAcc)) setAccesos(dataAcc);

      if (Array.isArray(dataEst)) {
        const mappedEst = dataEst.map(est => ({
          ...est,
          parqueos: Array.isArray(dataParq) ? dataParq.filter(p => p.estacion?.id === est.id) : [],
          accesos: Array.isArray(dataAcc) ? dataAcc.filter(a => a.estacion?.id === est.id) : [],
        }));
        setEstaciones(mappedEst);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ESTACIONES LOGIC ---
  const openBuilderEstacion = () => {
    setBuilderEstacionNombre('');
    setBuilderEstacionMunId('');
    setBuilderEstacionParqueos([]);
    setBuilderTempParqueoId('');
    setIsBuilderEstacionOpen(true);
  };

  const handleAddBuilderParqueo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderTempParqueoId) return;
    const parq = parqueos.find(p => p.id.toString() === builderTempParqueoId);
    if (!parq) return;
    setBuilderEstacionParqueos([...builderEstacionParqueos, { id: parq.id, nombre: parq.nombre }]);
    setBuilderTempParqueoId('');
  };

  const handleRemoveBuilderParqueo = (parqueoId: number) => {
    setBuilderEstacionParqueos(builderEstacionParqueos.filter(p => p.id !== parqueoId));
  };

  const submitFullEstacion = async () => {
    if (!builderEstacionNombre.trim() || !builderEstacionMunId) return;
    setLoading(true); setError(null);
    try {
      const resEst = await fetch(`${API_URL}/estaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: builderEstacionNombre, municipalidadId: parseInt(builderEstacionMunId) }),
      });
      const dataEst = await resEst.json();
      if (!resEst.ok) throw new Error(dataEst.message || 'Error al crear estación');

      const nuevaEstacionId = dataEst.id;

      for (const parq of builderEstacionParqueos) {
        await fetch(`${API_URL}/parqueos/${parq.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estacionId: nuevaEstacionId }),
        });
      }

      setIsBuilderEstacionOpen(false);
      fetchData();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const openDetallesEstacion = (est: Estacion) => {
    setSelectedEstacionId(est.id);
    setEditEstacionNombre(est.nombre);
    setNewParqueoIdForEstacion('');
  };

  const handleUpdateEstacionName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstacionId || !editEstacionNombre.trim()) return;
    try {
      await fetch(`${API_URL}/estaciones/${selectedEstacionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editEstacionNombre }),
      });
      fetchData();
      alert('Nombre actualizado correctamente');
    } catch (err) { console.error(err); }
  };

  const handleDeleteEstacion = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta estación?')) return;
    try {
      const response = await fetch(`${API_URL}/estaciones/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Error al eliminar la estación.');
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar eliminar la estación.');
    }
  };

  const handleAssignParqueoToEstacion = async (estacionId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!newParqueoIdForEstacion) return;
    try {
      await fetch(`${API_URL}/parqueos/${newParqueoIdForEstacion}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estacionId }),
      });
      setNewParqueoIdForEstacion('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleUnassignParqueo = async (parqueoId: number) => {
    if (!window.confirm('¿Desasignar este parqueo de la estación?')) return;
    try { await fetch(`${API_URL}/parqueos/${parqueoId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estacionId: null }) }); fetchData(); } catch (err) { console.error(err); }
  };

  // --- PARQUEOS LOGIC ---
  const handleParqueoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreParqueo.trim()) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${API_URL}/parqueos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreParqueo }),
      });
      if (!response.ok) throw new Error('Error al crear parqueo');
      setNombreParqueo(''); setIsParqueoModalOpen(false);
      fetchData();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleDeleteParqueo = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este parqueo?')) return;
    try {
      const response = await fetch(`${API_URL}/parqueos/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Error al eliminar el parqueo.');
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar eliminar el parqueo.');
    }
  };

  // --- ACCESOS LOGIC ---
  // --- BUILDER ACCESO LOGIC ---
  const openBuilderAcceso = () => {
    setBuilderAccesoNombre('');
    setBuilderAccesoEstacionId('');
    setBuilderAccesoGuardias([]);
    setBuilderTempGuardiaId('');
    setIsBuilderAccesoOpen(true);
  };

  const handleAddBuilderGuardia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderTempGuardiaId) return;
    const guardia = guardias.find(g => g.id.toString() === builderTempGuardiaId);
    if (!guardia) return;
    setBuilderAccesoGuardias([...builderAccesoGuardias, { id: guardia.id, nombre: guardia.nombre, dpi: guardia.dpi }]);
    setBuilderTempGuardiaId('');
  };

  const handleRemoveBuilderGuardia = (guardiaId: number) => {
    setBuilderAccesoGuardias(builderAccesoGuardias.filter(g => g.id !== guardiaId));
  };

  const isBuilderAccesoValid =
    builderAccesoNombre.trim() !== '' &&
    builderAccesoEstacionId !== '' &&
    builderAccesoGuardias.length >= 1;

  const submitFullAcceso = async () => {
    if (!isBuilderAccesoValid) return;
    setLoading(true); setError(null);
    try {
      const resAcceso = await fetch(`${API_URL}/accesos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: builderAccesoNombre, estacionId: parseInt(builderAccesoEstacionId) }),
      });
      const dataAcceso = await resAcceso.json();
      if (!resAcceso.ok) throw new Error(dataAcceso.message || 'Error al crear acceso');

      const nuevoAccesoId = dataAcceso.id;

      for (const guardia of builderAccesoGuardias) {
        await fetch(`${API_URL}/guardias/${guardia.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accesoId: nuevoAccesoId }),
        });
      }

      setIsBuilderAccesoOpen(false);
      fetchData();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleDeleteAcceso = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este acceso?')) return;
    try {
      const response = await fetch(`${API_URL}/accesos/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Error al eliminar el acceso.');
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar eliminar el acceso.');
    }
  };

  const handleAssignGuardiaToAcceso = async (accesoId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardiaIdForAcceso) return;
    try {
      await fetch(`${API_URL}/guardias/${newGuardiaIdForAcceso}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accesoId }),
      });
      setNewGuardiaIdForAcceso('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleUnassignGuardia = async (guardiaId: number) => {
    if (!window.confirm('¿Remover a este guardia del acceso?')) return;
    try { await fetch(`${API_URL}/guardias/${guardiaId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accesoId: null }) }); fetchData(); } catch (err) { console.error(err); }
  };

  // --- EXPORTACIONES EXCEL ---
  const handleExportEstacionesExcel = () => {
    const headers = [
      'ID',
      'Nombre de Estación',
      'Municipalidad',
      'Parqueos Vinculados',
      'Total Parqueos',
      'Puntos de Acceso'
    ];
    const rows = estaciones.map(est => {
      const parqueosTexto = (est.parqueos && est.parqueos.length > 0)
        ? est.parqueos.map(p => p.nombre).join('; ')
        : 'Sin parqueos';
      const cantidadParqueos = est.parqueos ? est.parqueos.length : 0;
      const accesosTexto = (est.accesos && est.accesos.length > 0)
        ? est.accesos.map(a => a.nombre).join('; ')
        : 'Sin accesos';

      return [
        est.id,
        est.nombre,
        est.municipalidad?.nombre || 'Sin asignar',
        parqueosTexto,
        cantidadParqueos,
        accesosTexto
      ];
    });

    downloadExcel(`reporte_estaciones_${getFormattedDate()}`, 'Estaciones', headers, rows);
  };

  const handleExportParqueosExcel = () => {
    const headers = ['ID', 'Nombre del Parqueo', 'Estación Asignada'];
    const rows = parqueos.map(p => [
      p.id,
      p.nombre,
      p.estacion?.nombre || 'Sin asignar'
    ]);
    downloadExcel(`reporte_parqueos_${getFormattedDate()}`, 'Parqueos', headers, rows);
  };

  const handleExportAccesosExcel = () => {
    const headers = [
      'ID',
      'Nombre de Acceso',
      'Estación',
      'Total Guardias',
      'Guardias Asignados'
    ];
    const rows = accesos.map(acc => {
      const guardiasTexto = (acc.guardias && acc.guardias.length > 0)
        ? acc.guardias.map(g => `${g.nombre} (DPI: ${g.dpi})`).join('; ')
        : 'Sin guardias';
      return [
        acc.id,
        acc.nombre,
        acc.estacion?.nombre || 'Sin asignar',
        acc.guardias?.length || 0,
        guardiasTexto
      ];
    });
    downloadExcel(`reporte_accesos_${getFormattedDate()}`, 'Accesos', headers, rows);
  };

  return (
    <section className="infraestructura-section">
      <div className="section-header">
        <h2 className="section-title">Infraestructura Fija</h2>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeSubTab === 'estaciones' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('estaciones')}
        >Estaciones</button>
        <button
          className={`tab-btn ${activeSubTab === 'parqueos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('parqueos')}
        >Parqueos</button>
        <button
          className={`tab-btn ${activeSubTab === 'accesos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('accesos')}
        >Puntos de Acceso</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* ---------------- ESTACIONES TAB ---------------- */}
      {activeSubTab === 'estaciones' && (
        <>
          <div className="action-bar">
            <button
              type="button"
              className="btn btn-export"
              onClick={handleExportEstacionesExcel}
              disabled={estaciones.length === 0}
            >
              Exportar Excel
            </button>
            <button className="btn" onClick={openBuilderEstacion}>+ Nueva Estación</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Nombre</th><th>Municipalidad</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estaciones.map(est => (
                  <React.Fragment key={est.id}>
                    <tr>
                      <td>#{est.id}</td>
                      <td>{est.nombre}</td>
                      <td>{est.municipalidad?.nombre || 'Sin asignar'}</td>
                      <td className="actions-cell">
                        <button className="btn btn-small" onClick={() => openDetallesEstacion(est)}>
                          Editar Detalles
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteEstacion(est.id)}>Eliminar</button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {estaciones.length === 0 && <tr><td colSpan={4} className="empty-cell">No hay estaciones registradas.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---------------- PARQUEOS TAB ---------------- */}
      {activeSubTab === 'parqueos' && (
        <>
          <div className="action-bar">
            <button
              type="button"
              className="btn btn-export"
              onClick={handleExportParqueosExcel}
              disabled={parqueos.length === 0}
            >
              Exportar Excel
            </button>
            <button className="btn" onClick={() => { setNombreParqueo(''); setIsParqueoModalOpen(true); }}>+ Nuevo Parqueo</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Nombre</th><th>Asignado a Estación</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {parqueos.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td><td>{p.nombre}</td>
                    <td>{p.estacion?.nombre || <span className="empty-text">Sin asignar</span>}</td>
                    <td><button className="delete-btn" onClick={() => handleDeleteParqueo(p.id)}>Eliminar</button></td>
                  </tr>
                ))}
                {parqueos.length === 0 && <tr><td colSpan={4} className="empty-cell">No hay parqueos registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---------------- ACCESOS TAB ---------------- */}
      {activeSubTab === 'accesos' && (
        <>
          <div className="action-bar">
            <button
              type="button"
              className="btn btn-export"
              onClick={handleExportAccesosExcel}
              disabled={accesos.length === 0}
            >
              Exportar Excel
            </button>
            <button className="btn" onClick={openBuilderAcceso}>+ Nuevo Acceso</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Nombre de Acceso</th><th>Estación</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accesos.map(acc => (
                  <React.Fragment key={acc.id}>
                    <tr>
                      <td>#{acc.id}</td><td>{acc.nombre}</td><td>{acc.estacion?.nombre || 'Desconocida'}</td>
                      <td className="actions-cell">
                        <button className="btn btn-small" onClick={() => setSelectedAccesoId(acc.id)}>
                          Editar Detalles
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteAcceso(acc.id)}>Eliminar</button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {accesos.length === 0 && <tr><td colSpan={4} className="empty-cell">No hay accesos registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ==================== MODALES ==================== */}
      {/* ================= MODAL CREADOR DE ESTACIONES (WIZARD) ================= */}
      {isBuilderEstacionOpen && (
        <div className="modal-overlay" onClick={() => setIsBuilderEstacionOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configuración de Nueva Estación</h3>
              <button className="modal-close" onClick={() => setIsBuilderEstacionOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* IZQUIERDA: DATOS GENERALES */}
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>1. Información General</h4>
                  <div className="form-group">
                    <label>Nombre de la Estación *</label>
                    <input type="text" className="input-field" placeholder="Ej. Estación Central" value={builderEstacionNombre} onChange={e => setBuilderEstacionNombre(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Municipalidad *</label>
                    <select className="select-field" value={builderEstacionMunId} onChange={e => setBuilderEstacionMunId(e.target.value)} disabled={loading} required>
                      <option value="">Seleccione municipalidad...</option>
                      {municipalidades.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DERECHA: PARQUEOS OPCIONALES */}
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>2. Parqueos (Opcional)</h4>

                  <ul style={{ listStyle: 'none', marginBottom: '1rem', padding: 0, minHeight: '80px' }}>
                    {builderEstacionParqueos.length === 0 ? (
                      <p className="empty-text" style={{ fontSize: '0.9rem' }}>No has asignado parqueos.</p>
                    ) : (
                      builderEstacionParqueos.map(p => (
                        <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <span><strong>{p.nombre}</strong></span>
                          <button type="button" className="delete-btn" onClick={() => handleRemoveBuilderParqueo(p.id)}>Quitar</button>
                        </li>
                      ))
                    )}
                  </ul>
                  <form className="form-container" style={{ margin: 0 }} onSubmit={handleAddBuilderParqueo}>
                    <select className="select-field flex-1" value={builderTempParqueoId} onChange={e => setBuilderTempParqueoId(e.target.value)}>
                      <option value="">Seleccionar parqueo...</option>
                      {parqueos.filter(p => !p.estacion && !builderEstacionParqueos.find(bp => bp.id === p.id)).map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn" disabled={!builderTempParqueoId}>+</button>
                  </form>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn flex-1" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={submitFullEstacion} disabled={!builderEstacionNombre.trim() || !builderEstacionMunId || loading}>
                  {loading ? 'Procesando...' : 'Confirmar y Crear Estación'}
                </button>
                <button className="btn btn-secondary" onClick={() => setIsBuilderEstacionOpen(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETALLES ESTACIÓN (EDICIÓN) ================= */}
      {(() => {
        const selectedEstacion = estaciones.find(e => e.id === selectedEstacionId);
        if (!selectedEstacion) return null;
        return (
          <div className="modal-overlay" onClick={() => setSelectedEstacionId(null)}>
            <div className="modal-container" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edición de Estación: {selectedEstacion.nombre}</h3>
                <button className="modal-close" onClick={() => setSelectedEstacionId(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Columna Izquierda: Editar Datos Base */}
                  <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Información General</h4>
                    <form onSubmit={handleUpdateEstacionName}>
                      <div className="form-group">
                        <label>Nombre de la Estación</label>
                        <input type="text" className="input-field" value={editEstacionNombre} onChange={e => setEditEstacionNombre(e.target.value)} required />
                      </div>
                      <button type="submit" className="btn btn-small" style={{ marginTop: '0.5rem', width: '100%' }}>Actualizar Nombre</button>
                    </form>
                  </div>

                  {/* Columna Derecha: Parqueos */}
                  <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Parqueos Vinculados</h4>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                      {(!selectedEstacion.parqueos || selectedEstacion.parqueos.length === 0) ? (
                        <p className="empty-text">No hay parqueos vinculados a esta estación.</p>
                      ) : (
                        selectedEstacion.parqueos.map(p => (
                          <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}>
                            <span><strong>{p.nombre}</strong></span>
                            <button type="button" className="delete-btn" onClick={() => handleUnassignParqueo(p.id)}>Remover</button>
                          </li>
                        ))
                      )}
                    </ul>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Vincular Nuevo Parqueo</h4>
                    <form className="form-container" style={{ margin: 0 }} onSubmit={(e) => handleAssignParqueoToEstacion(selectedEstacion.id, e)}>
                      <select className="select-field flex-1" value={newParqueoIdForEstacion} onChange={e => setNewParqueoIdForEstacion(e.target.value)}>
                        <option value="">Seleccionar parqueo disponible...</option>
                        {parqueos.filter(p => !p.estacion).map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                      <button type="submit" className="btn" disabled={!newParqueoIdForEstacion}>Vincular</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {isParqueoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsParqueoModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Nuevo Parqueo</h3>
              <button className="modal-close" onClick={() => setIsParqueoModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleParqueoSubmit}>
                <div className="form-group form-group-spaced">
                  <label>Nombre del Parqueo *</label>
                  <input type="text" className="input-field" placeholder="Ej. Parqueo Sur" value={nombreParqueo} onChange={e => setNombreParqueo(e.target.value)} required />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn flex-1" disabled={loading}>Crear Parqueo</button>
                  <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsParqueoModalOpen(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CREADOR DE ACCESOS (WIZARD) ================= */}
      {isBuilderAccesoOpen && (
        <div className="modal-overlay" onClick={() => setIsBuilderAccesoOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configuración de Nuevo Acceso</h3>
              <button className="modal-close" onClick={() => setIsBuilderAccesoOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* IZQUIERDA: DATOS GENERALES */}
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>1. Información General</h4>
                  <div className="form-group">
                    <label>Nombre / Ubicación del Acceso *</label>
                    <input type="text" className="input-field" placeholder="Ej. Entrada Norte" value={builderAccesoNombre} onChange={e => setBuilderAccesoNombre(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Pertenece a la Estación *</label>
                    <select className="select-field" value={builderAccesoEstacionId} onChange={e => setBuilderAccesoEstacionId(e.target.value)} disabled={loading} required>
                      <option value="">Seleccione estación...</option>
                      {estaciones.map(est => (
                        <option key={est.id} value={est.id}>{est.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DERECHA: GUARDIAS */}
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>2. Asignar Guardias</h4>

                  <div style={{ padding: '0.75rem', background: builderAccesoGuardias.length > 0 ? '#d4edda' : '#fff3cd', color: builderAccesoGuardias.length > 0 ? '#155724' : '#856404', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <strong>Mínimo requerido: 1 Guardia por Acceso.</strong><br />
                    Guardias asignados: {builderAccesoGuardias.length}
                  </div>

                  <ul style={{ listStyle: 'none', marginBottom: '1rem', padding: 0, minHeight: '80px' }}>
                    {builderAccesoGuardias.length === 0 ? (
                      <p className="empty-text" style={{ fontSize: '0.9rem' }}>Agrega al menos un guardia.</p>
                    ) : (
                      builderAccesoGuardias.map(g => (
                        <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <span><strong>{g.nombre}</strong></span>
                          <button type="button" className="delete-btn" onClick={() => handleRemoveBuilderGuardia(g.id)}>Quitar</button>
                        </li>
                      ))
                    )}
                  </ul>
                  <form className="form-container" style={{ margin: 0 }} onSubmit={handleAddBuilderGuardia}>
                    <select className="select-field flex-1" value={builderTempGuardiaId} onChange={e => setBuilderTempGuardiaId(e.target.value)}>
                      <option value="">Seleccionar guardia...</option>
                      {guardias.filter(g => !g.acceso && !builderAccesoGuardias.find(bg => bg.id === g.id)).map(g => (
                        <option key={g.id} value={g.id}>{g.nombre}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn" disabled={!builderTempGuardiaId}>+</button>
                  </form>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn flex-1" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={submitFullAcceso} disabled={!isBuilderAccesoValid || loading}>
                  {loading ? 'Procesando...' : 'Confirmar y Crear Acceso'}
                </button>
                <button className="btn btn-secondary" onClick={() => setIsBuilderAccesoOpen(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETALLES ACCESO (EDICIÓN) ================= */}
      {(() => {
        const selectedAcceso = accesos.find(a => a.id === selectedAccesoId);
        if (!selectedAcceso) return null;
        return (
          <div className="modal-overlay" onClick={() => setSelectedAccesoId(null)}>
            <div className="modal-container" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edición de Guardias en: {selectedAcceso.nombre}</h3>
                <button className="modal-close" onClick={() => setSelectedAccesoId(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Guardias Asignados</h4>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                    {(!selectedAcceso.guardias || selectedAcceso.guardias.length === 0) ? (
                      <div style={{ color: '#856404', background: '#fff3cd', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                        ⚠️ <strong>Alerta:</strong> Este acceso no tiene guardias. Las estaciones deben contar con por lo menos 1 guardia por acceso.
                      </div>
                    ) : (
                      selectedAcceso.guardias.map(g => (
                        <li key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <span><strong>{g.nombre}</strong> (DPI: {g.dpi})</span>
                          <button type="button" className="delete-btn" onClick={() => handleUnassignGuardia(g.id)}>Remover</button>
                        </li>
                      ))
                    )}
                  </ul>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Agregar Nuevo Guardia</h4>
                  <form className="form-container" style={{ margin: 0 }} onSubmit={(e) => handleAssignGuardiaToAcceso(selectedAcceso.id, e)}>
                    <select className="select-field flex-1" value={newGuardiaIdForAcceso} onChange={e => setNewGuardiaIdForAcceso(e.target.value)}>
                      <option value="">Seleccionar guardia disponible...</option>
                      {guardias.filter(g => !g.acceso).map(g => (
                        <option key={g.id} value={g.id}>{g.nombre} (DPI: {g.dpi})</option>
                      ))}
                    </select>
                    <button type="submit" className="btn" disabled={!newGuardiaIdForAcceso}>Asignar Guardia</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </section>
  );
};
