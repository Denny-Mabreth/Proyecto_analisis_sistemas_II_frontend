import React, { useState, useEffect } from 'react';
import './Municipalidades.css';

interface Municipalidad {
  id: number;
  nombre: string;
  activo: boolean;
}

export const Municipalidades = () => {
  const [municipalidades, setMunicipalidades] = useState<Municipalidad[]>([]);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchMunicipalidades = async () => {
    try {
      const response = await fetch(`${API_URL}/municipalidades`);
      const data = await response.json();
      setMunicipalidades(data);
    } catch (error) {
      console.error('Error fetching municipalidades:', error);
    }
  };

  useEffect(() => {
    fetchMunicipalidades();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/municipalidades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre }),
      });
      setNombre('');
      fetchMunicipalidades();
    } catch (error) {
      console.error('Error creating municipalidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta municipalidad?')) return;
    
    try {
      const res = await fetch(`${API_URL}/municipalidades/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.message || 'No se pudo eliminar la municipalidad.');
        return;
      }
      fetchMunicipalidades();
    } catch (error) {
      console.error('Error deleting municipalidad:', error);
      alert('Error de conexión al intentar eliminar.');
    }
  };

  return (
    <section className="municipalidades-section">
      <div className="section-header">
        <h2 className="section-title">Gestión de Municipalidades</h2>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input-field"
          placeholder="Nombre de la municipalidad (ej. Ciudad de Guatemala)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn" disabled={loading || !nombre.trim()}>
          {loading ? 'Agregando...' : 'Agregar'}
        </button>
      </form>

      <div className="table-container">
        {municipalidades.length === 0 ? (
          <div className="empty-state">No hay municipalidades registradas. ¡Agrega la primera!</div>
        ) : (
          <table className="minimal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {municipalidades.map((mun) => (
                <tr key={mun.id}>
                  <td>#{mun.id}</td>
                  <td>{mun.nombre}</td>
                  <td>{mun.activo ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(mun.id)}
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
