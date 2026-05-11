import React, {
  useState,
  useEffect,
  useMemo
} from "react";

import {
  Users,
  GraduationCap,
  BookOpen,
  School,
  CalendarDays,
  User,
  CalendarCheck,
  CalendarRange,
  ChevronRight,
  Clock,
  Sparkles,
  RefreshCcw
} from "lucide-react";

import toast from "react-hot-toast";
import api from "../../lib/axios";
import ScheduleCard from "../../components/ScheduleCard";

// PREMIUM UI UPGRADE
const glassCard =
  "bg-white/90 backdrop-blur-sm border border-white/70";

const hoverLift =
  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg";

const softBtn =
  `
  min-h-[44px]
  px-4 py-2.5
  rounded-2xl
  text-xs sm:text-sm
  font-semibold
  border border-black/5
  bg-white
  hover:bg-zinc-50
  active:scale-[0.98]
  shadow-sm
  transition-all duration-200
  flex items-center justify-center gap-2
`;

const primaryBtn =
  `
  min-h-[44px]
  px-4 py-2.5
  rounded-2xl
  text-xs sm:text-sm
  font-semibold
  bg-[#715445]
  text-white
  hover:bg-[#5e4336]
  active:scale-[0.98]
  shadow-lg shadow-[#715445]/15
  transition-all duration-200
  flex items-center justify-center gap-2
`;

// PREMIUM UI UPGRADE
const StatCard = ({
  count,
  label,
  subLabel,
  icon: Icon,
  iconBg,
  tint
}) => (
  <div
    className={`
      ${glassCard}
      ${hoverLift}
      rounded-3xl p-4 sm:p-5 lg:p-6
      min-h-[110px]
      relative overflow-hidden
    `}
  >
    <div
      className={`absolute inset-0 opacity-70 ${tint}`}
    />

    <div className="relative z-10 flex items-center gap-4">
      <div
        className={`
          ${iconBg}
          w-12 h-12 sm:w-14 sm:h-14 rounded-2xl
          text-white flex items-center justify-center
          shadow-md shrink-0
        `}
      >
        <Icon size={22} />
      </div>

      <div className="min-w-0">
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {count}
        </h3>

        <p className="text-sm sm:text-[15px] font-semibold text-gray-800 truncate">
          {label}
        </p>

        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 truncate">
          {subLabel}
        </p>
      </div>
    </div>
  </div>
);

// TABLE TO CARD RESPONSIVE

const RowIcon = ({
  icon: Icon,
  text
}) => (
  <div className="flex items-start gap-3">
    <Icon
      size={14}
      className="mt-0.5 shrink-0 text-[#715445]"
    />
    <span className="break-words">
      {text}
    </span>
  </div>
);

// SAFE RESPONSIVE REFACTOR
const AdminBeranda = () => {
  const [stats, setStats] =
    useState({
      murid: "-",
      guru: "-",
      mapel: "-",
      kelas: "-"
    });
  
  const [infoLibur, setInfoLibur] = useState(null);

  const [jadwalHariIni, setJadwalHariIni] =
    useState([]);

  const [jadwalMinggu, setJadwalMinggu] =
    useState([]);

  const [loadingStats, setLoadingStats] =
    useState(true);

  const [loadingJadwal, setLoadingJadwal] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [showAllHari, setShowAllHari] =
    useState(false);

  const [showAllMinggu, setShowAllMinggu] =
    useState(false);

  const tglFormatted =
    new Date().toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).toUpperCase();

  const rangeMinggu =
    useMemo(() => {
      const now = new Date();
      const day = now.getDay();
      const diff =
        day === 0 ? -6 : 1 - day;

      const monday =
        new Date(now);

      monday.setDate(
        now.getDate() + diff
      );

      const sunday =
        new Date(monday);

      sunday.setDate(
        monday.getDate() + 6
      );

      const format = (d) =>
        d.toLocaleDateString(
          "id-ID",
          {
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        );

      return `${format(
        monday
      )} - ${format(sunday)}`;
    }, []);

  const fetchData =
    async (silent = false) => {
      try {
        if (!silent) {
          setLoadingStats(true);
          setLoadingJadwal(true);
        }

        const [
          statsRes,
          hariRes,
          mingguRes
        ] =
          await Promise.all([
            api.get(
              "/admin/dashboard"
            ),
            api.get(
              "/admin/jadwal/hari-ini"
            ),
            api.get(
              "/admin/jadwal/minggu-ini"
            )
          ]);

        setStats(
          statsRes.data || {}
        );

        setJadwalHariIni(hariRes.data?.data || []);

        setInfoLibur({
          isLibur: hariRes.data?.isLibur,
          keterangan: hariRes.data?.keterangan
        });

        setJadwalMinggu(
          mingguRes.data || []
        );
      } catch (err) {
        toast.error(
          "Gagal memuat dashboard"
        );
      } finally {
        setLoadingStats(false);
        setLoadingJadwal(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  // TOAST SYSTEM READY
  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        const id =
          toast.loading(
            "Memperbarui data..."
          );

        await fetchData(true);

        toast.success(
          "Dashboard diperbarui",
          { id }
        );
      } catch {
        toast.error(
          "Gagal memperbarui data"
        );
      } finally {
        setRefreshing(false);
      }
    };

  const displayHari =
    showAllHari
      ? jadwalHariIni
      : jadwalHariIni.slice(0, 4);

  const urutHari = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu"
  ];

  const groupHari =
    urutHari.map((hari) => ({
      hari,
      data:
        jadwalMinggu.filter(
          (j) =>
            j.hari === hari
        )
    }));

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-7 animate-[fadeIn_.35s_ease]">

      {/* PREMIUM UI UPGRADE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          count={
            loadingStats
              ? "..."
              : stats.murid
          }
          label="Murid Aktif"
          subLabel="Total Murid"
          icon={Users}
          iconBg="bg-[#F2A65A]"
          tint="bg-gradient-to-br from-orange-50 to-transparent"
        />

        <StatCard
          count={
            loadingStats
              ? "..."
              : stats.guru
          }
          label="Guru Aktif"
          subLabel="Total Pengajar"
          icon={
            GraduationCap
          }
          iconBg="bg-[#58B26B]"
          tint="bg-gradient-to-br from-emerald-50 to-transparent"
        />

        <StatCard
          count={
            loadingStats
              ? "..."
              : stats.mapel
          }
          label="Mapel Aktif"
          subLabel="Total Pelajaran"
          icon={BookOpen}
          iconBg="bg-[#5B88C7]"
          tint="bg-gradient-to-br from-blue-50 to-transparent"
        />

        <StatCard
          count={
            loadingStats
              ? "..."
              : stats.kelas
          }
          label="Kelas Aktif"
          subLabel="Total Ruangan"
          icon={School}
          iconBg="bg-[#9B6BFF]"
          tint="bg-gradient-to-br from-purple-50 to-transparent"
        />
      </div>

      {/* MOBILE UX FIX */}
      <section className="rounded-3xl border border-black/5 bg-gradient-to-b from-white to-zinc-50 shadow-sm p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-5">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#715445]/10 flex items-center justify-center shrink-0">
              <CalendarCheck
                size={18}
                className="text-[#715445]"
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Jadwal Hari Ini
              </h3>

              <p className="text-xs text-gray-500 font-medium truncate">
                {tglFormatted}
              </p>
            </div>
          </div>

          {jadwalHariIni.length >
            4 && (
            <button
              onClick={() =>
                setShowAllHari(
                  !showAllHari
                )
              }
              className={
                softBtn
              }
            >
              {showAllHari
                ? "Ringkas"
                : "Lihat Semua"}
              <ChevronRight
                size={14}
              />
            </button>
          )}
        </div>

        {infoLibur?.isLibur && (
  <div className="mb-3 px-3 py-2 rounded-lg bg-red-100 text-red-600 text-sm font-semibold">
    Hari ini libur: {infoLibur.keterangan}
  </div>
)}

        {loadingJadwal ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map(
              (_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-3xl bg-gray-100 animate-pulse"
                />
              )
            )}
          </div>
        ) : displayHari.length ===
          0 ? (
          <div className="rounded-3xl bg-zinc-50 border border-dashed border-gray-200 py-14 text-center text-gray-400 font-semibold">
            Tidak Ada Jadwal Untuk Hari Ini
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
{displayHari.map((j) => (
  <ScheduleCard
    key={j.id}
    type={j.tipe}
    grade={j.kelas}
    day={j.hari}
    subject={j.mapel}
    teacher={j.guru}
    time={j.time}
    is_libur={j.is_libur}
    keterangan_libur={j.keterangan_libur}
    jenis={j.jenis}
  />
))}
          </div>
        )}
      </section>

      {/* SAFE RESPONSIVE REFACTOR */}
      <section className="rounded-3xl border border-black/5 bg-gradient-to-b from-white to-zinc-50 shadow-sm p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-6">
          <div className="flex gap-3 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-[#715445]/10 flex items-center justify-center shrink-0">
              <CalendarRange
                size={18}
                className="text-[#715445]"
              />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Jadwal Minggu Ini
              </h3>

              <p className="text-xs text-gray-500 font-medium">
                {rangeMinggu}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setShowAllMinggu(
                !showAllMinggu
              )
            }
            className={
              softBtn
            }
          >
            {showAllMinggu
              ? "Ringkas"
              : "Lihat Semua"}
            <ChevronRight
              size={14}
            />
          </button>
        </div>

        {loadingJadwal ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map(
              (_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-3xl bg-gray-100 animate-pulse"
                />
              )
            )}
          </div>
        ) : jadwalMinggu.length ===
          0 ? (
          <div className="rounded-3xl bg-zinc-50 border border-dashed border-gray-200 py-14 text-center text-gray-400 font-semibold">
            Belum Ada Jadwal
          </div>
        ) : (
          <div className="space-y-7">
            {groupHari.map(
              ({
                hari,
                data
              }) => {
                if (
                  data.length ===
                  0
                )
                  return null;

                const tampil =
                  showAllMinggu
                    ? data
                    : data.slice(
                        0,
                        2
                      );

                return (
                  <div
                    key={hari}
                  >
                    <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-[#715445] mb-3">
                      {hari}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {tampil.map(
                        (
                          j
                        ) => (
                        <ScheduleCard
                          key={j.id}
                          type={j.tipe}
                          grade={j.kelas}
                          day={j.hari}
                          subject={j.mapel}
                          teacher={j.guru}
                          time={j.time}
                          is_libur={j.is_libur}
                          keterangan_libur={j.keterangan_libur}
                          jenis={j.jenis}
                        />
                        )
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminBeranda;