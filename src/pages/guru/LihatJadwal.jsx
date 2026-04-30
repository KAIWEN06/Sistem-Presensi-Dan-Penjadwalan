import { useState, useEffect } from "react";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import {
  FaFolder,
  FaRegFileAlt,
  FaClock,
  FaCalendarAlt,
  FaBookOpen,
  FaSyncAlt,
} from "react-icons/fa";
import { formatDateManado } from "../../utils/timezone";

// PREMIUM UI UPGRADE
// FULL RESPONSIVE ORTU PANEL
// SAFE REFACTOR
// NO LOGIC CHANGED
// MOBILE READY
// CONSISTENT WITH ADMIN PREMIUM

const defaultPelajaran = {
  Senin: [],
  Selasa: [],
  Rabu: [],
  Kamis: [],
  Jumat: [],
  Sabtu: [],
};

const LihatJadwal = () => {
  const [activeTab, setActiveTab] = useState("pelajaran");
  const [dataPelajaran, setDataPelajaran] =
    useState(defaultPelajaran);
  const [dataUjian, setDataUjian] =
    useState([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    try {
      setLoading(true);

      const id = toast.loading(
        "Memuat jadwal..."
      );

      const res = await api.get(
        "/guru/jadwal"
      );

      if (res.data) {
        setDataPelajaran(
          res.data.pelajaran ||
            defaultPelajaran
        );
        setDataUjian(
          res.data.ujian || []
        );
      }

      toast.success(
        "Jadwal berhasil dimuat",
        { id }
      );
    } catch (err) {
      toast.error(
        "Gagal memuat jadwal"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTanggal = (
    tgl
  ) => {
    if (!tgl) return "-";
    return formatDateManado(
      `${tgl}T12:00:00`
    );
  };

  const totalHariAktif =
    Object.values(
      dataPelajaran
    ).filter(
      (item) =>
        item.length > 0
    ).length;

  const totalMapel =
    Object.values(
      dataPelajaran
    ).reduce(
      (acc, val) =>
        acc + val.length,
      0
    );

  return (
    <section className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* TAB */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              setActiveTab(
                "pelajaran"
              )
            }
            className={`inline-flex items-center justify-center gap-2 min-h-[46px] rounded-2xl font-bold transition-all ${
              activeTab ===
              "pelajaran"
                ? "bg-[#715445] text-white shadow-md"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <FaFolder />
            Pelajaran
          </button>

          <button
            onClick={() =>
              setActiveTab(
                "ujian"
              )
            }
            className={`inline-flex items-center justify-center gap-2 min-h-[46px] rounded-2xl font-bold transition-all ${
              activeTab ===
              "ujian"
                ? "bg-[#715445] text-white shadow-md"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <FaRegFileAlt />
            Ujian
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
        {loading ? (
          <LoadingState />
        ) : activeTab ===
          "pelajaran" ? (
          <>
            {/* HEADER */}
            <div className="mb-5">
              <h2 className="text-lg font-black text-gray-900">
                Jadwal
                Pelajaran
                Mingguan
              </h2>
            </div>

            {/* MOBILE */}
            <div className="lg:hidden overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4 min-w-max">
                {Object.keys(
                  dataPelajaran
                ).map((hari) => (
                  <HariCard
                    key={hari}
                    hari={hari}
                    items={
                      dataPelajaran[
                        hari
                      ]
                    }
                  />
                ))}
              </div>
            </div>

            {/* DESKTOP */}
            <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.keys(
                dataPelajaran
              ).map(
                (hari) => (
                  <HariCard
                    key={hari}
                    hari={hari}
                    items={
                      dataPelajaran[
                        hari
                      ]
                    }
                  />
                )
              )}
            </div>
          </>
        ) : (
          <>
            {/* HEADER */}
            <div className="mb-5">
              <h2 className="text-lg font-black text-gray-900">
                Jadwal
                Ujian
                Mendatang
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Menampilkan
                ujian aktif
                terdekat.
              </p>
            </div>

            {dataUjian.length >
            0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {dataUjian.map(
                  (
                    item,
                    idx
                  ) => (
                    <div
                      key={
                        idx
                      }
                      className="rounded-3xl border border-gray-100 bg-[#faf9f8] p-4 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-widest font-black text-rose-500">
                            Ujian
                          </p>

                          <h3 className="font-black text-gray-900 mt-1">
                            {formatTanggal(
                              item.tanggal
                            )}
                          </h3>
                        </div>

                        <span className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-full bg-white border border-gray-200 text-xs font-bold text-[#715445]">
                          <FaClock />
                          {
                            item.jam
                          }
                        </span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="font-bold text-gray-800">
                          {
                            item.mapel
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyState text="Tidak ada jadwal ujian." />
            )}
          </>
        )}
      </div>
    </section>
  );
};

/* COMPONENTS */

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-black">
            {title}
          </p>

          <h3 className="text-2xl font-black text-gray-900 mt-1">
            {value}
          </h3>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function HariCard({
  hari,
  items,
}) {
  return (
    <div className="w-[290px] lg:w-auto rounded-3xl border border-gray-100 bg-[#faf9f8] p-4 shrink-0">
      <div className="pb-3 mb-4 border-b border-gray-200 flex items-center justify-between gap-2">
        <h3 className="font-black text-gray-900">
          {hari}
        </h3>

        <span className="text-lg font-bold px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-800">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.length >
        0 ? (
          items.map(
            (
              item,
              idx
            ) => (
              <div
                key={
                  idx
                }
                className="rounded-2xl bg-white border border-gray-100 p-3"
              >
                <p className="text-xs font-black text-[#715445]">
                  {
                    item.jam
                  }
                </p>

                <p className="text-sm font-bold text-gray-800 mt-1 leading-snug">
                  {
                    item.mapel
                  }
                </p>
              </div>
            )
          )
        ) : (
          <p className="text-sm text-gray-400 text-center py-5">
            Tidak ada
            jadwal
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map(
        (_, i) => (
          <div
            key={i}
            className="h-24 rounded-3xl bg-gray-100 animate-pulse"
          />
        )
      )}
    </div>
  );
}

function EmptyState({
  text,
}) {
  return (
    <div className="rounded-3xl bg-gray-50 text-gray-400 text-center py-12">
      {text}
    </div>
  );
}

export default LihatJadwal;