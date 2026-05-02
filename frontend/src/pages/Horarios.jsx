import React, { useContext, useEffect, useState } from 'react';
import { CircularProgress, Autocomplete, TextField } from '@mui/material';
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  Squares2X2Icon,
  UsersIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import { AuthContext } from '../context/auth-context';

const DAY_ORDER = [
  { key: 'lunes', label: 'Lunes', short: 'Lun' },
  { key: 'martes', label: 'Martes', short: 'Mar' },
  { key: 'miercoles', label: 'Miercoles', short: 'Mie' },
  { key: 'jueves', label: 'Jueves', short: 'Jue' },
  { key: 'viernes', label: 'Viernes', short: 'Vie' },
  { key: 'sabado', label: 'Sabado', short: 'Sab' },
  { key: 'domingo', label: 'Domingo', short: 'Dom' },
];

const SHIFT_COLORS = [
  'bg-sky-100 text-sky-950 border-sky-200',
  'bg-emerald-100 text-emerald-950 border-emerald-200',
  'bg-amber-100 text-amber-950 border-amber-200',
  'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-200',
  'bg-rose-100 text-rose-950 border-rose-200',
  'bg-indigo-100 text-indigo-950 border-indigo-200',
  'bg-teal-100 text-teal-950 border-teal-200',
  'bg-orange-100 text-orange-950 border-orange-200',
];

function getMinutes(timeValue) {
  if (!timeValue) return 0;
  const [hours = '0', minutes = '0'] = timeValue.split(':');
  return (Number(hours) * 60) + Number(minutes);
}

function formatHourRange(turno) {
  return `${turno.hora_inicio.slice(0, 5)} - ${turno.hora_fin.slice(0, 5)}`;
}

function getShiftDuration(turno) {
  const start = getMinutes(turno.hora_inicio);
  const end = getMinutes(turno.hora_fin);
  if (end <= start) return 0;
  return (end - start) / 60;
}

function getWeekRangeLabel(offsetWeeks = 0) {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + (offsetWeeks * 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });

  return `${fmt.format(monday)} al ${fmt.format(sunday)}`;
}

function getWeekDays(offsetWeeks = 0) {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + (offsetWeeks * 7));

  const dates = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates[DAY_ORDER[i].key] = {
      display: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
      iso: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    };
  }
  return dates;
}

function getEmployeeColor(name) {
  const seed = (name || 'empleado').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SHIFT_COLORS[seed % SHIFT_COLORS.length];
}

function getDayMeta(turno) {
  if (!turno?.fecha) return DAY_ORDER[0];
  const d = new Date(turno.fecha + 'T00:00:00');
  const jsDay = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
  // DAY_ORDER starts Monday (index 0) … Sunday (index 6)
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return DAY_ORDER[idx] || DAY_ORDER[0];
}

