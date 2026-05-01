import React from 'react';
import { IconButton } from '@mui/material';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';

export default function AppTopbar({ handleDrawerToggle, title = 'Vision General' }) {
  return (
    <header className="h-[72px] bg-white bg-opacity-90 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 w-full">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <IconButton onClick={handleDrawerToggle} edge="start" color="inherit">
            <Bars3Icon className="w-6 h-6 text-gray-800" />
          </IconButton>
        </div>

        <h2 className="text-lg font-light text-gray-800 hidden sm:block tracking-wide">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <IconButton size="small">
          <div className="relative">
            <BellIcon className="w-5 h-5 text-gray-600" />
            <span className="absolute top-0 right-0 block h-1.5 w-1.5 rounded-full ring-2 ring-white bg-[#111111]" />
          </div>
        </IconButton>
      </div>
    </header>
  );
}
