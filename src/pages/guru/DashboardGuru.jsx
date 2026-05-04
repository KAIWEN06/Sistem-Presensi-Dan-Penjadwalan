import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaBook,
  FaUsers,
  FaArrowRight,
  FaSyncAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { todayManado } from "../../utils/timezone";

// PREMIUM UI UPGRADE
// TOAST SYSTEM READY
// LOADING NOTIFICATION READY
// SUCCESS ERROR FEEDBACK READY
// MOBILE SAFE TOOLBAR FIX
// NO OVERFLOW SMALL SCREEN
// SAFE RESPONSIVE REFACTOR
// PRODUCTION READY

const DashboardGuru = () => {
  const navigate = useNavigate();

  const [jadwalHariIni, setJadwalHariIni] = useState([]);
  const [jadwalBesok, setJadwalBesok] = useState([]);

  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalMengajar: 0,
    sudahPresensi: 0,
    belumPresensi: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboard = async (silent = false) => {
    try {
      setLoading(true);

      let toastId;

      if (!silent) {
        toastId = toast.loading("Memuat dashboard...");
      }

      const res = await api.get("/guru/dashboard");

      setJadwalHariIni(res.data.jadwalHariIni || []);
      setJadwalBesok(res.data.jadwalBesok || []);

      setStats({
        totalSiswa: res.data.totalSiswa || 0,
        totalMengajar: res.data.totalMengajar || 0,
        sudahPresensi: res.data.sudahPresensi || 0,
        belumPresensi: res.data.belumPresensi || 0,
      });

      if (!silent) {
        toast.success("Dashboard berhasil dimuat", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error(error);

      toast.error("Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    fetchDashboard();
  };

  const handleOpenPresensi = (item) => {
    toast.success("Membuka presensi...");

    navigate("/guru/presensi", {
      state: {
        autoSelect: item,
        tanggal: todayManado(),
      },
    });
  };

const statusBadge = (status, is_libur) => {
  if (is_libur) {
    return (
      <span className="inline-flex items-center px-3 rounded-full text-xs font-bold bg-red-100 text-red-600">
        Libur
      </span>
    );
  }

  const done = status === "sudah";

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 min-h-[38px] px-3 rounded-full text-xs font-bold whitespace-nowrap ${
        done
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {done ? <FaCheckCircle /> : <FaClock />}
      {done ? "Sudah" : "Belum"}
    </span>
  );
};

  const StatCard = ({
    title,
    value,
    icon,
    bg,
    color,
  }) => (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0 ${bg} ${color}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500 font-semibold truncate">
            {title}
          </p>

          <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
            {value}
          </h3>
        </div>
      </div>
    </div>
  );

  const Skeleton = () => (
    <div className="rounded-3xl bg-white border border-gray-100 p-5 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
      <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
      <div className="h-4 w-full bg-gray-100 rounded" />
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Mengajar Hari Ini"
          value={stats.totalMengajar}
          icon={<FaBook />}
          bg="bg-[#715445]/10"
          color="text-[#715445]"
        />

        <StatCard
          title="Total Siswa"
          value={stats.totalSiswa}
          icon={<FaUsers />}
          bg="bg-blue-100"
          color="text-blue-600"
        />

        <StatCard
          title="Sudah Presensi"
          value={stats.sudahPresensi}
          icon={<FaCheckCircle />}
          bg="bg-emerald-100"
          color="text-emerald-600"
        />

        <StatCard
          title="Belum Presensi"
          value={stats.belumPresensi}
          icon={<FaClock />}
          bg="bg-amber-100"
          color="text-amber-600"
        />
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="xl:col-span-2 rounded-3xl border border-gray-100 bg-[#f8f6f4] p-4 sm:p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">
              Jadwal Hari Ini
            </h2>

            <p className="text-sm text-gray-500">
              Tap kartu jadwal untuk membuka presensi.
            </p>
          </div>

          {loading ? (
            <>
              <Skeleton />
              <Skeleton />
            </>
          ) : jadwalHariIni.length > 0 ? (
            jadwalHariIni.map((item, i) => (
              <button
                key={i}
                disabled={item.is_libur}
                onClick={() => handleOpenPresensi(item)}
                className={`w-full text-left rounded-3xl p-4 sm:p-5 transition-all ${
                  item.is_libur
                    ? "bg-red-50 border-red-200 cursor-not-allowed opacity-70"
                    : "bg-white border-gray-100 hover:shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-[#715445]">
                      {item.jam}
                    </p>

                    <p className="text-sm sm:text-base text-gray-700 font-semibold">
                      {item.kelas}
                    </p>

                    {item.is_libur && (
                      <p className="text-red-500 text-xs font-bold mt-1">
                        Libur: {item.keterangan_libur}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {statusBadge(item.status, item.is_libur)}


                    <span className="w-10 h-10 rounded-2xl bg-[#715445] text-white inline-flex items-center justify-center">
                      <FaArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-3xl bg-white border border-dashed border-gray-200 p-10 text-center text-gray-500">
              Tidak ada jadwal hari ini.
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center">
              <FaCalendarAlt />
            </div>

            <div>
              <h2 className="font-black text-gray-900">
                Jadwal Besok
              </h2>

              <p className="text-sm text-gray-500">
                {jadwalBesok.length} kelas tersedia
              </p>
            </div>
          </div>

          {loading ? (
            <>
              <Skeleton />
            </>
          ) : jadwalBesok.length > 0 ? (
            jadwalBesok.map((item, i) => (
              <div
                key={i}
                className="rounded-3xl bg-gray-50 border border-gray-100 p-4"
              >
                <p className="font-black text-[#715445]">
                  {item.jam}
                </p>

                <p className="text-sm text-gray-700 font-medium mt-1">
                  {item.kelas}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-3xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              Tidak ada jadwal besok.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardGuru;