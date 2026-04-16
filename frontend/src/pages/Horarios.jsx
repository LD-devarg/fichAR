import React, { useContext, useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline';

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

function normalizeDayName(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getDayMeta(turno) {
  const normalized = normalizeDayName(turno.nombre_dia);
  const byName = DAY_ORDER.find((day) => day.key === normalized);
  if (byName) return byName;

  const dayFromId = DAY_ORDER[(Number(turno.dia) || 1) - 1];
  return dayFromId || DAY_ORDER[0];
}

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

function getWeekRangeLabel() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });

  return `${fmt.format(monday)} al ${fmt.format(sunday)}`;
}

function getEmployeeColor(name) {
  const seed = (name || 'empleado').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SHIFT_COLORS[seed % SHIFT_COLORS.length];
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

function groupTurnosByDay(turnos) {
  return DAY_ORDER.reduce((acc, day) => {
    acc[day.key] = turnos
      .filter((turno) => getDayMeta(turno).key === day.key)
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

function ShiftBlock({ turno, showSucursal }) {
  const empleado = turno.nombre_empleado || `Empleado #${turno.empleado}`;
  const colorClass = getEmployeeColor(empleado);

  return (
    <article className={`rounded-2xl border p-3 shadow-sm ${colorClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{empleado}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] opacity-70">{formatHourRange(turno)}</p>
        </div>
        <span className="rounded-full bg-white/75 px-2 py-1 text-[11px] font-medium">
          {getShiftDuration(turno).toFixed(1)} hs
        </span>
      </div>
      {showSucursal && (
        <p className="mt-3 flex items-center gap-1.5 text-xs opacity-75">
          <MapPinIcon className="h-3.5 w-3.5" />
          {turno.nombre_sucursal || `Sucursal #${turno.sucursal}`}
        </p>
      )}
    </article>
  );
}

function DayColumn({ day, turnos, emptyLabel, showSucursal }) {
  return (
    <section className="flex min-h-[18rem] flex-col rounded-[28px] border border-gray-200 bg-white/95 p-4 shadow-sm">
      <div className="mb-4 border-b border-gray-100 pb-3">
        <p className="text-xs uppercase tracking-[0.28em] text-gray-400">{day.short}</p>
        <h3 className="mt-1 text-lg font-light text-gray-950">{day.label}</h3>
        <p className="mt-1 text-xs text-gray-500">{turnos.length} turnos</p>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {turnos.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 text-center text-sm text-gray-400">
            {emptyLabel}
          </div>
        ) : (
          turnos.map((turno) => (
            <ShiftBlock key={turno.id} turno={turno} showSucursal={showSucursal} />
          ))
        )}
      </div>
    </section>
  );
}

export default function Horarios() {
  const { isAdmin } = useContext(AuthContext);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSucursal, setSelectedSucursal] = useState(null);

  useEffect(() => {
    const fetchHorarios = async () => {
      try {
        const res = await api.get('horarios/');
        setHorarios(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, []);

  const sucursales = buildSucursales(horarios);

  useEffect(() => {
    if (!isAdmin || sucursales.length === 0) return;
    if (selectedSucursal && sucursales.some((sucursal) => sucursal.id === selectedSucursal)) return;
    setSelectedSucursal(sucursales[0].id);
  }, [isAdmin, selectedSucursal, sucursales]);

  const planillaActual = isAdmin
    ? sucursales.find((sucursal) => sucursal.id === selectedSucursal) || null
    : {
        id: 'personal',
        name: 'Mi semana',
        turnos: horarios,
      };

  const turnosAgrupados = planillaActual ? groupTurnosByDay(planillaActual.turnos) : null;
  const resumen = planillaActual ? buildSummary(planillaActual.turnos) : null;
  const weekLabel = getWeekRangeLabel();

  return (
    <div className="max-w-[90rem] mx-auto py-2">
      <section className="overflow-hidden rounded-[32px] border border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f6f7fb_50%,#eef2ff_100%)] shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/85 px-3 py-1 text-xs uppercase tracking-[0.24em] text-gray-500">
                <CalendarDaysIcon className="h-4 w-4" />
                {weekLabel}
              </div>
              <h1 className="text-3xl font-light tracking-tight text-gray-950">Planilla Horaria</h1>
              <p className="mt-2 text-sm text-gray-600">
                {isAdmin
                  ? 'Vista semanal por sucursal.'
                  : 'Tu agenda semanal actual.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isAdmin && sucursales.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white/85 p-2">
                  {sucursales.map((sucursal) => {
                    const active = sucursal.id === selectedSucursal;
                    return (
                      <button
                        key={sucursal.id}
                        type="button"
                        onClick={() => setSelectedSucursal(sucursal.id)}
                        className={`rounded-xl px-4 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-gray-950 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {sucursal.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {isAdmin && (
                <button
                  type="button"
                  className="rounded-2xl bg-gray-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-black"
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
          <div className="px-6 py-8 md:px-8">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-[24px] border border-dashed border-gray-200 bg-white/85 px-5 py-5">
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
                  className="shrink-0 rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                >
                  + Asignar
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 md:px-8 md:py-8">
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={Squares2X2Icon}
                label="Turnos"
                value={resumen?.turnos ?? 0}
                helper={isAdmin ? 'Bloques visibles en la sucursal seleccionada.' : 'Turnos asignados en tu semana actual.'}
              />
              <SummaryCard
                icon={ClockIcon}
                label="Horas"
                value={`${(resumen?.horas ?? 0).toFixed(1)} hs`}
                helper="Suma estimada a partir de las franjas cargadas."
              />
              <SummaryCard
                icon={UsersIcon}
                label={isAdmin ? 'Personas' : 'Dias'}
                value={isAdmin ? resumen?.empleados ?? 0 : resumen?.dias ?? 0}
                helper={isAdmin ? 'Empleados distintos con cobertura en esta vista.' : 'Dias de la semana con al menos un turno asignado.'}
              />
              <SummaryCard
                icon={BuildingStorefrontIcon}
                label={isAdmin ? 'Sucursal' : 'Sucursales'}
                value={
                  isAdmin
                    ? planillaActual?.name || 'Sin sucursal'
                    : new Set(horarios.map((turno) => turno.nombre_sucursal || turno.sucursal)).size
                }
                helper={isAdmin ? 'La planilla siempre se enfoca en una sucursal por vez.' : 'Cantidad de sucursales donde tienes turnos esta semana.'}
              />
            </div>

            {isAdmin && planillaActual && (
              <div className="mb-8 rounded-[28px] border border-gray-200 bg-white/85 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Vista operativa</p>
                    <h2 className="mt-2 text-2xl font-light text-gray-950">{planillaActual.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      Cada columna representa un día. Dentro de cada bloque se ve directamente quién trabaja y en qué franja, sin separar horario y nombre en filas distintas.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    {resumen?.dias ?? 0} de 7 días con cobertura visible
                  </div>
                </div>
              </div>
            )}

            <div className="hidden xl:grid xl:grid-cols-7 xl:gap-4">
              {DAY_ORDER.map((day) => (
                <DayColumn
                  key={day.key}
                  day={day}
                  turnos={turnosAgrupados?.[day.key] || []}
                  emptyLabel={isAdmin ? 'Sin cobertura cargada para este día.' : 'No tienes turnos este día.'}
                  showSucursal={!isAdmin}
                />
              ))}
            </div>

            <div className="space-y-5 xl:hidden">
              {DAY_ORDER.map((day) => (
                <div key={day.key} className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-gray-400">{day.short}</p>
                      <h3 className="mt-1 text-xl font-light text-gray-950">{day.label}</h3>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                      {(turnosAgrupados?.[day.key] || []).length} turnos
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(turnosAgrupados?.[day.key] || []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center text-sm text-gray-400">
                        {isAdmin ? 'Sin cobertura cargada para este día.' : 'No tienes turnos este día.'}
                      </div>
                    ) : (
                      (turnosAgrupados?.[day.key] || []).map((turno) => (
                        <ShiftBlock key={turno.id} turno={turno} showSucursal={!isAdmin} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
