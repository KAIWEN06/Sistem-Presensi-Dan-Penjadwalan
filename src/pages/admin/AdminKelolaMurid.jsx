import React, { useEffect, useState } from "react";
import api from "../../lib/axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Calendar as CalendarIcon,
  CloudUpload,
  ClipboardList,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  User,
  GraduationCap,
  Users,
  ChevronRight,
  X,
  Loader2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Power
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

export default function AdminKelolaMurid() {
  /* ===============================
     STATE (Logic Intact)
  =============================== */
  const [tahunBaru, setTahunBaru] = useState("");
  const [ganjilMulai, setGanjilMulai] = useState("");
  const [ganjilSelesai, setGanjilSelesai] = useState("");
  const [genapMulai, setGenapMulai] = useState("");
  const [genapSelesai, setGenapSelesai] = useState("");
  const [tahunAktif, setTahunAktif] = useState("-");

  const [muridData, setMuridData] = useState([]);
  const [kelasList, setKelasList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterKelas, setFilterKelas] = useState("semua");
  const [filterTahunLulus, setFilterTahunLulus] = useState("semua");

  const [excelFile, setExcelFile] = useState(null);
  const [showTambah, setShowTambah] = useState(false);

  const [formTambah, setFormTambah] = useState({
    nis: "",
    nama: "",
    kelas: "",
    nama_ortu: ""
  });

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    nama: "",
    kelas: "",
    nama_ortu: ""
  });

  /* ===============================
     FETCH LOGIC (Logic Intact)
  =============================== */
  const fetchMaster = async () => {
    try {
      const kelasRes = await api.get("/admin/kelas/aktif").catch(() => ({ data: [] }));
      setKelasList(kelasRes.data || []);
      const tahunRes = await api.get("/admin/tahun-ajaran/aktif").catch(() => ({ data: { id: "-" } }));
      setTahunAktif(tahunRes.data?.id || "-");
      const tahunAll = await api
      .get("/admin/tahun-ajaran")
      .catch(() => ({ data: [] }));
    const tahunNonAktif = (tahunAll.data || [])
      .filter((t) => t.aktif === false)
      .map((t) => t.id)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => b.localeCompare(a));

    setListTahunLulus(tahunNonAktif);
    } catch (err) {
      console.log(err);
    }
  };

  

  const fetchMurid = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/murid");
      setMuridData(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMuridLulus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/murid/lulus");
      setMuridData(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaster();
  }, []);

  useEffect(() => {
    if (filterStatus === "lulus") {
      fetchMuridLulus();
    } else {
      fetchMurid();
    }
  }, [filterStatus]);

  /* ===============================
     HANDLERS (Logic Intact)
  =============================== */
