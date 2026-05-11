import { useState, useEffect, useMemo, useRef } from "react";
import {
  User,
  BookOpen,
  FileText,
  Clock3,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import api from "../../lib/axios";

const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

const JadwalOrtu = () => {
  const [tab, setTab] = useState("pelajaran");
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);

  const [jadwal, setJadwal] = useState({
    pelajaran: {},
    ujian: [],
  });

  const [loading, setLoading] = useState(true);

  const requestRef = useRef(0);

  /* ================= LOAD ANAK ================= */
  const loadAnak = async () => {
    try {
      const res = await api.get("/ortu/anak");
      const data = res.data || [];

      setStudents(data);

      if (data.length > 0) {
        setSelected((prev) => prev || data[0]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= LOAD JADWAL ================= */
  const loadJadwal = async (nis) => {
    const currentRequest = ++requestRef.current;

    try {
      setLoading(true);

      const res = await api.get(`/ortu/jadwal/${nis}`);

      // cegah response lama overwrite response baru
      if (currentRequest !== requestRef.current) return;

      const hasil = res.data || {};

      setJadwal({
        pelajaran: hasil.pelajaran || {},
        ujian: Array.isArray(hasil.ujian) ? hasil.ujian : [],
      });
    } catch (err) {
      console.log("ERROR JADWAL:", err);
    } finally {
      if (currentRequest === requestRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAnak();
  }, []);

  useEffect(() => {
    if (selected?.nis) {
      loadJadwal(selected.nis);
    }
  }, [selected?.nis]);

  /* ================= SORT UJIAN ================= */
  const ujianList = useMemo(() => {
    if (!Array.isArray(jadwal.ujian)) return [];

    return [...jadwal.ujian].sort((a, b) => {
      const keyA = `${a.tanggal || ""} ${(a.jam || "").split(" - ")[0]}`;
      const keyB = `${b.tanggal || ""} ${(b.jam || "").split(" - ")[0]}`;
      return keyA.localeCompare(keyB);
    });
  }, [jadwal.ujian]);

  const formatTanggal = (tgl) => {
    if (!tgl) return "-";

    try {
      return new Date(`${tgl}T12:00:00`).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return tgl;
    }
  };

  const data =
    tab === "pelajaran"
      ? jadwal.pelajaran
      : jadwal.ujian;

  return (
    <div className="space-y-6">

      {/* PILIH ANAK */}
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4 min-w-max">
          {students.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelected(s)}
              className={`min-w-[240px] rounded-2xl border p-4 text-left transition shadow-sm ${
                selected?.nis === s.nis
                  ? "bg-white border-[#5A3E36] ring-2 ring-[#E8DDD8]"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EEE7E4] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#5A3E36]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.nama}</p>
                  <p className="text-sm text-gray-500 truncate">{s.kelas}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TAB */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setTab("pelajaran")}
          className={`px-5 py-2.5 rounded-2xl font-bold text-sm border transition shadow-sm flex items-center ${
            tab === "pelajaran"
              ? "bg-green-50 border-green-600 text-green-700 ring-2 ring-green-100"
              : "bg-white border-[#5A3E36]/20 text-[#5A3E36] hover:bg-[#F8F5F4]"
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Pelajaran
        </button>

        <button
          onClick={() => setTab("ujian")}
          className={`px-5 py-2.5 rounded-2xl font-bold text-sm border transition shadow-sm flex items-center ${
            tab === "ujian"
              ? "bg-red-50 border-red-600 text-red-700 ring-2 ring-red-100"
              : "bg-white border-[#5A3E36]/20 text-[#5A3E36] hover:bg-[#F8F5F4]"
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Ujian
        </button>
      </div>

      {/* CONTENT */}
      <div className="bg-gray-200 rounded-2xl p-4 relative">

        {loading && (
          <div className="absolute inset-0 bg-white/40 rounded-2xl z-10" />
        )}

        {tab === "pelajaran" ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {hariList.map((hari) => {
              const items = data?.[hari] || [];

              return (
                <div
                  key={hari}
                  className="min-w-[285px] bg-white rounded-2xl p-4"
                >
                  <div className="flex justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{hari}</h3>
                      <p className="text-xs text-gray-500">
                        {items.length} Jadwal
                      </p>
                    </div>

                    <Clock3 className="w-4 h-4 text-[#5A3E36]" />
                  </div>

                  <div className="space-y-3">
                    {items.length > 0 ? (
                      items.map((item, idx) => (
                        <div
  key={idx}
  className={`rounded-xl p-3 border ${
    item.jenis === "libur"
      ? "bg-red-50 border-red-200"
      : item.jenis === "kegiatan"
      ? "bg-blue-50 border-blue-200"
      : item.jenis === "lainnya"
      ? "bg-green-50 border-green-200"
      : "bg-gray-50 border-gray-100"
  }`}
>
  {item.jenis && (
    <p
      className={`text-xs font-bold mb-2 ${
        item.jenis === "libur"
          ? "text-red-500"
          : item.jenis === "kegiatan"
          ? "text-blue-600"
          : "text-green-600"
      }`}
    >
      {item.jenis === "libur"
        ? "Libur"
        : item.jenis === "kegiatan"
        ? "Kegiatan"
        : "Agenda"}{" "}
      : {item.keterangan_libur}
    </p>
  )}

  <p
    className={`text-xs font-semibold ${
      item.jenis === "libur"
        ? "text-red-700"
        : item.jenis === "kegiatan"
        ? "text-blue-700"
        : item.jenis === "lainnya"
        ? "text-green-700"
        : "text-[#5A3E36]"
    }`}
  >
    {item.jam}
  </p>

  <p className="font-semibold mt-1">
    {item.mapel}
  </p>

  <p className="text-xs text-gray-500">
    {item.guru}
  </p>
</div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">
                        Tidak ada jadwal
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ujianList.length > 0 ? (
              ujianList.map((item, idx) => (
                <div
  key={idx}
  className={`rounded-2xl p-5 border ${
    item.jenis === "libur"
      ? "bg-red-50 border-red-200"
      : item.jenis === "kegiatan"
      ? "bg-blue-50 border-blue-200"
      : item.jenis === "lainnya"
      ? "bg-green-50 border-green-200"
      : "bg-white border-gray-100"
  }`}
>
  {item.jenis && (
    <p
      className={`text-xs font-bold mb-2 ${
        item.jenis === "libur"
          ? "text-red-500"
          : item.jenis === "kegiatan"
          ? "text-blue-600"
          : "text-green-600"
      }`}
    >
      {item.jenis === "libur"
        ? "Libur"
        : item.jenis === "kegiatan"
        ? "Kegiatan"
        : "Agenda"}{" "}
      : {item.keterangan_libur}
    </p>
  )}

  <p className="text-xs font-semibold text-[#5A3E36] uppercase">
    Jadwal Ujian
  </p>

  <h3 className="font-bold mt-1">
    {formatTanggal(item.tanggal)}
  </h3>

  <div
    className={`mt-4 text-sm font-semibold ${
      item.jenis === "libur"
        ? "text-red-700"
        : item.jenis === "kegiatan"
        ? "text-blue-700"
        : item.jenis === "lainnya"
        ? "text-green-700"
        : "text-[#5A3E36]"
    }`}
  >
    {item.jam}
  </div>

  <p className="mt-3 font-semibold">
    {item.mapel}
  </p>

  <p className="text-sm text-gray-500">
    {item.guru}
  </p>
</div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-2xl p-8 text-center text-gray-400">
                Tidak ada jadwal ujian
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JadwalOrtu;