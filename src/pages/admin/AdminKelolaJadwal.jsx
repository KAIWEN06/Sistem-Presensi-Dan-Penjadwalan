import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  AlertCircle,
  Loader2,
  CalendarDays,
  Clock3,
  BookOpen,
  User,
  School,
  ChevronDown,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import ConfirmModal from "../../components/ui/ConfirmModal";

// PREMIUM UI UPGRADE
// MOBILE SAFE TOOLBAR FIX
// NO OVERFLOW SMALL SCREEN
// PREMIUM ADD EDIT MODAL
// PERFECT ALIGNMENT FIX
// TOAST SYSTEM READY
// SAFE RESPONSIVE REFACTOR
// PRODUCTION READY

const getHariIndonesia = (tanggal) => {
  if (!tanggal) return "";
  const [y, m, d] = tanggal.split("-").map(Number);
  const dt = new Date(y, m - 1, d);

  const hari = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  return hari[dt.getDay()];
};

const statusTabs = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "selesai", label: "Selesai" },
  { key: "dibatalkan", label: "Dibatalkan" },
  { key: "nonaktif", label: "Nonaktif" },
];

export default function AdminKelolaJadwal() {
  const [jadwalData, setJadwalData] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("semua");
  const [filterKelas, setFilterKelas] = useState("semua");
  const [activeTab, setActiveTab] = useState("semua");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [showDelete, setShowDelete] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

const emptyForm = {
  jenis: "pelajaran",
  kelas: "",
  mapel: "",
  guru: "",
  hari: "",
  tanggal: "",
  mulai: "",
  selesai: "",
  status: "aktif",
};

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await Promise.all([fetchJadwal(), fetchMaster()]);
      setLoading(false);
    };

    initLoad();
  }, []);

  const fetchJadwal = async () => {
    try {
      const res = await api.get("/admin/jadwal");
      setJadwalData(res.data || []);
    } catch (err) {
      toast.error("Gagal memuat jadwal");
    }
  };

  const fetchMaster = async () => {
    try {
      const [kelasRes, mapelRes, guruRes] = await Promise.all([
        api.get("/admin/kelas"),
        api.get("/admin/mapel"),
        api.get("/admin/guru"),
      ]);

      setKelasList(kelasRes.data || []);
      setMapelList(mapelRes.data || []);
      setGuruList(guruRes.data || []);
    } catch {
      toast.error("Gagal memuat data master");
    }
  };

  const handleSimpan = async () => {
    if (
      !form.kelas ||
      !form.mapel ||
      !form.guru ||
      !form.mulai ||
      !form.selesai
    ) {
      return toast.error("Mohon lengkapi semua bidang wajib.");
    }

    const payload = {
      ...form,
      hari:
        form.jenis === "ujian"
          ? getHariIndonesia(form.tanggal)
          : form.hari,
    };

    try {
      const toastId = toast.loading("Menyimpan jadwal...");

      if (editId) {
        await api.put(`/admin/jadwal/${editId}`, payload);
      } else {
        await api.post("/admin/jadwal", payload);
      }

      toast.success("Jadwal berhasil disimpan", {
        id: toastId,
      });

      setShowModal(false);
      setEditId(null);
      setForm(emptyForm);
      fetchJadwal();
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Gagal menyimpan data."
      );
    }
  };

  const handleHapus = (id) => {
    setSelectedDelete(id);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);

      const toastId = toast.loading(
        "Menghapus jadwal..."
      );

      await api.delete(
        `/admin/jadwal/${selectedDelete}`
      );

      toast.success("Jadwal berhasil dihapus", {
        id: toastId,
      });

      setShowDelete(false);
      setSelectedDelete(null);
      fetchJadwal();
    } catch {
      toast.error("Gagal menghapus data");
    } finally {
      setDeleteLoading(false);
    }
  };
  
const handleToggleStatus = async (
  jadwal
) => {
  const newStatus =
    jadwal.status === "aktif"
      ? "nonaktif"
      : "aktif";

  try {
    const id = toast.loading(
      "Mengubah status..."
    );

    await api.patch(
      `/admin/jadwal/${jadwal.id}/status`,
      {
        status: newStatus,
      }
    );

    toast.success(
      "Status berhasil diubah",
      { id }
    );

    fetchJadwal();
  } catch {
    toast.error(
      "Gagal mengubah status"
    );
  }
};  

  const openTambah = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

