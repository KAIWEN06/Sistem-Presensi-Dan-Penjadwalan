import { useState, useEffect } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { todayManado } from "../../utils/timezone";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaMinusCircle,
  FaSearch,
  FaSave,
  FaCalendarAlt,
  FaUsers,
  FaClock,
} from "react-icons/fa";

const KelolaPresensi = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] =
    useState("");
  const [jadwal, setJadwal] =
    useState([]);
  const [tertunda, setTertunda] =
    useState([]);
  const [selectedJadwal, setSelectedJadwal] =
    useState(null);
  const [dataSiswa, setDataSiswa] =
    useState([]);
  const [loadingSiswa, setLoadingSiswa] =
    useState(false);
  const [autoDone, setAutoDone] =
    useState(false);

  const defaultTanggal =
    location.state?.tanggal ||
    todayManado();

  const [tanggal, setTanggal] =
    useState(defaultTanggal);

  /* =========================
     INIT
  ========================= */
  useEffect(() => {
    fetchTertunda();
  }, []);

  useEffect(() => {
    fetchJadwal();
  }, [tanggal]);

  /* =========================
     API
  ========================= */
  const fetchTertunda = async () => {
    try {
      const res = await api.get(
        "/guru/presensi-tertunda"
      );
      setTertunda(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJadwal = async () => {
    try {
      const res = await api.get(
        `/guru/kelas-ajar?tanggal=${tanggal}`
      );

      setJadwal(res.data || []);

      if (
        !location.state?.autoSelect &&
        !autoDone
      ) {
        setSelectedJadwal(null);
        setDataSiswa([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     LOAD SISWA
  ========================= */
  const handleAbsenSekarang =
    async (
      j,
      customTanggal = tanggal
    ) => {
      setSelectedJadwal(j);
      setLoadingSiswa(true);

      const id = toast.loading(
        "Memuat data siswa..."
      );

      try {
        const res = await api.get(
          `/guru/siswa-kelas/${j.id_jadwal}?tanggal=${customTanggal}`
        );

        setDataSiswa(
          res.data || []
        );

        toast.success(
          "Data siswa berhasil dimuat",
          { id }
        );
      } catch (err) {
        console.error(err);

        toast.error(
          "Gagal memuat data siswa",
          { id }
        );
      } finally {
        setLoadingSiswa(false);
      }
    };

  /* =========================
     AUTO SELECT DASHBOARD
  ========================= */
  useEffect(() => {
    if (!jadwal.length) return;
    if (autoDone) return;

    const targetId =
      location.state?.autoSelect
        ?.id_jadwal;

    if (!targetId) return;

    const found = jadwal.find(
      (j) =>
        String(j.id_jadwal) ===
        String(targetId)
    );

    if (!found) return;

    const timer =
      setTimeout(async () => {
        await handleAbsenSekarang(
          found,
          defaultTanggal
        );

        setAutoDone(true);

        window.scrollTo({
          top: 500,
          behavior:
            "smooth",
        });

        navigate(
          location.pathname,
          {
            replace: true,
            state: {},
          }
        );
      }, 250);

    return () =>
      clearTimeout(timer);
  }, [jadwal, autoDone]);

  const bukaTertunda = (j) => {
    setTanggal(j.tanggal);
    setAutoDone(true);

    setTimeout(() => {
      handleAbsenSekarang(
        j,
        j.tanggal
      );
    }, 400);
  };

  /* =========================
     SIMPAN
  ========================= */
  const simpanPresensi =
    async () => {
      if (
        !selectedJadwal ||
        dataSiswa.length === 0
      ) {
        return toast.error(
          "Pilih jadwal dulu."
        );
      }

      const id = toast.loading(
        "Menyimpan presensi..."
      );

      try {
        await api.post(
          "/guru/presensi",
          {
            tanggal,
            id_jadwal:
              selectedJadwal.id_jadwal,
            kelas_id:
              selectedJadwal.kelas_id,
            id_mapel:
              selectedJadwal.id_mapel,
            presensi: dataSiswa,
          }
        );

        toast.success(
          "Presensi berhasil disimpan",
          { id }
        );

        fetchJadwal();
        fetchTertunda();
      } catch (err) {
        console.error(err);

        toast.error(
          "Gagal menyimpan presensi",
          { id }
        );
      }
    };

  /* =========================
     UTIL
  ========================= */
  const filtered =
    dataSiswa.filter((s) =>
      s.nama
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  const updateStatus = (
    index,
    value
  ) => {
    const temp = [...dataSiswa];
    temp[index].status = value;
    setDataSiswa(temp);
  };

  const countStatus = (type) =>
    dataSiswa.filter(
      (x) => x.status === type
    ).length;

  const getStatusColor = (
    status
  ) => {
    switch (status) {
      case "Hadir":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Izin":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Sakit":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Alpha":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "";
    }
  };

  const badgeJadwal = (
    status
  ) => {
    if (status === "sudah") {
      return (
        <span className="inline-flex items-center justify-center min-h-[32px] px-3 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
          Sudah
        </span>
      );
    }

    if (
      status ===
      "terlambat"
    ) {
      return (
        <span className="inline-flex items-center justify-center min-h-[32px] px-3 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
          Terlambat
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center min-h-[32px] px-3 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
        Belum
      </span>
    );
  };

  return (
    <section className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

      {/* TERTUNDA */}
      {tertunda.length > 0 && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 sm:p-5 space-y-4">
          <h2 className="font-black text-rose-700">
            Presensi Tertunda (
            {tertunda.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tertunda.map((j, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white border border-rose-100 p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-gray-900">
                    {j.tanggal}
                  </p>

                  <p className="text-sm text-gray-500">
                    {j.waktu} •{" "}
                    {j.kelas}
                  </p>
                </div>

                <button
                  onClick={() =>
                    bukaTertunda(j)
                  }
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-2xl bg-rose-600 text-white font-bold active:scale-95 transition-all"
                >
                  Isi Sekarang
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest font-black text-gray-500 mb-2">
              Tanggal
            </label>

            <input
              type="date"
              value={tanggal}
              onChange={(e) => {
                setTanggal(
                  e.target.value
                );
                setAutoDone(false);
              }}
              className="w-full h-12 rounded-2xl border border-gray-200 px-4 focus:ring-4 focus:ring-[#715445]/10 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-black text-gray-500 mb-2">
              Cari Siswa
            </label>

            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-4 focus:ring-4 focus:ring-[#715445]/10 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* JADWAL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700 font-black">
          <FaClock />
          Jadwal Mengajar
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max snap-x snap-mandatory">
            {jadwal.length === 0 && (
              <div className="rounded-3xl bg-white border border-gray-100 p-6 text-gray-500">
                Tidak ada jadwal
                mengajar.
              </div>
            )}

            {jadwal.map((j, i) => (
              <div
                key={i}
                className={`snap-start min-w-[280px] rounded-3xl bg-white border p-5 shadow-sm transition-all ${
                  selectedJadwal?.id_jadwal ===
                  j.id_jadwal
                    ? "border-[#715445] ring-2 ring-[#715445]/20"
                    : "border-gray-100"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="font-black text-[#715445]">
                    {j.waktu}
                  </p>

                  {badgeJadwal(
                    j.status_presensi
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {j.kelas}
                </p>

                <button
                  onClick={() =>
                    handleAbsenSekarang(
                      j
                    )
                  }
                  className="w-full inline-flex items-center justify-center min-h-[44px] rounded-2xl border border-gray-200 font-bold hover:bg-gray-50 transition-all"
                >
                  {j.status_presensi ===
                  "sudah"
                    ? "Edit Presensi"
                    : "Absen Sekarang"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusCard
          icon={<FaCheckCircle />}
          label="Hadir"
          value={countStatus(
            "Hadir"
          )}
          color="bg-emerald-500"
        />

        <StatusCard
          icon={
            <FaExclamationCircle />
          }
          label="Izin"
          value={countStatus(
            "Izin"
          )}
          color="bg-amber-500"
        />

        <StatusCard
          icon={<FaTimesCircle />}
          label="Sakit"
          value={countStatus(
            "Sakit"
          )}
          color="bg-rose-500"
        />

        <StatusCard
          icon={<FaMinusCircle />}
          label="Alpha"
          value={countStatus(
            "Alpha"
          )}
          color="bg-gray-500"
        />
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">
                  No
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">
                  Nama
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">
                  Kelas
                </th>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loadingSiswa ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-8 text-center"
                  >
                    Memuat...
                  </td>
                </tr>
              ) : filtered.length >
                0 ? (
                filtered.map(
                  (s, i) => (
                    <tr
                      key={i}
                    >
                      <td className="px-5 py-4">
                        {i + 1}
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {s.nama}
                      </td>

                      <td className="px-5 py-4">
                        {s.kelas}
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={
                            s.status
                          }
                          onChange={(
                            e
                          ) =>
                            updateStatus(
                              i,
                              e
                                .target
                                .value
                            )
                          }
                          className={`h-10 px-3 rounded-2xl border text-xs font-bold ${getStatusColor(
                            s.status
                          )}`}
                        >
                          <option value="Hadir">
                            Hadir
                          </option>
                          <option value="Izin">
                            Izin
                          </option>
                          <option value="Sakit">
                            Sakit
                          </option>
                          <option value="Alpha">
                            Alpha
                          </option>
                        </select>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="p-8 text-center text-gray-400"
                  >
                    Pilih jadwal
                    untuk melihat
                    siswa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD */}
      <div className="md:hidden space-y-3">
        {loadingSiswa ? (
          <div className="rounded-3xl bg-white p-6 text-center">
            Memuat...
          </div>
        ) : filtered.length >
          0 ? (
          filtered.map(
            (s, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 space-y-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-black text-gray-900">
                      {s.nama}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {s.kelas}
                    </p>
                  </div>

                  <FaUsers className="text-[#715445]" />
                </div>

                <select
                  value={
                    s.status
                  }
                  onChange={(
                    e
                  ) =>
                    updateStatus(
                      i,
                      e.target
                        .value
                    )
                  }
                  className={`w-full h-11 px-4 rounded-2xl border text-sm font-bold ${getStatusColor(
                    s.status
                  )}`}
                >
                  <option value="Hadir">
                    Hadir
                  </option>
                  <option value="Izin">
                    Izin
                  </option>
                  <option value="Sakit">
                    Sakit
                  </option>
                  <option value="Alpha">
                    Alpha
                  </option>
                </select>
              </div>
            )
          )
        ) : (
          <div className="rounded-3xl bg-white p-6 text-center text-gray-400">
            Pilih jadwal
            untuk melihat
            siswa.
          </div>
        )}
      </div>

      {/* ACTION */}
      <div className="sticky bottom-3 z-20">
        <div className="rounded-3xl bg-white border border-gray-100 shadow-xl p-3 sm:p-4">
          <button
            onClick={
              simpanPresensi
            }
            disabled={
              !selectedJadwal ||
              dataSiswa.length ===
                0
            }
            className={`w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-2xl font-black transition-all ${
              !selectedJadwal ||
              dataSiswa.length ===
                0
                ? "bg-gray-200 text-gray-500"
                : "bg-[#715445] text-white active:scale-95"
            }`}
          >
            <FaSave />
            Simpan
            Perubahan
          </button>
        </div>
      </div>
    </section>
  );
  function StatusCard({
  icon,
  label,
  value,
  color,
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-black text-gray-400">
            {label}
          </p>

          <h3 className="text-2xl font-black text-gray-900">
            {value}
          </h3>
        </div>

        <div
          className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
};

export default KelolaPresensi;