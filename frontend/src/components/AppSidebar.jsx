import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer, IconButton } from '@mui/material';
import { AuthContext } from '../context/auth-context';
import {
  HomeIcon,
  ClockIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowLeftStartOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const SidebarContent = ({ handleDrawerToggle, mobile }) => {
  const { user, isAdmin, isEmpleado, logout } = useContext(AuthContext);

  const menus = [
    { name: 'Inicio', path: '/dashboard', icon: HomeIcon, end: true, show: true },
    {
      name: 'Fichaje Diario',
      path: '/dashboard/asistencia',
      icon: ClockIcon,
      end: false,
      show: isEmpleado || isAdmin,
    },
    {
      name: isAdmin ? 'Sueldos' : 'Mis Recibos',
      path: '/dashboard/sueldos',
      icon: CurrencyDollarIcon,
      end: false,
      show: true,
    },
    {
      name: 'Planilla Horaria',
      path: '/dashboard/horarios',
      icon: CalendarDaysIcon,
      end: false,
      show: true,
    },
    {
      name: 'Panel Gestion',
      path: '/dashboard/admin',
      icon: UsersIcon,
      end: false,
      show: isAdmin,
    },
  ];

  const visibleMenus = menus.filter((menu) => menu.show);

  return (
    <div className="h-full flex flex-col bg-white text-gray-800 w-64 border-r border-gray-100 shadow-sm relative">
      {mobile && (
        <div className="absolute top-4 right-4 md:hidden">
          <IconButton onClick={handleDrawerToggle}>
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </IconButton>
        </div>
      )}

      <div className="h-20 flex flex-col items-center justify-center border-b border-gray-50 bg-[#fafafa]">
        <img src="/logo-fichar.png" className="h-20 w-20" alt="Logo de marca FichAR" />
      </div>

      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
        {visibleMenus.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              end={item.end}
              to={item.path}
              onClick={mobile ? handleDrawerToggle : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-lg font-light text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 group'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-800'}`} />
                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-gray-100 bg-[#fafafa]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex flex-shrink-0 items-center justify-center text-sm font-medium text-gray-700">
              {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{user.nombre}</p>
              <p className="text-xs text-gray-500 font-light truncate">
                {isAdmin ? 'Administrador' : 'Empleado'}
              </p>
            </div>
            <IconButton onClick={logout} size="small" aria-label="Cerrar Sesión" sx={{ color: '#ef4444', ml: 'auto', '&:hover': { bgcolor: '#fef2f2' } }}>
              <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AppSidebar({ mobileOpen, handleDrawerToggle }) {
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 256, border: 'none' },
        }}
      >
        <SidebarContent handleDrawerToggle={handleDrawerToggle} mobile />
      </Drawer>

      <div className="hidden md:flex flex-col w-64 flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}
