import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import logo from "../../assets/foto/logo.png";

export default function SidebarOrtu({
  isSidebarOpen,
  mobile = false, 
  closeSidebar,
}) {
  const menus = [
    { name: "Beranda", icon: "ti ti-home", path: "/ortu" },
    { name: "Lihat Presensi", icon: "ti ti-book", path: "/ortu/lihat-presensi" },
    { name: "Lihat Jadwal", icon: "ti ti-calendar-event", path: "/ortu/lihat-jadwal" },
  ];

  return (
    <aside
      className={`
        h-screen bg-[#3B3128] text-white flex flex-col shadow-2xl
        transition-all duration-300
        ${
          mobile 
            ? "w-[280px]" // Lebar tetap di mobile
            : `${isSidebarOpen ? "w-[280px]" : "w-[88px]"}` // Respon di desktop
        }
      `}
    >
      {/* HEADER */}
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

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1">
        {menus.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end={item.path === "/ortu"}
            onClick={mobile ? closeSidebar : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all relative ${
                isActive ? "bg-white text-[#3B3128] shadow-lg" : "text-white/80 hover:bg-white/10"
              }`
            }
          >
            <i className={`${item.icon} text-[22px] shrink-0 ${!isSidebarOpen && !mobile ? "mx-auto" : ""}`} />
            {(isSidebarOpen || mobile) && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="p-3 border-t border-white/10">
        <NavLink
          to="/login"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm hover:bg-red-500/20 transition-colors"
        >
          <i className="ti ti-logout text-[22px]" />
          {(isSidebarOpen || mobile) && <span>Keluar</span>}
        </NavLink>
      </div>
    </aside>
  );
}