import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/auth-context';
import api from '../services/api';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, MapPinIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CircularProgress } from '@mui/material';

function getDeviationMinutes(plannedTime, actualTime) {
  if (!plannedTime || !actualTime) return 0;
  // plannedTime: "08:00"
  // actualTime: Date object
  const [pHours, pMins] = plannedTime.split(':').map(Number);
  const plannedDate = new Date(actualTime);
  plannedDate.setHours(pHours, pMins, 0, 0);

  const diffMs = actualTime.getTime() - plannedDate.getTime();
  return Math.round(diffMs / 60000);
}

function DeviationBadge({ minutes, type }) {
  if (minutes === 0) return <span className="text-gray-500 text-xs">A tiempo</span>;
  
  const isLate = minutes > 0;
  const isEarly = minutes < 0;
  const absMins = Math.abs(minutes);
  
  if (type === 'entrada') {
    if (isLate) return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md font-medium text-xs">+{absMins}m tarde</span>;
    if (isEarly) return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium text-xs">-{absMins}m temprano</span>;
  } else {
    if (isLate) return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium text-xs">+{absMins}m extra</span>;
    if (isEarly) return <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium text-xs">-{absMins}m antes</span>;
  }
}

export default function Asistencias() {
  const { isAdmin, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [asistencias, setAsistencias] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [dateOffset, setDateOffset] = useState(0);

  // Form state for Employees
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [clockingIn, setClockingIn] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAsistencia = async (targetIsoDate) => {
    try {
      setLoading(true);
      const [asistRes, horRes, sucRes] = await Promise.all([
        api.get(`asistencia/?fecha=${targetIsoDate}`),
        api.get(`horarios/?fecha=${targetIsoDate}`),
        api.get('empresa/sucursales/')
      ]);
      setAsistencias(asistRes.data);
      setHorarios(horRes.data);
      setSucursales(sucRes.data);
      if (sucRes.data.length > 0) {
        setSelectedSucursal(sucRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Date Math
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dateOffset);
  const isoDate = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;
  
  const formatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: '2-digit', month: 'short' });
  const displayDate = formatter.format(targetDate);

  useEffect(() => {
    fetchAsistencia(isoDate);
  }, [dateOffset]);

  const handleClockInOut = async (tipo) => {
    if (!selectedSucursal) {
      setFormError('Por favor selecciona una sucursal.');
      return;
    }
    setClockingIn(true);
    setFormError('');
    try {
      const res = await api.post('asistencia/', {
        sucursal: selectedSucursal,
        tipo_fichada: tipo
      });
      setAsistencias(prev => [res.data, ...prev]);
    } catch (err) {
      const msgs = err.response?.data ? Object.values(err.response.data).flat().join(', ') : 'Error al registrar fichaje.';
      setFormError(msgs);
    } finally {
      setClockingIn(false);
    }
  };

  // Process data for the target date
  // Data is already filtered by backend
  const shiftsToday = horarios;
  const clocksToday = asistencias;

  // Map employees to their deviations
  const employeeMap = {};

  shiftsToday.forEach(shift => {
    const empId = shift.empleado;
    if (!employeeMap[empId]) {
      employeeMap[empId] = {
        id: empId,
        nombre: shift.username_empleado || 'Desconocido', // Since it's nested from Horarios
        planned: [],
        actual: { entrada: null, salida: null }
      };
    }
    employeeMap[empId].planned.push(shift);
  });

  clocksToday.forEach(clock => {
    const empId = clock.empleado;
    if (!employeeMap[empId]) {
      employeeMap[empId] = {
        id: empId,
        nombre: clock.nombre_empleado || 'Desconocido',
        planned: [],
        actual: { entrada: null, salida: null }
      };
    }
    if (clock.tipo_fichada === 'entrada') {
      if (!employeeMap[empId].actual.entrada || new Date(clock.fecha_hora) < new Date(employeeMap[empId].actual.entrada.fecha_hora)) {
        employeeMap[empId].actual.entrada = clock;
      }
    } else {
      if (!employeeMap[empId].actual.salida || new Date(clock.fecha_hora) > new Date(employeeMap[empId].actual.salida.fecha_hora)) {
        employeeMap[empId].actual.salida = clock;
      }
    }
  });

  const deviationsList = Object.values(employeeMap).sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <CircularProgress size={32} sx={{ color: '#111111' }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full py-2 px-4 md:px-6">
      <div className="w-full">
        <div className="border-b border-gray-200 pb-3 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded border border-gray-200 bg-white overflow-hidden">
                <button onClick={() => setDateOffset(o => o - 1)} className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-700 border-x border-gray-100">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {displayDate}
                </div>
                <button onClick={() => setDateOffset(o => o + 1)} className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-medium tracking-tight text-gray-900">Control de Asistencia</h1>
              </div>
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Registrar Fichaje</h2>
            {formError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{formError}</div>}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación (Sucursal)</label>
                <select
                  value={selectedSucursal}
                  onChange={e => setSelectedSucursal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
                >
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleClockInOut('entrada')}
                  disabled={clockingIn}
                  className="flex-1 md:flex-none bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"
                >
                  Fichar Entrada
                </button>
                <button
                  onClick={() => handleClockInOut('salida')}
                  disabled={clockingIn}
                  className="flex-1 md:flex-none bg-white text-gray-900 border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Fichar Salida
                </button>
              </div>
            </div>
          </div>
        )}

        {deviationsList.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No hay turnos planificados ni fichajes registrados para este día.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Horario Planificado</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Entrada</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Salida</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deviationsList.map(emp => {
                    const planned = emp.planned[0]; // Assume 1 shift per day for simplicity in the view
                    const entrada = emp.actual.entrada;
                    const salida = emp.actual.salida;
                    
                    let devEntrada = 0;
                    let devSalida = 0;
                    
                    if (planned && entrada) {
                      devEntrada = getDeviationMinutes(planned.hora_inicio, new Date(entrada.fecha_hora));
                    }
                    if (planned && salida) {
                      devSalida = getDeviationMinutes(planned.hora_fin, new Date(salida.fecha_hora));
                    }

                    const formatTime = (isoString) => {
                      if (!isoString) return '--:--';
                      const d = new Date(isoString);
                      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                    };

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{emp.nombre}</div>
                          {planned && <div className="text-xs text-gray-500">{planned.nombre_sucursal || 'Sucursal'}</div>}
                        </td>
                        <td className="px-6 py-4">
                          {planned ? (
                            <div className="text-sm text-gray-700">
                              {planned.hora_inicio.slice(0,5)} - {planned.hora_fin.slice(0,5)}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Sin turno</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatTime(entrada?.fecha_hora)}</div>
                          {planned && entrada && <div className="mt-1"><DeviationBadge minutes={devEntrada} type="entrada" /></div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatTime(salida?.fecha_hora)}</div>
                          {planned && salida && <div className="mt-1"><DeviationBadge minutes={devSalida} type="salida" /></div>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {planned && !entrada && !salida ? (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium">
                              <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Ausente
                            </span>
                          ) : entrada && salida ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-medium">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Completado
                            </span>
                          ) : entrada ? (
                            <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium">
                              <ClockIcon className="w-3.5 h-3.5" /> Trabajando
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Fuera de horario</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
