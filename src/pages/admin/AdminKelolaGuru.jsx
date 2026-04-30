import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Power,
  Trash2,
  GraduationCap,
  ShieldCheck,
  ShieldX,
  X,
  Save,
  User,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import ConfirmModal from "../../components/ui/ConfirmModal";

// PREMIUM UI UPGRADE
export default function AdminKelolaGuru() {
  const [guruData, setGuruData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("aktif");

  const [showTambah, setShowTambah] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formNama, setFormNama] = useState("");
  const [formNip, setFormNip] = useState("");

  const [editId, setEditId] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    nama: "",
    nip: "",
  });

  const [showDelete, setShowDelete] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAktif = (status) =>
    String(status || "").toLowerCase().trim() === "aktif";

  const fetchGuru = async () => {
    try {
      setLoading(true);

      const res = await api.get("/admin/guru");

      const data = (res.data || []).map((g) => ({
        ...g,
        id: g.id_guru || g.id,
        status: (g.status || "nonaktif").toLowerCase().trim(),
      }));

      setGuruData(data);
    } catch (err) {
      toast.error("Gagal memuat data guru");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuru();
  }, []);

  // TOAST SYSTEM READY
  const handleTambah = async () => {
    if (!formNama.trim()) {
      return toast.error("Nama guru wajib diisi");
    }

    try {
      setSaving(true);

      const id = toast.loading("Menyimpan guru...");

      await api.post("/admin/guru", {
        nama: formNama,
        nip: formNip || "",
        status: "aktif",
      });

      toast.success("Guru berhasil ditambahkan", { id });

      setFormNama("");
      setFormNip("");
      setShowTambah(false);

      fetchGuru();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menambah guru");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (guru) => {
    const newStatus = isAktif(guru.status) ? "nonaktif" : "aktif";

    try {
      const id = toast.loading("Memperbarui status...");

      await api.patch(`/admin/guru/${guru.id}/status`, {
        status: newStatus,
      });

      toast.success("Status berhasil diperbarui", { id });

      fetchGuru();
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  // CONFIRM MODAL READY
  const handleHapusGuru = (guru) => {
    setSelectedDelete(guru);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);

      const id = toast.loading("Menghapus guru...");

      await api.delete(`/admin/guru/${selectedDelete.id}`);

      toast.success("Guru berhasil dihapus", { id });

      setShowDelete(false);
      setSelectedDelete(null);

      fetchGuru();
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Guru tidak bisa dihapus karena sudah digunakan."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const saveEdit = async () => {
    try {
      setEditSaving(true);

      const id = toast.loading("Menyimpan perubahan...");

      await api.put(`/admin/guru/${editId}`, {
        nama: editForm.nama,
        nip: editForm.nip,
      });

      toast.success("Perubahan berhasil disimpan", { id });

      setEditId(null);

      fetchGuru();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal update guru");
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = guruData.filter((g) => {
    const cocokCari = `${g.nama} ${g.nip}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const cocokStatus =
      filterStatus === "semua"
        ? true
        : g.status === filterStatus;

    return cocokCari && cocokStatus;
  });

  const totalGuru = guruData.length;
  const totalAktif = guruData.filter((g) =>
    isAktif(g.status)
  ).length;
  const totalNonaktif = totalGuru - totalAktif;

  return (
    <section className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Guru"
          value={totalGuru}
          icon={<Users size={20} />}
          color="text-[#715445]"
          bg="bg-[#715445]/10"
        />

        <StatCard
          title="Guru Aktif"
          value={totalAktif}
          icon={<ShieldCheck size={20} />}
          color="text-emerald-600"
          bg="bg-emerald-100"
        />

        <StatCard
          title="Nonaktif"
          value={totalNonaktif}
          icon={<ShieldX size={20} />}
          color="text-rose-600"
          bg="bg-rose-100"
        />
      </div>

      {/* SEARCH FILTER */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
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
              placeholder="Cari nama atau NIP..."
              className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-11 text-sm outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowTambah(true)}
            className="h-12 px-5 rounded-2xl bg-[#715445] text-white font-bold text-sm hover:bg-[#5e4336] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Tambah Guru
          </button>
        </div>

        {/* FILTER TAB */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 w-max min-w-full">
            {["semua", "aktif", "nonaktif"].map((item) => (
              <button
                key={item}
                onClick={() =>
                  setFilterStatus(item)
                }
                className={`min-h-[42px] px-5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  filterStatus === item
                    ? "bg-[#715445] text-white shadow-md"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 font-medium">
          {filtered.length} data ditemukan
        </p>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block rounded-3xl bg-white border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <Th>ID</Th>
                <Th>NIP</Th>
                <Th>Nama</Th>
                <Th center>Status</Th>
                <Th right>Aksi</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-16 text-center"
                  >
                    <Loader2 className="animate-spin mx-auto text-gray-300" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-16 text-center text-gray-400"
                  >
                    Tidak ada data guru
                  </td>
                </tr>
              ) : (
                filtered.map((guru) => (
                  <tr
                    key={guru.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <Td>
                      <span className="px-3 py-1 rounded-xl bg-[#715445]/10 text-[#715445] text-xs font-black">
                        {guru.id}
                      </span>
                    </Td>

                    <Td>{guru.nip || "-"}</Td>

                    <Td bold>{guru.nama}</Td>

                    <Td center>
                      <Badge
                        active={isAktif(guru.status)}
                      />
                    </Td>

                    <Td right>
                      <div className="flex justify-end gap-2">
                        <ActionBtn
                          onClick={() => {
                            setEditId(guru.id);
                            setEditForm({
                              nama: guru.nama || "",
                              nip: guru.nip || "",
                            });
                          }}
                        >
                          <Pencil size={15} />
                        </ActionBtn>

                        <ActionBtn
                          onClick={() =>
                            handleToggleStatus(guru)
                          }
                        >
                          <Power size={15} />
                        </ActionBtn>

                        {!isAktif(guru.status) && (
                          <ActionBtn
                            danger
                            onClick={() =>
                              handleHapusGuru(guru)
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

      {/* MOBILE CARD UX */}
      <div className="md:hidden space-y-3 pb-10">
        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center">
            <Loader2 className="animate-spin mx-auto text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-gray-400">
            Tidak ada data guru
          </div>
        ) : (
          filtered.map((guru) => (
            <div
              key={guru.id}
              className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 space-y-4"
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.2em] text-[#715445]">
                    {guru.id}
                  </p>

                  <h3 className="font-black text-gray-900 text-lg truncate">
                    {guru.nama}
                  </h3>

                  <p className="text-sm text-gray-500">
                    NIP: {guru.nip || "-"}
                  </p>
                </div>

                <Badge
                  active={isAktif(guru.status)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setEditId(guru.id);
                    setEditForm({
                      nama: guru.nama || "",
                      nip: guru.nip || "",
                    });
                  }}
                  className="min-h-[44px] rounded-2xl bg-gray-100 text-sm font-bold"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleToggleStatus(guru)
                  }
                  className={`min-h-[44px] rounded-2xl text-sm font-bold text-white ${
                    isAktif(guru.status)
                      ? "bg-rose-500"
                      : "bg-emerald-500"
                  }`}
                >
                  {isAktif(guru.status)
                    ? "Nonaktifkan"
                    : "Aktifkan"}
                </button>

                {!isAktif(guru.status) && (
                  <button
                    onClick={() =>
                      handleHapusGuru(guru)
                    }
                    className="col-span-2 min-h-[44px] rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-bold"
                  >
                    Hapus Guru
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL TAMBAH */}
      <GuruModal
        open={showTambah}
        title="Tambah Guru Baru"
        subtitle="Tambahkan tenaga pengajar ke sistem"
        nama={formNama}
        nip={formNip}
        setNama={setFormNama}
        setNip={setFormNip}
        onClose={() => setShowTambah(false)}
        onSave={handleTambah}
        loading={saving}
        saveText="Simpan Guru"
      />

      {/* MODAL EDIT */}
      <GuruModal
        open={!!editId}
        title="Edit Data Guru"
        subtitle={`${editId || ""} • ${editForm.nama || ""}`}
        nama={editForm.nama}
        nip={editForm.nip}
        setNama={(v) =>
          setEditForm({
            ...editForm,
            nama: v,
          })
        }
        setNip={(v) =>
          setEditForm({
            ...editForm,
            nip: v,
          })
        }
        onClose={() => setEditId(null)}
        onSave={saveEdit}
        loading={editSaving}
        saveText="Simpan Perubahan"
      />

      {/* CONFIRM MODAL READY */}
      <ConfirmModal
        open={showDelete}
        title="Hapus Guru?"
        desc="Data guru akan dihapus permanen."
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

function StatCard({
  title,
  value,
  icon,
  color,
  bg,
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-black">
            {title}
          </p>
          <h3 className="text-3xl font-black text-gray-900">
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

function GuruModal({
  open,
  title,
  subtitle,
  nama,
  nip,
  setNama,
  setNip,
  onClose,
  onSave,
  loading,
  saveText,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-0">
        <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 sm:px-7 py-4 border-b border-gray-100 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center shrink-0">
                <User size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black text-gray-900">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {subtitle}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-7 space-y-5">
              <Input
                label="Nama Lengkap"
                value={nama}
                onChange={setNama}
              />

              <Input
                label="NIP (Opsional)"
                value={nip}
                onChange={setNip}
              />
            </div>

            <div className="px-5 sm:px-7 py-4 border-t border-gray-100 grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="min-h-[48px] rounded-2xl bg-gray-100 font-bold"
              >
                Batal
              </button>

              <button
                onClick={onSave}
                disabled={loading}
                className="min-h-[48px] rounded-2xl bg-[#715445] text-white font-black shadow-lg shadow-[#715445]/20"
              >
                {loading ? "Menyimpan..." : saveText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
      />
    </div>
  );
}

function Badge({ active }) {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[78px] h-9
        px-3 rounded-full
        text-[10px] font-black uppercase tracking-wider
        leading-none text-center
        ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
        }
      `}
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  danger,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
        danger
          ? "border-rose-200 text-rose-600 bg-rose-50"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
      className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 ${
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
  center,
  right,
  bold,
}) {
  return (
    <td
      className={`px-6 py-5 text-sm ${
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