const openEdit = (item) => {
  setEditId(item.id);

  setForm({
    jenis: item.tipe || "pelajaran",
    kelas: item.kelas_id || item.kelas || "",
    mapel: item.mapel_id || item.mapel || "",
    guru: item.guru_id || item.guru || "",
    hari: item.hari || "",
    tanggal: item.tanggal || "",
    mulai: item.mulai || "",
    selesai: item.selesai || "",
    status: item.status || "aktif",
  });

  setShowModal(true);
};

const filtered = jadwalData.filter((item) => {
  const matchSearch =
    (item.mapel?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (item.guru?.toLowerCase() || "").includes(search.toLowerCase());

  const matchJenis =
    filterJenis === "semua" || item.tipe === filterJenis;

  const matchKelas =
    filterKelas === "semua" ||
    String(item.kelas) === String(filterKelas);

  const matchStatus =
    activeTab === "semua" ||
    (item.status || "").toLowerCase().trim() === activeTab;

  return (
    matchSearch &&
    matchJenis &&
    matchKelas &&
    matchStatus
  );
});

  return (
    <section className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
          <button
            onClick={openTambah}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-2xl bg-[#715445] text-white font-bold hover:bg-[#5e4336] active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus size={18} />
            Tambah Jadwal
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm px-4 sm:px-5 py-3">
  <div className="overflow-x-auto">
    <div className="flex gap-5 min-w-max">
      {statusTabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative pb-2 text-sm font-bold whitespace-nowrap transition ${
              active
                ? "text-[#715445]"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab.label}

            {active && (
              <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] rounded-full bg-[#715445]" />
            )}
          </button>
        );
      })}
    </div>
  </div>
