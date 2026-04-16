import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import {
  BuildingStorefrontIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import api from '../services/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} className={value === index ? 'py-6' : ''}>
      {value === index && children}
    </div>
  );
}

const initialSucursalForm = {
  nombre: '',
  direccion: '',
};

const initialUsuarioForm = {
  username: '',
  nombre: '',
  email: '',
  password: '',
  rol: 'Empleado',
  valor_hora: '',
  turno_preferido: 'Indiferente',
  dias_laborales: [],
};

const turnoOptions = ['Manana', 'Tarde', 'Noche', 'Indiferente'];

function sanitizeTurnoPreferido(value) {
  if (value === 'Manana') return 'Mañana';
  return value;
}

export default function AdminPanel() {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submittingSucursal, setSubmittingSucursal] = useState(false);
  const [submittingUsuario, setSubmittingUsuario] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [diasSemana, setDiasSemana] = useState([]);
  const [sucursalForm, setSucursalForm] = useState(initialSucursalForm);
  const [usuarioForm, setUsuarioForm] = useState(initialUsuarioForm);
  const [sucursalMessage, setSucursalMessage] = useState(null);
  const [usuarioMessage, setUsuarioMessage] = useState(null);

  const fetchPanelData = async () => {
    try {
      setLoading(true);
      const [sucursalesRes, usuariosRes, diasRes] = await Promise.all([
        api.get('empresa/sucursales/'),
        api.get('usuarios/'),
        api.get('core/dias-semana/'),
      ]);

      setSucursales(sucursalesRes.data);
      setUsuarios(usuariosRes.data);
      setDiasSemana(diasRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanelData();
  }, []);

  const handleSucursalSubmit = async (event) => {
    event.preventDefault();
    setSubmittingSucursal(true);
    setSucursalMessage(null);

    try {
      const { data } = await api.post('empresa/sucursales/', sucursalForm);
      setSucursales((current) => [...current, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setSucursalForm(initialSucursalForm);
      setSucursalMessage({ type: 'success', text: 'Sucursal creada correctamente.' });
    } catch (error) {
      const detail = error.response?.data;
      setSucursalMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : 'No se pudo crear la sucursal.',
      });
    } finally {
      setSubmittingSucursal(false);
    }
  };

  const toggleDiaLaboral = (diaId) => {
    setUsuarioForm((current) => {
      const exists = current.dias_laborales.includes(diaId);
      return {
        ...current,
        dias_laborales: exists
          ? current.dias_laborales.filter((id) => id !== diaId)
          : [...current.dias_laborales, diaId],
      };
    });
  };

  const handleUsuarioSubmit = async (event) => {
    event.preventDefault();
    setSubmittingUsuario(true);
    setUsuarioMessage(null);

    const payload = {
      username: usuarioForm.username,
      nombre: usuarioForm.nombre,
      email: usuarioForm.email,
      password: usuarioForm.password,
      is_active: true,
      rol: usuarioForm.rol,
      configuracion_laboral: {
        valor_hora: usuarioForm.valor_hora === '' ? '0.00' : usuarioForm.valor_hora,
        turno_preferido: sanitizeTurnoPreferido(usuarioForm.turno_preferido),
        dias_laborales: usuarioForm.dias_laborales,
      },
    };

    try {
      const { data } = await api.post('usuarios/', payload);
      setUsuarios((current) => [...current, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setUsuarioForm(initialUsuarioForm);
      setUsuarioMessage({ type: 'success', text: 'Usuario y configuración laboral creados.' });
    } catch (error) {
      const detail = error.response?.data;
      let text = 'No se pudo crear el usuario.';

      if (detail && typeof detail === 'object') {
        const firstKey = Object.keys(detail)[0];
        const firstValue = detail[firstKey];
        text = Array.isArray(firstValue) ? firstValue[0] : String(firstValue);
      } else if (typeof detail === 'string') {
        text = detail;
      }

      setUsuarioMessage({ type: 'error', text });
    } finally {
      setSubmittingUsuario(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2">
      <h1 className="mb-6 text-3xl font-light tracking-tight text-gray-900">Panel de Gestión</h1>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          TabIndicatorProps={{ style: { backgroundColor: '#111111' } }}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 300, fontSize: '1rem', color: '#6b7280' },
            '& .Mui-selected': { color: '#111111 !important', fontWeight: 400 },
          }}
        >
          <Tab label="Sucursales" />
          <Tab label="Usuarios" />
          <Tab label="Planificador" />
        </Tabs>
      </Box>

      {loading ? (
        <div className="py-16 text-center">
          <CircularProgress size={30} sx={{ color: '#111111' }} />
        </div>
      ) : (
        <>
          <TabPanel value={tabIndex} index={0}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
              <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white">
                    <BuildingStorefrontIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-light text-gray-900">Nueva sucursal</h2>
                    <p className="text-sm text-gray-500">Se guarda directamente en tu empresa.</p>
                  </div>
                </div>

                {sucursalMessage && (
                  <Alert severity={sucursalMessage.type} sx={{ mb: 2 }}>
                    {sucursalMessage.text}
                  </Alert>
                )}

                <form className="space-y-4" onSubmit={handleSucursalSubmit}>
                  <TextField
                    label="Nombre"
                    fullWidth
                    value={sucursalForm.nombre}
                    onChange={(e) => setSucursalForm((current) => ({ ...current, nombre: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Dirección"
                    fullWidth
                    value={sucursalForm.direccion}
                    onChange={(e) => setSucursalForm((current) => ({ ...current, direccion: e.target.value }))}
                    required
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disableElevation
                    disabled={submittingSucursal}
                    sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' }, textTransform: 'none', borderRadius: '10px' }}
                  >
                    {submittingSucursal ? 'Guardando...' : 'Crear sucursal'}
                  </Button>
                </form>
              </section>

              <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-light text-gray-900">Sucursales creadas</h2>
                    <p className="text-sm text-gray-500">{sucursales.length} sucursales visibles en esta empresa.</p>
                  </div>
                </div>

                {sucursales.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center text-sm text-gray-500">
                    Todavía no hay sucursales cargadas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {sucursales.map((suc) => (
                      <article key={suc.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
                        <h3 className="mt-2 text-lg font-medium text-gray-900">{suc.nombre}</h3>
                        <p className="mt-2 text-sm text-gray-500">{suc.direccion}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </TabPanel>

          <TabPanel value={tabIndex} index={1}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[28rem_minmax(0,1fr)]">
              <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white">
                    <UserPlusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-light text-gray-900">Nuevo usuario</h2>
                    <p className="text-sm text-gray-500">Alta de usuario junto con configuración laboral.</p>
                  </div>
                </div>

                {usuarioMessage && (
                  <Alert severity={usuarioMessage.type} sx={{ mb: 2 }}>
                    {usuarioMessage.text}
                  </Alert>
                )}

                <form className="space-y-4" onSubmit={handleUsuarioSubmit}>
                  <TextField
                    label="Username"
                    fullWidth
                    value={usuarioForm.username}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, username: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Nombre completo"
                    fullWidth
                    value={usuarioForm.nombre}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, nombre: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={usuarioForm.email}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, email: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Contraseña"
                    type="password"
                    fullWidth
                    value={usuarioForm.password}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, password: e.target.value }))}
                    required
                  />
                  <TextField
                    select
                    fullWidth
                    label="Rol"
                    SelectProps={{ native: true }}
                    value={usuarioForm.rol}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, rol: e.target.value }))}
                  >
                    <option value="Empleado">Empleado</option>
                    <option value="Admin">Admin</option>
                  </TextField>
                  <TextField
                    label="Valor hora"
                    type="number"
                    fullWidth
                    value={usuarioForm.valor_hora}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, valor_hora: e.target.value }))}
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                  <TextField
                    select
                    fullWidth
                    label="Turno preferido"
                    SelectProps={{ native: true }}
                    value={usuarioForm.turno_preferido}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, turno_preferido: e.target.value }))}
                  >
                    {turnoOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </TextField>

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Días laborables</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {diasSemana.map((dia) => (
                        <FormControlLabel
                          key={dia.id}
                          control={
                            <Checkbox
                              checked={usuarioForm.dias_laborales.includes(dia.id)}
                              onChange={() => toggleDiaLaboral(dia.id)}
                              sx={{ color: '#111111', '&.Mui-checked': { color: '#111111' } }}
                            />
                          }
                          label={dia.dia}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disableElevation
                    disabled={submittingUsuario}
                    sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' }, textTransform: 'none', borderRadius: '10px' }}
                  >
                    {submittingUsuario ? 'Guardando...' : 'Crear usuario'}
                  </Button>
                </form>
              </section>

              <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-light text-gray-900">Usuarios activos</h2>
                    <p className="text-sm text-gray-500">{usuarios.length} usuarios visibles en esta empresa.</p>
                  </div>
                </div>

                {usuarios.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center text-sm text-gray-500">
                    Todavía no hay usuarios cargados.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usuarios.map((usuario) => (
                      <article key={usuario.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{usuario.nombre}</h3>
                            <p className="text-sm text-gray-500">@{usuario.username} · {usuario.email}</p>
                          </div>
                          <div className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.22em] text-gray-500">
                            {usuario.nombres_grupos?.[0] || 'Sin rol'}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Valor hora</p>
                            <p className="mt-1">{usuario.configuracion_laboral?.valor_hora ?? '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Turno preferido</p>
                            <p className="mt-1">{usuario.configuracion_laboral?.turno_preferido || 'Indiferente'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Estado</p>
                            <p className="mt-1">{usuario.is_active ? 'Activo' : 'Inactivo'}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(usuario.configuracion_laboral?.dias_laborales || []).length > 0 ? (
                            usuario.configuracion_laboral.dias_laborales.map((diaId) => {
                              const dia = diasSemana.find((item) => item.id === diaId);
                              return (
                                <span key={diaId} className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                                  {dia?.dia || `Dia #${diaId}`}
                                </span>
                              );
                            })
                          ) : (
                            <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                              Sin días configurados
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </TabPanel>

          <TabPanel value={tabIndex} index={2}>
            <div className="rounded-[28px] border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
              El planificador queda para la siguiente iteración. Ahora el panel ya permite crear sucursales y usuarios con configuración laboral.
            </div>
          </TabPanel>
        </>
      )}
    </div>
  );
}
