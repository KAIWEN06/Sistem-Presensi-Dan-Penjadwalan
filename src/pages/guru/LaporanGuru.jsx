import { FaDownload } from "react-icons/fa";
import { Search, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import {
  todayManado,
  monthManado,
} from "../../utils/timezone";

export default function LaporanGuru() {
  const bulanNow = monthManado();

  const daftarBulan = [
    { id: "01", nama: "Januari" },
    { id: "02", nama: "Februari" },
    { id: "03", nama: "Maret" },
    { id: "04", nama: "April" },
    { id: "05", nama: "Mei" },
    { id: "06", nama: "Juni" },
    { id: "07", nama: "Juli" },
    { id: "08", nama: "Agustus" },
    { id: "09", nama: "September" },
    { id: "10", nama: "Oktober" },
    { id: "11", nama: "November" },
    { id: "12", nama: "Desember" },
  ];

  const [tab, setTab] = useState("pengajar");
  const [isWaliKelas, setIsWaliKelas] = useState(false);

  const [tahunList, setTahunList] = useState([]);
  const [tahunId, setTahunId] = useState("");

  const [semesterList, setSemesterList] = useState([]);

  const [opsi, setOpsi] = useState([]);
  const [pilih, setPilih] = useState("");

  const [mode, setMode] = useState("bulan");
  const [timeline, setTimeline] = useState(bulanNow);

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMaster, setLoadingMaster] = useState(true);

  useEffect(() => {
    initPage();
  }, []);

  useEffect(() => {
    if (!tahunId) return;
    loadSemester();
    loadFilter();
  }, [tahunId, tab]);

  useEffect(() => {
    if (tahunId && pilih && timeline) {
      loadRows();
    }
  }, [tahunId, pilih, timeline, tab]);

  const initPage = async () => {
    try {
      setLoadingMaster(true);
      await Promise.all([loadTahun(), cekWaliKelas()]);
    } finally {
      setLoadingMaster(false);
    }
  };

  const cekWaliKelas = async () => {
    try {
      const res = await api.get("/guru/laporan/wali/filter");
      setIsWaliKelas((res.data || []).length > 0);
    } catch {}
  };

  const loadTahun = async () => {
    try {
      const res = await api.get("/guru/tahun/list");
      const list = res.data || [];
      setTahunList(list);

      const aktif = list.find((x) => x.aktif) || list[0];
      if (aktif) setTahunId(aktif.id);
    } catch {}
  };

  const loadSemester = async () => {
    try {
      const res = await api.get(
        `/guru/semester/list?tahun_id=${tahunId}`
      );

      const list = res.data || [];
      setSemesterList(list);

      if (mode === "semester" && list.length) {
        setTimeline(
          list.find((x) => x.aktif)?.id ||
            list[0]?.id ||
            ""
        );
      }
    } catch {}
  };

  const loadFilter = async () => {
    try {
      setRows([]);
      setOpsi([]);
      setPilih("");

      const url =
        tab === "pengajar"
          ? "/guru/laporan/pengajar/filter"
          : "/guru/laporan/wali/filter";

      const res = await api.get(url);
      const list = res.data || [];

      setOpsi(list);

      if (list.length) {
        setPilih(list[0].id);
      }
    } catch {}
  };

  const loadRows = async () => {
    try {
      setLoading(true);

      const url =
        tab === "pengajar"
          ? `/guru/laporan/pengajar?jadwal=${pilih}&mode=${mode}&nilai=${timeline}&tahun_id=${tahunId}`
          : `/guru/laporan/wali?kelas=${pilih}&mode=${mode}&nilai=${timeline}&tahun_id=${tahunId}`;

      const res = await api.get(url);
      setRows(res.data || []);
    } catch {
      setRows([]);
      toast.error("Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  const handleTab = (val) => {
    setTab(val);
    setMode("bulan");
    setTimeline(bulanNow);
    setSearch("");
  };

  const handleMode = (val) => {
    setMode(val);

    if (val === "hari") {
      setTimeline(todayManado());
    } else if (val === "bulan") {
      setTimeline(bulanNow);
    } else {
      setTimeline(
        semesterList.find((x) => x.aktif)?.id ||
          semesterList[0]?.id ||
          ""
      );
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((x) =>
      x.nama
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [rows, search]);

const handlePDF = async () => {
  if (!filtered.length) {
    toast.error("Tidak ada data untuk diunduh");
    return;
  }


  const LOGO_URL =
    "https://ccehpokvtkamhkhhhsnt.supabase.co/storage/v1/object/public/public-assets/logo.png";

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const center = pageWidth / 2;
  toast.success("Mengunduh laporan...");

  const loadImageBase64 = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const formatTanggal = new Date().toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const periodeText = () => {
    if (mode === "hari") return timeline;

    if (mode === "bulan") {
      const bln = daftarBulan.find(
        (x) => x.id === timeline
      );
      return bln?.nama || timeline;
    }

    if (mode === "semester") {
      const smt = semesterList.find(
        (x) => x.id === timeline
      );

      return smt
        ? `${smt.tahun_id} - ${smt.nama}`
        : timeline;
    }

    return "-";
  };

  const totalHadir = filtered.reduce(
    (sum, x) => sum + Number(x.hadir || 0),
    0
  );

  const totalSakit = filtered.reduce(
    (sum, x) => sum + Number(x.sakit || 0),
    0
  );

  const totalIzin = filtered.reduce(
    (sum, x) => sum + Number(x.izin || 0),
    0
  );

  const totalAlpha = filtered.reduce(
    (sum, x) => sum + Number(x.alpha || 0),
    0
  );

  const logoBase64 =
    await loadImageBase64(LOGO_URL);

  /* ===============================
     PAGE 1 HEADER
  =============================== */
  if (logoBase64) {
    doc.addImage(
      logoBase64,
      "PNG",
      14,
      10,
      18,
      18
    );
  }

  doc.setDrawColor(74, 52, 43);
  doc.setLineWidth(0.5);
  doc.line(14, 31, 196, 31);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(74, 52, 43);

  doc.text(
    "SD GMIM 12 MANADO",
    center,
    17,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);

  doc.text(
    "Sistem Presensi dan Penjadwalan Sekolah",
    center,
    23,
    { align: "center" }
  );

  doc.text(
    "Jl. Pingkan Matindas No. 44, Kec. Paal Dua, Kota Manado",
    center,
    28,
    { align: "center" }
  );

  /* TITLE */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);

  doc.text(
    tab === "pengajar"
      ? "LAPORAN REKAP PRESENSI PENGAJAR"
      : "LAPORAN REKAP PRESENSI WALI KELAS",
    center,
    40,
    { align: "center" }
  );

  /* INFO BOX */
  doc.setFillColor(248, 246, 243);
  doc.roundedRect(14, 46, 182, 24, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(`Tahun Ajaran : ${tahunId}`, 18, 54);
  doc.text(`Periode : ${periodeText()}`, 18, 60);
  doc.text(`Dicetak : ${formatTanggal}`, 18, 66);
  doc.text(`Jumlah Data : ${filtered.length}`, 110, 54);

  /* SUMMARY */
  const y = 78;
  const w = 42;
  const g = 4;

  const statBox = (
    x,
    title,
    value,
    r,
    gr,
    b
  ) => {
    doc.setFillColor(r, gr, b);
    doc.roundedRect(x, y, w, 18, 2, 2, "F");

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(title, x + 3, y + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(String(value), x + 3, y + 14);
  };

  statBox(
    14,
    "Hadir",
    totalHadir,
    232,
    245,
    233
  );

  statBox(
    14 + w + g,
    "Sakit",
    totalSakit,
    227,
    242,
    253
  );

  statBox(
    14 + (w + g) * 2,
    "Izin",
    totalIzin,
    255,
    248,
    225
  );

  statBox(
    14 + (w + g) * 3,
    "Alpha",
    totalAlpha,
    255,
    235,
    238
  );

  /* ===============================
     TABLE AUTO PAGE
  =============================== */
  autoTable(doc, {
    startY: 102,
    head: [
      [
        "No",
        "Nama",
        "Kelas",
        "Hadir",
        "Sakit",
        "Izin",
        "Alpha",
      ],
    ],
    body: filtered.map((x, i) => [
      i + 1,
      x.nama,
      `Kelas ${x.kelas}`,
      x.hadir,
      x.sakit,
      x.izin,
      x.alpha,
    ]),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [225, 225, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [74, 52, 43],
      textColor: [255, 255, 255],
      halign: "center",
    },
    bodyStyles: {
      halign: "center",
    },
    columnStyles: {
      1: { halign: "left" },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  });

  /* ===============================
     TANDA TANGAN HALAMAN TERAKHIR TABEL
  =============================== */
  const lastTablePage =
    doc.internal.getNumberOfPages();

  doc.setPage(lastTablePage);

  const finalY =
    doc.lastAutoTable.finalY;

  if (finalY < 240) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      "Mengetahui,",
      145,
      finalY + 12
    );

    doc.text(
      "Wali Kelas",
      145,
      finalY + 18
    );

    doc.text(
      "_____________________",
      145,
      finalY + 40
    );
  }

  /* ===============================
     HALAMAN ANALISIS
  =============================== */
  doc.addPage();

  const analysisPage =
    doc.internal.getNumberOfPages();

  doc.setPage(analysisPage);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(74, 52, 43);

  doc.text(
    "ANALISIS KEHADIRAN",
    center,
    18,
    { align: "center" }
  );

  const totalAll =
    totalHadir +
    totalSakit +
    totalIzin +
    totalAlpha;

  const persen = (n) =>
    totalAll
      ? ((n / totalAll) * 100).toFixed(1)
      : 0;

  const drawBar = (
    yPos,
    label,
    val,
    color,
    pct
  ) => {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    doc.text(label, 20, yPos);

    doc.setFillColor(
      color[0],
      color[1],
      color[2]
    );

    doc.roundedRect(
      52,
      yPos - 4,
      (pct / 100) * 110,
      6,
      1,
      1,
      "F"
    );

    doc.text(
      `${val} (${pct}%)`,
      165,
      yPos
    );
  };

  drawBar(
    50,
    "Hadir",
    totalHadir,
    [34, 197, 94],
    persen(totalHadir)
  );

  drawBar(
    65,
    "Sakit",
    totalSakit,
    [59, 130, 246],
    persen(totalSakit)
  );

  drawBar(
    80,
    "Izin",
    totalIzin,
    [234, 179, 8],
    persen(totalIzin)
  );

  drawBar(
    95,
    "Alpha",
    totalAlpha,
    [239, 68, 68],
    persen(totalAlpha)
  );

  doc.setFillColor(248, 246, 243);
  doc.roundedRect(
    14,
    118,
    182,
    50,
    2,
    2,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    "Catatan Evaluasi",
    18,
    130
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    `• Persentase kehadiran: ${persen(
      totalHadir
    )}%`,
    18,
    140
  );

  doc.text(
    `• Total ketidakhadiran: ${
      totalSakit +
      totalIzin +
      totalAlpha
    }`,
    18,
    148
  );

  doc.text(
    `• Status terbanyak selain hadir: ${
      Math.max(
        totalSakit,
        totalIzin,
        totalAlpha
      ) === totalAlpha
        ? "Alpha"
        : Math.max(
            totalSakit,
            totalIzin,
            totalAlpha
          ) === totalSakit
        ? "Sakit"
        : "Izin"
    }`,
    18,
    156
  );

  /* ===============================
     FOOTER PREMIUM ALL PAGE
  =============================== */
  const totalPages =
    doc.internal.getNumberOfPages();

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {
    doc.setPage(i);

    doc.setDrawColor(
      220,
      220,
      220
    );

    doc.setLineWidth(0.2);

    doc.line(
      14,
      286,
      196,
      286
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);
    doc.setTextColor(
      110,
      110,
      110
    );

    doc.text(
      "SD GMIM 12 MANADO",
      14,
      291
    );

    doc.text(
      formatTanggal,
      pageWidth / 2,
      291,
      { align: "center" }
    );

    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      196,
      291,
      { align: "right" }
    );
  }

  /* SAVE */
  doc.save(
    tab === "pengajar"
      ? "Laporan-Pengajar.pdf"
      : "Laporan-Wali-Kelas.pdf"
  );
  toast.success("Laporan berhasil diunduh");
};

  const totalHadir = filtered.reduce(
    (a, b) => a + Number(b.hadir || 0),
    0
  );

  const totalSakit = filtered.reduce(
    (a, b) => a + Number(b.sakit || 0),
    0
  );

  const totalIzin = filtered.reduce(
    (a, b) => a + Number(b.izin || 0),
    0
  );

  const totalAlpha = filtered.reduce(
    (a, b) => a + Number(b.alpha || 0),
    0
  );

  return (
    <section className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* TAB */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => handleTab("pengajar")}
            className={`min-h-[44px] rounded-2xl font-bold transition-all ${
              tab === "pengajar"
                ? "bg-[#715445] text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Laporan Pengajar
          </button>

          {isWaliKelas && (
            <button
              onClick={() => handleTab("wali")}
              className={`min-h-[44px] rounded-2xl font-bold transition-all ${
                tab === "wali"
                  ? "bg-[#715445] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Wali Kelas
            </button>
          )}
        </div>
      </div>

      {/* FILTER */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3 items-center">
          <div className="xl:col-span-4">
            <InputSearch
              search={search}
              setSearch={setSearch}
            />
          </div>

          <div className="xl:col-span-2">
            <SelectBox
              value={tahunId}
              onChange={(e) =>
                setTahunId(e.target.value)
              }
            >
              {tahunList.map((x) => (
                <option
                  key={x.id}
                  value={x.id}
                >
                  {x.id}
                </option>
              ))}
            </SelectBox>
          </div>

          <div className="xl:col-span-3">
            <SelectBox
              value={pilih}
              onChange={(e) =>
                setPilih(e.target.value)
              }
            >
              {opsi.map((x) => (
                <option
                  key={x.id}
                  value={x.id}
                >
                  {x.label || x.nama}
                </option>
              ))}
            </SelectBox>
          </div>

          <div className="xl:col-span-3">
            <SelectBox
              value={mode}
              onChange={(e) =>
                handleMode(e.target.value)
              }
            >
              <option value="hari">
                Per Hari
              </option>
              <option value="bulan">
                Per Bulan
              </option>
              <option value="semester">
                Per Semester
              </option>
            </SelectBox>
          </div>
        </div>

        {/* BARIS KEDUA DESKTOP PDF + TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-3">
            <button
              onClick={handlePDF}
              className="w-full h-11 rounded-2xl bg-[#715445] text-white font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-sm"
            >
              <FaDownload />
              Unduh PDF
            </button>
          </div>

          <div className="lg:col-span-9">
            {mode === "hari" && (
              <input
                type="date"
                value={timeline}
                onChange={(e) =>
                  setTimeline(
                    e.target.value
                  )
                }
                className="h-11 rounded-2xl border border-gray-200 px-4 w-full"
              />
            )}

            {mode === "bulan" && (
              <SelectBox
                value={timeline}
                onChange={(e) =>
                  setTimeline(
                    e.target.value
                  )
                }
              >
                {daftarBulan.map((x) => (
                  <option
                    key={x.id}
                    value={x.id}
                  >
                    {x.nama}
                  </option>
                ))}
              </SelectBox>
            )}

            {mode === "semester" && (
              <SelectBox
                value={timeline}
                onChange={(e) =>
                  setTimeline(
                    e.target.value
                  )
                }
              >
                {semesterList.map((x) => (
                  <option
                    key={x.id}
                    value={x.id}
                  >
                    {x.tahun_id} - {x.nama}
                  </option>
                ))}
              </SelectBox>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Hadir"
          value={totalHadir}
          color="text-emerald-600"
        />
        <StatCard
          title="Sakit"
          value={totalSakit}
          color="text-blue-600"
        />
        <StatCard
          title="Izin"
          value={totalIzin}
          color="text-amber-600"
        />
        <StatCard
          title="Alpha"
          value={totalAlpha}
          color="text-rose-600"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 font-black text-gray-900">
          {tab === "pengajar"
            ? "Rekap Presensi Pengajar"
            : "Rekap Presensi Wali Kelas"}
        </div>

        {/* desktop */}
        <div className="hidden md:block overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>No</Th>
                <Th left>Nama</Th>
                <Th>Kelas</Th>
                <Th>Hadir</Th>
                <Th>Sakit</Th>
                <Th>Izin</Th>
                <Th>Alpha</Th>
              </tr>
            </thead>

            <tbody>
              {loading || loadingMaster ? (
                <LoadingRow />
              ) : filtered.length ? (
                filtered.map((x, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100"
                  >
                    <Td>{i + 1}</Td>
                    <Td left bold>
                      {x.nama}
                    </Td>
                    <Td>
                      Kelas {x.kelas}
                    </Td>
                    <Td green>{x.hadir}</Td>
                    <Td blue>{x.sakit}</Td>
                    <Td amber>{x.izin}</Td>
                    <Td red>{x.alpha}</Td>
                  </tr>
                ))
              ) : (
                <EmptyRow />
              )}
            </tbody>
          </table>
        </div>

        {/* mobile */}
        <div className="md:hidden p-4 space-y-3">
          {loading || loadingMaster ? (
            <CardLoading />
          ) : filtered.length ? (
            filtered.map((x, i) => (
              <div
                key={i}
                className="rounded-3xl border border-gray-100 p-4"
              >
                <h3 className="font-black text-gray-900">
                  {x.nama}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Kelas {x.kelas}
                </p>

                <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
                  <MiniStat
                    label="H"
                    val={x.hadir}
                    type="hadir"
                  />
                  <MiniStat
                    label="S"
                    val={x.sakit}
                    type="sakit"
                  />
                  <MiniStat
                    label="I"
                    val={x.izin}
                    type="izin"
                  />
                  <MiniStat
                    label="A"
                    val={x.alpha}
                    type="alpha"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-10">
              Tidak ada data
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* COMPONENT */

function InputSearch({
  search,
  setSearch,
}) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="Cari nama..."
        className="w-full h-11 rounded-2xl border border-gray-200 pl-11 pr-4"
      />
    </div>
  );
}

function SelectBox(props) {
  return (
    <select
      {...props}
      className="h-11 rounded-2xl border border-gray-200 px-4 w-full"
    />
  );
}

function StatCard({
  title,
  value,
  color,
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">
        {title}
      </p>
      <h3
        className={`text-2xl font-black mt-1 ${color}`}
      >
        {value}
      </h3>
    </div>
  );
}

function Th({
  children,
  left,
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-black uppercase text-gray-500 ${
        left
          ? "text-left"
          : "text-center"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  left,
  bold,
  green,
  blue,
  amber,
  red,
}) {
  const color = green
    ? "text-emerald-600"
    : blue
    ? "text-blue-600"
    : amber
    ? "text-amber-600"
    : red
    ? "text-rose-600"
    : "text-gray-700";

  return (
    <td
      className={`px-4 py-3 text-center ${color} ${
        left
          ? "text-left"
          : ""
      } ${
        bold
          ? "font-bold"
          : ""
      }`}
    >
      {children}
    </td>
  );
}

function LoadingRow() {
  return (
    <tr>
      <td
        colSpan="7"
        className="py-10 text-center"
      >
        <Loader2 className="animate-spin mx-auto text-gray-300" />
      </td>
    </tr>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td
        colSpan="7"
        className="py-10 text-center text-gray-400"
      >
        Tidak ada data
      </td>
    </tr>
  );
}

function CardLoading() {
  return (
    <div className="text-center py-10">
      <Loader2 className="animate-spin mx-auto text-gray-300" />
    </div>
  );
}

function MiniStat({
  label,
  val,
  type,
}) {
  const style =
    type === "hadir"
      ? "bg-emerald-50 text-emerald-700"
      : type === "sakit"
      ? "bg-blue-50 text-blue-700"
      : type === "izin"
      ? "bg-amber-50 text-amber-700"
      : "bg-rose-50 text-rose-700";

  return (
    <div
      className={`rounded-2xl p-2 ${style}`}
    >
      <p className="font-bold opacity-70">
        {label}
      </p>
      <p className="font-black">
        {val}
      </p>
    </div>
  );
}