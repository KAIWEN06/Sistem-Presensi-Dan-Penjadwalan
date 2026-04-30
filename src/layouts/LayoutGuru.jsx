// LayoutGuru.jsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/guru/SidebarGuru";
import AppHeader from "../components/AppHeader";
import FooterGuru from "../components/Footer";

// SAFE RESPONSIVE LAYOUT
// MOBILE DRAWER READY
// DESKTOP FULL HIDE READY
// NO OVERFLOW SMALL SCREEN
// PREMIUM PANEL STRUCTURE
// PRODUCTION READY

export default function LayoutGuru() {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(true);

  const [isMobileOpen, setIsMobileOpen] =
    useState(false);

  return (
    <div className="flex h-screen bg-[#ECEBEB] text-gray-800 overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar
        isSidebarOpen={
          isSidebarOpen
        }
        isMobileOpen={
          isMobileOpen
        }
        setIsMobileOpen={
          setIsMobileOpen
        }
      />

      {/* CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="shrink-0 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pt-5">
          <AppHeader
            isSidebarOpen={
              isSidebarOpen
            }
            setIsSidebarOpen={
              setIsSidebarOpen
            }
            setIsMobileOpen={
              setIsMobileOpen
            }
          />
        </div>

        {/* MAIN SCROLL AREA */}
        <main
          className="
            flex-1
            min-h-0
            overflow-y-auto
            overflow-x-hidden
            no-scrollbar

            px-3 pb-4 pt-3
            sm:px-4 sm:pb-5 sm:pt-4
            lg:px-6 lg:pb-6 lg:pt-5
          "
        >
          <div className="w-full max-w-full">
            <Outlet />
          </div>
        </main>

        {/* FOOTER */}
        <div className="shrink-0">
          <FooterGuru />
        </div>
      </div>
    </div>
  );
}