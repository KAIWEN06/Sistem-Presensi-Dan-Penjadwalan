import { useEffect, useState } from "react";
import api from "../../lib/axios";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";

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
  locales: { "en-US": enUS }
});

/* ================= DATE ================= */
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

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-500">{label}</label>
    {children}
  </div>
);

const SelectField = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#715445]/30 focus:border-[#715445] outline-none transition bg-white"
  >
    {children}
  </select>
);

/* ================= TOOLBAR ================= */
const CustomToolbar = ({ label, onNavigate, onView, view }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <button onClick={() => onNavigate("TODAY")}
          className="px-3 py-1 bg-[#715445] text-white rounded">
          Today
        </button>

        <button onClick={() => onNavigate("PREV")}
          className="p-2 bg-gray-200 rounded">
          <ChevronLeft size={16}/>
        </button>

        <button onClick={() => onNavigate("NEXT")}
          className="p-2 bg-gray-200 rounded">
          <ChevronRight size={16}/>
        </button>
      </div>

      <div className="font-semibold">{label}</div>

      <div className="flex gap-2">
        {["month","week","day"].map(v=>(
          <button key={v} onClick={()=>onView(v)}
            className={`px-3 py-1 rounded ${
              view===v ? "bg-[#715445] text-white" : "bg-gray-200"
            }`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

const EventItem = ({ event }) => (
  <div className="text-xs">{event.title}</div>
);

export default function AdminKalender() {

  // 🔥 SEMUA STATE DI DALAM COMPONENT
  const [events,setEvents] = useState([]);
  const [kelasList,setKelasList] = useState([]);
  const [date,setDate] = useState(new Date());
  const [view,setView] = useState("month");

  const [showModal,setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [form,setForm] = useState({
    tanggal_mulai:"",
    tanggal_selesai:"",
    keterangan:"",
    jenis:"libur",
    semua_kelas:true,
    kelas:[]
  });

  /* ================= FETCH ================= */
const fetchData = async () => {
  try {
    const res = await api.get("/admin/kalender");

setEvents(
  res.data.map((e) => ({
    id: e.id,
    title: e.title || "(Tanpa keterangan)",

    start: toStartOfDay(e.start),
    end: toEndOfDay(e.end),

    // 🔥 mapping ulang
    keterangan: e.title,
    jenis: e.type,
    semua_kelas: e.semua_kelas,
    kelas: e.kelas || []
  }))
);

  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
};

  const fetchKelas = async ()=>{
    try{
      const res = await api.get("/admin/kelas");
      setKelasList(res.data || []);
    }catch{
      toast.error("Gagal ambil kelas");
    }
  };

  useEffect(()=>{
    fetchData();
    fetchKelas();
  },[]);

  /* ================= CREATE ================= */
  const handleSelectSlot = ({start,end})=>{
    const realEnd = new Date(end);
    realEnd.setDate(realEnd.getDate()-1);

    setForm({
      ...form,
      tanggal_mulai:formatDate(start),
      tanggal_selesai:formatDate(realEnd),
      keterangan:""
    });

    setShowModal(true);
    setIsEdit(false);
  };

 const handleSubmit = async () => {
  try {
    const payload = {
      tanggal_mulai: form.tanggal_mulai,
      tanggal_selesai: form.tanggal_selesai,
      jenis: form.jenis,
      keterangan: form.keterangan,
      semua_kelas: form.semua_kelas,
      kelas: form.semua_kelas ? [] : form.kelas
    };

    console.log("CREATE PAYLOAD:", payload); // 🔥 debug

    await api.post("/admin/kalender", payload);

    toast.success("Berhasil tambah event");

    setShowModal(false);
    fetchData();

  } catch (err) {
    console.error("CREATE ERROR:", err.response?.data || err);

    toast.error(
      err.response?.data?.error || "Gagal menambahkan event"
    );
  }
};
/* ================= UPDATE ================= */
const handleUpdate = async () => {
  if (!form.tanggal_mulai || !form.tanggal_selesai) {
    toast.error("Tanggal belum lengkap");
    return;
  }

  if (!form.keterangan) {
    toast.error("Isi keterangan");
    return;
  }

  try {
    const payload = {
      ...form,
      kelas: form.semua_kelas
        ? []
        : form.kelas.map((k) => parseInt(k))
    };

    console.log("UPDATE PAYLOAD:", payload);

    await api.put(`/admin/kalender/${selectedEvent.id}`, payload);
    toast.success("Berhasil update");

    setIsEdit(false);
    setSelectedEvent(null);
    setShowModal(false);

    fetchData();

  } catch (err) {
    console.error("UPDATE ERROR:", err.response?.data || err);

    toast.error(
      err.response?.data?.error || "Gagal update kalender"
    );
  }
};

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!confirm("Hapus event ini?")) return;

    try {
      await api.delete(`/admin/kalender/${selectedEvent.id}`);
      toast.success("Berhasil hapus");
      setIsEdit(false);
      setSelectedEvent(null);
      fetchData();
    } catch {
      toast.error("Gagal hapus");
    }
  };

  return (
    <div className="p-6 space-y-4">

      <div className="flex justify-end">
        <button onClick={()=>setShowModal(true)}
          className="px-4 py-2 bg-[#715445] text-white rounded flex items-center gap-2">
          <Plus size={16}/> Tambah
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
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
          style={{height:600}}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(e)=>{
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
          components={{toolbar:CustomToolbar,event:EventItem}}
        />
      </div>

{(showModal || isEdit) && (
  <div className="fixed inset-0 z-[100]">

    {/* OVERLAY */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => {
        setShowModal(false);
        setIsEdit(false);
      }}
    />

    <div className="absolute inset-0 overflow-y-auto">
      <div className="min-h-full flex items-end sm:items-center justify-center">

        <div className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden">

          {/* ================= HEADER ================= */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between">

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center">
                <CalendarDays size={20} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isEdit ? "Edit Event" : "Tambah Event"}
                </h3>
                <p className="text-xs text-gray-500">
                  Kelola kalender akademik
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setIsEdit(false);
              }}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* ================= BODY ================= */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-5">

            {/* TANGGAL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tanggal Mulai">
                <input
                  type="date"
                  value={form.tanggal_mulai}
                  onChange={(e)=>setForm({...form,tanggal_mulai:e.target.value})}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#715445]/30 focus:border-[#715445] outline-none transition"
                />
              </Field>

              <Field label="Tanggal Selesai">
                <input
                  type="date"
                  value={form.tanggal_selesai}
                  onChange={(e)=>setForm({...form,tanggal_selesai:e.target.value})}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#715445]/30 focus:border-[#715445] outline-none transition"
                />
              </Field>
            </div>

            {/* JENIS */}
            <Field label="Jenis">
              <SelectField
                value={form.jenis}
                onChange={(e)=>setForm({...form,jenis:e.target.value})}
              >
                <option value="libur">Libur</option>
                <option value="kegiatan">Kegiatan</option>
                <option value="lainnya">Lainnya</option>
              </SelectField>
            </Field>

            {/* RADIO KELAS */}
            <Field label="Target Kelas">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="kelas_mode"
                    checked={form.semua_kelas === true}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        semua_kelas: true,
                        kelas: []
                      }))
                    }
                  />
                  Semua
                </label>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="kelas_mode"
                    checked={form.semua_kelas === false}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        semua_kelas: false
                      }))
                    }
                  />
                  Pilih
                </label>
              </div>
            </Field>

            {/* CHECKBOX */}
            {form.semua_kelas === false && (
              <div className="border rounded-xl p-3 max-h-40 overflow-y-auto bg-gray-50 space-y-2">

                {kelasList.map((k) => (
                  <label key={k.id} className="flex items-center gap-2 text-sm cursor-pointer">

                    <input
                      type="checkbox"
                      checked={form.kelas.includes(k.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;

                        setForm((prev) => ({
                          ...prev,
                          kelas: checked
                            ? [...new Set([...prev.kelas, k.id])]
                            : prev.kelas.filter((id) => id !== k.id)
                        }));
                      }}
                    />

                    {k.nama}
                  </label>
                ))}

              </div>
            )}

            {/* KETERANGAN */}
            <Field label="Keterangan">
              <input
                value={form.keterangan}
                onChange={(e)=>setForm({...form,keterangan:e.target.value})}
                placeholder="Masukkan keterangan..."
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#715445]/30 focus:border-[#715445] outline-none transition"
              />
            </Field>

          </div>

          {/* ================= FOOTER ================= */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 grid grid-cols-2 gap-3 p-5">

            <button
              onClick={()=>{
                setShowModal(false);
                setIsEdit(false);
              }}
              className="min-h-[50px] rounded-2xl bg-gray-100 font-medium hover:bg-gray-200 transition"
            >
              Batal
            </button>

            <button
              onClick={isEdit ? handleUpdate : handleSubmit}
              className="min-h-[50px] rounded-2xl bg-[#715445] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#5c4438] transition"
            >
              <Check size={16} />
              {isEdit ? "Update" : "Simpan"}
            </button>

            {isEdit && (
              <button
                onClick={handleDelete}
                className="col-span-2 min-h-[50px] rounded-2xl bg-red-500 text-white flex items-center justify-center gap-2 hover:bg-red-600 transition"
              >
                <Trash2 size={16} />
                Hapus Event
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}