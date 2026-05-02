import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SuperAdmin = () => {
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nuevaEmpresa, setNuevaEmpresa] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empresasRes, usuariosRes] = await Promise.all([
        api.get('/empresa/empresas/'),
        api.get('/usuarios/')
      ]);
      setEmpresas(empresasRes.data);
      setUsuarios(usuariosRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmpresa = async (e) => {
    e.preventDefault();
    if (!nuevaEmpresa) return;
    
    try {
      await api.post('/empresa/empresas/', { nombre: nuevaEmpresa });
      setNuevaEmpresa('');
      fetchData();
      alert('Empresa creada correctamente');
    } catch (error) {
      console.error('Error creando empresa', error);
      alert('Error al crear empresa');
    }
  };

  const handleUpdateEmpresaAdmin = async (empresaId, adminId) => {
    try {
      await api.patch(`/empresa/empresas/${empresaId}/`, {
        administrador: adminId || null
      });
      fetchData();
      alert('Administrador asignado correctamente');
    } catch (error) {
      console.error('Error asignando administrador', error);
      alert('Error al asignar administrador');
    }
  };

  const handleUpdateUsuarioEmpresa = async (usuarioId, empresaId) => {
    try {
      await api.patch(`/usuarios/${usuarioId}/`, {
        empresa: empresaId || null
      });
      fetchData();
      alert('Empresa reasignada correctamente');
    } catch (error) {
      console.error('Error reasignando empresa', error);
      alert('Error al reasignar empresa');
    }
  };

  if (loading) return <div className="p-8">Cargando datos del sistema...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Panel SuperAdmin</h1>
      
      {/* CREAR EMPRESA */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Crear Nueva Empresa</h2>
        <form onSubmit={handleCreateEmpresa} className="flex gap-4">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Nombre de la nueva empresa..."
            value={nuevaEmpresa}
            onChange={(e) => setNuevaEmpresa(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Crear Empresa
          </button>
        </form>
      </section>

      {/* LISTA DE EMPRESAS Y SUS ADMINS */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Gestión de Empresas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 rounded-tl-lg">ID</th>
                <th className="p-3">Nombre Empresa</th>
                <th className="p-3 rounded-tr-lg">Administrador Actual</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map(empresa => (
                <tr key={empresa.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{empresa.id}</td>
                  <td className="p-3">{empresa.nombre}</td>
                  <td className="p-3">
                    <select
                      className="p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 w-full"
                      value={empresa.administrador || ''}
                      onChange={(e) => handleUpdateEmpresaAdmin(empresa.id, e.target.value)}
                    >
                      <option value="">-- Sin Administrador --</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre || u.username} ({u.email})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ASIGNACIÓN DE USUARIOS A EMPRESAS */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Reasignar Usuarios a Empresas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 rounded-tl-lg">ID</th>
                <th className="p-3">Usuario / Email</th>
                <th className="p-3 rounded-tr-lg">Empresa Asignada</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{usuario.id}</td>
                  <td className="p-3">{usuario.nombre || usuario.username} <span className="text-gray-400">({usuario.email})</span></td>
                  <td className="p-3">
                    <select
                      className="p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 w-full"
                      value={usuario.empresa || ''}
                      onChange={(e) => handleUpdateUsuarioEmpresa(usuario.id, e.target.value)}
                    >
                      <option value="">-- Sin Empresa --</option>
                      {empresas.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
    </div>
  );
};

export default SuperAdmin;
