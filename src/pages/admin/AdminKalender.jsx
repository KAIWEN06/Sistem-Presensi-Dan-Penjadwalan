import { useEffect, useState, useMemo } from "react";
import api from "../../lib/axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import toast from "react-hot-toast";

import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

const warnaKelas = [
  "#E16766", "#5B88C7", "#6BCB77", "#F7B801", "#9D4EDD", "#FF6F91"
];

export default function AdminKalender() {
  const [events, setEvents] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("all");

  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    jenis: "libur",
    keterangan: "",
    semua_kelas: true,
    kelas: []
  });

  /* ================= FETCH ================= */
  const fetchData = async () => {
    const [kalRes, kelasRes] = await Promise.all([
      api.get("/admin/kalender"),
      api.get("/admin/kelas")
    ]);

    const mapped = kalRes.data.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end)
    }));

    setEvents(mapped);
    setKelasList(kelasRes.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= FILTER ================= */
  const filteredEvents = useMemo(() => {
    if (selectedKelas === "all") return events;

    return events.filter((e) => {
      if (e.semua_kelas) return true;
      return e.kelas?.includes(Number(selectedKelas));
    });
  }, [events, selectedKelas]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        await api.put(`/admin/kalender/${editId}`, form);
      } else {
        await api.post("/admin/kalender", form);
      }

      setShowForm(false);
      setEditId(null);
      fetchData();
    } catch {
      toast.error("Gagal simpan");
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!confirm("Hapus event ini?")) return;

    await api.delete(`/admin/kalender/${selectedEvent.id}`);
    setShowDetail(false);
    fetchData();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-xl font-bold text-[#715445]">
          Kalender Akademik
        </h1>

        <button
          onClick={() => {
            setEditId(null);
            setForm({
              tanggal_mulai: "",
              tanggal_selesai: "",
              jenis: "libur",
              keterangan: "",
              semua_kelas: true,
              kelas: []
            });
            setShowForm(true);
          }}
          className="bg-[#715445] text-white px-4 py-2 rounded-xl"
        >
          Tambah Event
        </button>
      </div>

      {/* FILTER */}
      <select
        value={selectedKelas}
        onChange={(e) => setSelectedKelas(e.target.value)}
        className="border px-3 py-2 rounded-xl"
      >
        <option value="all">Semua Kelas</option>
        {kelasList.map((k) => (
          <option key={k.id} value={k.id}>
            {k.nama}
          </option>
        ))}
      </select>

      {/* CALENDAR */}
      <div className="bg-white rounded-2xl shadow p-4">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={["month", "week", "day"]}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setShowDetail(true);
          }}
          style={{ height: "70vh" }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor:
                event.kelas?.length > 0
                  ? warnaKelas[event.kelas[0] % warnaKelas.length]
                  : "#715445",
              borderRadius: "8px",
              cursor: "pointer"
            }
          })}
        />
      </div>

      {/* ================= DETAIL POPUP ================= */}
      {showDetail && selectedEvent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">

            <h2 className="font-semibold text-[#715445] text-lg">
              Detail Event
            </h2>

            <p><b>Keterangan:</b> {selectedEvent.title}</p>
            <p>
              <b>Tanggal:</b>{" "}
              {format(selectedEvent.start, "dd MMM yyyy")} -{" "}
              {format(selectedEvent.end, "dd MMM yyyy")}
            </p>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleDelete}
                className="text-red-500"
              >
                Hapus
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetail(false)}
                  className="bg-gray-200 px-3 py-2 rounded-xl"
                >
                  Tutup
                </button>

                <button
                  onClick={() => {
                    setEditId(selectedEvent.id);
                    setForm({
                      tanggal_mulai: format(selectedEvent.start, "yyyy-MM-dd"),
                      tanggal_selesai: format(selectedEvent.end, "yyyy-MM-dd"),
                      jenis: selectedEvent.type,
                      keterangan: selectedEvent.title,
                      semua_kelas: selectedEvent.semua_kelas,
                      kelas: selectedEvent.kelas || []
                    });
                    setShowDetail(false);
                    setShowForm(true);
                  }}
                  className="bg-[#715445] text-white px-3 py-2 rounded-xl"
                >
                  Edit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

{/* ================= FORM MODAL ================= */}
{showForm && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">

      <h2 className="font-semibold text-[#715445]">
        {editId ? "Edit Kalender" : "Tambah Kalender"}
      </h2>

      {/* TANGGAL */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Tanggal Mulai</label>
          <input
            type="date"
            value={form.tanggal_mulai}
            onChange={(e) =>
              setForm({ ...form, tanggal_mulai: e.target.value })
            }
            className="border p-2 rounded-xl w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">Tanggal Selesai</label>
          <input
            type="date"
            value={form.tanggal_selesai}
            onChange={(e) =>
              setForm({ ...form, tanggal_selesai: e.target.value })
            }
            className="border p-2 rounded-xl w-full"
          />
        </div>
      </div>

      {/* KETERANGAN */}
      <input
        placeholder="Keterangan"
        value={form.keterangan}
        onChange={(e) =>
          setForm({ ...form, keterangan: e.target.value })
        }
        className="border p-2 rounded-xl w-full"
      />

      {/* SEMUA KELAS */}
      <label className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
        <input
          type="checkbox"
          checked={form.semua_kelas}
          onChange={(e) =>
            setForm({
              ...form,
              semua_kelas: e.target.checked,
              kelas: []
            })
          }
        />
        Semua Kelas
      </label>

      {/* PILIH KELAS */}
      {!form.semua_kelas && (
        <div className="border rounded-xl p-3 bg-gray-50 max-h-40 overflow-y-auto">
          <p className="text-sm font-medium text-gray-600 mb-2">
            Pilih Kelas
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {kelasList.map((k) => (
              <label
                key={k.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                  form.kelas.includes(k.id)
                    ? "bg-[#715445]/10 border border-[#715445]"
                    : "hover:bg-gray-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.kelas.includes(k.id)}
                  onChange={() => {
                    setForm((prev) => ({
                      ...prev,
                      kelas: prev.kelas.includes(k.id)
                        ? prev.kelas.filter((x) => x !== k.id)
                        : [...prev.kelas, k.id]
                    }));
                  }}
                />
                <span className="text-sm">{k.nama}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* BUTTON */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => setShowForm(false)}
          className="bg-gray-200 px-3 py-2 rounded-xl"
        >
          Batal
        </button>

        <button
          onClick={handleSubmit}
          className="bg-[#715445] text-white px-4 py-2 rounded-xl"
        >
          Simpan
        </button>
      </div>

    </div>
  </div>
)}
        </div>
  );
}