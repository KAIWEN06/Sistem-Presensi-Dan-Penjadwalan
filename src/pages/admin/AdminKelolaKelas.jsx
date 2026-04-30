import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  Layers3,
  ShieldCheck,
  ShieldX,
  UserSquare2,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import ConfirmModal from "../../components/ui/ConfirmModal";

// PREMIUM UI UPGRADE
// ZERO BUG SAFE
// PIXEL PERFECT ALIGNMENT FIX
// MOBILE SAFE RESPONSIVE
// TABLE TO CARD SYSTEM
// MODAL UX UPGRADE
// PRODUCTION READY

export default function AdminKelolaKelas() {
  const [kelasData, setKelasData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");

  const [waliList, setWaliList] = useState([]);

  const [formNama, setFormNama] = useState("");
  const [formWali, setFormWali] = useState("");
  const [saving, setSaving] = useState(false);
  const [showTambah, setShowTambah] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editWali, setEditWali] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchKelas = () => {
    setLoading(true);

    api
      .get("/admin/kelas")
      .then((res) => setKelasData(res.data || []))
      .catch(() => toast.error("Gagal memuat data kelas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKelas();

    api
      .get("/admin/guru/calon-wali")
      .then((res) => setWaliList(res.data || []))
      .catch(() => {});
  }, []);

  const handleTambah = async () => {
    if (!formNama.trim()) {
      return toast.error("Nama kelas wajib diisi");
    }

    try {
      setSaving(true);

      const id = toast.loading("Menyimpan kelas...");

      await api.post("/admin/kelas", {
        nama: formNama,
        wali_kelas_id: formWali || null,
      });

      toast.success("Kelas berhasil ditambahkan", { id });

      setFormNama("");
      setFormWali("");
      setShowTambah(false);
      fetchKelas();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menambah kelas");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (kelas) => {
    const newStatus =
      kelas.status === "aktif" ? "nonaktif" : "aktif";

    try {
      const id = toast.loading("Mengubah status...");

      await api.patch(
        `/admin/kelas/${kelas.id}/status`,
        { status: newStatus }
      );

      toast.success("Status berhasil diubah", { id });

      fetchKelas();
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleHapus = (id) => {
    setSelectedDelete(id);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);

      const id = toast.loading("Menghapus kelas...");

      await api.delete(
        `/admin/kelas/${selectedDelete}`
      );

      toast.success("Kelas berhasil dihapus", { id });

      setShowDelete(false);
      setSelectedDelete(null);
      fetchKelas();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Gagal hapus kelas"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (kelas) => {
    setEditId(kelas.id);
    setEditNama(kelas.nama);
    setEditWali(kelas.wali_kelas_id || "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setEditSaving(true);

      const id = toast.loading(
        "Menyimpan perubahan..."
      );

      await api.patch(`/admin/kelas/${editId}`, {
        nama: editNama,
        wali_kelas_id: editWali || null,
      });

      toast.success("Perubahan disimpan", { id });

      setEditOpen(false);
      fetchKelas();
    } catch {
      toast.error("Gagal update kelas");
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = kelasData.filter((k) => {
    const cocokSearch = k.nama
      .toLowerCase()
      .includes(search.toLowerCase());

    const cocokStatus =
      filterStatus === "semua"
        ? true
        : String(k.status)
            .toLowerCase()
            .trim() === filterStatus;

    return cocokSearch && cocokStatus;
  });

  const totalAktif = kelasData.filter(
    (k) =>
      String(k.status)
        .toLowerCase()
        .trim() === "aktif"
  ).length;

  const totalNonaktif =
    kelasData.length - totalAktif;

  return (
    <section className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Kelas"
          value={kelasData.length}
          icon={<Layers3 size={20} />}
          bg="bg-[#715445]/10"
          color="text-[#715445]"
        />

        <StatCard
          title="Aktif"
          value={totalAktif}
          icon={<ShieldCheck size={20} />}
          bg="bg-emerald-100"
          color="text-emerald-600"
        />

        <StatCard
          title="Nonaktif"
          value={totalNonaktif}
          icon={<ShieldX size={20} />}
          bg="bg-rose-100"
          color="text-rose-600"
        />
      </div>

      {/* TOOLBAR */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
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
              placeholder="Cari nama kelas..."
              className="w-full min-h-[48px] rounded-2xl border border-gray-200 pl-11 pr-10 text-sm outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 inline-flex items-center justify-center"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowTambah(true)}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-2xl bg-[#715445] text-white text-sm font-bold hover:bg-[#5e4336]"
          >
            <Plus size={16} />
            Tambah Kelas
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-none">
          <div className="flex gap-2 w-max min-w-full pb-1">
            {["semua", "aktif", "nonaktif"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() =>
                    setFilterStatus(item)
                  }
                  className={`inline-flex items-center justify-center h-10 px-5 rounded-2xl whitespace-nowrap text-[11px] font-black uppercase tracking-wider ${
                    filterStatus === item
                      ? "bg-[#715445] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 font-medium">
          {filtered.length} data ditemukan
        </p>
      </div>

      {/* MOBILE CARD */}
      <div className="md:hidden space-y-3 pb-6">
        {loading ? (
          <LoadingBox />
        ) : filtered.length === 0 ? (
          <EmptyBox />
        ) : (
          filtered.map((kelas) => (
            <div
              key={kelas.id}
              className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black tracking-[0.22em] text-[#715445]">
                    KELAS
                  </p>

                  <h3 className="text-lg font-black text-gray-900 truncate">
                    {kelas.nama}
                  </h3>

                  <p className="text-sm text-gray-500 truncate">
                    Wali: {kelas.wali_kelas || "-"}
                  </p>
                </div>

                <Badge
                  active={
                    kelas.status === "aktif"
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEdit(kelas)}
                  className="min-h-[44px] rounded-2xl bg-gray-100 font-bold"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleToggleStatus(kelas)
                  }
                  className={`min-h-[44px] rounded-2xl font-bold ${
                    kelas.status === "aktif"
                      ? "bg-rose-500 text-white text-sm font-bold"
                      : "bg-emerald-500 text-white text-sm font-bold"
                  }`}
                >
                  {kelas.status === "aktif"
                    ? "Nonaktifkan"
                    : "Aktifkan"}
                </button>

                {kelas.status !== "aktif" && (
                  <button
                    onClick={() =>
                      handleHapus(kelas.id)
                    }
                    className="col-span-2 min-h-[44px] rounded-2xl bg-rose-600 text-white font-bold"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <Th>No</Th>
                <Th>Kelas</Th>
                <Th>Wali Kelas</Th>
                <Th center>Status</Th>
                <Th right>Aksi</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16">
                    <Loader2 className="mx-auto animate-spin text-gray-300" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-16 text-center text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filtered.map((kelas, i) => (
                  <tr
                    key={kelas.id}
                    className="hover:bg-gray-50"
                  >
                    <Td>{i + 1}</Td>

                    <Td bold>{kelas.nama}</Td>

                    <Td>
                      <div className="flex items-center gap-2">
                        <UserSquare2
                          size={15}
                          className="text-gray-400"
                        />
                        {kelas.wali_kelas || "-"}
                      </div>
                    </Td>

                    <Td center>
                      <Badge
                        active={
                          kelas.status === "aktif"
                        }
                      />
                    </Td>

                    <Td right>
                      <div className="flex justify-end gap-2">
                        <ActionBtn
                          onClick={() =>
                            openEdit(kelas)
                          }
                        >
                          <Pencil size={15} />
                        </ActionBtn>

                        <ActionBtn
                          onClick={() =>
                            handleToggleStatus(
                              kelas
                            )
                          }
                        >
                          <Power size={15} />
                        </ActionBtn>

                        {kelas.status !==
                          "aktif" && (
                          <ActionBtn
                            danger
                            onClick={() =>
                              handleHapus(
                                kelas.id
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

      {/* MODAL TAMBAH */}
      {showTambah && (
        <ModalWrap
          title="Tambah Kelas"
          subtitle="Tambahkan kelas baru ke sistem"
          icon={<Plus size={20} />}
          close={() =>
            setShowTambah(false)
          }
        >
          <Field label="Nama Kelas">
            <input
              value={formNama}
              onChange={(e) =>
                setFormNama(e.target.value)
              }
              placeholder="Contoh: Kelas 1A"
              className="w-full min-h-[52px] px-4 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
            />
          </Field>

          <Field label="Wali Kelas">
            <SelectGuru
              value={formWali}
              onChange={(e) =>
                setFormWali(e.target.value)
              }
              list={waliList}
            />
          </Field>

          <FooterBtn
            cancel={() =>
              setShowTambah(false)
            }
            submit={handleTambah}
            loading={saving}
            text="Simpan"
          />
        </ModalWrap>
      )}

      {/* MODAL EDIT */}
      {editOpen && (
        <ModalWrap
          title="Edit Kelas"
          subtitle="Perbarui data kelas"
          icon={<Pencil size={20} />}
          close={() =>
            setEditOpen(false)
          }
        >
          <Field label="Nama Kelas">
            <input
              value={editNama}
              onChange={(e) =>
                setEditNama(e.target.value)
              }
              className="w-full min-h-[52px] px-4 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
            />
          </Field>

          <Field label="Wali Kelas">
            <SelectGuru
              value={editWali}
              onChange={(e) =>
                setEditWali(e.target.value)
              }
              list={waliList}
            />
          </Field>

          <FooterBtn
            cancel={() =>
              setEditOpen(false)
            }
            submit={handleSaveEdit}
            loading={editSaving}
            text="Simpan"
          />
        </ModalWrap>
      )}

      <ConfirmModal
        open={showDelete}
        title="Hapus Data?"
        desc="Data tidak bisa dikembalikan."
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

/* COMPONENTS */

function SelectGuru({
  value,
  onChange,
  list,
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full min-h-[52px] px-4 pr-10 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 appearance-none outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
      >
        <option value="">Tanpa Wali</option>

        {list.map((g) => (
          <option
            key={g.id_guru}
            value={g.id_guru}
          >
            {g.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={18}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  bg,
  color,
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase text-gray-400">
            {title}
          </p>
          <h3 className="text-3xl font-black text-gray-900 mt-1">
            {value}
          </h3>
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Badge({ active }) {
  return (
    <span
      className={`inline-flex items-center justify-center h-9 min-w-[84px] px-3 rounded-full text-[11px] font-black uppercase ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
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
      Tidak ada data kelas
    </div>
  );
}

function ModalWrap({
  title,
  subtitle,
  icon,
  close,
  children,
}) {
  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={close}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col overflow-visible">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center">
                  {icon}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl font-black text-gray-900 truncate">
                    {title}
                  </h3>

                  <p className="text-sm text-gray-500 truncate">
                    {subtitle}
                  </p>
                </div>
              </div>

              <button
                onClick={close}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <div className="space-y-2.5">
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function FooterBtn({
  cancel,
  submit,
  loading,
  text,
}) {
  return (
    <div className="sticky bottom-0 bg-white grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
      <button
        onClick={cancel}
        className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-gray-100 font-bold"
      >
        Batal
      </button>

      <button
        onClick={submit}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-[#715445] text-white font-bold"
      >
        {loading ? (
          <>
            <Loader2
              size={16}
              className="animate-spin"
            />
            Proses...
          </>
        ) : (
          <>
            <Check size={16} />
            {text}
          </>
        )}
      </button>
    </div>
  );
}