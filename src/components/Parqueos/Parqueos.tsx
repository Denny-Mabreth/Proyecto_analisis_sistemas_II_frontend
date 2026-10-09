import React, { useState, useEffect } from 'react';
import './Parqueos.css';

interface Parqueo {
  id: number;
  nombre: string;
  estacion?: { id: number, nombre: string };
}

export const Parqueos = () => {
  const [parqueos, setParqueos] = useState<Parqueo[]>([]);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchParqueos = async () => {
    try {
      const response = await fetch(`${API_URL}/parqueos`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setParqueos(data);
      } else {
        setParqueos([]);
      }
    } catch (error) {
      console.error('Error fetching parqueos:', error);
      setParqueos([]);
    }
  };

  useEffect(() => {
    fetchParqueos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/parqueos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
        }),
      });
      setNombre('');
      fetchParqueos();
    } catch (error) {
      console.error('Error creating parqueo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este parqueo?')) return;
    
    try {
      await fetch(`${API_URL}/parqueos/${id}`, {
        method: 'DELETE',
      });
      fetchParqueos();
    } catch (error) {
      console.error('Error deleting parqueo:', error);
    }
  };

  return (
    <section className="parqueos-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Parqueos</h2>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input-field"
          placeholder="Nombre (ej. Parqueo Sur)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn" disabled={loading || !nombre.trim()}>
          {loading ? 'Agregando...' : 'Crear Parqueo'}
        </button>
      </form>

      <div className="table-container">
        {parqueos.length === 0 ? (
          <div className="empty-state">No hay parqueos registrados. ¡Agrega el primero!</div>
        ) : (
          <table className="minimal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Asignado a estación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {parqueos.map((parqueo) => (
                <tr key={parqueo.id}>
                  <td>#{parqueo.id}</td>
                  <td>{parqueo.nombre}</td>
                  <td>{parqueo.estacion ? parqueo.estacion.nombre : 'No asignado'}</td>
                  <td>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(parqueo.id)}
                    >
                      Eliminar
                    </button>
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
