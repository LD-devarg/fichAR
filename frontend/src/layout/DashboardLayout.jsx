import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="flex bg-[#f9f9f9] min-h-screen">
      {/* Panel Izquierdo: Sidebar Responsive */}
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Contenedor Derecho: Topbar y Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* Barra superior de herramientas y header */}
        <Topbar handleDrawerToggle={handleDrawerToggle} />
        
        {/* Aquí es donde React Router inyecta la página activa dinámicamente */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
