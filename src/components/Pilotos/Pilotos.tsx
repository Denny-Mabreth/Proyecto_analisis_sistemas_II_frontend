import React, { useState, useEffect } from 'react';
import './Pilotos.css';

interface Piloto {
  id: number;
  nombre: string;
  historial_educativo: string;
  residencia: string;
  telefono: string;
  correo?: string;
}

export const Pilotos = () => {
  const [pilotos, setPilotos] = useState<Piloto[]>([]);
  const [nombre, setNombre] = useState('');
  const [historialEducativo, setHistorialEducativo] = useState('');
  const [residencia, setResidencia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchPilotos = async () => {
    try {
      const res = await fetch(`${API_URL}/pilotos`);
      const data = await res.json();
      if (Array.isArray(data)) setPilotos(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchPilotos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !historialEducativo.trim() || !residencia.trim() || !telefono.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const url = editingId ? `${API_URL}/pilotos/${editingId}` : `${API_URL}/pilotos`;
      const method = editingId ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          historial_educativo: historialEducativo,
          residencia,
          telefono,
          correo: correo.trim() ? correo : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || (editingId ? 'Error al actualizar piloto' : 'Error al crear piloto'));
      }
      setNombre('');
      setHistorialEducativo('');
      setResidencia('');
      setTelefono('');
      setCorreo('');
      setEditingId(null);
      fetchPilotos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este piloto?')) return;
    try {
      await fetch(`${API_URL}/pilotos/${id}`, { method: 'DELETE' });
      fetchPilotos();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (piloto: Piloto) => {
    setEditingId(piloto.id);
    setNombre(piloto.nombre);
    setHistorialEducativo(piloto.historial_educativo);
    setResidencia(piloto.residencia);
    setTelefono(piloto.telefono);
    setCorreo(piloto.correo || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNombre('');
    setHistorialEducativo('');
    setResidencia('');
    setTelefono('');
    setCorreo('');
    setError(null);
  };

  return (
    <section className="pilotos-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Pilotos</h2>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}

      <form className="form-container pilotos-form-grid" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre completo <span className="required-asterisk">*</span></label>
          <input type="text" className="input-field" placeholder="Ej. Juan Pérez" value={nombre} onChange={e => setNombre(e.target.value)} disabled={loading} required />
        </div>

        <div className="form-group">
          <label>Historial educativo <span className="required-asterisk">*</span></label>
          <input type="text" className="input-field" placeholder="Ej. Perito Contador" value={historialEducativo} onChange={e => setHistorialEducativo(e.target.value)} disabled={loading} required />
        </div>

        <div className="form-group full-width">
          <label>Dirección de residencia <span className="required-asterisk">*</span></label>
          <input type="text" className="input-field" placeholder="Ej. 4ta Avenida, Zona 1" value={residencia} onChange={e => setResidencia(e.target.value)} disabled={loading} required />
        </div>

        <div className="form-group">
          <label>Teléfono <span className="required-asterisk">*</span></label>
          <input type="text" className="input-field" placeholder="Ej. 5555-5555" value={telefono} onChange={e => setTelefono(e.target.value)} disabled={loading} required />
        </div>

        <div className="form-group">
          <label>Correo electrónico</label>
          <input type="email" className="input-field" placeholder="Ej. juan@correo.com" value={correo} onChange={e => setCorreo(e.target.value)} disabled={loading} />
        </div>
        
        <div className="full-width" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn" disabled={loading || !nombre.trim() || !historialEducativo.trim() || !residencia.trim() || !telefono.trim()} style={{ flex: 1 }}>
            {loading ? 'Guardando...' : (editingId ? 'Actualizar Piloto' : 'Registrar Piloto')}
          </button>
          {editingId && (
            <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#666' }} onClick={handleCancelEdit} disabled={loading}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="table-container">
        {pilotos.length === 0 ? (
          <div className="empty-state">No hay pilotos registrados.</div>
        ) : (
          <table className="minimal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Educación</th>
                <th>Residencia</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pilotos.map(piloto => (
                <tr key={piloto.id}>
                  <td>#{piloto.id}</td>
                  <td>{piloto.nombre}</td>
                  <td>{piloto.historial_educativo}</td>
                  <td>{piloto.residencia}</td>
                  <td>{piloto.telefono}</td>
                  <td>{piloto.correo || '-'}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleEdit(piloto)}>Editar</button>
                    <button className="delete-btn" onClick={() => handleDelete(piloto.id)}>Eliminar</button>
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
