import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/auth-context';
import { BuildingStorefrontIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { CircularProgress } from '@mui/material';

function AdminDashboard() {
  const [sucursales, setSucursales] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayDate = new Date();
        const todayIso = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;
        
        const [sucRes, horRes] = await Promise.all([
          api.get('empresa/sucursales/'),
          api.get(`horarios/?fecha=${todayIso}`)
        ]);
        setSucursales(sucRes.data);
        setHorarios(horRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();
  const isoDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const formatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: '2-digit', month: 'long' });
  const displayDate = formatter.format(today);

  const shiftsToday = horarios.filter(h => h.fecha === isoDate);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <CircularProgress size={32} sx={{ color: '#111111' }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full py-2 px-4 md:px-6">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight">Horarios del Día</h1>
        <p className="text-sm text-gray-500 capitalize mt-1">{displayDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sucursales.map(sucursal => {
          const sucursalShifts = shiftsToday.filter(h => h.sucursal === sucursal.id);

          return (
            <div key={sucursal.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <BuildingStorefrontIcon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{sucursal.nombre}</h3>
                    <p className="text-xs text-gray-500">{sucursalShifts.length} {sucursalShifts.length === 1 ? 'turno hoy' : 'turnos hoy'}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1">
                {sucursalShifts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-gray-400">
                    <UsersIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">Sin cobertura asignada</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sucursalShifts.map(shift => (
                      <div key={shift.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium">
                            {shift.username_empleado?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{shift.nombre_empleado || shift.username_empleado}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <ClockIcon className="w-3.5 h-3.5" />
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
      </div>
    </div>
  );
}

function EmployeeDashboard({ user }) {
  return (
    <div className="w-full h-full py-2 px-4 md:px-6">
      <h1 className="text-3xl font-light text-gray-900 mb-8 tracking-tight">Bienvenido, {user?.nombre || user?.username || 'Usuario'}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-gray-400 font-light uppercase tracking-widest mb-1.5">Horas Semanales</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-light text-gray-900">38.5</p>
            <span className="text-sm font-light text-gray-500">/ 45 hs</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-gray-400 font-light uppercase tracking-widest mb-1.5">Próximo Turno</p>
          <p className="text-3xl font-light text-gray-900">Mañ, 09:00</p>
          <p className="text-sm text-gray-500 font-light mt-1">Sucursal Centro</p>
        </div>

        {/* Acción Rápida */}
        <div className="bg-[#111111] p-6 rounded-xl shadow-md text-white flex flex-col justify-center">
          <p className="text-xs text-gray-400 font-light uppercase tracking-widest mb-4">Reloj de Ingreso</p>
          <button className="w-full bg-white text-black font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
            Ir a Fichaje
          </button>
        </div>
      </div>

      {/* Bloque Extra Minimalista */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
        <h3 className="text-lg font-light text-gray-800 mb-4">Avisos Recientes</h3>
        <div className="py-3 border-b border-gray-50">
          <p className="text-sm font-medium text-gray-800">Recibo de Sueldo (Abril) generado.</p>
          <p className="text-xs text-gray-500 font-light mt-0.5">Hace 2 horas</p>
        </div>
        <div className="py-3">
          <p className="text-sm font-medium text-gray-800">Cambio de Horario Sábado.</p>
          <p className="text-xs text-gray-500 font-light mt-0.5">La apertura será a las 10:00.</p>
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
