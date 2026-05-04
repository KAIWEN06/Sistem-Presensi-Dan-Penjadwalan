import { useState, useEffect } from "react";
import {
  User,
  ChevronRight,
  CheckCircle,
  Clock,
  CalendarDays,
  Play,
} from "lucide-react";
import api from "../../lib/axios";
const DashboardOrtu = () => {
  const [students, setStudents] = useState([]);
  const [selectedAnak, setSelectedAnak] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState({
    Hadir: 0,
    Izin: 0,
    Sakit: 0,
    Alpha: 0,
  });

  const [loadingData, setLoadingData] = useState(false);

  /* ================= LOAD DATA ANAK ================= */
  const loadAnak = async () => {
    try {
      const res = await api.get("/ortu/anak");
      const data = res.data || [];

      setStudents(data);

      if (data.length > 0) {
        setSelectedAnak(data[0]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= LOAD DASHBOARD ================= */
  const loadDashboard = async (nis) => {
    try {
      setLoadingData(true);

      const res = await api.get(`/ortu/dashboard/${nis}`);

      const hariIni = res.data?.hariIni || [];
      const ringkasan = res.data?.ringkasan || {};
      const updateTerakhir =
        res.data?.updateTerakhir || "-";
setTimeout(() => {
  setSubjects(hariIni);

  setSummary({
    Hadir: ringkasan.Hadir || 0,
    Izin: ringkasan.Izin || 0,
    Sakit: ringkasan.Sakit || 0,
    Alpha: ringkasan.Alpha || 0,
  });

  setLastUpdate(updateTerakhir);

  setLoadingData(false);
}, 450);
    } catch (err) {
      console.log(err);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAnak();
  }, []);

  useEffect(() => {
    if (selectedAnak?.nis) {
      loadDashboard(selectedAnak.nis);
    }
  }, [selectedAnak]);

  // ================= STATUS DINAMIS =================
const statusUtama =
  subjects.some((x) => x.status?.toLowerCase() === "sakit")
    ? "Sakit"
    : subjects.some((x) => x.status?.toLowerCase() === "izin")
    ? "Izin"
    : subjects.length > 0
    ? "Hadir"
    : "-";

// ================= WARNA DINAMIS =================
const statusTheme = {
  Hadir: {
    card: "bg-green-50 border border-green-200",
    iconBox: "bg-green-100",
    icon: "text-green-600",
    text: "text-green-600",
  },

  Izin: {
    card: "bg-yellow-50 border border-yellow-200",
    iconBox: "bg-yellow-100",
    icon: "text-yellow-600",
    text: "text-yellow-600",
  },

  Sakit: {
    card: "bg-red-50 border border-red-200",
    iconBox: "bg-red-100",
    icon: "text-red-600",
    text: "text-red-600",
  },

  "-": {
    card: "bg-gray-50 border border-gray-200",
    iconBox: "bg-gray-100",
    icon: "text-gray-500",
    text: "text-gray-500",
  },
};

const theme = statusTheme[statusUtama];


/* ================= HITUNG STATUS HARI INI ================= */
const hadirHariIni = subjects.filter(
  (x) => x.status?.toLowerCase() === "hadir"
).length;

const izinHariIni = subjects.filter(
  (x) => x.status?.toLowerCase() === "izin"
).length;

const sakitHariIni = subjects.filter(
  (x) => x.status?.toLowerCase() === "sakit"
).length;

const alphaHariIni = subjects.filter(
  (x) =>
    x.status?.toLowerCase() === "alpha" ||
    x.status?.toLowerCase() === "alpa"
).length;

/* ================= UPDATE TERAKHIR ================= */
const [lastUpdate, setLastUpdate] =
  useState("-");

  return (
    <div className="space-y-6">

      {/* ================= PILIH ANAK ================= */}
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4 min-w-max">

          {students.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelectedAnak(s)}
              className={`
                min-w-[240px] rounded-2xl border p-4 text-left
                transition-all duration-200 shadow-sm
                ${
                  selectedAnak?.nis === s.nis
                    ? "bg-white border-[#5A3E36] ring-2 ring-[#E8DDD8]"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div className="flex items-center gap-3">

                <div
                  className={`
                    w-11 h-11 rounded-xl flex items-center justify-center
                    ${
                      selectedAnak?.nis === s.nis
                        ? "bg-[#EEE7E4]"
                        : "bg-gray-100"
                    }
                  `}
                >
                  <User className="w-5 h-5 text-[#5A3E36]" />
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {s.nama}
                  </p>

                  <p className="text-sm text-gray-500">
                    {s.kelas}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400" />

              </div>
            </button>
          ))}

        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================= LEFT ================= */}
<div className="bg-white rounded-2xl shadow-inner p-4">

  <div className="bg-gray-100 rounded-xl shadow p-5 space-y-4">

    <div className="flex items-center gap-3">

      <div className="p-2 rounded-lg bg-gray-500">
        <CheckCircle className="w-5 h-5 text-white" />
      </div>

<div>
  <h2 className="font-semibold text-gray-700">
    Status Kehadiran Hari Ini
  </h2>

  <div className="mt-1 flex flex-wrap gap-2">

    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
      {subjects.length} Mapel
    </span>

    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
      Hadir {hadirHariIni}
    </span>

    <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
      Izin {izinHariIni}
    </span>

    <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
      Sakit {sakitHariIni}
    </span>

    <span className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-1 rounded-full">
      Alpha {alphaHariIni}
    </span>

  </div>
</div>

    </div>

    {loadingData ? (
      <div className="space-y-3">
        <div className="h-16 rounded-lg bg-gray-200 animate-pulse"></div>
        <div className="h-16 rounded-lg bg-gray-200 animate-pulse"></div>
      </div>
    ) : subjects.length > 0 ? (
      
subjects.map((s, i) => {
  const isLibur = s.is_libur;
  const status = s.status?.toLowerCase();

  const warna = isLibur
      ? "bg-red-50 border-red-200"
      : status === "hadir"
      ? "bg-green-50 border-green-200"
      : status === "izin"
      ? "bg-yellow-50 border-yellow-200"
      : status === "sakit"
      ? "bg-red-50 border-red-200"
      : "bg-gray-50 border-gray-200";

  const textColor =
    status === "hadir"
      ? "text-green-600"
      : status === "izin"
      ? "text-yellow-600"
      : status === "sakit"
      ? "text-red-600"
      : "text-gray-500";

  return (
    <div
      key={i}
      className={`flex justify-between items-center rounded-lg p-3 border shadow-sm transition ${warna}`}
    >
      <div className="flex items-center gap-2">

        <CheckCircle className={`w-4 h-4 ${textColor}`} />

        <div>
          <p className="font-medium">{s.mapel}</p>

          <p className="text-xs text-gray-500">
            {s.guru}
          </p>

          <p className={`text-xs font-semibold ${textColor}`}>
          {isLibur ? "Libur" : s.status}
        </p>

        {isLibur && (
          <p className="text-red-500 text-xs font-bold mt-1">
            {s.keterangan_libur}
          </p>
        )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="bg-white text-xs px-2 py-1 rounded">
          {s.jam}
        </span>

        <button className="bg-blue-500 text-white p-1.5 rounded">
          <Play className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
})
    ) : (
      <div className="text-sm text-gray-400">
        Belum ada presensi hari ini
      </div>
    )}

  </div>

    <div className="mt-4 bg-blue-100 text-blue-700 rounded-xl p-4 flex items-center gap-2 shadow">
      <Clock className="w-5 h-5" />

      <span className="font-medium">
        Update Terakhir: {lastUpdate}
      </span>
    </div>

</div>

        {/* ================= RIGHT ================= */}
        <div className="bg-white rounded-xl shadow p-5">

          {/* HEADER */}
          <div className="flex items-center gap-3 mb-4">

            <div className="bg-gray-500 text-white p-2 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>

            <h2 className="font-semibold text-gray-700">
              Kehadiran Bulan Ini
            </h2>
          </div>

          {/* BODY */}
          {loadingData ? (
            <div className="space-y-3">
              <div className="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
              <div className="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
              <div className="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
              <div className="h-12 rounded-lg bg-gray-200 animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-3">

              <div className="flex justify-between bg-gray-100 p-3 rounded-lg">
                <span className="text-green-600 font-medium">
                  Hadir
                </span>
                <span>{summary.Hadir} hari</span>
              </div>

              <div className="flex justify-between bg-gray-100 p-3 rounded-lg">
                <span className="text-yellow-600 font-medium">
                  Izin
                </span>
                <span>{summary.Izin} hari</span>
              </div>

              <div className="flex justify-between bg-gray-100 p-3 rounded-lg">
                <span className="text-red-600 font-medium">
                  Sakit
                </span>
                <span>{summary.Sakit} hari</span>
              </div>

              <div className="flex justify-between bg-gray-100 p-3 rounded-lg">
                <span className="text-gray-700 font-medium">
                  Alpha
                </span>
                <span>{summary.Alpha} hari</span>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardOrtu;