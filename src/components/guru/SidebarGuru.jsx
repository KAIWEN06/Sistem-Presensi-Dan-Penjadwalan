import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import logo from "../../assets/foto/logo.png";

export default function SidebarGuru({
  isSidebarOpen,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const menus = [
    { name: "Beranda", icon: "ti ti-home", path: "/guru" },
    { name: "Kelola Presensi", icon: "ti ti-book", path: "/guru/presensi" },
    { name: "Riwayat Presensi", icon: "ti ti-history-toggle", path: "/guru/riwayat" },
    { name: "Lihat Jadwal", icon: "ti ti-calendar-event", path: "/guru/jadwal" },
    { name: "Lihat Laporan", icon: "ti ti-file-description", path: "/guru/laporan" },
  ];

  const closeSidebar = () => {
    if (typeof setIsMobileOpen === "function") {
      setIsMobileOpen(false);
    }
  };

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div className="h-[90px] border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 shrink-0">
            <img src={logo} alt="logo" className="w-full h-full object-contain" />
          </div>

          {(isSidebarOpen || mobile) && (
            <div className="animate-in fade-in duration-500">
              <h1 className="font-bold text-sm leading-tight">SD GMIM 12</h1>
              <p className="text-[10px] text-white/60">Sistem Presensi</p>
            </div>
          )}
        </div>

        {mobile && (
          <button
            onClick={closeSidebar}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1">
        {menus.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end={item.path === "/guru"}
            onClick={mobile ? closeSidebar : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all relative overflow-hidden ${
                isActive ? "bg-white text-[#3B3128] shadow-lg" : "text-white/80 hover:bg-white/10"
              }`
            }
          >
            <i className={`${item.icon} text-[22px] shrink-0 ${!isSidebarOpen && !mobile ? "mx-auto" : ""}`} />
            {(isSidebarOpen || mobile) && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <NavLink
          to="/login"
          onClick={mobile ? closeSidebar : undefined}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm hover:bg-red-500/20 transition-colors"
        >
          <i className="ti ti-logout text-[22px]" />
          {(isSidebarOpen || mobile) && <span>Keluar</span>}
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      <div
        onClick={closeSidebar}
        className={`lg:hidden fixed inset-0 bg-black/45 backdrop-blur-sm z-[119] transition-all duration-300 ${
          isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-[120] w-[280px] bg-[#3B3128] text-white shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent mobile />
      </aside>

      <aside
        className={`hidden lg:flex h-screen bg-[#3B3128] text-white flex-col shadow-2xl transition-all duration-300 relative overflow-hidden ${
          isSidebarOpen ? "w-[280px]" : "w-[88px]"
        }`}
      >
        <div className={`${isSidebarOpen ? "w-[280px]" : "w-[88px]"} h-full flex flex-col transition-all duration-300`}>
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}