import React, { useEffect, useState } from "react";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

import {
  BookOpen,
  Search,
  Plus,
  Pencil,
  Power,
  Trash2,
  X,
  Check,
  Loader2,
} from "lucide-react";

// PREMIUM UI UPGRADE
// PERFECT ALIGNMENT FIX
// BADGE CENTER FIX
// MOBILE UX FIX
// TOAST SYSTEM READY
// SAFE RESPONSIVE REFACTOR

const AdminKelolaMapel = () => {
  /* =========================
     STATE & LOGIC (UNCHANGED)
  ========================= */
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nama, setNama] = useState("");
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState("semua");
  const [search, setSearch] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    nama: "",
  });

  const [showDelete, setShowDelete] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [selectedDelete, setSelectedDelete] =
    useState(null);

  /* =========================
     FETCH
  ========================= */
  const loadData = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        "/admin/mapel"
      );

      setList(res.data || []);
    } catch {
      toast.error(
        "Gagal mengambil data mapel"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     ACTIONS
  ========================= */

  const tambahMapel = async () => {
    if (!nama.trim()) {
      return toast.error(
        "Nama mapel wajib diisi"
      );
    }

    try {
      setSaving(true);

      const id = toast.loading(
        "Menyimpan mapel..."
      );

      await api.post("/admin/mapel", {
        nama: nama.trim(),
      });

      toast.success(
        "Mapel berhasil ditambahkan",
        { id }
      );

      setNama("");
      loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Gagal tambah mapel"
      );
    } finally {
      setSaving(false);
    }
  };

  const bukaEdit = (item) => {
    setEditData({
      id: item.id,
      nama: item.nama,
    });

    setShowEdit(true);
  };

  const simpanEdit = async () => {
    if (!editData.nama.trim()) {
      return toast.error(
        "Nama mapel wajib diisi"
      );
    }

    try {
      setEditSaving(true);

      const id = toast.loading(
        "Menyimpan perubahan..."
      );

      await api.put(
        `/admin/mapel/${editData.id}`,
        {
          nama:
            editData.nama.trim(),
        }
      );

      toast.success(
        "Mapel berhasil diupdate",
        { id }
      );

      setShowEdit(false);
      loadData();
    } catch {
      toast.error(
        "Gagal update mapel"
      );
    } finally {
      setEditSaving(false);
    }
  };

  const ubahStatus = async (
    id,
    status
  ) => {
    try {
      const toastId =
        toast.loading(
          "Memperbarui status..."
        );

      await api.patch(
        `/admin/mapel/${id}/status`,
        { status }
      );

      toast.success(
        "Status berhasil diubah",
        { id: toastId }
      );

      loadData();
    } catch {
      toast.error(
        "Gagal update status"
      );
    }
  };

  const hapusMapel = (id) => {
    setSelectedDelete(id);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);

      const id = toast.loading(
        "Menghapus mapel..."
      );

      await api.delete(
        `/admin/mapel/${selectedDelete}`
      );

      toast.success(
        "Mapel berhasil dihapus",
        { id }
      );

      setShowDelete(false);
      setSelectedDelete(null);

      loadData();
    } catch {
      toast.error(
        "Gagal hapus mapel"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  /* =========================
     FILTER
  ========================= */

  const hasil = list.filter(
    (item) => {
      const cocokFilter =
        filter === "semua"
          ? true
          : item.status === filter;

      const q =
        search.toLowerCase();

      const cocokSearch =
        item.nama
          .toLowerCase()
          .includes(q) ||
        item.id
          .toLowerCase()
          .includes(q);

      return (
        cocokFilter &&
        cocokSearch
      );
    }
  );

  const total = list.length;
  const aktif = list.filter(
    (x) =>
      x.status === "aktif"
  ).length;

  const nonaktif =
    total - aktif;

    const [showTambah, setShowTambah] =
  useState(false);

  return (
    <section className="w-full px-0 py-8 space-y-12 animate-in fade-in duration-700">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Mapel"
          value={total}
          icon={
            <BookOpen size={20} />
          }
          color="text-[#715445]"
          bg="bg-[#715445]/10"
        />

        <StatCard
          title="Aktif"
          value={aktif}
          icon={<Check size={20} />}
          color="text-emerald-600"
          bg="bg-emerald-100"
        />

        <StatCard
          title="Nonaktif"
          value={nonaktif}
          icon={
            <Power size={20} />
          }
          color="text-rose-600"
          bg="bg-rose-100"
        />
      </div>

      {/* TOP TOOLBAR */}

<div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">

  {/* SEARCH + ACTION */}
  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">

    {/* SEARCH */}
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
        placeholder="Cari mapel / kode..."
        className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-11 text-sm outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
      />

      {search && (
        <button
          onClick={() =>
            setSearch("")
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        >
          <X size={14} />
        </button>
      )}
    </div>

    {/* BUTTON OPEN MODAL */}
    <button
      onClick={() =>
        setShowTambah(true)
      }
      className="
        w-full sm:w-auto
        min-h-[48px]
        px-5
        rounded-2xl
        bg-[#715445]
        text-white
        font-bold
        text-sm
        inline-flex
        items-center
        justify-center
        gap-2
        active:scale-95
        transition-all
        hover:bg-[#5e4336]
        whitespace-nowrap
      "
    >
      <Plus size={16} />
      Tambah Mapel
    </button>
  </div>

  {/* FILTER */}
  <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
    <div className="flex gap-2 w-max min-w-full">
      {[
        "semua",
        "aktif",
        "nonaktif",
      ].map((st) => (
        <button
          key={st}
          onClick={() =>
            setFilter(st)
          }
          className={`min-h-[42px] px-5 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
            filter === st
              ? "bg-[#715445] text-white shadow-md"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {st}
        </button>
      ))}
    </div>
  </div>

  <p className="text-sm text-gray-500 font-medium">
    {hasil.length} data ditemukan
  </p>
</div>
      {/* DESKTOP TABLE */}
      <div className="hidden md:block rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <Th>Kode</Th>
                <Th>Nama</Th>
                <Th center>Status</Th>
                <Th right>Aksi</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-16 text-center"
                  >
                    <Loader2 className="animate-spin mx-auto text-gray-300" />
                  </td>
                </tr>
              ) : hasil.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-16 text-center text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                hasil.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                      className="hover:bg-gray-50"
                    >
                      <Td>
                        <span className="inline-flex items-center justify-center px-3 h-8 rounded-xl bg-[#715445]/10 text-[#715445] text-xs font-black">
                          {
                            item.id
                          }
                        </span>
                      </Td>

                      <Td bold>
                        {
                          item.nama
                        }
                      </Td>

                      <Td center>
                        <Badge
                          active={
                            item.status ===
                            "aktif"
                          }
                        />
                      </Td>

                      <Td right>
                        <div className="flex justify-end gap-2">
                          <ActionBtn
                            onClick={() =>
                              bukaEdit(
                                item
                              )
                            }
                          >
                            <Pencil size={15} />
                          </ActionBtn>

                          {item.status ===
                          "aktif" ? (
                            <ActionBtn
                              onClick={() =>
                                ubahStatus(
                                  item.id,
                                  "nonaktif"
                                )
                              }
                            >
                              <Power size={15} />
                            </ActionBtn>
                          ) : (
                            <>
                              <ActionBtn
                                onClick={() =>
                                  ubahStatus(
                                    item.id,
                                    "aktif"
                                  )
                                }
                              >
                                <Check size={15} />
                              </ActionBtn>

                              <ActionBtn
                                danger
                                onClick={() =>
                                  hapusMapel(
                                    item.id
                                  )
                                }
                              >
                                <Trash2 size={15} />
                              </ActionBtn>
                            </>
                          )}
                        </div>
                      </Td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD */}
      <div className="md:hidden space-y-3 pb-8">
        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center">
            <Loader2 className="animate-spin mx-auto text-gray-300" />
          </div>
        ) : hasil.length ===
          0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-gray-400">
            Tidak ada data
          </div>
        ) : (
          hasil.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 space-y-4"
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.2em] text-[#715445]">
                    {item.id}
                  </p>

                  <h3 className="font-black text-gray-900 text-lg break-words">
                    {item.nama}
                  </h3>
                </div>

                <Badge
                  active={
                    item.status ===
                    "aktif"
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    bukaEdit(
                      item
                    )
                  }
                  className="min-h-[44px] rounded-2xl bg-gray-100 text-sm font-bold"
                >
                  Edit
                </button>

                {item.status ===
                "aktif" ? (
                  <button
                    onClick={() =>
                      ubahStatus(
                        item.id,
                        "nonaktif"
                      )
                    }
                    className="min-h-[44px] rounded-2xl bg-rose-500 text-white text-sm font-bold"
                  >
                    Nonaktifkan
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        ubahStatus(
                          item.id,
                          "aktif"
                        )
                      }
                      className="min-h-[44px] rounded-2xl bg-emerald-500 text-white text-sm font-bold"
                    >
                      Aktifkan
                    </button>

                    <button
                      onClick={() =>
                        hapusMapel(
                          item.id
                        )
                      }
                      className="col-span-2 min-h-[44px] rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-bold"
                    >
                      Hapus
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL EDIT */}
{/* MODAL EDIT MAPEL PREMIUM */}
{showEdit && (
  <div className="fixed inset-0 z-[100]">
    {/* overlay */}
    <div
      className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      onClick={() =>
        setShowEdit(false)
      }
    />

    <div className="absolute inset-0 overflow-y-auto">
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">

        <div className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">

          {/* HEADER */}
          <div className="px-5 sm:px-7 py-4 border-b border-gray-100 flex gap-4">

            <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center shrink-0">
              <Pencil size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black text-gray-900">
                Edit Mapel
              </h3>

              <p className="text-sm text-gray-500 truncate">
                Perbarui data mata pelajaran
              </p>
            </div>

            <button
              onClick={() =>
                setShowEdit(false)
              }
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 sm:p-7 space-y-5">

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                ID Mapel
              </label>

              <input
                disabled
                value={editData.id}
                className="w-full h-14 rounded-2xl border border-gray-200 bg-gray-100 px-4 text-sm font-semibold text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                Nama Mata Pelajaran
              </label>

              <input
                value={editData.nama}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    nama: e.target.value,
                  })
                }
                placeholder="Nama mapel..."
                className="w-full h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
              />
            </div>

          </div>

          {/* FOOTER */}
          <div className="px-5 sm:px-7 py-4 border-t border-gray-100 grid grid-cols-2 gap-3">

            <button
              onClick={() =>
                setShowEdit(false)
              }
              className="min-h-[52px] rounded-2xl bg-gray-100 text-gray-800 font-black"
            >
              Batal
            </button>

            <button
              onClick={simpanEdit}
              disabled={editSaving}
              className="min-h-[52px] rounded-2xl bg-[#715445] text-white font-black shadow-lg shadow-[#715445]/20 inline-flex items-center justify-center gap-2"
            >
              {editSaving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Simpan
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  </div>
)}

{showTambah && (
  <div className="fixed inset-0 z-[100]">
    {/* overlay */}
    <div
      className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      onClick={() =>
        setShowTambah(false)
      }
    />

    <div className="absolute inset-0 overflow-y-auto">
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">

        <div className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">

          {/* HEADER */}
          <div className="px-5 sm:px-7 py-4 border-b border-gray-100 flex gap-4">

            <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center shrink-0">
              <BookOpen size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black text-gray-900">
                Tambah Mapel Baru
              </h3>

              <p className="text-sm text-gray-500 truncate">
                Tambahkan mata pelajaran ke sistem akademik
              </p>
            </div>

            <button
              onClick={() =>
                setShowTambah(false)
              }
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 sm:p-7 space-y-5">

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                Nama Mata Pelajaran
              </label>

              <input
                value={nama}
                onChange={(e) =>
                  setNama(
                    e.target.value
                  )
                }
                placeholder="Contoh: Matematika"
                className="w-full h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
              />
            </div>

          </div>

          {/* FOOTER */}
          <div className="px-5 sm:px-7 py-4 border-t border-gray-100 grid grid-cols-2 gap-3">

            <button
              onClick={() =>
                setShowTambah(false)
              }
              className="min-h-[52px] rounded-2xl bg-gray-100 text-gray-800 font-black"
            >
              Batal
            </button>

            <button
              onClick={async () => {
                await tambahMapel();
              }}
              disabled={saving}
              className="min-h-[52px] rounded-2xl bg-[#715445] text-white font-black shadow-lg shadow-[#715445]/20 inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Simpan Mapel
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* DELETE MODAL */}
      <ConfirmModal
        open={showDelete}
        title="Hapus Data?"
        desc="Data tidak bisa dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        danger={true}
        loading={
          deleteLoading
        }
        onClose={() =>
          setShowDelete(
            false
          )
        }
        onConfirm={
          confirmDelete
        }
      />
    </section>
  );
};

export default AdminKelolaMapel;

/* COMPONENT */

function StatCard({
  title,
  value,
  icon,
  color,
  bg,
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 hover:-translate-y-1 hover:shadow-md transition-all">
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

function Badge({
  active,
}) {
  return (
    <span
      className={`inline-flex items-center justify-center h-9 min-w-[88px] px-3 rounded-full text-[10px] font-black uppercase leading-none text-center ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      {active
        ? "Aktif"
        : "Nonaktif"}
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
      className={`w-10 h-10 rounded-2xl border inline-flex items-center justify-center transition-all active:scale-95 ${
        danger
          ? "bg-rose-50 border-rose-200 text-rose-600"
          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
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
  bold,
  center,
  right,
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