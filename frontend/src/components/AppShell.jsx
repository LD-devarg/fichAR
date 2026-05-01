import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

export default function AppShell({ variant, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((current) => !current);
  };

  return (
    <div className="flex bg-[#f9f9f9] min-h-screen">
      <AppSidebar
        variant={variant}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AppTopbar title={title} handleDrawerToggle={handleDrawerToggle} />

        <main className="flex-1 p-4 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
