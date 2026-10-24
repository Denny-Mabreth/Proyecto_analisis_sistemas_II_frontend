import React, { useState, useEffect } from 'react';
import './Personal.css';
import { downloadExcel, getFormattedDate } from '../../utils/excelExport';

interface Piloto {
  id: number;
  nombre: string;
  historial_educativo: string;
  residencia: string;
  telefono: string;
  correo?: string;
}

interface Guardia {
  id: number;
  nombre: string;
  dpi: string;
  acceso?: { id: number; nombre: string } | null;
}

export const Personal = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pilotos' | 'guardias'>('pilotos');
  
  // PILOTOS STATE
  const [pilotos, setPilotos] = useState<Piloto[]>([]);
  const [nombrePiloto, setNombrePiloto] = useState('');
  const [historialEducativo, setHistorialEducativo] = useState('');
  const [residencia, setResidencia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [editingPilotoId, setEditingPilotoId] = useState<number | null>(null);
  const [isPilotoModalOpen, setIsPilotoModalOpen] = useState(false);

  // GUARDIAS STATE
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [nombreGuardia, setNombreGuardia] = useState('');
  const [dpiGuardia, setDpiGuardia] = useState('');
  const [isGuardiaModalOpen, setIsGuardiaModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchData = async () => {
    try {
      const [resPilotos, resGuardias] = await Promise.all([
        fetch(`${API_URL}/pilotos`),
        fetch(`${API_URL}/guardias`)
      ]);
      const dataPilotos = await resPilotos.json();
      const dataGuardias = await resGuardias.json();
      if (Array.isArray(dataPilotos)) setPilotos(dataPilotos);
      if (Array.isArray(dataGuardias)) setGuardias(dataGuardias);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- PILOTOS LOGIC ---
  const openPilotoModal = (piloto?: Piloto) => {
    if (piloto) {
      setEditingPilotoId(piloto.id);
      setNombrePiloto(piloto.nombre);
      setHistorialEducativo(piloto.historial_educativo);
      setResidencia(piloto.residencia);
      setTelefono(piloto.telefono);
      setCorreo(piloto.correo || '');
    } else {
      setEditingPilotoId(null);
      setNombrePiloto('');
      setHistorialEducativo('');
      setResidencia('');
      setTelefono('');
      setCorreo('');
    }
    setIsPilotoModalOpen(true);
  };

  const handlePilotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombrePiloto.trim() || !historialEducativo.trim() || !residencia.trim() || !telefono.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const url = editingPilotoId ? `${API_URL}/pilotos/${editingPilotoId}` : `${API_URL}/pilotos`;
      const method = editingPilotoId ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombrePiloto,
          historial_educativo: historialEducativo,
          residencia,
          telefono,
          correo: correo.trim() ? correo : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al guardar piloto');
      setIsPilotoModalOpen(false);
      fetchData();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleDeletePiloto = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este piloto?')) return;
    try {
      const response = await fetch(`${API_URL}/pilotos/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        alert(data.message || 'Error al eliminar el piloto.');
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar eliminar.');
    }
  };

  // --- GUARDIAS LOGIC ---
  const openGuardiaModal = () => {
    setNombreGuardia('');
    setDpiGuardia('');
    setIsGuardiaModalOpen(true);
  };

  const handleGuardiaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreGuardia.trim() || !dpiGuardia.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/guardias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreGuardia, dpi: dpiGuardia }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al registrar guardia');
      setIsGuardiaModalOpen(false);
      fetchData();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleDeleteGuardia = async (id: number) => {
    if (!window.confirm('¿Despedir/remover a este guardia por completo del sistema?')) return;
    try { await fetch(`${API_URL}/guardias/${id}`, { method: 'DELETE' }); fetchData(); } catch (err) { console.error(err); }
  };

  // --- EXPORTACIONES EXCEL ---
  const handleExportPilotosExcel = () => {
    const headers = ['ID', 'Nombre Completo', 'Historial Educativo', 'Residencia', 'Teléfono', 'Correo Electrónico'];
    const rows = pilotos.map(p => [
      p.id,
      p.nombre,
      p.historial_educativo || 'N/A',
      p.residencia || 'N/A',
      p.telefono || 'N/A',
      p.correo || 'N/A'
    ]);
    downloadExcel(`reporte_pilotos_${getFormattedDate()}`, 'Pilotos', headers, rows);
  };

  const handleExportGuardiasExcel = () => {
    const headers = ['ID', 'Nombre Completo', 'DPI', 'Punto de Acceso Asignado', 'Estado'];
    const rows = guardias.map(g => [
      g.id,
      g.nombre,
      g.dpi,
      g.acceso?.nombre || 'Sin asignar',
      g.acceso ? 'Asignado' : 'Disponible'
    ]);
    downloadExcel(`reporte_guardias_${getFormattedDate()}`, 'Guardias', headers, rows);
  };

  return (
    <section className="personal-section">
      <div className="section-header">
        <h2 className="section-title">Directorio de Personal</h2>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeSubTab === 'pilotos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('pilotos')}
        >Pilotos</button>
        <button 
          className={`tab-btn ${activeSubTab === 'guardias' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('guardias')}
        >Guardias de Seguridad</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* ---------------- PILOTOS TAB ---------------- */}
      {activeSubTab === 'pilotos' && (
        <>
          <div className="action-bar">
            <button
              type="button"
              className="btn btn-export"
              onClick={handleExportPilotosExcel}
              disabled={pilotos.length === 0}
            >
              Exportar Excel
            </button>
            <button className="btn" onClick={() => openPilotoModal()}>+ Nuevo Piloto</button>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Nombre</th><th>Educación</th><th>Teléfono</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pilotos.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td><td>{p.nombre}</td><td>{p.historial_educativo}</td><td>{p.telefono}</td>
                    <td className="actions-cell">
                      <button className="btn btn-small" onClick={() => openPilotoModal(p)}>Editar</button>
                      <button className="delete-btn" onClick={() => handleDeletePiloto(p.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {pilotos.length === 0 && <tr><td colSpan={5} className="empty-cell">No hay pilotos registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---------------- GUARDIAS TAB ---------------- */}
      {activeSubTab === 'guardias' && (
        <>
          <div className="action-bar">
            <button
              type="button"
              className="btn btn-export"
              onClick={handleExportGuardiasExcel}
              disabled={guardias.length === 0}
            >
              Exportar Excel
            </button>
            <button className="btn" onClick={() => openGuardiaModal()}>+ Nuevo Guardia de Seguridad</button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Nombre</th><th>DPI</th><th>Asignación Actual</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {guardias.map(g => (
                  <tr key={g.id}>
                    <td>{g.id}</td><td>{g.nombre}</td><td>{g.dpi}</td>
                    <td>{g.acceso ? <span style={{ color: 'green' }}>{g.acceso.nombre}</span> : <span style={{ color: '#d97706' }}>Sin asignar</span>}</td>
                    <td><button className="delete-btn" onClick={() => handleDeleteGuardia(g.id)}>Despedir</button></td>
                  </tr>
                ))}
                {guardias.length === 0 && <tr><td colSpan={5} className="empty-cell">No hay guardias registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ==================== MODALES ==================== */}
      {isPilotoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPilotoModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPilotoId ? 'Editar Piloto' : 'Registrar Nuevo Piloto'}</h3>
              <button className="modal-close" onClick={() => setIsPilotoModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form className="personal-form-grid" onSubmit={handlePilotoSubmit}>
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input type="text" className="input-field" value={nombrePiloto} onChange={e => setNombrePiloto(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Historial educativo *</label>
                  <input type="text" className="input-field" value={historialEducativo} onChange={e => setHistorialEducativo(e.target.value)} required />
                </div>
                <div className="form-group full-width">
                  <label>Dirección de residencia *</label>
                  <input type="text" className="input-field" value={residencia} onChange={e => setResidencia(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input type="text" className="input-field" value={telefono} onChange={e => setTelefono(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Correo electrónico</label>
                  <input type="email" className="input-field" value={correo} onChange={e => setCorreo(e.target.value)} />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn flex-1" disabled={loading}>{editingPilotoId ? 'Actualizar Piloto' : 'Registrar Piloto'}</button>
                  <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsPilotoModalOpen(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isGuardiaModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGuardiaModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Nuevo Guardia</h3>
              <button className="modal-close" onClick={() => setIsGuardiaModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form className="personal-form-grid" onSubmit={handleGuardiaSubmit}>
                <div className="form-group full-width">
                  <label>Nombre Completo *</label>
                  <input type="text" className="input-field" value={nombreGuardia} onChange={e => setNombreGuardia(e.target.value)} required />
                </div>
                <div className="form-group full-width">
                  <label>DPI *</label>
                  <input type="text" className="input-field" value={dpiGuardia} onChange={e => setDpiGuardia(e.target.value)} required />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn flex-1" disabled={loading}>Registrar Guardia</button>
                  <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsGuardiaModalOpen(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
