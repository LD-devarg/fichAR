import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { CATALOG_TTL_MS, SHORT_TTL_MS, cachedGet } from '../services/requestCache';
import { CircularProgress } from '@mui/material';

function toIsoDate(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getShiftStart(turno) {
  return new Date(`${turno.fecha}T${turno.hora_inicio}`);
}

function sortShifts(a, b) {
  return getShiftStart(a) - getShiftStart(b);
}

const dayFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

function AdminDashboard() {
  const [sucursales, setSucursales] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [diasSemana, setDiasSemana] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayDate = new Date();
        const todayIso = toIsoDate(todayDate);

        const [sucursalesData, horariosData, usuariosData, diasData] = await Promise.all([
          cachedGet('empresa/sucursales/', { ttl: CATALOG_TTL_MS }),
          cachedGet(`horarios/?fecha=${todayIso}`, { ttl: SHORT_TTL_MS }),
          cachedGet('usuarios/', { ttl: CATALOG_TTL_MS }),
          cachedGet('core/dias-semana/', { ttl: CATALOG_TTL_MS }),
        ]);
        setSucursales(sucursalesData);
        setHorarios(horariosData);
        setUsuarios(usuariosData);
        setDiasSemana(diasData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();
  const isoDate = toIsoDate(today);

  const formatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: '2-digit', month: 'long' });
  const displayDate = formatter.format(today);
  const currentDayName = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(today);

  const shiftsToday = horarios.filter(h => h.fecha === isoDate);

  const normalize = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const diaObj = diasSemana.find(d => normalize(d.dia) === normalize(currentDayName));

  const elegibles = usuarios.filter(emp =>
    emp.is_active &&
    diaObj &&
    emp.configuracion_laboral?.dias_laborales?.includes(diaObj.id)
  );

  const asignadosIds = shiftsToday.map(t => t.empleado);
  const unassigned = elegibles.filter(emp => !asignadosIds.includes(emp.id));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <CircularProgress size={32} sx={{ color: '#111111' }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full py-2 px-4 md:px-6">
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Horarios del Día</h1>
        <p className="text-xs text-gray-500 capitalize mt-1">{displayDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sucursales.map(sucursal => {
          const sucursalShifts = shiftsToday.filter(h => h.sucursal === sucursal.id);

          return (
            <div key={sucursal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-md shadow-sm border border-gray-100">
                    <BuildingStorefrontIcon className="w-4 h-4 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-900">{sucursal.nombre}</h3>
                    <p className="text-[10px] text-gray-500">{sucursalShifts.length} {sucursalShifts.length === 1 ? 'turno' : 'turnos'}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 flex-1 overflow-y-auto max-h-[300px]">
                {sucursalShifts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-4 text-gray-400">
                    <UsersIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[11px]">Sin cobertura asignada</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sucursalShifts.map(shift => (
                      <div key={shift.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-medium">
                            {shift.username_empleado?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 leading-none">{shift.nombre_empleado || shift.username_empleado}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                              <ClockIcon className="w-3 h-3" />
                              {shift.hora_inicio.slice(0, 5)} - {shift.hora_fin.slice(0, 5)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-md shadow-sm border border-gray-100">
                <UsersIcon className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-900">Disponibles Hoy</h3>
                <p className="text-[10px] text-gray-500">Elegibles sin asignar</p>
              </div>
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto max-h-[300px]">
            {unassigned.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-4 text-gray-400">
                <span className="text-[11px]">No hay empleados disponibles</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unassigned.map(emp => (
                  <div key={emp.id} className="text-[11px] px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700 shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    {emp.nombre || emp.username}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard({ user }) {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurnos = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const startDate = toIsoDate(today);
        const endDate = toIsoDate(addDays(today, 14));
        const data = await cachedGet(`horarios/?start_date=${startDate}&end_date=${endDate}`, { ttl: SHORT_TTL_MS });
        setTurnos([...data].sort(sortShifts));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTurnos();
  }, []);

  const now = new Date();
  const proximoTurno = turnos.find((turno) => getShiftStart(turno) >= now) || turnos[0] || null;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <CircularProgress size={32} sx={{ color: '#111111' }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full py-2 px-4 md:px-6">
      <h1 className="text-xl font-light text-gray-900 mb-8 tracking-tight">Bienvenido, {user?.nombre || user?.username || 'Usuario'}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-gray-400 font-light uppercase tracking-widest mb-3">Próximo Turno</p>
          {proximoTurno ? (
            <>
              <p className="text-3xl font-light text-gray-900">
                {dayFormatter.format(new Date(`${proximoTurno.fecha}T00:00:00`))}
              </p>
              <div className="mt-3 space-y-1 text-sm text-gray-500 font-light">
                <p className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  {proximoTurno.hora_inicio.slice(0, 5)} - {proximoTurno.hora_fin.slice(0, 5)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  {proximoTurno.nombre_sucursal || 'Sucursal sin nombre'}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 font-light">Sin turnos asignados.</p>
          )}
        </div>

        <div className="bg-[#111111] p-6 rounded-xl shadow-md text-white flex flex-col justify-center">
          <p className="text-xs text-gray-400 font-light uppercase tracking-widest mb-4">Reloj de Ingreso</p>
          <Link to="/dashboard/asistencia" className="w-full bg-white text-black font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors shadow-sm text-center">
            Ir a Fichaje
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-light text-gray-900">Mis turnos</h2>
              <p className="text-xs text-gray-500 mt-1">Próximos 14 días</p>
            </div>
            <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
          </div>

          {turnos.length === 0 ? (
            <div className="px-5 py-12 text-center text-[12px] xl:text-[14px] text-gray-500">
              No tenés turnos asignados para los próximos días.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Día</th>
                    <th className="px-5 py-3 font-medium">Horario</th>
                    <th className="px-5 py-3 font-medium">Sucursal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {turnos.map((turno) => (
                    <tr key={turno.id} className="text-[12px] xl:text-[14px] text-gray-700">
                      <td className="px-5 py-3 capitalize">
                        {dayFormatter.format(new Date(`${turno.fecha}T00:00:00`))}
                      </td>
                      <td className="px-5 py-3 text-gray-900">
                        {turno.hora_inicio.slice(0, 5)} - {turno.hora_fin.slice(0, 5)}
                      </td>
                      <td className="px-5 py-3">
                        {turno.nombre_sucursal || 'Sin sucursal'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-light text-gray-800 mb-4">Avisos Recientes</h3>
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">Sin avisos por el momento.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useContext(AuthContext);

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard user={user} />;
}