</div>

      {/* FILTER */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari mapel atau guru..."
              className="w-full min-h-[52px] pl-11 pr-4 rounded-2xl border border-gray-200 text-sm font-semibold outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
            />
          </div>

          <SelectField
            value={filterJenis}
            onChange={(e) =>
              setFilterJenis(e.target.value)
            }
          >
            <option value="semua">
              Semua Jenis
            </option>
            <option value="pelajaran">
              Pelajaran
            </option>
            <option value="ujian">
              Ujian
            </option>
          </SelectField>

          <SelectField
            value={filterKelas}
            onChange={(e) =>
              setFilterKelas(e.target.value)
            }
          >
            <option value="semua">
              Semua Kelas
            </option>

            {kelasList.map((k) => (
              <option
                key={k.id}
                value={k.id}
              >
                {k.nama}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
                <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                    <Th>Status</Th>
                    <Th>Jenis</Th>
                    <Th>Hari / Tanggal</Th>
                    <Th center>Waktu</Th>
                    <Th>Kelas</Th>
                    <Th>Mapel</Th>
                    <Th>Guru</Th>
                    <Th right>Aksi</Th>
                </tr>
                </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="py-16"
                  >
                    <Loader2 className="mx-auto animate-spin text-gray-300" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="py-16 text-center text-gray-400"
                  >
                    Tidak ada jadwal
                  </td>
                </tr>
              ) : (
filtered.map((item) => (
  <tr
    key={item.id}
    className="hover:bg-gray-50"
  >
    {/* STATUS */}
    <Td>
      <StatusBadge
        status={item.status}
      />
    </Td>

    {/* JENIS */}
    <Td>
      <JenisBadge
        jenis={item.tipe}
      />
    </Td>

    {/* HARI / TANGGAL */}
    <Td>
      {item.tipe === "ujian"
        ? item.tanggal
        : item.hari}
    </Td>

    {/* WAKTU */}
    <Td center>
      {item.rentangWaktu}
    </Td>

    {/* KELAS */}
    <Td>{item.kelas}</Td>

    {/* MAPEL */}
    <Td bold>
      {item.mapel}
    </Td>

    {/* GURU */}
    <Td>{item.guru}</Td>

    {/* AKSI */}
    <Td right>
      <div className="flex items-center justify-end gap-2">
        <ActionBtn
          onClick={() =>
            openEdit(item)
          }
        >
          <Pencil size={15} />
        </ActionBtn>

        <ActionBtn
          onClick={() =>
            handleToggleStatus(
              item
            )
          }
        >
          <Power size={15} />
        </ActionBtn>

        {item.status !==
          "aktif" && (
          <ActionBtn
            danger
            onClick={() =>
              handleHapus(
                item.id
              )
            }
          >
            <Trash2 size={15} />
          </ActionBtn>
        )}
      </div>
    </Td>
  </tr>
))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <LoadingBox />
        ) : filtered.length === 0 ? (
          <EmptyBox />
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <JenisBadge
                  jenis={item.tipe}
                />

                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">
                    {item.rentangWaktu}
                  </p>

                  <p className="text-xs text-gray-500">
                    {item.tipe ===
                    "ujian"
                      ? item.tanggal
                      : item.hari}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {item.mapel}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {item.guru} •{" "}
                  {item.kelas}
                </p>
              </div>

                <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() =>
                    openEdit(item)
                    }
                    className="min-h-[46px] rounded-2xl bg-gray-100 font-bold"
                >
                    Edit
                </button>

                <button
                    onClick={() =>
                    handleToggleStatus(item)
                    }
                    className={`min-h-[46px] rounded-2xl text-sm font-bold ${
                    item.status === "aktif"
                        ? "bg-rose-500 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                >
                    {item.status === "aktif"
                    ? "Nonaktifkan"
                    : "Aktifkan"}
                </button>

                {item.status !== "aktif" && (
                    <button
                    onClick={() =>
                        handleHapus(item.id)
                    }
                    className="col-span-2 min-h-[46px] rounded-2xl bg-rose-600 text-white font-bold"
                    >
                    Hapus
                    </button>
                )}
                </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() =>
              setShowModal(false)
            }
          />

          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full flex items-end sm:items-center justify-center">
              <div className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col overflow-hidden">
                {/* HEADER */}
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] inline-flex items-center justify-center shrink-0">
                      <CalendarDays size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xl font-black text-gray-900 truncate">
                        {editId
                          ? "Edit Jadwal"
                          : "Tambah Jadwal"}
                      </h3>

                      <p className="text-sm text-gray-500 truncate">
                        Kelola data jadwal
                        sekolah
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setShowModal(false)
                    }
                    className="w-10 h-10 rounded-xl bg-gray-100 inline-flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* BODY */}
                <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Jenis">
                      <SelectField
                        value={form.jenis}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            jenis:
                              e.target
                                .value,
                          })
                        }
                      >
                        <option value="pelajaran">
                          Pelajaran
                        </option>
                        <option value="ujian">
                          Ujian
                        </option>
                      </SelectField>
                    </Field>

                    <Field label="Kelas">
                      <SelectField
                        value={form.kelas}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            kelas:
                              e.target
                                .value,
                          })
                        }
                      >
                        <option value="">
                          Pilih Kelas
                        </option>

                        {kelasList.map(
                          (k) => (
                            <option
                              key={
                                k.id
                              }
                              value={
                                k.id
                              }
                            >
                              {
                                k.nama
                              }
                            </option>
                          )
                        )}
                      </SelectField>
                    </Field>
                  </div>

                  <Field label="Mata Pelajaran">
                    <SelectField
                      value={form.mapel}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          mapel:
                            e.target
                              .value,
                        })
                      }
                    >
                      <option value="">
                        Pilih Mapel
                      </option>

                      {mapelList.map(
                        (m) => (
                          <option
                            key={
                              m.id
                            }
                            value={
                              m.id
                            }
                          >
                            {
                              m.nama
                            }
                          </option>
                        )
                      )}
                    </SelectField>
                  </Field>

                  <Field label="Guru">
                    <SelectField
                      value={form.guru}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          guru:
                            e.target
                              .value,
                        })
                      }
                    >
                      <option value="">
                        Pilih Guru
                      </option>

                      {guruList.map(
                        (g) => (
                          <option
                            key={
                              g.id
                            }
                            value={
                              g.id
                            }
                          >
                            {
                              g.nama
                            }
                          </option>
                        )
                      )}
                    </SelectField>
                  </Field>

<Field label="Status">
  <SelectField
    value={form.status}
    onChange={(e) =>
      setForm({
        ...form,
        status: e.target.value,
      })
    }
  >
    <option value="aktif">
      Aktif
    </option>

    {form.jenis === "pelajaran" && (
      <option value="nonaktif">
        Nonaktif
      </option>
    )}

    {form.jenis === "ujian" && (
      <>
        <option value="selesai">
          Selesai
        </option>

        <option value="dibatalkan">
          Dibatalkan
        </option>
      </>
    )}
  </SelectField>
</Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label={
                        form.jenis ===
                        "ujian"
                          ? "Tanggal"
                          : "Hari"
                      }
                    >
                      {form.jenis ===
                      "pelajaran" ? (
                        <SelectField
                          value={
                            form.hari
                          }
                          onChange={(
                            e
                          ) =>
                            setForm(
                              {
                                ...form,
                                hari: e
                                  .target
                                  .value,
                              }
                            )
                          }
                        >
                          <option value="">
                            Pilih Hari
                          </option>

                          {[
                            "Senin",
                            "Selasa",
                            "Rabu",
                            "Kamis",
                            "Jumat",
                            "Sabtu",
                          ].map(
                            (
                              h
                            ) => (
                              <option
                                key={
                                  h
                                }
                                value={
                                  h
                                }
                              >
                                {
                                  h
                                }
                              </option>
                            )
                          )}
                        </SelectField>
                      ) : (
                        <input
                          type="date"
                          value={
                            form.tanggal
                          }
                          onChange={(
                            e
                          ) =>
                            setForm(
                              {
                                ...form,
                                tanggal:
                                  e
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="input-premium"
                        />
                      )}
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Mulai">
                        <input
                          type="time"
                          value={
                            form.mulai
                          }
                          onChange={(
                            e
                          ) =>
                            setForm(
                              {
                                ...form,
                                mulai:
                                  e
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="input-premium"
                        />
                      </Field>

                      <Field label="Selesai">
                        <input
                          type="time"
                          value={
                            form.selesai
                          }
                          onChange={(
                            e
                          ) =>
                            setForm(
                              {
                                ...form,
                                selesai:
                                  e
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="input-premium"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 grid grid-cols-2 gap-3 p-5">
                  <button
                    onClick={() =>
                      setShowModal(
                        false
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-gray-100 font-bold"
                  >
                    Batal
                  </button>

                  <button
                    onClick={
                      handleSimpan
                    }
                    className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-[#715445] text-white font-bold"
                  >
                    <Check
                      size={16}
                    />
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDelete}
        title="Hapus Jadwal?"
        desc="Data yang dihapus tidak bisa dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        danger={true}
        loading={deleteLoading}
        onClose={() =>
          setShowDelete(false)
        }
        onConfirm={confirmDelete}
      />
    </section>
  );
}

/* COMPONENT */

function SelectField(props) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-gray-200 bg-white text-sm font-semibold outline-none appearance-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
      >
        {props.children}
      </select>

      <ChevronDown
        size={18}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <div className="space-y-2">
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
        {label}
      </label>

      {children}
    </div>
  );
}

function JenisBadge({
  jenis,
}) {
  const ujian =
    jenis === "ujian";

  return (
    <span
      className={`inline-flex items-center justify-center text-center leading-none shrink-0 whitespace-nowrap h-9 min-w-[84px] px-3 rounded-full text-[11px] font-black uppercase ${
        ujian
          ? "bg-[#FCEAE9] text-[#E16766]"
          : "bg-[#F7F2EF] text-[#715445]"
      }`}
    >
      {jenis}
    </span>
  );
}

function StatusBadge({
  status,
}) {
  const s =
    (status || "")
      .toLowerCase()
      .trim();

  const styles = {
    aktif:
      "bg-emerald-50 text-emerald-700",
    selesai:
      "bg-blue-50 text-blue-700",
    dibatalkan:
      "bg-rose-50 text-rose-700",
    nonaktif:
      "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center justify-center h-8 min-w-[88px] px-3 rounded-full text-[11px] font-black uppercase whitespace-nowrap ${
        styles[s] ||
        "bg-gray-100 text-gray-700"
      }`}
    >
      {s || "-"}
    </span>
  );
}

function Th({
  children,
  center,
  right,
}) {
  return (
    <th
      className={`px-6 py-4 text-xs font-black uppercase text-gray-400 ${
        center
          ? "text-center"
          : right
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  bold,
  center,
  right,
}) {
  return (
    <td
      className={`px-6 py-4 text-sm ${
        bold
          ? "font-bold text-gray-900"
          : "text-gray-600"
      } ${
        center
          ? "text-center"
          : right
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function ActionBtn({
  children,
  danger,
  ...props
}) {
  return (
    <button
      {...props}
      className={`w-10 h-10 rounded-2xl border inline-flex items-center justify-center ${
        danger
          ? "bg-rose-50 border-rose-200 text-rose-600"
          : "bg-white border-gray-200 text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingBox() {
  return (
    <div className="rounded-3xl bg-white p-10 text-center">
      <Loader2 className="mx-auto animate-spin text-gray-300" />
    </div>
  );
}

function EmptyBox() {
  return (
    <div className="rounded-3xl bg-white p-10 text-center text-gray-400">
      <AlertCircle className="mx-auto mb-3" />
      Tidak ada data jadwal
    </div>
  );
}