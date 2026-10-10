import React, { useState, useEffect } from 'react';
import './Buses.css';

interface Parqueo { id: number; nombre: string; }
interface Linea { id: number; nombre: string; }
interface Piloto { id: number; nombre: string; }
interface Bus {
  id: number;
  placa: string;
  capacidad_maxima: number;
  parqueo?: Parqueo;
  linea?: Linea;
  piloto?: Piloto;
}

export const Buses = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [parqueos, setParqueos] = useState<Parqueo[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [pilotos, setPilotos] = useState<Piloto[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [placa, setPlaca] = useState('');
  const [capacidadMaxima, setCapacidadMaxima] = useState('');
  const [parqueoId, setParqueoId] = useState('');
  const [lineaId, setLineaId] = useState('');
  const [pilotoId, setPilotoId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchBuses = async () => {
    try {
      const res = await fetch(`${API_URL}/buses`);
      const data = await res.json();
      if (Array.isArray(data)) setBuses(data);
    } catch (e) { console.error(e); }
  };

  const fetchDependencies = async () => {
    try {
      const [resP, resL, resPi] = await Promise.all([
        fetch(`${API_URL}/parqueos`),
        fetch(`${API_URL}/lineas`),
        fetch(`${API_URL}/pilotos`).catch(() => ({ json: () => [] }))
      ]);
      const dataP = await resP.json();
      const dataL = await resL.json();
      const dataPi = await resPi.json();
      if (Array.isArray(dataP)) setParqueos(dataP);
      if (Array.isArray(dataL)) setLineas(dataL);
      if (Array.isArray(dataPi)) setPilotos(dataPi);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchBuses();
    fetchDependencies();
  }, []);

  const openModal = (bus?: Bus) => {
    if (bus) {
      setEditingId(bus.id);
      setPlaca(bus.placa);
      setCapacidadMaxima(bus.capacidad_maxima.toString());
      setParqueoId(bus.parqueo ? bus.parqueo.id.toString() : '');
      setLineaId(bus.linea ? bus.linea.id.toString() : '');
      setPilotoId(bus.piloto ? bus.piloto.id.toString() : '');
    } else {
      setEditingId(null);
      setPlaca('');
      setCapacidadMaxima('');
      setParqueoId('');
      setLineaId('');
      setPilotoId('');
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim() || !capacidadMaxima || !parqueoId) return;
    setError(null);
    setLoading(true);
    try {
      const url = editingId ? `${API_URL}/buses/${editingId}` : `${API_URL}/buses`;
      const method = editingId ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placa,
          capacidad_maxima: parseInt(capacidadMaxima),
          parqueoId: parseInt(parqueoId),
          lineaId: lineaId ? parseInt(lineaId) : null,
          pilotoId: pilotoId ? parseInt(pilotoId) : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || (editingId ? 'Error al actualizar bus' : 'Error al crear bus'));
      }
      handleCloseModal();
      fetchBuses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este bus?')) return;
    try {
      await fetch(`${API_URL}/buses/${id}`, { method: 'DELETE' });
      fetchBuses();
    } catch (err) { console.error(err); }
  };

  return (
    <section className="buses-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Buses</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="action-bar">
        <button className="btn" onClick={() => openModal()}>+ Nuevo Bus</button>
      </div>

      <div className="table-container">
        {buses.length === 0 ? (
          <div className="empty-state">No hay buses registrados.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Capacidad</th>
                <th>Parqueo</th>
                <th>Línea</th>
                <th>Piloto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {buses.map(bus => (
                <tr key={bus.id}>
                  <td>{bus.placa}</td>
                  <td>{bus.capacidad_maxima} pas.</td>
                  <td>{bus.parqueo ? bus.parqueo.nombre : 'Error: Sin parqueo'}</td>
                  <td>{bus.linea ? bus.linea.nombre : 'No asignada'}</td>
                  <td>{bus.piloto ? bus.piloto.nombre : 'Sin piloto'}</td>
                  <td className="actions-cell">
                    <button className="btn btn-small" onClick={() => openModal(bus)}>Editar</button>
                    <button className="delete-btn" onClick={() => handleDelete(bus.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Editar Bus' : 'Registrar Nuevo Bus'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <form className="buses-form-grid" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Placa del Bus *</label>
                  <input type="text" className="input-field" placeholder="Ej. P-123ABC" value={placa} onChange={e => setPlaca(e.target.value)} disabled={loading} required />
                </div>
                <div className="form-group">
                  <label>Capacidad Máxima *</label>
                  <input type="number" className="input-field" placeholder="Número de pasajeros" value={capacidadMaxima} onChange={e => setCapacidadMaxima(e.target.value)} disabled={loading} required />
                </div>
                <div className="form-group full-width">
                  <label>Parqueo Base *</label>
                  <select className="select-field" value={parqueoId} onChange={e => setParqueoId(e.target.value)} disabled={loading} required>
                    <option value="">Selecciona Parqueo...</option>
                    {parqueos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Línea Asignada (Opcional)</label>
                  <select className="select-field" value={lineaId} onChange={e => setLineaId(e.target.value)} disabled={loading}>
                    <option value="">Sin Línea</option>
                    {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
                {pilotos.length > 0 && (
                  <div className="form-group full-width">
                    <label>Piloto Asignado (Opcional)</label>
                    <select className="select-field" value={pilotoId} onChange={e => setPilotoId(e.target.value)} disabled={loading}>
                      <option value="">Sin Piloto</option>
                      {pilotos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="submit" className="btn flex-1" disabled={loading || !placa.trim() || !capacidadMaxima || !parqueoId}>
                    {loading ? 'Guardando...' : (editingId ? 'Actualizar Bus' : 'Registrar Bus')}
                  </button>
                  <button type="button" className="btn btn-secondary flex-1" onClick={handleCloseModal} disabled={loading}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