function buildSucursales(horarios) {
  const bySucursal = new Map();

  horarios.forEach((turno) => {
    const id = turno.sucursal;
    if (!bySucursal.has(id)) {
      bySucursal.set(id, {
        id,
        name: turno.nombre_sucursal || `Sucursal #${id}`,
        turnos: [],
      });
    }
    bySucursal.get(id).turnos.push(turno);
  });

  return Array.from(bySucursal.values())
    .map((sucursal) => ({
      ...sucursal,
      turnos: sucursal.turnos.sort((a, b) => {
        const dayDiff = DAY_ORDER.findIndex((day) => day.key === getDayMeta(a).key)
          - DAY_ORDER.findIndex((day) => day.key === getDayMeta(b).key);
        if (dayDiff !== 0) return dayDiff;
        return getMinutes(a.hora_inicio) - getMinutes(b.hora_inicio);
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function groupTurnosByDay(turnos, weekDates) {
  return DAY_ORDER.reduce((acc, day) => {
    acc[day.key] = turnos
      .filter((turno) => turno.fecha === weekDates[day.key].iso)
      .sort((a, b) => getMinutes(a.hora_inicio) - getMinutes(b.hora_inicio));
    return acc;
  }, {});
}

function buildSummary(turnos) {
  const totalHoras = turnos.reduce((acc, turno) => acc + getShiftDuration(turno), 0);
  const empleados = new Set(turnos.map((turno) => turno.nombre_empleado || turno.empleado).filter(Boolean));
  const diasCubiertos = new Set(turnos.map((turno) => getDayMeta(turno).key));

  return {
    turnos: turnos.length,
    horas: totalHoras,
    empleados: empleados.size,
    dias: diasCubiertos.size,
  };
}

function SummaryCard({ icon, label, value, helper }) {
  const MetricIcon = icon;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
          <MetricIcon className="h-5 w-5" />
        </div>
        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">{label}</p>
      </div>
      <p className="text-3xl font-light text-gray-950">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{helper}</p>
    </div>
  );
}

function ShiftBlock({ turno, showSucursal, onClick }) {
  const empleado = turno.username_empleado || turno.nombre_empleado || `Empleado #${turno.empleado}`;
  const colorClass = getEmployeeColor(empleado);

  return (
    <article
      onClick={onClick}
      className={`rounded-md p-1.5 transition-all ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${colorClass.split(' ').filter(c => !c.startsWith('border-')).join(' ')}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold truncate leading-tight text-gray-900">{empleado}</p>
          <p className="mt-0.5 text-[10px] opacity-80 leading-tight tracking-wide">{formatHourRange(turno)}</p>
        </div>
        <span className="shrink-0 text-[9px] font-medium opacity-70">
          {getShiftDuration(turno).toFixed(1)}h
        </span>
      </div>
      {showSucursal && (
        <p className="mt-0.5 flex items-center gap-1 text-[9px] opacity-75 truncate">
          <MapPinIcon className="h-2.5 w-2.5 shrink-0" />
          {turno.nombre_sucursal || `Sucursal #${turno.sucursal}`}
        </p>
      )}
    </article>
  );
}

function DayCell({ turnos, emptyLabel, showSucursal, onEditShift }) {
  return (
    <div className="flex min-h-[90px] flex-col gap-1.5 rounded-lg border border-gray-100 bg-gray-50/40 p-1.5">
      {turnos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-[10px] text-gray-800">
          {emptyLabel}
        </div>
      ) : (
        turnos.map((turno) => (
          <ShiftBlock key={turno.id} turno={turno} showSucursal={showSucursal} onClick={onEditShift ? () => onEditShift(turno) : undefined} />
        ))
      )}
    </div>
  );
}

export default function Horarios() {
  const { isAdmin } = useContext(AuthContext);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNextWeek = () => {
    setDirection(1);
    setWeekOffset(o => o + 1);
  };

  const handlePrevWeek = () => {
    setDirection(-1);
    setWeekOffset(o => o - 1);
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 400 : -400,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? -400 : 400,
      opacity: 0,
    }),
  };

  // Form & Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  // dayForm: { sucursal, fecha, rows: [{_key, id, empleado, hora_inicio, hora_fin}] }
  const newRow = () => ({ _key: Math.random().toString(36).slice(2), id: null, empleado: '', hora_inicio: '', hora_fin: '' });
  const [dayForm, setDayForm] = useState({ sucursal: '', fecha: '', rows: [newRow()] });
  const [deletedIds, setDeletedIds] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // API Data
  const [empleadosList, setEmpleadosList] = useState([]);
  const [diasList, setDiasList] = useState([]);
  const [sucursalesList, setSucursalesList] = useState([]);

  const fetchHorarios = async (startDate, endDate) => {
    try {
      setLoading(true);
      const res = await api.get(`horarios/?start_date=${startDate}&end_date=${endDate}`);
      setHorarios(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      if (isAdmin) {
        const [empleadosRes, diasRes, sucursalesRes] = await Promise.all([
          api.get('usuarios/'),
          api.get('core/dias-semana/'),
          api.get('empresa/sucursales/'),
        ]);
        setEmpleadosList(empleadosRes.data);
        setDiasList(diasRes.data);
        setSucursalesList(sucursalesRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, [isAdmin]);

  useEffect(() => {
    const weekDates = getWeekDays(weekOffset);
    const startDate = weekDates['lunes'].iso;
    const endDate = weekDates['domingo'].iso;
    fetchHorarios(startDate, endDate);
  }, [weekOffset, isAdmin]);

  const handleOpenModal = (turno = null) => {
    setFormError('');
    setDeletedIds([]);
    if (turno) {
      // Load the full day for this sucursal + fecha
      const sameDayTurnos = horarios.filter(
        t => t.sucursal === turno.sucursal && t.fecha === turno.fecha
      );
      setDayForm({
        sucursal: turno.sucursal,
        fecha: turno.fecha,
        rows: sameDayTurnos.map(t => ({
          _key: String(t.id),
          id: t.id,
          empleado: t.empleado,
          hora_inicio: t.hora_inicio.slice(0, 5),
          hora_fin: t.hora_fin.slice(0, 5),
        })),
      });
    } else {
      setDayForm({ sucursal: '', fecha: '', rows: [newRow()] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const updateRow = (key, field, value) => {
    setDayForm(prev => ({
      ...prev,
      rows: prev.rows.map(r => r._key === key ? { ...r, [field]: value } : r),
    }));
  };

  const addRow = () => setDayForm(prev => ({ ...prev, rows: [...prev.rows, newRow()] }));

  const removeRow = (key) => {
    const row = dayForm.rows.find(r => r._key === key);
    if (row?.id) setDeletedIds(prev => [...prev, row.id]);
    setDayForm(prev => ({ ...prev, rows: prev.rows.filter(r => r._key !== key) }));
  };

  // Returns true if the shift is overnight (fin <= inicio, treating 00:00 as midnight)
  const isOvernight = (inicio, fin) => {
    if (!inicio || !fin) return false;
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    return (h2 * 60 + m2) < (h1 * 60 + m1);
  };

  const handleSaveTurno = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const { sucursal, fecha, rows } = dayForm;
    const errors = [];

    try {
      // 1. Delete removed rows
      await Promise.all(deletedIds.map(id => api.delete(`horarios/${id}/`).catch(() => { })));

      // 2. Save rows sequentially to respect conflict checks
      for (const row of rows) {
        if (!row.empleado || !row.hora_inicio || !row.hora_fin) continue;
        const payload = { empleado: row.empleado, sucursal, fecha, hora_inicio: row.hora_inicio, hora_fin: row.hora_fin };
        try {
          if (row.id) {
            const res = await api.put(`horarios/${row.id}/`, payload);
            setHorarios(prev => prev.map(t => t.id === row.id ? res.data : t));
          } else {
            const res = await api.post('horarios/', payload);
            setHorarios(prev => [...prev, res.data]);
          }
        } catch (err) {
          const data = err.response?.data;
          const msg = data?.detail || Object.values(data || {}).flat().filter(v => typeof v === 'string').join(' · ') || 'Error al guardar un turno.';
          errors.push(msg);
        }
      }

      // 3. Remove deleted turnos from local state
      if (deletedIds.length) {
        setHorarios(prev => prev.filter(t => !deletedIds.includes(t.id)));
      }

      if (errors.length) {
        setFormError(errors.join('\n'));
      } else {
        handleCloseModal();
      }
    } catch (err) {
      setFormError('Error inesperado al guardar.');
    } finally {
      setSubmitting(false);
    }
  };


  const sucursales = buildSucursales(horarios);

  const matricesList = isAdmin
    ? sucursales
    : [{ id: 'personal', name: 'Mi semana', turnos: horarios }];

  const weekLabel = getWeekRangeLabel(weekOffset);
  const weekDates = getWeekDays(weekOffset);

  const getEligibleUnassigned = (dayLabel, isoDate) => {
    // Normalizar a lowercase quitando tildes (por si acaso)
    const normalize = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const diaObj = diasList.find(d => normalize(d.dia) === normalize(dayLabel));
    if (!diaObj) return [];
    
    // Todos los empleados que trabajan este día
    const elegibles = empleadosList.filter(emp => 
      emp.is_active && 
      emp.configuracion_laboral?.dias_laborales?.includes(diaObj.id)
    );

    // Todos los que YA tienen turno ese día (en cualquier sucursal)
    const asignadosIds = horarios
      .filter(t => t.fecha === isoDate)
      .map(t => t.empleado);

    return elegibles.filter(emp => !asignadosIds.includes(emp.id));
  };

  return (
    <div className="w-full h-full py-2 px-4 md:px-6">
      <div className="w-full">
        <div className="border-b border-gray-200 pb-3 mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded border border-gray-200 bg-white overflow-hidden">
                  <button
                    onClick={handlePrevWeek}
                    className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-700 border-x border-gray-100">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    {weekLabel}
                  </div>
                  <button
                    onClick={handleNextWeek}
                    className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-medium tracking-tight text-gray-900">Planilla Horaria</h1>
                  <span className="hidden text-xs text-gray-500 md:inline-block">
                    {isAdmin ? 'Calendario semanal.' : 'Tu agenda semanal.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-black"
                >
                  + Asignar turno
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <CircularProgress size={32} sx={{ color: '#111111' }} />
          </div>
        ) : horarios.length === 0 ? (
          <div className="py-8">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <CalendarDaysIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-light text-gray-900">No hay turnos cargados</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {isAdmin
                      ? 'Para ver la planilla necesito al menos un horario creado en la API.'
                      : 'Cuando te asignen horarios, van a aparecer aquí.'}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="shrink-0 rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                >
                  + Asignar
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2">
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-[900px] overflow-hidden relative">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.div
                    key={weekOffset}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="w-full"
                  >
                    {/* Global Headers */}
                    <div className="grid grid-cols-7 gap-3 mb-4">
                      {DAY_ORDER.map((day) => (
                        <div key={day.key} className="border-b border-gray-200 pb-2">
                          <h3 className="text-[12px] font-medium text-gray-800 uppercase tracking-wide">
                            {day.label} {weekDates[day.key].display}
                          </h3>
                        </div>
                      ))}
                    </div>

                    {/* Sucursales Rows */}
                    <div className="flex flex-col gap-2">
                      {matricesList.map((matrix) => {
                        const turnosAgrupados = groupTurnosByDay(matrix.turnos, weekDates);
                        return (
                          <div key={matrix.id} className="flex flex-col gap-2">
                            {isAdmin && (
                              <h4 className="text-[13px] font-semibold text-gray-800 uppercase tracking-wide">{matrix.name}</h4>
                            )}
                            <div className="grid grid-cols-7 gap-3">
                              {DAY_ORDER.map((day) => (
                                <DayCell
                                  key={day.key}
                                  turnos={turnosAgrupados[day.key] || []}
                                  emptyLabel={isAdmin ? 'Sin cobertura cargada para este día.' : 'No tienes turnos este día.'}
                                  showSucursal={!isAdmin}
                                  onEditShift={isAdmin ? handleOpenModal : undefined}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </div>

                    {/* Disponibles Rows */}
                    {isAdmin && (
                      <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-3">
                        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Elegibles sin asignar
                        </h4>
                        <div className="grid grid-cols-7 gap-3">
                          {DAY_ORDER.map((day) => {
                            const unassigned = getEligibleUnassigned(day.label, weekDates[day.key].iso);
                            return (
                              <div key={day.key} className="flex min-h-[60px] flex-col gap-1 rounded-lg border border-dashed border-gray-200 bg-white p-1.5">
                                {unassigned.length === 0 ? (
                                  <div className="text-[9px] text-gray-400 text-center flex-1 flex items-center justify-center">Ninguno</div>
                                ) : (
                                  unassigned.map(emp => (
                                    <div key={emp.id} className="text-[10px] px-1.5 py-1 rounded bg-gray-50 border border-gray-100 text-gray-600 truncate text-center">
                                      {emp.nombre || emp.username}
                                    </div>
                                  ))
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[24px] shadow-xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-900">Asignar turno del día</h3>
                <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTurno}>
                {/* Sucursal + Fecha */}
                <div className="px-6 pt-5 pb-3 grid grid-cols-2 gap-3">
                  <Autocomplete
                    options={sucursalesList}
                    getOptionLabel={(opt) => opt.nombre || ''}
                    value={sucursalesList.find(s => String(s.id) === String(dayForm.sucursal)) || null}
                    onChange={(_, v) => setDayForm(prev => ({ ...prev, sucursal: v?.id || '' }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Sucursal" required size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9fafb', fontSize: '13px' }, '& .MuiInputLabel-root': { fontSize: '13px' } }}
                      />
                    )}
                    noOptionsText="Sin resultados"
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                  />
                  <TextField
                    label="Fecha" type="date" required size="small"
                    value={dayForm.fecha}
                    onChange={e => setDayForm(prev => ({ ...prev, fecha: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9fafb', fontSize: '13px' }, '& .MuiInputLabel-root': { fontSize: '13px' } }}
                  />
                </div>

                {/* Column headers */}
                <div className="px-6 pb-1">
                  <div className="grid grid-cols-[1fr_90px_90px_32px] gap-2 items-center">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Empleado</p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Ingreso</p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Salida</p>
                    <span />
                  </div>
                </div>

                {/* Rows */}
                <div className="px-6 space-y-3 max-h-[340px] overflow-y-auto py-4">
                  {dayForm.rows.map((row) => {
                    const overnight = isOvernight(row.hora_inicio, row.hora_fin);
                    return (
                      <div key={row._key} className="grid grid-cols-[1fr_90px_90px_32px] gap-4 items-center pt-2.5">
                        <Autocomplete
                          options={empleadosList}
                          getOptionLabel={(opt) => opt.nombre || opt.username || ''}
                          value={empleadosList.find(e => String(e.id) === String(row.empleado)) || null}
                          onChange={(_, v) => updateRow(row._key, 'empleado', v?.id || '')}
                          size="small"
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Empleado" size="small"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9fafb', fontSize: '13px' } }}
                            />
                          )}
                          noOptionsText="Sin resultados"
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                        />
                        <input
                          type="time"
                          value={row.hora_inicio}
                          onChange={e => updateRow(row._key, 'hora_inicio', e.target.value)}
                          className="w-full px-2 py-2 rounded-[10px] border border-gray-200 text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                        />
                        <div className="relative">
                          <input
                            type="time"
                            value={row.hora_fin}
                            onChange={e => updateRow(row._key, 'hora_fin', e.target.value)}
                            className={`w-full px-2 py-2 rounded-[10px] border text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:outline-none ${overnight ? 'border-amber-300' : 'border-gray-200'}`}
                          />
                          {overnight && (
                            <span className="absolute -top-2.5 -right-1 text-[9px] font-bold bg-amber-400 text-amber-900 px-1 rounded-full leading-none py-0.5 shadow-sm border border-amber-300">
                              +1
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(row._key)}
                          disabled={dayForm.rows.length === 1 && !row.id}
                          className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add row */}
                <div className="px-6 pt-2">
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Agregar empleado
                  </button>
                </div>

                {/* Error */}
                {formError && (
                  <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-100 whitespace-pre-line">
                    {formError}
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 mt-2 border-t border-gray-100">
                  <button
                    type="button" onClick={handleCloseModal} disabled={submitting}
                    className="px-4 py-2 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors flex items-center gap-1.5"
                  >
                    {submitting ? <span className="btn-spinner" /> : null}
                    {submitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

