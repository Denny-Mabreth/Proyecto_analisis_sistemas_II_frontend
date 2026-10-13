import React, { useState, useEffect } from 'react';
import './Usuarios.css';
import { User, UserRole } from '../../types/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal para crear
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRol, setNewRol] = useState<UserRole>('Monitor');

  // Modal para editar
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRol, setEditRol] = useState<UserRole>('Monitor');

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/usuarios`);
      if (!res.ok) throw new Error('No se pudieron obtener los usuarios');
      const data: User[] = await res.json();
      setUsuarios(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newUsername.trim() || !newPassword.trim()) {
      setFeedback({ type: 'error', message: 'Nombre, usuario y contraseña son requeridos.' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newNombre.trim(),
          username: newUsername.trim(),
          telefono: newTelefono.trim(),
          password: newPassword,
          rol: newRol,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al registrar el usuario');
      }

      setFeedback({ type: 'success', message: 'Usuario registrado exitosamente.' });
      setIsCreateModalOpen(false);
      setNewNombre('');
      setNewUsername('');
      setNewTelefono('');
      setNewPassword('');
      setNewRol('Monitor');
      fetchUsuarios();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'No se pudo crear el usuario.' });
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditNombre(user.nombre);
    setEditUsername(user.username);
    setEditTelefono(user.telefono || '');
    setEditRol(user.rol);
    setEditPassword('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editNombre.trim() || !editUsername.trim()) {
      setFeedback({ type: 'error', message: 'Nombre y nombre de usuario son obligatorios.' });
      return;
    }

    try {
      const payload: any = {
        nombre: editNombre.trim(),
        username: editUsername.trim(),
        telefono: editTelefono.trim(),
        rol: editRol,
      };

      if (editPassword.trim()) {
        payload.password = editPassword;
      }

      const res = await fetch(`${API_URL}/usuarios/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }

      setFeedback({ type: 'success', message: 'Usuario actualizado correctamente.' });
      setEditingUser(null);
      fetchUsuarios();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'No se pudo actualizar el usuario.' });
    }
  };

  const handleDelete = async (user: User) => {
    if (user.username === 'admin') {
      alert('No se puede eliminar el usuario administrador predeterminado.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.nombre}" (@${user.username})?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/usuarios/${user.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }

      setFeedback({ type: 'success', message: `Usuario @${user.username} eliminado correctamente.` });
      fetchUsuarios();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'No se pudo eliminar el usuario.' });
    }
  };

  return (
    <section className="usuarios-section">
      <div className="usuarios-header">
        <div>
          <h2>Administración de Usuarios</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
            Control de cuentas y asignación de roles para el sistema Transmetro
          </p>
        </div>
        <button className="btn" onClick={() => setIsCreateModalOpen(true)}>
          + Nuevo Usuario
        </button>
      </div>

      {feedback && (
        <div className={`alert-box ${feedback.type}`}>
          {feedback.message}
          <button
            onClick={() => setFeedback(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="table-container">
        {usuarios.length === 0 && !loading ? (
          <div className="empty-state">No hay usuarios registrados.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>
                    <strong>{u.nombre}</strong>
                  </td>
                  <td>
                    <span className="user-username">@{u.username}</span>
                  </td>
                  <td>{u.telefono || '—'}</td>
                  <td>
                    <span className={`badge-role ${u.rol === 'Administrador' ? 'admin' : 'monitor'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${u.activo !== false ? 'active' : 'inactive'}`}>
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => handleOpenEdit(u)}>
                        Editar
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(u)}
                        disabled={u.username === 'admin'}
                        title={u.username === 'admin' ? 'No se puede eliminar el admin principal' : 'Eliminar usuario'}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Nuevo Usuario</h3>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ej. Juan Carlos Pérez"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nombre de Usuario *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ej. jperez"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Teléfono</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="ej. 5555-1234"
                  value={newTelefono}
                  onChange={(e) => setNewTelefono(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Contraseña *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Rol en el Sistema *</label>
                <select
                  className="select-field"
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value as UserRole)}
                >
                  <option value="Administrador">Administrador (Acceso total)</option>
                  <option value="Monitor">Monitor (Acceso solo a Monitoreo)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn">
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Usuario: @{editingUser.username}</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  className="input-field"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nombre de Usuario *</label>
                <input
                  type="text"
                  className="input-field"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Teléfono</label>
                <input
                  type="tel"
                  className="input-field"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Rol en el Sistema *</label>
                <select
                  className="select-field"
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value as UserRole)}
                  disabled={editingUser.username === 'admin'}
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Monitor">Monitor</option>
                </select>
                {editingUser.username === 'admin' && (
                  <small style={{ color: 'var(--text-secondary)' }}>
                    El rol del administrador principal no puede ser modificado.
                  </small>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nueva Contraseña (Opcional)</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Dejar en blanco para mantener la actual"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn">
                  Actualizar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
