import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import AppHeader from "./AppHeader";
import AdminFooter from "../components/admin/FooterAdmin";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen flex bg-[#ECEBEB] text-gray-800 overflow-hidden">
      {/* 1. OVERLAY - WAJIB ADA DI LUAR && AGAR ANIMASI BLUR JALAN */}
      <div
        onClick={() => setIsMobileSidebarOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/45 backdrop-blur-sm z-[119] transition-all duration-300 ${
          isMobileSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* 2. DESKTOP SIDEBAR */}
      <div className="hidden lg:block h-full">
        <AdminSidebar isSidebarOpen={isSidebarOpen} mobile={false} />
      </div>

      {/* 3. MOBILE SIDEBAR */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-[120] w-[280px] transition-transform duration-300 ease-out bg-[#3B3128] ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar
          isSidebarOpen={true}
          mobile={true}
          closeSidebar={() => setIsMobileSidebarOpen(false)}
        />
      </aside>

      {/* 4. CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 md:p-6">
          <AppHeader
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            openMobileSidebar={() => setIsMobileSidebarOpen(true)}
            setIsMobileOpen={setIsMobileSidebarOpen}
          />
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}