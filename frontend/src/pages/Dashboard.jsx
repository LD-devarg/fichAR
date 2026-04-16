import React, { useContext } from 'react';
import { AuthContext } from '../context/auth-context';

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-5xl mx-auto py-2">
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
            
            {/* Acción Rápida - Call to Action Negro Sofisticado */}
            <div className="bg-[#111111] p-6 rounded-xl shadow-md text-white flex flex-col justify-center">
                <p className="text-xs text-gray-400 font-light uppercase tracking-widest mb-4">Reloj de Ingreso</p>
                <button className="w-full bg-white text-black font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
                    Fichar Entrada AHORA
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
