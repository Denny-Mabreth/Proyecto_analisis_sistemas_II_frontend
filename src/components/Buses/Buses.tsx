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
        fetch(`${API_URL}/pilotos`).catch(() => ({ json: () => [] })) // Graceful fail if pilotos not implemented in backend
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
      setPlaca('');
      setCapacidadMaxima('');
      setParqueoId('');
      setLineaId('');
      setPilotoId('');
      setEditingId(null);
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

  const handleEdit = (bus: Bus) => {
    setEditingId(bus.id);
    setPlaca(bus.placa);
    setCapacidadMaxima(bus.capacidad_maxima.toString());
    setParqueoId(bus.parqueo ? bus.parqueo.id.toString() : '');
    setLineaId(bus.linea ? bus.linea.id.toString() : '');
    setPilotoId(bus.piloto ? bus.piloto.id.toString() : '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPlaca('');
    setCapacidadMaxima('');
    setParqueoId('');
    setLineaId('');
    setPilotoId('');
    setError(null);
  };

  return (
    <section className="buses-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Buses</h2>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}

      <form className="form-container" onSubmit={handleSubmit}>
        <input type="text" className="input-field" placeholder="Placa (ej. P-123ABC)" value={placa} onChange={e => setPlaca(e.target.value)} disabled={loading} required />
        <input type="number" className="input-field" placeholder="Capacidad máxima" value={capacidadMaxima} onChange={e => setCapacidadMaxima(e.target.value)} disabled={loading} required />

        <select className="select-field" value={parqueoId} onChange={e => setParqueoId(e.target.value)} disabled={loading} required>
          <option value="">Selecciona Parqueo (Obligatorio)</option>
          {parqueos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>

        <select className="select-field" value={lineaId} onChange={e => setLineaId(e.target.value)} disabled={loading}>
          <option value="">Sin Línea (Opcional)</option>
          {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
        </select>

        {pilotos.length > 0 && (
          <select className="select-field" value={pilotoId} onChange={e => setPilotoId(e.target.value)} disabled={loading}>
            <option value="">Sin Piloto (Opcional)</option>
            {pilotos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="btn" disabled={loading || !placa.trim() || !capacidadMaxima || !parqueoId} style={{ flex: 1 }}>
            {loading ? 'Guardando...' : (editingId ? 'Actualizar Bus' : 'Registrar Bus')}
          </button>
          {editingId && (
            <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#666' }} onClick={handleCancelEdit} disabled={loading}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="table-container">
        {buses.length === 0 ? (
          <div className="empty-state">No hay buses registrados.</div>
        ) : (
          <table className="minimal-table">
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
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleEdit(bus)}>Editar</button>
                    <button className="delete-btn" onClick={() => handleDelete(bus.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
