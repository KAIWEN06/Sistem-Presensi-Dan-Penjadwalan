import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const UserDropdown = ({ nama, role, avatar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Avatar yang bisa diklik */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#715445] text-white font-bold sm:h-11 sm:w-11 shrink-0 transition-all active:scale-95 hover:opacity-90 shadow-sm"
      >
        {avatar}
      </button>

      {/* Menu Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[999] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
          {/* Header Info di dalam Dropdown */}
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#715445] flex items-center justify-center text-white font-bold text-xl">
              {avatar}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold text-gray-800">{nama}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{role}</span>
            </div>
          </div>
          
          {/* List Menu */}
          <div className="p-2">
            <NavLink to="/login">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium">
                <LogOut size={18} />
                Keluar Sistem
              </button>
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;