const handleRollover = async () => {
  try {
    const id = toast.loading(
      "Memproses rollover tahun ajaran..."
    );

    const res = await api.post(
      "/admin/tahun-ajaran/rollover",
      {
        tahunBaru,
        semester1: {
          mulai: ganjilMulai,
          selesai: ganjilSelesai
        },
        semester2: {
          mulai: genapMulai,
          selesai: genapSelesai
        }
      }
    );

    await fetchMaster();
    await fetchMurid();

    toast.success(
      `Rollover berhasil • Naik Kelas ${res.data.naikKelas} • Lulus ${res.data.lulus}`,
      { id }
    );
  } catch (err) {
    toast.error(
      err.response?.data?.error ||
        "Gagal rollover tahun ajaran"
    );
  }
};
const toggleStatus = async (murid) => {
  try {
    const statusBaru =
      murid.status === "aktif"
        ? "nonaktif"
        : "aktif";

    const id = toast.loading(
      "Memperbarui status..."
    );

    await api.patch(
      `/admin/murid/${murid.nis}/status`,
      {
        status: statusBaru
      }
    );

    await fetchMurid();

    toast.success(
      `Status ${murid.nama} menjadi ${statusBaru}`,
      { id }
    );
  } catch (err) {
    toast.error(
      "Gagal memperbarui status"
    );
  }
};


  const downloadTemplate = () => {
    const data = [
      { NIS: "M001", NAMA: "Rafael Kairupan", NAMA_ORANG_TUA: "Yanto Kairupan", KELAS: "2" },
      { NIS: "M002", NAMA: "Mikael Runtuwene", NAMA_ORANG_TUA: "Maria Runtuwene", KELAS: "2" }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "template_murid.xlsx");
  };

  const filteredData = muridData.filter((m) => {
    const cocokSearch = `${m.nis} ${m.nama}`.toLowerCase().includes(search.toLowerCase());
    const cocokStatus = filterStatus === "semua" ? true : m.status === filterStatus;
    const cocokKelas = filterStatus === "lulus" ? true : filterKelas === "semua" ? true : String(m.kelas) === String(filterKelas);
    const cocokTahun = filterStatus !== "lulus" ? true : filterTahunLulus === "semua" ? true : String(m.tahun) === String(filterTahunLulus);
    return cocokSearch && cocokStatus && cocokKelas && cocokTahun;
  });

  const [listTahunLulus, setListTahunLulus] = useState([]);

  /* =========================================================
   STATE TAMBAHAN
========================================================= */

const [showDelete, setShowDelete] =
  useState(false);

const [selectedDelete, setSelectedDelete] =
  useState(null);

const [deleteLoading, setDeleteLoading] =
  useState(false);


/* =========================================================
   GANTI HAPUS MURID
========================================================= */

const hapusMurid = async (nis) => {
  setSelectedDelete(nis);
  setShowDelete(true);
};


/* =========================================================
   HANDLE DELETE CONFIRM
========================================================= */

const confirmDelete = async () => {
  try {
    setDeleteLoading(true);

    const loadId =
      toast.loading(
        "Menghapus murid..."
      );

    await api.delete(
      `/admin/murid/${selectedDelete}`
    );

    toast.success(
      "Murid berhasil dihapus",
      { id: loadId }
    );

    setShowDelete(false);
    setSelectedDelete(null);

    fetchMurid();
  } catch (err) {
    toast.error(
      "Gagal menghapus data"
    );
  } finally {
    setDeleteLoading(false);
  }
};


/* =========================================================
   GANTI TAMBAH MURID
========================================================= */

const tambahMurid = async () => {
  try {
    const loadId =
      toast.loading(
        "Menyimpan murid..."
      );

    await api.post("/admin/murid", {
      nis: formTambah.nis,
      nama: formTambah.nama,
      kelas_id: Number(
        formTambah.kelas
      ),
      nama_ortu:
        formTambah.nama_ortu ||
        null
    });

    toast.success(
      "Murid berhasil ditambahkan",
      { id: loadId }
    );

    setShowTambah(false);

    setFormTambah({
      nis: "",
      nama: "",
      kelas: "",
      nama_ortu: ""
    });

    fetchMurid();
  } catch (err) {
    toast.error(
      "Gagal menambah murid"
    );
  }
};


/* =========================================================
   GANTI EDIT
========================================================= */

const saveEdit = async (nis) => {
  try {
    const loadId =
      toast.loading(
        "Menyimpan perubahan..."
      );

    await api.patch(
      `/admin/murid/${nis}`,
      {
        nama: editForm.nama,
        kelas: Number(
          editForm.kelas
        ),
        nama_ortu:
          editForm.nama_ortu
      }
    );

    toast.success(
      "Perubahan disimpan",
      { id: loadId }
    );

    setEditId(null);

    fetchMurid();
  } catch (err) {
    toast.error(
      "Gagal menyimpan perubahan"
    );
  }
};


/* =========================================================
   GANTI UPLOAD EXCEL
========================================================= */

