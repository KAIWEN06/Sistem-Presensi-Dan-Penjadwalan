import { useState, useEffect } from "react";
import {
  FaChevronRight,
  FaSearch,
  FaSyncAlt,
  FaCalendarAlt,
  FaUsers,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../lib/axios";

// PREMIUM UI UPGRADE
// FULL RESPONSIVE ORTU PANEL
// SAFE REFACTOR
// NO LOGIC CHANGED
// MOBILE READY
// CONSISTENT WITH ADMIN PREMIUM

const LIMIT = 15;

const RiwayatPresensi = () => {
  const [tanggal, setTanggal] = useState("");
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] =
    useState(true);

  /* DETAIL */
  const [selected, setSelected] =
    useState(null);
  const [detail, setDetail] =
    useState([]);
  const [loadingDetail, setLoadingDetail] =
    useState(false);

  const [cariNama, setCariNama] =
    useState("");
  const [filterStatus, setFilterStatus] =
    useState("");

  useEffect(() => {
    fetchRiwayat(true);
  }, []);

  const fetchRiwayat = async (
    reset = false
  ) => {
    try {
      const currentPage = reset
        ? 1
        : page;

      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const id = reset
        ? toast.loading(
            "Memuat riwayat..."
          )
        : null;

      const res = await api.get(
        `/guru/riwayat?page=${currentPage}&limit=${LIMIT}`
      );

      const rows =
        res.data?.data || [];

      if (reset) {
        setData(rows);
        setPage(2);
      } else {
        setData((prev) => [
          ...prev,
          ...rows,
        ]);
        setPage(
          (prev) => prev + 1
        );
      }

      setHasMore(
        Boolean(res.data?.hasMore)
      );

      if (id) {
        toast.success(
          "Riwayat dimuat",
          { id }
        );
      }
    } catch (err) {
      toast.error(
        "Gagal memuat riwayat"
      );
      console.error(
        "Gagal ambil riwayat",
        err
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchDetail = async (
    item
  ) => {
    try {
      setLoadingDetail(true);
      setSelected(item);

      const id = toast.loading(
        "Memuat detail..."
      );

      const res = await api.get(
        `/guru/riwayat/${item.tanggal}/${item.id_jadwal}`
      );

      setDetail(
        res.data?.detail || []
      );
      setCariNama("");
      setFilterStatus("");

      toast.success(
        "Detail dimuat",
        { id }
      );
    } catch (err) {
      toast.error(
        "Gagal memuat detail"
      );
      console.error(
        "Gagal ambil detail",
        err
      );
      setDetail([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const listKelas = [
    ...new Set(
      data.map((d) => d.kelas)
    ),
  ];

  const listMapel = [
    ...new Set(
      data.map((d) => d.mapel)
    ),
  ];

  const getStatusStyle = (
    status
  ) => {
    switch (status) {
      case "sudah":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "belum":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "tidak":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (
    status
  ) => {
    switch (status) {
      case "sudah":
        return "Sudah";
      case "belum":
        return "Belum";
      case "tidak":
        return "Tidak Ada";
      default:
        return status;
    }
  };

  const getBadgeDetail = (
    status
  ) => {
    const s =
      status?.toLowerCase();

    if (s === "hadir")
      return "bg-emerald-50 text-emerald-700";
    if (s === "izin")
      return "bg-amber-50 text-amber-700";
    if (s === "sakit")
      return "bg-blue-50 text-blue-700";

    return "bg-rose-50 text-rose-700";
  };

  const filtered = data.filter(
    (d) =>
      (!tanggal ||
        d.tanggal === tanggal) &&
      (!kelas ||
        d.kelas === kelas) &&
      (!mapel ||
        d.mapel === mapel)
  );

  const filteredDetail =
    detail.filter((d) => {
      return (
        (!cariNama ||
          d.nama
            .toLowerCase()
            .includes(
              cariNama.toLowerCase()
            )) &&
        (!filterStatus ||
          d.status.toLowerCase() ===
            filterStatus.toLowerCase())
      );
    });

  const total = detail.length;

  const hadir = detail.filter(
    (x) =>
      x.status.toLowerCase() ===
      "hadir"
  ).length;

  const izin = detail.filter(
    (x) =>
      x.status.toLowerCase() ===
      "izin"
  ).length;

  const sakit = detail.filter(
    (x) =>
      x.status.toLowerCase() ===
      "sakit"
  ).length;

  const alpha = detail.filter(
    (x) => {
      const s =
        x.status.toLowerCase();
      return (
        s === "alpha" ||
        s === "alfa"
      );
    }
  ).length;

  return (
    <section className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* FILTER */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <InputWrap
            icon={<FaCalendarAlt />}
          >
            <input
              type="date"
              value={tanggal}
              onChange={(e) =>
                setTanggal(
                  e.target.value
                )
              }
              className="w-full h-11 bg-transparent outline-none"
            />
          </InputWrap>

          <select
            value={kelas}
            onChange={(e) =>
              setKelas(
                e.target.value
              )
            }
            className="h-11 rounded-2xl border border-gray-200 px-4 w-full focus:ring-4 focus:ring-[#715445]/10 outline-none"
          >
            <option value="">
              Semua Kelas
            </option>

            {listKelas.map(
              (k, i) => (
                <option
                  key={i}
                  value={k}
                >
                  {k}
                </option>
              )
            )}
          </select>

          <select
            value={mapel}
            onChange={(e) =>
              setMapel(
                e.target.value
              )
            }
            className="h-11 rounded-2xl border border-gray-200 px-4 w-full focus:ring-4 focus:ring-[#715445]/10 outline-none"
          >
            <option value="">
              Semua Mapel
            </option>

            {listMapel.map(
              (m, i) => (
                <option
                  key={i}
                  value={m}
                >
                  {m}
                </option>
              )
            )}
          </select>
        </div>
      </div>

{/* LIST */}
<div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
  <div className="flex items-center justify-between gap-3 mb-4">
    <h2 className="text-lg font-black text-gray-900">
      Daftar Presensi
    </h2>

    <span className="text-xs sm:text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
      {filtered.length} data
    </span>
  </div>

  <div className="space-y-3">
    {loading ? (
      <SkeletonRows />
    ) : filtered.length === 0 ? (
      <EmptyState text="Tidak ada riwayat presensi." />
    ) : (
      filtered.map((item, i) => {
        const aktif =
          selected &&
          selected.tanggal === item.tanggal &&
          selected.id_jadwal === item.id_jadwal;

        return (
          <div
            key={`${item.id_jadwal}-${item.tanggal}-${i}`}
            className="space-y-2"
          >
            {/* CARD */}
            <button
              onClick={() =>
                fetchDetail(item)
              }
              className={`w-full text-left rounded-3xl border p-4 transition-all duration-300 ${
                aktif
                  ? "border-[#715445]/20 bg-[#715445]/[0.03] shadow-sm"
                  : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex flex-col items-center justify-center shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 leading-none">
                      {item.hari}
                    </p>
                    <p className="text-lg font-black text-gray-900 leading-none mt-1">
                      {
                        item.tanggal.split(
                          "-"
                        )[2]
                      }
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-gray-900 truncate text-sm sm:text-base">
                      {item.kelas} -{" "}
                      {item.mapel}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {item.jam} •{" "}
                      {item.tanggal}
                    </p>

                    <p className="text-xs text-gray-400 truncate mt-1">
                      {item.info}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center justify-center min-h-[32px] px-3 rounded-full border text-[11px] font-black whitespace-nowrap ${getStatusStyle(
                    item.status
                  )}`}
                >
                  {getStatusText(
                    item.status
                  )}
                </span>
              </div>
            </button>

          </div>
        );
      })
    )}
  </div>

  {!loading &&
    hasMore && (
      <div className="pt-4">
        <button
          onClick={() =>
            fetchRiwayat(
              false
            )
          }
          disabled={
            loadingMore
          }
          className="w-full inline-flex items-center justify-center min-h-[44px] rounded-2xl bg-[#715445] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-60"
        >
          {loadingMore
            ? "Memuat..."
            : "Load More"}
        </button>
      </div>
    )}
</div>

      {/* DETAIL */}
      {selected && (
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5 space-y-5">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Detail Presensi
            </h2>

            <p className="text-sm text-gray-600 mt-1">
              {selected.kelas} -{" "}
              {selected.mapel}
            </p>

            <p className="text-sm text-gray-500">
              {selected.hari},{" "}
              {
                selected.tanggal
              }{" "}
              •{" "}
              {selected.jam}
            </p>
          </div>

          {/* STATS */}
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div className="flex gap-2 min-w-max md:grid md:grid-cols-5 md:min-w-0">
              <div className="w-[110px] shrink-0 md:w-auto">
                <StatCard
                  title="Total"
                  value={total}
                  color="gray"
                />
              </div>

              <div className="w-[110px] shrink-0 md:w-auto">
                <StatCard
                  title="Hadir"
                  value={hadir}
                  color="green"
                />
              </div>

              <div className="w-[110px] shrink-0 md:w-auto">
                <StatCard
                  title="Izin"
                  value={izin}
                  color="yellow"
                />
              </div>

              <div className="w-[110px] shrink-0 md:w-auto">
                <StatCard
                  title="Sakit"
                  value={sakit}
                  color="blue"
                />
              </div>

              <div className="w-[110px] shrink-0 md:w-auto">
                <StatCard
                  title="Alpha"
                  value={alpha}
                  color="red"
                />
              </div>
            </div>
          </div>

          {/* FILTER DETAIL */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <InputWrap
              icon={<FaSearch />}
            >
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={cariNama}
                onChange={(e) =>
                  setCariNama(
                    e.target
                      .value
                  )
                }
                className="w-full h-11 bg-transparent outline-none"
              />
            </InputWrap>

            <select
              value={
                filterStatus
              }
              onChange={(e) =>
                setFilterStatus(
                  e.target
                    .value
                )
              }
              className="h-11 rounded-2xl border border-gray-200 px-4 w-full focus:ring-4 focus:ring-[#715445]/10 outline-none"
            >
              <option value="">
                Semua Status
              </option>
              <option value="hadir">
                Hadir
              </option>
              <option value="izin">
                Izin
              </option>
              <option value="sakit">
                Sakit
              </option>
              <option value="alpha">
                Alpha
              </option>
            </select>
          </div>

          {/* TABLE DESKTOP */}
          <div className="hidden md:block overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-3xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>No</Th>
                  <Th>NIS</Th>
                  <Th>Nama</Th>
                  <Th>Status</Th>
                </tr>
              </thead>

              <tbody>
                {loadingDetail ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-8 text-center text-gray-400"
                    >
                      Memuat...
                    </td>
                  </tr>
                ) : filteredDetail.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-8 text-center text-gray-400"
                    >
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredDetail.map(
                    (
                      item,
                      i
                    ) => (
                      <tr
                        key={`${item.nis}-${i}`}
                        className="border-t border-gray-100"
                      >
                        <Td>
                          {i +
                            1}
                        </Td>
                        <Td>
                          {
                            item.nis
                          }
                        </Td>
                        <Td bold>
                          {
                            item.nama
                          }
                        </Td>
                        <Td>
                          <span
                            className={`inline-flex items-center justify-center min-h-[32px] px-3 rounded-full text-xs font-bold capitalize ${getBadgeDetail(
                              item.status
                            )}`}
                          >
                            {
                              item.status
                            }
                          </span>
                        </Td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD */}
          <div className="md:hidden space-y-3">
            {loadingDetail ? (
              <EmptyState text="Memuat detail..." />
            ) : filteredDetail.length ===
              0 ? (
              <EmptyState text="Data tidak ditemukan." />
            ) : (
              filteredDetail.map(
                (
                  item,
                  i
                ) => (
                  <div
                    key={`${item.nis}-${i}`}
                    className="rounded-3xl border border-gray-100 p-4 bg-white"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-400 font-bold">
                          #{i + 1}
                        </p>
                        <h3 className="font-black text-gray-900">
                          {
                            item.nama
                          }
                        </h3>
                        <p className="text-sm text-gray-500">
                          NIS:{" "}
                          {
                            item.nis
                          }
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center justify-center h-9 px-3 rounded-full text-xs font-bold capitalize ${getBadgeDetail(
                          item.status
                        )}`}
                      >
                        {
                          item.status
                        }
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
};

function InputWrap({
  icon,
  children,
}) {
  return (
    <div className="h-11 rounded-2xl border border-gray-200 px-4 flex items-center gap-3 bg-white">
      <span className="text-gray-400 text-sm shrink-0">
        {icon}
      </span>
      {children}
    </div>
  );
}

function SkeletonRows() {
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
    <div className="rounded-3xl bg-gray-50 p-8 text-center text-gray-400">
      {text}
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}) {
  const styles = {
    gray: "bg-gray-50 text-gray-800",
    green:
      "bg-emerald-50 text-emerald-700",
    yellow:
      "bg-amber-50 text-amber-700",
    blue:
      "bg-blue-50 text-blue-700",
    red: "bg-rose-50 text-rose-700",
  };

  return (
    <div
      className={`rounded-3xl p-4 text-center border border-gray-100 ${styles[color]}`}
    >
      <p className="text-xs opacity-70 font-bold uppercase tracking-wider">
        {title}
      </p>
      <p className="text-2xl font-black mt-1">
        {value}
      </p>
    </div>
  );
}

function Th({
  children,
}) {
  return (
    <th className="p-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-400">
      {children}
    </th>
  );
}

function Td({
  children,
  bold,
}) {
  return (
    <td
      className={`p-4 text-sm ${
        bold
          ? "font-bold text-gray-900"
          : "text-gray-600"
      }`}
    >
      {children}
    </td>
  );
}

export default RiwayatPresensi;