import { useEffect, useState } from "react";
import api from "../../lib/axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";

// 🔥 TAMBAHAN
import toast from "react-hot-toast";

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

/* ================= TOOLBAR ================= */
const CustomToolbar = ({ label, onNavigate, onView, view }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

      <div className="flex gap-2 items-center">
        <button onClick={() => onNavigate("TODAY")}
          className="px-3 py-1.5 rounded-md bg-[#715445] text-white">
          Today
        </button>

        <button onClick={() => onNavigate("PREV")}
          className="p-2 rounded-md bg-gray-200">
          <ChevronLeft size={16} />
        </button>

        <button onClick={() => onNavigate("NEXT")}
          className="p-2 rounded-md bg-gray-200">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="font-semibold text-lg text-center">{label}</div>

      <div className="flex gap-2">
        {["month", "week", "day"].map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-3 py-1.5 rounded-md ${
              view === v
                ? "bg-[#715445] text-white"
                : "bg-gray-200"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ================= EVENT ================= */
const EventItem = ({ event }) => (
  <div className="text-xs px-1">{event.title}</div>
);

export default function AdminKalender() {
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");

  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const [form, setForm] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    keterangan: ""
  });

  /* ================= FETCH ================= */
  const fetchData = async () => {
    const res = await api.get("/admin/kalender");

    setEvents(
      res.data.map((e) => ({
        ...e,
        title:
          e.keterangan ||
          e.title ||
          e.deskripsi ||
          "(Tanpa keterangan)",
        start: toStartOfDay(e.start),
        end: toEndOfDay(e.end)
      }))
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= CREATE ================= */
  const handleSelectSlot = ({ start, end }) => {
    const realEnd = new Date(end);
    realEnd.setDate(realEnd.getDate() - 1);

    setForm({
      tanggal_mulai: formatDate(start),
      tanggal_selesai: formatDate(realEnd),
      keterangan: ""
    });

    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      await api.post("/admin/kalender", form);
      toast.success("Event berhasil ditambahkan");
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error("Gagal menambahkan event");
    }
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    try {
      await api.put(`/admin/kalender/${selectedEvent.id}`, form);
      toast.success("Event berhasil diupdate");
      setIsEdit(false);
      setSelectedEvent(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal mengupdate event");
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!confirm("Hapus event ini?")) return;

    try {
      await api.delete(`/admin/kalender/${selectedEvent.id}`);
      toast.success("Event berhasil dihapus");
      setSelectedEvent(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus event");
    }
  };

  return (
    <div className="p-6 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Kalender Akademik</h1>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#715445] text-white"
        >
          <Plus size={16} />
          Tambah Event
        </button>
      </div>

      {/* CALENDAR */}
      <div className="bg-white rounded-xl shadow p-4">
        <Calendar
          selectable
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onNavigate={(d) => setDate(d)}
          onView={(v) => setView(v)}
          views={["month", "week", "day"]}
          style={{ height: "75vh" }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(e) => {
            const realEnd = new Date(e.end);
            realEnd.setHours(0, 0, 0, 0);

            setSelectedEvent(e);
            setForm({
              tanggal_mulai: formatDate(e.start),
              tanggal_selesai: formatDate(realEnd),
              keterangan: e.title
            });
          }}
          components={{
            toolbar: CustomToolbar,
            event: EventItem
          }}
        />
      </div>

      {/* MODAL & COMPONENT LAIN TIDAK DIUBAH */}
    </div>
  );
}