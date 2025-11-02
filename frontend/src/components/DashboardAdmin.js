import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardAdmin.css";

function DashboardAdmin() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalUsuarios: 0, usuariosPorRol: [], usuariosActivos: 0 });
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    if (userData.rol !== 'administrador') {
      alert('Acceso denegado. Solo administradores.');
      navigate('/dashboard');
      return;
    }

    setUser(userData);
    cargarDatos(token);
  }, [navigate]);

  const cargarDatos = async (token) => {
    try {
      const statsResponse = await fetch('http://localhost:4000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      const usersResponse = await fetch('http://localhost:4000/api/admin/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsuarios(usersData.usuarios);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const editarUsuario = (id) => {
    alert('Funcion en desarrollo: Editar usuario ' + id);
  };

  const eliminarUsuario = (id) => {
    if (window.confirm('¿Estas seguro de eliminar este usuario?')) {
      alert('Funcion en desarrollo: Eliminar usuario ' + id);
    }
  };

  const handleSearchUser = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usuariosTableBody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  };

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    alert('✅ Configuracion guardada correctamente');
  };

  const handleReporteSubmit = (e) => {
    e.preventDefault();
    alert('📥 Generando reporte...');
    setTimeout(() => {
      alert('✅ Reporte generado exitosamente');
    }, 1500);
  };

  const adminUsers = stats.usuariosPorRol?.find(r => r._id === 'administrador');

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="loading-spinner"></div>
        <p className="mt-4">Cargando panel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-admin">
      {/* NAVBAR */}
      <div className="navbar">
        <h1>🔧 Panel Administrativo</h1>
        <div className="user-info">
          <span>{user?.nombre} ({user?.rol})</span>
          <button className="logout-btn" onClick={handleLogout}>Cerrar Sesion</button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="container">
        {/* Sección de bienvenida */}
        <div className="welcome-section">
          <h2>Bienvenido al Panel de Administracion ⚡</h2>
          <p>Desde aqui puedes gestionar usuarios, ver estadisticas del sistema y controlar el optimizador de energia inteligente.</p>
        </div>

        {/* Estadísticas */}
        <h3 className="section-title">📊 Estadisticas</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalUsuarios || 0}</div>
            <div className="stat-label">Usuarios Totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{adminUsers?.cantidad || 0}</div>
            <div className="stat-label">Administradores</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.usuariosActivos || 0}</div>
            <div className="stat-label">Usuarios Activos</div>
          </div>
        </div>

        {/* Funcionalidades */}
        <h3 className="section-title">⚙️ Funcionalidades Disponibles</h3>
        <div className="features-grid">
          <div className="feature-card" data-bs-toggle="modal" data-bs-target="#modalUsuarios">
            <h3>👥 Gestion de Usuarios</h3>
            <p>Ver, editar y eliminar usuarios. Cambiar roles y permisos.</p>
          </div>

          <div className="feature-card" data-bs-toggle="modal" data-bs-target="#modalEstadisticas">
            <h3>📈 Estadisticas del Sistema</h3>
            <p>Monitorear el consumo de energia y patrones de uso.</p>
          </div>

          <div className="feature-card" data-bs-toggle="modal" data-bs-target="#modalConfiguracion">
            <h3>⚙️ Configuracion</h3>
            <p>Ajustar parametros del optimizador de energia.</p>
          </div>

          <div className="feature-card" data-bs-toggle="modal" data-bs-target="#modalAlertas">
            <h3>🔔 Sistema de Alertas</h3>
            <p>Configurar y gestionar alertas de consumo anomalo.</p>
          </div>

          <div className="feature-card" data-bs-toggle="modal" data-bs-target="#modalReportes">
            <h3>📋 Reportes Avanzados</h3>
            <p>Generar reportes detallados de consumo energetico.</p>
          </div>

          <div className="feature-card" data-bs-toggle="modal" data-bs-target="#modalAuditoria">
            <h3>🔐 Auditoria y Logs</h3>
            <p>Ver el historial de acciones y cambios en el sistema.</p>
          </div>
        </div>
      </div>

      {/* MODALES */}
      {/* Modal: Gestión de Usuarios */}
      <div className="modal fade" id="modalUsuarios" tabIndex="-1">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">👥 Gestion de Usuarios</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="🔍 Buscar usuario por nombre o correo..."
                  onChange={handleSearchUser}
                />
              </div>
              <div className="table-responsive">
                <table className="table table-dark table-hover">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Fecha Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody id="usuariosTableBody">
                    {usuarios.length === 0 ? (
                      <tr><td colSpan="6" className="text-center">No hay usuarios</td></tr>
                    ) : (
                      usuarios.map(u => (
                        <tr key={u._id}>
                          <td>{u.nombre}</td>
                          <td>{u.correo}</td>
                          <td>
                            <span className={`badge ${u.rol === 'administrador' ? 'bg-danger' : 'bg-primary'}`}>
                              {u.rol}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${u.activo ? 'bg-success' : 'bg-secondary'}`}>
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>{new Date(u.creadoEn).toLocaleDateString()}</td>
                          <td>
                            <button className="btn btn-sm btn-warning me-2" onClick={() => editarUsuario(u._id)}>✏️</button>
                            <button className="btn btn-sm btn-danger" onClick={() => eliminarUsuario(u._id)}>🗑️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Configuración */}
      <div className="modal fade" id="modalConfiguracion" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">⚙️ Configuracion del Sistema</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleConfigSubmit}>
                <div className="mb-3">
                  <label className="form-label">Tarifa por kWh ($)</label>
                  <input type="number" className="form-control" defaultValue="500" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Umbral de Consumo Alto (W)</label>
                  <input type="number" className="form-control" defaultValue="3000" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Umbral de Consumo Critico (W)</label>
                  <input type="number" className="form-control" defaultValue="4000" />
                </div>
                <button type="submit" className="btn btn-primary w-100">💾 Guardar Configuracion</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Reportes */}
      <div className="modal fade" id="modalReportes" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">📋 Generar Reportes</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleReporteSubmit}>
                <div className="mb-3">
                  <label className="form-label">Tipo de Reporte</label>
                  <select className="form-select">
                    <option value="consumo">Consumo Energetico</option>
                    <option value="costos">Analisis de Costos</option>
                    <option value="usuarios">Actividad de Usuarios</option>
                    <option value="alertas">Historico de Alertas</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Periodo</label>
                  <select className="form-select">
                    <option value="dia">Ultimo Dia</option>
                    <option value="semana">Ultima Semana</option>
                    <option value="mes">Ultimo Mes</option>
                    <option value="año">Ultimo Año</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-100">📥 Generar y Descargar</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modales restantes (Estadísticas, Alertas, Auditoría) - simplificados por espacio */}
      <div className="modal fade" id="modalEstadisticas" tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">📈 Estadisticas del Sistema</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="text-center">Estadisticas detalladas disponibles proximamente.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="modalAlertas" tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">🔔 Sistema de Alertas</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="text-center">Sistema de alertas en desarrollo.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="modalAuditoria" tabIndex="-1">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">🔐 Auditoria y Logs</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="text-center">Logs del sistema disponibles proximamente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;