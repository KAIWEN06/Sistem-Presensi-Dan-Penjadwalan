import { useEffect, useMemo, useState } from "react";
import {
  User,
  ChevronRight,
  Search,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  Filter,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList,
} from "recharts";

import api from "../../lib/axios";

const LihatPresensi = () => {
  const [students, setStudents] = useState([]);
  const [selectedAnak, setSelectedAnak] = useState(null);

  const [stats, setStats] = useState({
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    total: 0,
  });

  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [loading, setLoading] = useState(false);

  /* FILTER ASLI (tidak diubah fungsi) */
  const [bulan, setBulan] = useState("");
  const [tahun, setTahun] = useState("");
  const [semester, setSemester] = useState("");
  const [hari, setHari] = useState("");

  /* tambahan date filter frontend only */
  const [dateFilter, setDateFilter] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* auto responsive per page */
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth < 640) setPerPage(5);
      else if (window.innerWidth < 1024) setPerPage(8);
      else setPerPage(12);
    };

    updatePerPage();
    window.addEventListener("resize", updatePerPage);

    return () =>
      window.removeEventListener("resize", updatePerPage);
  }, []);

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

  const loadPresensi = async (nis) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (bulan) params.append("bulan", bulan);
      if (tahun) params.append("tahun", tahun);
      if (semester) params.append("semester", semester);
      if (hari) params.append("hari", hari);

      const res = await api.get(
        `/ortu/presensi/${nis}?${params.toString()}`
      );

      setStats(
        res.data?.stats || {
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0,
          total: 0,
        }
      );

      setTableData(res.data?.riwayat || []);
      setChartData(res.data?.chartData || []);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnak();
  }, []);

  useEffect(() => {
    if (selectedAnak?.nis) {
      loadPresensi(selectedAnak.nis);
    }
  }, [selectedAnak, bulan, tahun, semester, hari]);

  useEffect(() => {
    setPage(1);
  }, [tableData, search, dateFilter, perPage]);

  const statusColor = (status) => {
    const s = status?.toLowerCase();

    if (s === "hadir") return "bg-green-500";
    if (s === "izin") return "bg-yellow-500";
    if (s === "sakit") return "bg-red-500";
    return "bg-gray-500";
  };

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();

    return tableData.filter((row) => {
      const matchSearch =
        row.tanggal?.toLowerCase().includes(q) ||
        row.hari?.toLowerCase().includes(q) ||
        row.jam?.toLowerCase().includes(q) ||
        row.mapel?.toLowerCase().includes(q) ||
        row.status?.toLowerCase().includes(q);

      const matchDate = dateFilter
        ? row.tanggal === dateFilter
        : true;

      return matchSearch && matchDate;
    });
  }, [tableData, search, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / perPage)
  );

  const paginatedData = filteredData.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const changePage = (value) => {
    setPage(Math.min(Math.max(value, 1), totalPages));
  };

  return (
    <div className="space-y-6">

      {/* PILIH ANAK */}
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4 min-w-max">
          {students.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelectedAnak(s)}
              className={`
                min-w-[240px] rounded-2xl border p-4 text-left shadow-sm transition
                ${
                  selectedAnak?.nis === s.nis
                    ? "bg-white border-[#5A3E36] ring-2 ring-[#E8DDD8]"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#5A3E36]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.nama}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {s.kelas}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FILTER PREMIUM */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#5A3E36]" />
          <h2 className="font-semibold text-gray-800">
            Filter Presensi
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">

          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="h-11 rounded-xl border px-4 bg-white"
          >
            <option value="">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>

          <select
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            className="h-11 rounded-xl border px-4 bg-white"
          >
            <option value="">Semua Tahun</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="h-11 rounded-xl border px-4 bg-white"
          >
            <option value="">Semua Semester</option>
            <option value="ganjil">Ganjil</option>
            <option value="genap">Genap</option>
          </select>

          <select
            value={hari}
            onChange={(e) => setHari(e.target.value)}
            className="h-11 rounded-xl border px-4 bg-white"
          >
            <option value="">Semua Hari</option>
            <option value="Senin">Senin</option>
            <option value="Selasa">Selasa</option>
            <option value="Rabu">Rabu</option>
            <option value="Kamis">Kamis</option>
            <option value="Jumat">Jumat</option>
          </select>

          {/* date tambahan */}
          <div className="relative">
            <CalendarDays className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-11 w-full rounded-xl border pl-10 pr-4 bg-white"
            />
          </div>

          <button
            onClick={() => {
              setBulan("");
              setTahun("");
              setSemester("");
              setHari("");
              setDateFilter("");
              setSearch("");
            }}
            className="h-11 rounded-xl bg-[#5A3E36] text-white font-medium hover:opacity-95"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RIWAYAT */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
            <h2 className="font-semibold text-gray-700">
              Riwayat Presensi
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari data..."
                className="w-full border rounded-xl pl-9 pr-4 py-2 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          ) : filteredData.length > 0 ? (
            <>
              {/* MOBILE */}
              <div className="block md:hidden space-y-3">
                {paginatedData.map((row, i) => (
                  <div
                    key={i}
                    className="border rounded-2xl p-4 bg-gray-50"
                  >
                    <div className="flex justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-sm">
                          {row.mapel}
                        </p>
                        <p className="text-xs text-gray-500">
                          {row.tanggal}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 text-xs text-white rounded-full h-fit ${statusColor(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Hari</p>
                        <p>{row.hari}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Jam</p>
                        <p>{row.jam}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => changePage(page - 1)}
                    className="flex-1 border rounded-xl py-2 disabled:opacity-40"
                  >
                    Prev
                  </button>

                  <button
                    disabled={page === totalPages}
                    onClick={() => changePage(page + 1)}
                    className="flex-1 border rounded-xl py-2 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* DESKTOP */}
          <div className="hidden md:block">
            {/* hapus scroll kanan kiri */}
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-4 py-3 w-[18%]">Tanggal</th>
                    <th className="px-4 py-3 w-[18%]">Hari</th>
                    <th className="px-4 py-3 w-[16%]">Jam</th>
                    <th className="px-4 py-3 w-[30%]">Mapel</th>
                    <th className="px-4 py-3 w-[18%]">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 truncate">
                        {row.tanggal}
                      </td>

                      <td className="px-4 py-3 truncate">
                        {row.hari}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.jam}
                      </td>

                      <td className="px-4 py-3 truncate">
                        {row.mapel}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs text-white ${statusColor(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Halaman {page} dari {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => changePage(page - 1)}
                  className="px-3 py-2 rounded-xl border disabled:opacity-40"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  disabled={page === totalPages}
                  onClick={() => changePage(page + 1)}
                  className="px-3 py-2 rounded-xl border disabled:opacity-40"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">
              Data tidak ditemukan
            </div>
          )}
        </div>

        {/* CHART */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            Statistik Presensi
          </h2>

          {loading ? (
            <div className="h-72 bg-gray-100 rounded-xl animate-pulse"></div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 10,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.18}
                  />

                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />

                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry, index) => {
                      let fill = "#6B7280";

                      if (entry.name === "Hadir") fill = "#22C55E";
                      else if (entry.name === "Izin") fill = "#EAB308";
                      else if (entry.name === "Sakit") fill = "#EF4444";

                      return <Cell key={index} fill={fill} />;
                    })}

                    <LabelList dataKey="value" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LihatPresensi;