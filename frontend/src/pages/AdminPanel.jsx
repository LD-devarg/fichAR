import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Tab,
  Tabs,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  BuildingStorefrontIcon,
  PencilSquareIcon,
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import api from '../services/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} className={value === index ? 'py-4' : ''}>
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
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);

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

  const selectDiasDeSemana = () => {
    const ids = diasSemana
      .filter(d => !d.dia.toLowerCase().includes('sabado') && !d.dia.toLowerCase().includes('sábado') && !d.dia.toLowerCase().includes('domingo'))
      .map(d => d.id);
    setUsuarioForm(cur => ({ ...cur, dias_laborales: ids }));
  };

  const selectFinDeSemana = () => {
    const ids = diasSemana
      .filter(d => d.dia.toLowerCase().includes('sabado') || d.dia.toLowerCase().includes('sábado') || d.dia.toLowerCase().includes('domingo'))
      .map(d => d.id);
    setUsuarioForm(cur => ({ ...cur, dias_laborales: ids }));
  };

  const selectTodosLosDias = () => {
    setUsuarioForm(cur => ({ ...cur, dias_laborales: diasSemana.map(d => d.id) }));
  };

  const closeUsuarioDialog = () => {
    if (submittingUsuario) return;
    setUsuarioDialogOpen(false);
    setUsuarioForm(initialUsuarioForm);
    setEditingUsuario(null);
  };

  const openCreateUsuarioDialog = () => {
    setUsuarioMessage(null);
    setEditingUsuario(null);
    setUsuarioForm(initialUsuarioForm);
    setUsuarioDialogOpen(true);
  };

  const openEditUsuarioDialog = (usuario) => {
    setUsuarioMessage(null);
    setEditingUsuario(usuario);
    setUsuarioForm({
      username: usuario.username || '',
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      rol: usuario.nombres_grupos?.[0] || 'Empleado',
      valor_hora: usuario.configuracion_laboral?.valor_hora ?? '',
      turno_preferido: usuario.configuracion_laboral?.turno_preferido || 'Indiferente',
      dias_laborales: usuario.configuracion_laboral?.dias_laborales || [],
    });
    setUsuarioDialogOpen(true);
  };

  const handleUsuarioSubmit = async (event) => {
    event.preventDefault();
    setSubmittingUsuario(true);
    setUsuarioMessage(null);

    const payload = {
      username: usuarioForm.username,
      nombre: usuarioForm.nombre,
      email: usuarioForm.email,
      is_active: true,
      rol: usuarioForm.rol,
      configuracion_laboral: {
        valor_hora: usuarioForm.valor_hora === '' ? '0.00' : usuarioForm.valor_hora,
        turno_preferido: sanitizeTurnoPreferido(usuarioForm.turno_preferido),
        dias_laborales: usuarioForm.dias_laborales,
      },
    };

    if (usuarioForm.password) {
      payload.password = usuarioForm.password;
    }

    try {
      const { data } = editingUsuario
        ? await api.patch(`usuarios/${editingUsuario.id}/`, payload)
        : await api.post('usuarios/', payload);
      setUsuarios((current) => {
        const next = editingUsuario
          ? current.map((usuario) => (usuario.id === data.id ? data : usuario))
          : [...current, data];
        return next.sort((a, b) => a.nombre.localeCompare(b.nombre));
      });
      setUsuarioForm(initialUsuarioForm);
      setUsuarioDialogOpen(false);
      setEditingUsuario(null);
      setUsuarioMessage({
        type: 'success',
        text: editingUsuario ? 'Usuario actualizado correctamente.' : 'Usuario y configuración laboral creados.',
      });
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
    <div className="w-full h-full py-2 px-4 md:px-6">
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

                <form className="flex flex-col gap-3" onSubmit={handleSucursalSubmit}>
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
                  <div className="border-y border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
                    Todavía no hay sucursales cargadas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {sucursales.map((suc) => (
                      <article key={suc.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
                        <h3 className=" text-lg font-bold text-gray-900 ">{suc.nombre}</h3>
                        <p className="mt-1 text-sm italic text-gray-500">{suc.direccion}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </TabPanel>

          <TabPanel value={tabIndex} index={1}>
            <div className="grid grid-cols-1 gap-6">
              <section className="hidden">
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

                <form className="flex flex-col gap-3" onSubmit={handleUsuarioSubmit}>
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
                    value={usuarioForm.rol}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, rol: e.target.value }))}
                  >
                    <MenuItem value="Empleado">Empleado</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
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
                    value={usuarioForm.turno_preferido}
                    onChange={(e) => setUsuarioForm((current) => ({ ...current, turno_preferido: e.target.value }))}
                  >
                    {turnoOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>

                  <div>
                    <div className="flex flex-col mb-2 gap-2">
                      <p className="text-sm font-medium text-gray-700">Días laborables</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="small" variant="outlined" onClick={selectDiasDeSemana} sx={{ textTransform: 'none', borderRadius: '8px', py: 0.2, fontSize: '0.75rem' }}>Días de semana</Button>
                        <Button size="small" variant="outlined" onClick={selectFinDeSemana} sx={{ textTransform: 'none', borderRadius: '8px', py: 0.2, fontSize: '0.75rem' }}>Fin de semana</Button>
                        <Button size="small" variant="outlined" onClick={selectTodosLosDias} sx={{ textTransform: 'none', borderRadius: '8px', py: 0.2, fontSize: '0.75rem' }}>Todos</Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0">
                      {diasSemana.map((dia) => (
                        <FormControlLabel
                          key={dia.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={usuarioForm.dias_laborales.includes(dia.id)}
                              onChange={() => toggleDiaLaboral(dia.id)}
                              sx={{ color: '#111111', '&.Mui-checked': { color: '#111111' }, padding: '4px' }}
                            />
                          }
                          label={<span className="text-sm">{dia.dia}</span>}
                          sx={{ margin: 0, paddingRight: '8px' }}
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

              <section className="w-full">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Usuarios activos</h2>
                    <p className="text-xs text-gray-500">{usuarios.length} usuarios visibles en esta empresa.</p>
                  </div>
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<UserPlusIcon className="h-5 w-5" />}
                    onClick={openCreateUsuarioDialog}
                    sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' }, textTransform: 'none', borderRadius: '10px', px: 2, py: 0.9, fontSize: '0.875rem' }}
                  >
                    Crear usuario
                  </Button>
                </div>

                {usuarioMessage && (
                  <Alert severity={usuarioMessage.type} sx={{ mb: 2 }}>
                    {usuarioMessage.text}
                  </Alert>
                )}

                {usuarios.length === 0 ? (
                  <div className="border-y border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
                    Todavía no hay usuarios cargados.
                  </div>
                ) : (
                  <div className="w-full border-t border-gray-200 pt-1">
                    <div className="max-h-[calc(100vh-350px)] overflow-y-auto pr-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
                      {usuarios.map((usuario) => (
                        <article key={usuario.id} className="border-b border-gray-200 py-2">
                        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-[1.35fr_0.75fr_0.9fr_0.7fr_auto] md:items-center">
                          <div>
                            <h3 className="truncate text-sm font-semibold text-gray-950">{usuario.nombre}</h3>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Valor hora</p>
                            <p className="text-sm text-gray-700">{usuario.configuracion_laboral?.valor_hora ?? '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Turno</p>
                            <p className="text-sm text-gray-700">{usuario.configuracion_laboral?.turno_preferido || 'Indiferente'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400">Estado</p>
                            <p className="text-sm text-gray-700">{usuario.is_active ? 'Activo' : 'Inactivo'}</p>
                          </div>
                          <div className="flex justify-end">
                            <IconButton size="small" onClick={() => openEditUsuarioDialog(usuario)} aria-label={`Editar ${usuario.nombre}`}>
                              <PencilSquareIcon className="h-4 w-4 text-gray-500" />
                            </IconButton>
                          </div>
                        </div>

                        <div className="hidden">
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

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                          {(usuario.configuracion_laboral?.dias_laborales || []).length > 0 ? (
                            usuario.configuracion_laboral.dias_laborales.map((diaId) => {
                              const dia = diasSemana.find((item) => item.id === diaId);
                              return (
                                <span key={diaId}>
                                  {dia?.dia || `Dia #${diaId}`}
                                </span>
                              );
                            })
                          ) : (
                            <span>
                              Sin días configurados
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            <Dialog
              open={usuarioDialogOpen}
              onClose={closeUsuarioDialog}
              fullWidth
              maxWidth="md"
              PaperProps={{ sx: { borderRadius: '28px' } }}
            >
              <DialogTitle sx={{ p: 0 }}>
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-white">
                      <UserPlusIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-light text-gray-900">{editingUsuario ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                      <p className="text-sm text-gray-500">
                        {editingUsuario ? 'Actualiza datos y configuracion laboral.' : 'Alta de usuario junto con configuracion laboral.'}
                      </p>
                    </div>
                  </div>
                  <IconButton onClick={closeUsuarioDialog} disabled={submittingUsuario}>
                    <XMarkIcon className="h-5 w-5" />
                  </IconButton>
                </div>
              </DialogTitle>

              <form onSubmit={handleUsuarioSubmit}>
                <DialogContent sx={{ p: 3 }}>
                  {usuarioMessage?.type === 'error' && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {usuarioMessage.text}
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      label="Contrasena"
                      type="password"
                      fullWidth
                      value={usuarioForm.password}
                      onChange={(e) => setUsuarioForm((current) => ({ ...current, password: e.target.value }))}
                      required={!editingUsuario}
                    />
                    <TextField
                      select
                      fullWidth
                      label="Rol"
                      value={usuarioForm.rol}
                      onChange={(e) => setUsuarioForm((current) => ({ ...current, rol: e.target.value }))}
                    >
                      <MenuItem value="Empleado">Empleado</MenuItem>
                      <MenuItem value="Admin">Admin</MenuItem>
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
                      value={usuarioForm.turno_preferido}
                      onChange={(e) => setUsuarioForm((current) => ({ ...current, turno_preferido: e.target.value }))}
                    >
                      {turnoOptions.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </TextField>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 md:col-span-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                        <p className="text-sm font-medium text-gray-700">Días laborables</p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="small" variant="outlined" onClick={selectDiasDeSemana} sx={{ textTransform: 'none', borderRadius: '8px', py: 0.2, fontSize: '0.75rem', borderColor: '#d1d5db', color: '#4b5563', '&:hover': { borderColor: '#111111', color: '#111111', bgcolor: 'transparent' } }}>Días de semana</Button>
                          <Button size="small" variant="outlined" onClick={selectFinDeSemana} sx={{ textTransform: 'none', borderRadius: '8px', py: 0.2, fontSize: '0.75rem', borderColor: '#d1d5db', color: '#4b5563', '&:hover': { borderColor: '#111111', color: '#111111', bgcolor: 'transparent' } }}>Fin de semana</Button>
                          <Button size="small" variant="outlined" onClick={selectTodosLosDias} sx={{ textTransform: 'none', borderRadius: '8px', py: 0.2, fontSize: '0.75rem', borderColor: '#d1d5db', color: '#4b5563', '&:hover': { borderColor: '#111111', color: '#111111', bgcolor: 'transparent' } }}>Todos</Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0">
                        {diasSemana.map((dia) => (
                          <FormControlLabel
                            key={dia.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={usuarioForm.dias_laborales.includes(dia.id)}
                                onChange={() => toggleDiaLaboral(dia.id)}
                                sx={{ color: '#111111', '&.Mui-checked': { color: '#111111' }, padding: '4px' }}
                              />
                            }
                            label={<span className="text-sm">{dia.dia}</span>}
                            sx={{ margin: 0, paddingRight: '8px' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Button onClick={closeUsuarioDialog} disabled={submittingUsuario} sx={{ color: '#4b5563', textTransform: 'none' }}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disableElevation
                    disabled={submittingUsuario}
                    sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' }, textTransform: 'none', borderRadius: '10px', px: 3 }}
                  >
                    {submittingUsuario ? 'Guardando...' : editingUsuario ? 'Guardar cambios' : 'Crear usuario'}
                  </Button>
                </DialogActions>
              </form>
            </Dialog>
          </TabPanel>
        </>
      )}
    </div>
  );
}
