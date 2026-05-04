import { useEffect, useState } from "react";
import api from "../../lib/axios";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import id from "date-fns/locale/id"; // Locale Indonesia
import toast from "react-hot-toast";

import {
  CalendarDays,
  X,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { id }
});

/* ================= DATE HELPERS ================= */
const formatDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toStartOfDay = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d, 0, 0, 0);
};

const toEndOfDay = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d, 23, 59, 59);
};

/* ================= SUB-COMPONENTS ================= */
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
    {children}
  </div>
);

const SelectField = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full border-gray-200 border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#715445]/20 focus:border-[#715445] outline-none transition bg-white cursor-pointer"
  >
    {children}
  </select>
);

/* ================= CUSTOM TOOLBAR ================= */
const CustomToolbar = ({ label, onNavigate, onView, view }) => {
  const viewLabels = {
    month: "Bulan",
    week: "Minggu",
    day: "Hari"
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl w-full md:w-auto justify-center md:justify-start">
      <div className="flex gap-1">
        <button onClick={() => onNavigate("PREV")} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition text-gray-600 active:scale-95">
          <ChevronLeft size={20}/>
        </button>
        <button onClick={() => onNavigate("TODAY")} className="px-4 py-1.5 text-sm font-bold text-[#715445] hover:bg-white hover:shadow-sm rounded-lg transition active:scale-95">
          Hari Ini
        </button>
        <button onClick={() => onNavigate("NEXT")} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition text-gray-600 active:scale-95">
          <ChevronRight size={20}/>
        </button>
      </div>
    </div>

      <div className="text-lg font-extrabold text-gray-800 capitalize tracking-tight">
        {label}
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
        {["month", "week", "day"].map((v) => (
          <button 
            key={v} 
            onClick={() => onView(v)}
            className={`flex-1 md:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              view === v 
                ? "bg-white text-[#715445] shadow-md scale-105" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>
    </div>
  );
};

const EventItem = ({ event }) => (
  <div className={`px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold truncate border-l-4 shadow-sm ${
    event.jenis === 'libur' ? 'bg-red-50 text-red-700 border-red-500' : 'bg-[#715445]/10 text-[#715445] border-[#715445]'
  }`}>
    {event.title}
  </div>
);

/* ================= MAIN COMPONENT ================= */
export default function AdminKalender() {
  const [events, setEvents] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [form, setForm] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    keterangan: "",
    jenis: "libur",
    semua_kelas: true,
    kelas: []
  });

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/kalender");
      setEvents(res.data.map((e) => ({
        id: e.id,
        title: e.title || "(Tanpa keterangan)",
        start: toStartOfDay(e.start),
        end: toEndOfDay(e.end),
        keterangan: e.title,
        jenis: e.type,
        semua_kelas: e.semua_kelas,
        kelas: e.kelas || []
      })));
    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  const fetchKelas = async () => {
    try {
      const res = await api.get("/admin/kelas");
      setKelasList(res.data || []);
    } catch {
      toast.error("Gagal ambil kelas");
    }
  };

  useEffect(() => {
    fetchData();
    fetchKelas();
  }, []);

  const handleSelectSlot = ({ start, end }) => {
    const realEnd = new Date(end);
    realEnd.setDate(realEnd.getDate() - 1);
    setForm({
      ...form,
      tanggal_mulai: formatDate(start),
      tanggal_selesai: formatDate(realEnd),
      keterangan: "",
      semua_kelas: true,
      kelas: []
    });
    setShowModal(true);
    setIsEdit(false);
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...form, kelas: form.semua_kelas ? [] : form.kelas };
      await api.post("/admin/kalender", payload);
      toast.success("Berhasil tambah event");
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menambahkan event");
    }
  };

  const handleUpdate = async () => {
    if (!form.tanggal_mulai || !form.tanggal_selesai || !form.keterangan) {
      toast.error("Lengkapi data formulir");
      return;
    }
    try {
      const payload = { ...form, kelas: form.semua_kelas ? [] : form.kelas.map(Number) };
      await api.put(`/admin/kalender/${selectedEvent.id}`, payload);
      toast.success("Berhasil update");
      setShowModal(false);
      setIsEdit(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal update");
    }
  };

  // --- LOGIKA HAPUS DENGAN TOAST CONFIRM ---
  const performDelete = async () => {
    const loadingToast = toast.loading("Menghapus agenda...");
    try {
      await api.delete(`/admin/kalender/${selectedEvent.id}`);
      toast.success("Agenda berhasil dihapus", { id: loadingToast });
      setShowModal(false);
      setIsEdit(false);
      fetchData();
    } catch {
      toast.error("Gagal menghapus agenda", { id: loadingToast });
    }
  };

  const handleDelete = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-800">
          Hapus agenda <b>{selectedEvent?.title}</b> secara permanen?
        </p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600"
          >
            Batal
          </button>
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              performDelete();
            }}
            className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      style: { borderRadius: '1.5rem', padding: '1rem', border: '1px solid #fee2e2' }
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-[#fdfbf9] min-h-screen">
      
      <div className="flex justify-end">
        <button 
          onClick={() => {
            setForm({ tanggal_mulai: formatDate(new Date()), tanggal_selesai: formatDate(new Date()), keterangan: "", jenis: "libur", semua_kelas: true, kelas: [] });
            setShowModal(true);
            setIsEdit(false);
          }}
          className="w-full sm:w-auto px-6 py-3 bg-[#715445] text-white rounded-2xl shadow-xl shadow-[#715445]/20 flex items-center justify-center gap-2 hover:bg-[#5c4438] transition active:scale-95 font-bold"
        >
          <Plus size={20}/> Tambah Agenda
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <style>{`
          .rbc-calendar { font-family: inherit; border: none; }
          .rbc-month-view { border-radius: 1.5rem; overflow: hidden; border: 1px solid #f3f4f6 !important; }
          .rbc-header { padding: 15px 0 !important; font-weight: 800 !important; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; background: #fafafa; border-bottom: 1px solid #f3f4f6 !important; }
          .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f3f4f6 !important; }
          .rbc-month-row + .rbc-month-row { border-top: 1px solid #f3f4f6 !important; }
          .rbc-today { background-color: #fdfaf8 !important; }
          .rbc-off-range-bg { background-color: #fcfcfc !important; }
          .rbc-event { background: none !important; border: none !important; padding: 1px 4px !important; }
          .rbc-show-more { color: #715445 !important; font-weight: 800; font-size: 11px; margin-top: 2px; }
        `}</style>

        <Calendar
          selectable
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onNavigate={setDate}
          onView={setView}
          culture="id" // MEMASTIKAN LOCALE INDONESIA
          style={{ height: "calc(100vh - 320px)", minHeight: 500 }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(e) => {
            setSelectedEvent(e);
            setIsEdit(true);
            setForm({
              tanggal_mulai: formatDate(e.start),
              tanggal_selesai: formatDate(e.end),
              keterangan: e.keterangan || e.title,
              jenis: e.jenis || e.type,
              semua_kelas: e.semua_kelas ?? true,
              kelas: (e.kelas || []).map(Number)
            });
          }}
          components={{ toolbar: CustomToolbar, event: EventItem }}
          messages={{ 
            showMore: (total) => `+${total} Lainnya`,
            next: "Berikutnya",
            previous: "Sebelumnya",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari"
          }}
        />
      </div>

{/* MODAL AGENDA */}
{(showModal || isEdit) && (
  <div className="fixed inset-0 z-[100]">
    {/* OVERLAY */}
    <div
      className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      onClick={() => {
        setShowModal(false);
        setIsEdit(false);
      }}
    />

    <div className="absolute inset-0 overflow-y-auto">
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-300">
          
          {/* HEADER */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] inline-flex items-center justify-center shrink-0">
                <CalendarDays size={20} />
              </div>

              <div className="min-w-0">
                <h3 className="text-xl font-black text-gray-900 truncate">
                  {isEdit ? "Edit Agenda" : "Agenda Baru"}
                </h3>
                <p className="text-sm text-gray-500 truncate uppercase tracking-wider font-bold">
                  Kalender Akademik
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setIsEdit(false);
              }}
              className="w-10 h-10 rounded-xl bg-gray-100 inline-flex items-center justify-center text-gray-400 hover:bg-gray-200 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* BODY */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
            {/* INPUT TANGGAL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Mulai">
                <input
                  type="date"
                  value={form.tanggal_mulai}
                  onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                  className="w-full border-gray-200 border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#715445]/20 focus:border-[#715445] outline-none transition bg-white font-medium"
                />
              </Field>

              <Field label="Selesai">
                <input
                  type="date"
                  value={form.tanggal_selesai}
                  onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                  className="w-full border-gray-200 border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#715445]/20 focus:border-[#715445] outline-none transition bg-white font-medium"
                />
              </Field>
            </div>

            {/* KATEGORI */}
            <Field label="Kategori">
              <SelectField
                value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value })}
              >
                <option value="libur">Libur Sekolah</option>
                <option value="kegiatan">Kegiatan / Event</option>
                <option value="lainnya">Lain-lain</option>
              </SelectField>
            </Field>

            {/* TARGET PESERTA */}
            <Field label="Target Peserta">
              <div className="flex p-1.5 bg-gray-100 rounded-2xl shadow-inner">
                <button
                  onClick={() => setForm(prev => ({ ...prev, semua_kelas: true, kelas: [] }))}
                  className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 ${form.semua_kelas ? "bg-white text-[#715445] shadow-sm" : "text-gray-500"}`}
                >
                  Semua Siswa
                </button>
                <button
                  onClick={() => setForm(prev => ({ ...prev, semua_kelas: false }))}
                  className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 ${!form.semua_kelas ? "bg-white text-[#715445] shadow-sm" : "text-gray-500"}`}
                >
                  Pilih Kelas
                </button>
              </div>
            </Field>

            {/* LIST KELAS (Jika tidak semua kelas) */}
            {!form.semua_kelas && (
              <div className="grid grid-cols-2 gap-2 border border-gray-100 rounded-[2rem] p-4 bg-gray-50/50 max-h-48 overflow-y-auto shadow-inner">
                {kelasList.map((k) => (
                  <label key={k.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-[#715445]/30 transition group shadow-sm">
                    <input
                      type="checkbox"
                      checked={form.kelas.includes(k.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          kelas: checked ? [...new Set([...prev.kelas, k.id])] : prev.kelas.filter((id) => id !== k.id)
                        }));
                      }}
                      className="w-4 h-4 rounded text-[#715445] focus:ring-[#715445]"
                    />
                    <span className="text-xs font-bold text-gray-700 group-hover:text-[#715445]">{k.nama}</span>
                  </label>
                ))}
              </div>
            )}

            {/* KETERANGAN */}
            <Field label="Keterangan Agenda">
              <textarea
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Misal: Libur Akhir Semester Ganjil"
                rows={3}
                className="w-full border border-gray-200 rounded-[2rem] px-5 py-4 text-sm focus:ring-2 focus:ring-[#715445]/20 focus:border-[#715445] outline-none transition font-medium resize-none bg-white"
              />
            </Field>

            {/* TOMBOL HAPUS (Hanya saat Edit) */}
            {isEdit && (
              <button
                onClick={handleDelete}
                className="w-full py-3.5 rounded-2xl bg-red-50 text-red-600 text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-red-100 transition active:scale-95 mt-2"
              >
                <Trash2 size={16} /> Hapus Agenda Ini
              </button>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 sm:p-6 mt-2">
            <div className="flex flex-row items-center gap-3">
              {/* Tombol Batal */}
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setIsEdit(false);
                }}
                className="flex-1 inline-flex items-center justify-center min-h-[52px] rounded-2xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all duration-200 active:scale-95"
              >
                Batal
              </button>

              {/* Tombol Simpan/Buat */}
              <button
                type="button"
                onClick={isEdit ? handleUpdate : handleSubmit}
                className="flex-[2] inline-flex items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-[#715445] text-white font-bold shadow-lg shadow-[#715445]/20 hover:bg-[#5c4438] transition-all duration-200 active:scale-95"
              >
                <Check size={18} strokeWidth={3} />
                <span className="whitespace-nowrap">
                  {isEdit ? "Simpan" : "Buat Agenda"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}