const uploadExcel = async () => {
  try {
    if (!excelFile)
      return toast.error(
        "Pilih file dulu"
      );

    setUploadLoading(true);

    const id =
      toast.loading(
        "Mengunggah file..."
      );

    const formData =
      new FormData();

    formData.append(
      "file",
      excelFile
    );

    await api.post(
      "/admin/murid/upload",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data"
        }
      }
    );

    toast.success(
      "Upload berhasil",
      { id }
    );

    setExcelFile(null);

    fetchMurid();
  } catch (err) {
    toast.error(
      "Upload gagal"
    );
  } finally {
    setUploadLoading(false);
  }
};

function ActionBtn({
  children,
  onClick,
  danger = false
}) {
  

  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-2xl border inline-flex items-center justify-center transition-all active:scale-95 ${
        danger
          ? "bg-rose-50 border-rose-200 text-rose-600"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-in fade-in duration-700">
      
      {/* SECTION 1: MANAJEMEN TAHUN AJARAN (VERCEL CARD) */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[#715445]/5 rounded-2xl text-[#715445]">
                <CalendarIcon size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tahun Ajaran</h3>
                <p className="text-gray-500 text-sm font-medium">Atur periode akademik & kenaikan kelas otomatis.</p>
              </div>
            </div>
            <div className="bg-[#715445]/5 px-6 py-3 rounded-2xl border border-[#715445]/10">
              <p className="text-[10px] font-bold text-[#715445] uppercase tracking-[0.2em] mb-1">Status Sekarang</p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xl font-black text-gray-800 tracking-tighter">{tahunAktif}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* TAHUN BARU SELECTOR */}
              <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Siapkan Tahun Ajaran Baru</label>
                <div className="relative group/input">
                  <select
                    value={tahunBaru}
                    onChange={(e) => setTahunBaru(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#715445]/5 focus:border-[#715445]/30 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Pilih Tahun Ajaran Berikutnya</option>
                    {(() => {
                      const awal = parseInt(tahunAktif.split("-")[0]) + 1;
                      const nextYear = `${awal}-${awal + 1}`;
                      return isNaN(awal) ? null : <option value={nextYear}>{nextYear}</option>;
                    })()}
                  </select>
                  <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                </div>
              </div>

              {/* SEMESTER GRID */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* GANJIL */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#715445]"></div>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Semester Ganjil</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={ganjilMulai} onChange={(e) => setGanjilMulai(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-[#715445]/5" />
                    <input type="date" value={ganjilSelesai} onChange={(e) => setGanjilSelesai(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-[#715445]/5" />
                  </div>
                </div>
                {/* GENAP */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#715445]"></div>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Semester Genap</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={genapMulai} onChange={(e) => setGenapMulai(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-[#715445]/5" />
                    <input type="date" value={genapSelesai} onChange={(e) => setGenapSelesai(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-[#715445]/5" />
                  </div>
                </div>
              </div>
            </div>

            {/* SUMMARY PANEL */}
            <div className="bg-[#715445] rounded-[1.8rem] p-8 text-white flex flex-col shadow-xl shadow-[#715445]/20">
              <h4 className="font-bold text-lg mb-6">Proses Rollover</h4>
              <div className="space-y-5 flex-1">
                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                  <span className="text-white/60">Tahun Baru</span>
                  <span className="font-mono font-bold">{tahunBaru || "---"}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Status Validasi</p>
                  {(() => {
                    const status = !tahunBaru ? { text: "Menunggu Input", color: "text-white/50" } : 
                                   (!ganjilMulai || !genapSelesai) ? { text: "Periode Belum Lengkap", color: "text-orange-300" } : 
                                   { text: "Data Siap Diproses", color: "text-emerald-300" };
                    return (
                      <div className={`flex items-center gap-2 text-sm font-bold ${status.color}`}>
                        <AlertCircle size={14} /> {status.text}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <button 
                onClick={handleRollover}
                disabled={!tahunBaru || !ganjilMulai}
                className="w-full bg-white text-[#715445] py-4 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mt-8"
              >
                Tutup & Mulai Tahun Baru
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: IMPORT EXCEL (MODERN UPLOAD) */}
      <section className="bg-gray-50/50 rounded-[2rem] border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white rounded-2xl shadow-sm text-gray-700">
              <CloudUpload size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Impor Data Massal</h3>
              <p className="text-sm text-gray-500 font-medium">Unggah berkas Excel sesuai template yang tersedia.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:border-[#715445] hover:text-[#715445] transition-all shadow-sm">
              <Download size={18} /> Unduh Template
            </button>

            <div className="flex items-center gap-2 p-1 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <label className="flex items-center gap-2 px-4 py-2 bg-[#715445] text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-[#5E4236] transition-all">
                <Upload size={16} /> Pilih File
                <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => setExcelFile(e.target.files[0])} />
              </label>
              <span className="text-xs font-bold text-gray-400 px-3 max-w-[150px] truncate">
                {excelFile ? excelFile.name : "Format .xlsx"}
              </span>
            </div>

            <button onClick={uploadExcel} disabled={uploadLoading || !excelFile} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10 disabled:opacity-40">
              {uploadLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Mulai Unggah
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: TABLE LIST (WITH DOT ANIMATION) */}


<section className="space-y-5 sm:space-y-6">
  {/* HEADER */}
  <div className="flex flex-col gap-4">
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* KIRI */}
        <div className="flex items-center gap-2 text-[#715445]">
          <Users size={18} className="shrink-0" />
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
            Database Murid
          </h3>
        </div>

      </div>

      <p className="text-sm text-gray-500 font-medium">
        Total {filteredData.length} siswa terdaftar di sistem.
      </p>
    </div>

    {/* SEARCH + FILTER */}
    <div className="sticky top-2 z-20 rounded-3xl bg-white/90 backdrop-blur-md border border-gray-100 shadow-sm p-3 sm:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* SEARCH */}
        <div className="relative group">
          <Search
            size={18}
            className="
              absolute left-4 top-1/2 -translate-y-1/2
              text-gray-400
              group-focus-within:text-[#715445]
            "
          />

          <input
            type="text"
            placeholder="Cari NIS / nama..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="
              w-full pl-11 pr-12
              h-11
              rounded-2xl
              border border-gray-200
              bg-white
              text-sm
              outline-none
              focus:ring-4 focus:ring-[#715445]/10
              focus:border-[#715445]/30
            "
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                w-7 h-7 rounded-full
                bg-gray-100 hover:bg-gray-200
                text-gray-500
                flex items-center justify-center
                transition-all
                active:scale-95
              "
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* FILTER KELAS */}
        {filterStatus !== "lulus" && (
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="
              w-full h-11 px-4
              rounded-2xl
              border border-gray-200
              bg-white
              text-sm font-semibold
              outline-none
              focus:ring-4 focus:ring-[#715445]/10
            "
          >
            <option value="semua">Semua Kelas</option>

            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        )}
      </div>

{/* STATUS TAB */}
<div className="mt-3 flex flex-col gap-3">

  {/* BARIS 1: TAB + SLOT KANAN */}
  <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-center justify-between gap-3">

    {/* TAB */}
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
      {[
        "semua",
        "aktif",
        "nonaktif",
        "lulus"
      ].map((s) => (
        <button
          key={s}
          onClick={() => setFilterStatus(s)}
          className={`shrink-0 min-h-[42px] px-4 sm:px-5 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
            filterStatus === s
              ? "bg-[#715445] text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {s}
        </button>
      ))}
    </div>

    {/* SLOT KANAN (DESKTOP) */}
    <div className="hidden lg:flex items-center">
      {filterStatus === "lulus" ? (
        <select
          value={filterTahunLulus}
          onChange={(e) => setFilterTahunLulus(e.target.value)}
          className="
            w-[180px]
            h-10 px-4
            rounded-2xl
            border border-gray-200
            bg-white
            text-sm font-semibold
            outline-none
            focus:ring-4 focus:ring-[#715445]/10
          "
        >
          <option value="semua">Semua Tahun</option>

          {(listTahunLulus || []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      ) : (
        <button
          onClick={() => setShowTambah(true)}
          className="
            h-10 px-5
            rounded-2xl
            bg-[#715445]
            text-white
            text-sm font-bold
            shadow-md shadow-[#715445]/20
            hover:bg-[#5e4336]
            active:scale-95
            transition-all
            flex items-center gap-2
          "
        >
          <Plus size={16} />
          Tambah Murid
        </button>
      )}
    </div>

  </div>

  {/* BARIS 2: MOBILE SLOT */}
  <div className="lg:hidden w-full">
    {filterStatus === "lulus" ? (
      <select
        value={filterTahunLulus}
        onChange={(e) => setFilterTahunLulus(e.target.value)}
        className="
          w-full
          h-11 px-4
          rounded-2xl
          border border-gray-200
          bg-white
          text-sm font-semibold
          outline-none
          focus:ring-4 focus:ring-[#715445]/10
        "
      >
        <option value="semua">Semua Tahun</option>

        {(listTahunLulus || []).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    ) : (
      <button
        onClick={() => setShowTambah(true)}
        className="
          w-full
          h-11
          rounded-2xl
          bg-[#715445]
          text-white
          text-sm font-bold
          flex items-center justify-center gap-2
          active:scale-95
        "
      >
        <Plus size={16} />
        Tambah Murid
      </button>
    )}
  </div>

</div>
    </div>
  </div>

  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] overflow-hidden">
    {/* ======================================
        DESKTOP TABLE
    ====================================== */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full min-w-[850px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
              NIS & Nama
            </th>

            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Orang Tua
            </th>

            <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Kelas
            </th>

            <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Status
            </th>

            <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td
                colSpan="5"
                className="py-16 text-center"
              >
                <div className="space-y-2">
                  <p className="text-gray-500 font-bold">
                    Tidak ada data ditemukan
                  </p>

                  <p className="text-sm text-gray-400">
                    Coba ubah filter atau tambah murid baru
                  </p>
                </div>
              </td>
            </tr>
          ) : filteredData.length ===
            0 ? (
            <tr>
              <td
                colSpan="5"
                className="py-16 text-center text-gray-400 font-medium"
              >
                Tidak ada data
              </td>
            </tr>
          ) : (
            filteredData.map((m) => (
              <tr
                key={m.nis}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-5">
                  <div className="space-y-1">
                    <span className="inline-flex px-2 py-1 rounded-lg bg-[#715445]/5 text-[#715445] text-[10px] font-black">
                      {m.nis}
                    </span>

                    <p className="font-bold text-gray-900">
                      {m.nama}
                    </p>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-500">
                  {m.nama_ortu ||
                    "-"}
                </td>

                <td className="px-6 py-5 text-center">
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold">
                    {String(
                      m.kelas
                    ).replace(
                      "Kelas ",
                      ""
                    )}
                  </span>
                </td>

                <td className="px-6 py-5 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      m.status ===
                      "aktif"
                        ? "bg-emerald-50 text-emerald-700"
                        : m.status ===
                          "lulus"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <ActionBtn
                      onClick={() => {
                        setEditId(m.nis);
                        setEditForm({
                          nama: m.nama,
                          kelas: String(m.kelas).replace("Kelas ", ""),
                          nama_ortu: m.nama_ortu || ""
                        });
                      }}
                    >
                      <Edit2 size={16} />
                    </ActionBtn>

                    <ActionBtn
                      onClick={() => toggleStatus(m)}
                    >
                      <Power size={16} />
                    </ActionBtn>

                    <ActionBtn
                      danger
                      onClick={() => hapusMurid(m.nis)}
                    >
                      <Trash2 size={16} />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* ======================================
        MOBILE CARD LIST
    ====================================== */}
    <div className="md:hidden p-3 space-y-3 bg-gray-50/50">
      {loading ? (
        <div className="rounded-3xl bg-white p-10 flex justify-center">
          <Loader2 className="animate-spin text-gray-300" />
        </div>
      ) : filteredData.length ===
        0 ? (
        <div className="rounded-3xl bg-white p-10 text-center text-gray-400 font-medium">
          Tidak ada data ditemukan
        </div>
      ) : (
        filteredData.map((m) => (
          <div
            key={m.nis}
            className="
              bg-white
              rounded-3xl
              border border-gray-100
              shadow-sm
              p-4
              space-y-4
              active:scale-[0.99]
              transition-all
            "
          >
            {/* TOP */}
            <div className="flex gap-3 items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black tracking-[0.2em] text-[#715445] truncate">
                  {m.nis}
                </p>

                <h4 className="text-base font-black text-gray-900 leading-tight break-words">
                  {m.nama}
                </h4>

                <p className="text-xs text-gray-500 mt-1 break-words">
                  Orang tua:{" "}
                  {m.nama_ortu ||
                    "-"}
                </p>
              </div>

              <span
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  m.status ===
                  "aktif"
                    ? "bg-emerald-50 text-emerald-700"
                    : m.status ===
                      "lulus"
                    ? "bg-purple-50 text-purple-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {m.status}
              </span>
            </div>

            {/* INFO */}
            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2">
              <span className="text-xs text-gray-500">
                Kelas
              </span>

              <span className="text-sm font-bold text-gray-800">
                {String(
                  m.kelas
                ).replace(
                  "Kelas ",
                  ""
                )}
              </span>
            </div>

            {/* ACTION */}
              <div className="grid grid-cols-3 gap-2">
                <ActionBtn
                  onClick={() => {
                    setEditId(m.nis);
                    setEditForm({
                      nama: m.nama,
                      kelas: String(m.kelas).replace("Kelas ", ""),
                      nama_ortu: m.nama_ortu || ""
                    });
                  }}
                >
                  <Edit2 size={16} />
                </ActionBtn>

                <ActionBtn
                  onClick={() => toggleStatus(m)}
                >
                  <Power size={16} />
                </ActionBtn>

                <ActionBtn
                  danger
                  onClick={() => hapusMurid(m.nis)}
                >
                  <Trash2 size={16} />
                </ActionBtn>
              </div>
          </div>
        ))
      )}
    </div>
  </div>
</section>

      {/* MODAL TAMBAH (MODERN OVERLAY) */}
      {showTambah && (
        <div className="fixed inset-0 z-[100]">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setShowTambah(false)}
          />

          {/* WRAPPER */}
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
              {/* MODAL */}
              <div
                className="
                  relative w-full sm:max-w-xl
                  bg-white
                  rounded-t-[2rem] sm:rounded-[2rem]
                  shadow-2xl
                  border border-gray-100
                  animate-in slide-in-from-bottom-5 sm:zoom-in-95
                  duration-300
                  max-h-[92vh]
                  overflow-hidden
                "
              >
                {/* HEADER */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-5 sm:px-7 py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center shrink-0">
                      <Plus size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                        Tambah Murid Baru
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Isi data siswa dengan benar agar langsung masuk ke sistem.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowTambah(false)}
                      className="
                        w-10 h-10 rounded-xl
                        bg-gray-100 hover:bg-gray-200
                        text-gray-500
                        flex items-center justify-center
                        transition-all
                        active:scale-95
                        shrink-0
                      "
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* BODY */}
                <div className="overflow-y-auto max-h-[calc(92vh-150px)] px-5 sm:px-7 py-5 space-y-5">
                  {/* NIS + KELAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* NIS */}
                    <div className="sm:col-span-1 space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                        NIS
                      </label>

                      <input
                        placeholder="M001"
                        value={formTambah.nis}
                        onChange={(e) =>
                          setFormTambah({
                            ...formTambah,
                            nis: e.target.value
                          })
                        }
                        className="
                          w-full h-12
                          rounded-2xl
                          border border-gray-200
                          bg-gray-50
                          px-4
                          text-sm font-semibold
                          outline-none
                          focus:bg-white
                          focus:ring-4 focus:ring-[#715445]/10
                          focus:border-[#715445]/30
                        "
                      />
                    </div>

                    {/* KELAS */}
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                        Penempatan Kelas
                      </label>

                      <select
                        value={formTambah.kelas}
                        onChange={(e) =>
                          setFormTambah({
                            ...formTambah,
                            kelas: e.target.value
                          })
                        }
                        className="
                          w-full h-12
                          rounded-2xl
                          border border-gray-200
                          bg-gray-50
                          px-4
                          text-sm font-semibold
                          outline-none
                          focus:bg-white
                          focus:ring-4 focus:ring-[#715445]/10
                          focus:border-[#715445]/30
                        "
                      >
                        <option value="">
                          Pilih Kelas
                        </option>

                        {kelasList.map((k) => (
                          <option
                            key={k.id}
                            value={k.id}
                          >
                            {k.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* NAMA */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Nama Lengkap
                    </label>

                    <input
                      placeholder="Masukkan nama siswa"
                      value={formTambah.nama}
                      onChange={(e) =>
                        setFormTambah({
                          ...formTambah,
                          nama: e.target.value
                        })
                      }
                      className="
                        w-full h-12
                        rounded-2xl
                        border border-gray-200
                        bg-gray-50
                        px-4
                        text-sm font-semibold
                        outline-none
                        focus:bg-white
                        focus:ring-4 focus:ring-[#715445]/10
                        focus:border-[#715445]/30
                      "
                    />
                  </div>

                  {/* ORTU */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Nama Orang Tua
                    </label>

                    <input
                      placeholder="Ayah / Ibu / Wali"
                      value={formTambah.nama_ortu}
                      onChange={(e) =>
                        setFormTambah({
                          ...formTambah,
                          nama_ortu:
                            e.target.value
                        })
                      }
                      className="
                        w-full h-12
                        rounded-2xl
                        border border-gray-200
                        bg-gray-50
                        px-4
                        text-sm font-semibold
                        outline-none
                        focus:bg-white
                        focus:ring-4 focus:ring-[#715445]/10
                        focus:border-[#715445]/30
                      "
                    />
                  </div>

                  {/* INFO CARD */}
                  <div className="rounded-2xl bg-[#715445]/5 border border-[#715445]/10 p-4">
                    <p className="text-xs font-semibold text-[#715445] leading-relaxed">
                      Pastikan NIS unik dan kelas sudah benar sebelum menyimpan data.
                    </p>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 px-5 sm:px-7 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowTambah(false)}
                      className="
                        min-h-[48px]
                        rounded-2xl
                        bg-gray-100
                        text-gray-700
                        text-sm font-bold
                        hover:bg-gray-200
                        active:scale-95
                        transition-all
                      "
                    >
                      Batal
                    </button>

                    <button
                      onClick={tambahMurid}
                      className="
                        min-h-[48px]
                        rounded-2xl
                        bg-[#715445]
                        text-white
                        text-sm font-black
                        shadow-lg shadow-[#715445]/20
                        hover:bg-[#5e4336]
                        active:scale-95
                        transition-all
                      "
                    >
                      Simpan Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT (INLINE REPLACEMENT STYLE) */}
      {editId && (
        <div className="fixed inset-0 z-[100]">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditId(null)}
          />

          {/* WRAPPER */}
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
              {/* MODAL */}
              <div
                className="
                  relative w-full sm:max-w-xl
                  bg-white
                  rounded-t-[2rem] sm:rounded-[2rem]
                  border border-gray-100
                  shadow-2xl
                  animate-in slide-in-from-bottom-5 sm:zoom-in-95
                  duration-300
                  max-h-[92vh]
                  overflow-hidden
                "
              >
                {/* HEADER */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-5 sm:px-7 py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center shrink-0">
                      <Edit2 size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                        Edit Data Murid
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                        {editId} • {editForm.nama || "Siswa"}
                      </p>
                    </div>

                    <button
                      onClick={() => setEditId(null)}
                      className="
                        w-10 h-10 rounded-xl
                        bg-gray-100 hover:bg-gray-200
                        text-gray-500
                        flex items-center justify-center
                        transition-all
                        active:scale-95
                        shrink-0
                      "
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* BODY */}
                <div className="overflow-y-auto max-h-[calc(92vh-150px)] px-5 sm:px-7 py-5 space-y-5">
                  {/* NAMA */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Nama Lengkap
                    </label>

                    <input
                      value={editForm.nama}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          nama: e.target.value
                        })
                      }
                      placeholder="Nama siswa"
                      className="
                        w-full h-12
                        rounded-2xl
                        border border-gray-200
                        bg-gray-50
                        px-4
                        text-sm font-semibold
                        outline-none
                        focus:bg-white
                        focus:ring-4 focus:ring-[#715445]/10
                        focus:border-[#715445]/30
                      "
                    />
                  </div>

                  {/* GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* KELAS */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                        Kelas
                      </label>

                      <select
                        value={editForm.kelas}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            kelas: e.target.value
                          })
                        }
                        className="
                          w-full h-12
                          rounded-2xl
                          border border-gray-200
                          bg-gray-50
                          px-4
                          text-sm font-semibold
                          outline-none
                          focus:bg-white
                          focus:ring-4 focus:ring-[#715445]/10
                          focus:border-[#715445]/30
                        "
                      >
                        {kelasList.map((k) => (
                          <option
                            key={k.id}
                            value={k.id}
                          >
                            {k.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ORTU */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                        Nama Orang Tua
                      </label>

                      <input
                        value={editForm.nama_ortu}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nama_ortu:
                              e.target.value
                          })
                        }
                        placeholder="Ayah / Ibu / Wali"
                        className="
                          w-full h-12
                          rounded-2xl
                          border border-gray-200
                          bg-gray-50
                          px-4
                          text-sm font-semibold
                          outline-none
                          focus:bg-white
                          focus:ring-4 focus:ring-[#715445]/10
                          focus:border-[#715445]/30
                        "
                      />
                    </div>
                  </div>

                  {/* INFO BOX */}
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                      Pastikan perubahan nama, kelas, dan wali murid sudah benar sebelum disimpan.
                    </p>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 px-5 sm:px-7 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEditId(null)}
                      className="
                        min-h-[48px]
                        rounded-2xl
                        bg-gray-100
                        text-gray-700
                        text-sm font-bold
                        hover:bg-gray-200
                        active:scale-95
                        transition-all
                      "
                    >
                      Batal
                    </button>

                    <button
                      onClick={() =>
                        saveEdit(editId)
                      }
                      className="
                        min-h-[48px]
                        rounded-2xl
                        bg-[#715445]
                        text-white
                        text-sm font-black
                        shadow-lg shadow-[#715445]/20
                        hover:bg-[#5e4336]
                        active:scale-95
                        transition-all
                      "
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
          <ConfirmModal
          open={showDelete}
          title="Hapus Murid?"
          desc="Data siswa akan dihapus permanen dan tidak bisa dikembalikan."
          confirmText="Ya, Hapus"
          cancelText="Batal"
          danger={true}
          loading={deleteLoading}
          onClose={() =>
            setShowDelete(false)
          }
          onConfirm={confirmDelete}
        />
    </div>
  );
}