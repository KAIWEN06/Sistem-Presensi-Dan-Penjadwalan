import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import api from "../lib/axios";
import UserDropdown from "./common/UserDropdown";

export default function AppHeader({
  isSidebarOpen,
  setIsSidebarOpen,
  openMobileSidebar,
  setIsMobileOpen, // support baru tanpa merusak lama
}) {
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [clock, setClock] = useState("");
  const [dateNow, setDateNow] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch (err) {
        console.log(err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setClock(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " WITA"
      );

      setDateNow(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateTime();

    const timer = setInterval(
      updateTime,
      1000
    );

    return () =>
      clearInterval(timer);
  }, []);

  const pageMeta = {
    "/admin": {
      title: "Beranda",
      desc: "Panel administrator",
    },
    "/admin/murid": {
      title: "Kelola Murid",
      desc: "Manajemen data siswa",
    },
    "/admin/guru": {
      title: "Kelola Guru",
      desc: "Manajemen tenaga pengajar",
    },
    "/admin/mapel": {
      title: "Kelola Mapel",
      desc: "Manajemen mata pelajaran",
    },
    "/admin/kelas": {
      title: "Kelola Kelas",
      desc: "Manajemen data kelas",
    },
    "/admin/jadwal": {
      title: "Kelola Jadwal",
      desc: "Atur jadwal pembelajaran",
    },
    "/admin/akun": {
      title: "Kelola Akun",
      desc: "Manajemen akun pengguna",
    },

    "/ortu": {
      title: "Beranda",
      desc: "Dashboard orang tua",
    },
    "/ortu/lihat-presensi": {
      title: "Lihat Presensi",
      desc: "Riwayat kehadiran anak",
    },
    "/ortu/lihat-jadwal": {
      title: "Lihat Jadwal",
      desc: "Jadwal pelajaran anak",
    },

    "/guru": {
      title: "Beranda",
      desc: "Dashboard guru",
    },
    "/guru/presensi": {
      title: "Kelola Presensi",
      desc: "Input kehadiran siswa",
    },
    "/guru/riwayat": {
      title: "Riwayat Presensi",
      desc: "Riwayat absensi kelas",
    },
    "/guru/jadwal": {
      title: "Lihat Jadwal",
      desc: "Jadwal mengajar",
    },
    "/guru/laporan": {
      title: "Lihat Laporan",
      desc: "Laporan presensi",
    },
  };

  const current =
    pageMeta[location.pathname] || {
      title: "Dashboard",
      desc: "Sistem akademik sekolah",
    };

  const nama =
    user?.nama || "Memuat...";
  const role =
    user?.role || "user";

  const avatar = nama
    .charAt(0)
    .toUpperCase();

  const handleToggle = () => {
    const isMobile =
      window.innerWidth < 1024;

    // MOBILE
    if (isMobile) {
      if (
        typeof setIsMobileOpen ===
        "function"
      ) {
        setIsMobileOpen(true);
        return;
      }

      if (
        typeof openMobileSidebar ===
        "function"
      ) {
        openMobileSidebar();
        return;
      }
    }

    // DESKTOP
    if (
      typeof setIsSidebarOpen ===
      "function"
    ) {
      setIsSidebarOpen(
        !isSidebarOpen
      );
    }
  };

  return (
    <header className="mb-4 md:mb-6 rounded-3xl border border-white/60 bg-gradient-to-r from-[#f5f5f5] via-[#ececec] to-[#f8f8f8] shadow-md px-3 sm:px-5 md:px-7 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={handleToggle}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow transition-all active:scale-95 hover:bg-gray-50"
          >
            <Menu size={22} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-gray-800 sm:text-xl md:text-3xl">
              {current.title}
            </h1>

            <p className="hidden truncate text-xs text-gray-500 sm:block md:text-sm">
              {current.desc}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden text-right md:block">
            <p className="text-sm font-bold text-gray-700">{clock}</p>
            <p className="text-xs capitalize text-gray-500">{dateNow}</p>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-300 pl-3 sm:gap-3 sm:pl-5">
            {/* GANTI BAGIAN INI DENGAN USERDROPDOWN */}
            <UserDropdown 
              nama={nama} 
              role={role} 
              avatar={avatar} 
            />

            {/* Nama tetap muncul di samping avatar pada layar desktop (sm ke atas) */}
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase text-gray-400">
                {role}
              </p>
              <p className="max-w-[160px] truncate text-sm font-bold text-gray-800">
                {nama}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}