import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  KeyRound,
  Power,
  Trash2,
  UserCog,
  Mail,
  Plus,
  X,
  Loader2,
  Check,
  RotateCcw,
  Users,
  ShieldCheck,
  Archive,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import ConfirmModal from "../../components/ui/ConfirmModal";

export default function AdminKelolaAkun() {
  const [tab, setTab] = useState("guru");
  const [status, setStatus] = useState("semua");
  const [kelas, setKelas] = useState("semua");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showBuat, setShowBuat] = useState(false);
  const [buatTarget, setBuatTarget] = useState(null);
  const [buatEmail, setBuatEmail] = useState("");
  const [buatLoading, setBuatLoading] = useState(false);

  const [showEmail, setShowEmail] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailBaru, setEmailBaru] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/akun/${tab}`);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
      toast.error("Gagal memuat data akun");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setRows([]);
    setSearch("");
    setStatus("semua");
    setKelas("semua");
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const txt =
        `${r.nama || ""} ${r.email || ""} ${r.nip || ""} ${r.kelas || ""}`.toLowerCase();

      const okSearch = txt.includes(search.toLowerCase());

      const rowStatus = (r.status || "").toLowerCase();

      const okStatus =
        status === "semua"
          ? rowStatus !== "dihapus"
          : rowStatus === status.toLowerCase();

      const okKelas =
        kelas === "semua" ||
        String(r.kelas) === String(kelas);

      return okSearch && okStatus && okKelas;
    });
  }, [rows, search, status, kelas]);

  const totalAktif = rows.filter(
    (r) => r.status === "aktif"
  ).length;

  const totalArsip = rows.filter(
    (r) => r.status === "dihapus"
  ).length;

  const resetPass = (id) => {
    setConfirmData({
      title: "Reset Password?",
      desc: "Password akan dikembalikan ke default.",
      action: async () => {
        await api.post(`/admin/akun/${id}/reset`);
        toast.success("Password berhasil direset");
      },
    });
    setConfirmOpen(true);
  };

  const ubahStatus = async (r) => {
    if (!r.email) {
      return toast.error("Akun login belum dibuat.");
    }

    try {
      const id = toast.loading("Mengubah status...");

      await api.patch(`/admin/akun/${r.id}/status`, {
        status:
          r.status === "aktif"
            ? "nonaktif"
            : "aktif",
      });

      toast.success("Status diperbarui", {
        id,
      });

      load();
    } catch {
      toast.error("Gagal ubah status akun");
    }
  };

  const hapus = (r) => {
    if (!r.email) {
      return toast.error(
        "Belum ada akun yang perlu dihapus."
      );
    }

    setConfirmData({
      title: "Arsipkan Akun?",
      desc: `Akun "${r.nama}" akan dipindahkan ke arsip.`,
      danger: true,
      action: async () => {
        await api.delete(`/admin/akun/${r.id}`);
        toast.success("Akun diarsipkan");
        load();
      },
    });

    setConfirmOpen(true);
  };

  const restore = (id) => {
    setConfirmData({
      title: "Pulihkan Akun?",
      desc: "Akun akan aktif kembali.",
      action: async () => {
        await api.patch(
          `/admin/akun/${id}/restore`
        );
        toast.success("Akun dipulihkan");
        load();
      },
    });

    setConfirmOpen(true);
  };

  const bukaBuatAkun = (r) => {
    setBuatTarget({
      id: r.id,
      nama: r.nama,
      type: tab,
    });
    setBuatEmail("");
    setShowBuat(true);
  };

  const simpanBuatAkun = async () => {
    if (
      !buatEmail.trim() ||
      !buatEmail.includes("@")
    ) {
      return toast.error(
        "Masukkan email yang valid"
      );
    }

    setBuatLoading(true);

    try {
      const id = toast.loading(
        "Membuat akun..."
      );

      await api.post(
        `/admin/akun/${buatTarget.type}/${buatTarget.id}`,
        {
          email: buatEmail.trim(),
          nama: buatTarget.nama,
        }
      );

      toast.success("Akun berhasil dibuat", {
        id,
      });

      setShowBuat(false);
      load();
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          "Gagal membuat akun"
      );
    } finally {
      setBuatLoading(false);
    }
  };

  const simpanEmail = async () => {
    if (
      !emailBaru.trim() ||
      !emailBaru.includes("@")
    ) {
      return toast.error(
        "Masukkan email valid"
      );
    }

    setEmailLoading(true);

    try {
      const id = toast.loading(
        "Menyimpan email..."
      );

      await api.patch(
        `/admin/akun/${emailTarget.id}/email`,
        {
          email: emailBaru.trim(),
        }
      );

      toast.success("Email diperbarui", {
        id,
      });

      setShowEmail(false);
      load();
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          "Gagal ganti email"
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const runConfirm = async () => {
    try {
      setConfirmLoading(true);
      await confirmData.action();
      setConfirmOpen(false);
    } catch {
      toast.error("Gagal memproses");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Data"
          value={rows.length}
          icon={<Users size={20} />}
        />

        <StatCard
          title="Aktif"
          value={totalAktif}
          icon={<ShieldCheck size={20} />}
          green
        />

        <StatCard
          title="Arsip"
          value={totalArsip}
          icon={<Archive size={20} />}
          red
        />
      </div>

      {/* TAB */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-2">
        <div className="grid grid-cols-2 gap-2">
          {["guru", "ortu"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`min-h-[48px] rounded-2xl font-black text-sm transition-all ${
                tab === t
                  ? "bg-[#715445] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {t === "guru"
                ? "Akun Guru"
                : "Akun Orang Tua"}
            </button>
          ))}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari nama / email..."
              className="w-full min-h-[52px] pl-11 pr-4 rounded-2xl border border-gray-200 outline-none focus:ring-4 focus:ring-[#715445]/10 focus:border-[#715445]/30"
            />
          </div>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="w-full min-h-[52px] px-4 rounded-2xl border border-gray-200 outline-none"
          >
            <option value="semua">
              Semua Status
            </option>
            <option value="aktif">
              Aktif
            </option>
            <option value="nonaktif">
              Nonaktif
            </option>
            <option value="dihapus">
              Arsip
            </option>
          </select>

          {tab === "ortu" && (
            <select
              value={kelas}
              onChange={(e) =>
                setKelas(e.target.value)
              }
              className="md:col-span-3 w-full min-h-[52px] px-4 rounded-2xl border border-gray-200 outline-none"
            >
              <option value="semua">
                Semua Kelas
              </option>

              {[1, 2, 3, 4, 5, 6].map(
                (k) => (
                  <option
                    key={k}
                    value={k}
                  >
                    Kelas {k}
                  </option>
                )
              )}
            </select>
          )}
        </div>
      </div>

      {/* MOBILE */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <LoadingBox />
        ) : filtered.length === 0 ? (
          <EmptyBox />
        ) : (
          filtered.map((r, i) => (
            <CardRow
              key={i}
              row={r}
              tab={tab}
              bukaBuatAkun={
                bukaBuatAkun
              }
              setEmailTarget={
                setEmailTarget
              }
              setShowEmail={
                setShowEmail
              }
              setEmailBaru={
                setEmailBaru
              }
              resetPass={
                resetPass
              }
              ubahStatus={
                ubahStatus
              }
              hapus={hapus}
              restore={
                restore
              }
            />
          ))
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <Th>Nama</Th>
                <Th>
                  {tab === "guru"
                    ? "NIP"
                    : "Kelas"}
                </Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th right>Aksi</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((r, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50"
                >
                  <Td bold>{r.nama}</Td>

                  <Td>
                    {tab === "guru"
                      ? r.nip || "-"
                      : r.kelas
                      ? `Kelas ${r.kelas}`
                      : "-"}
                  </Td>

                  <Td>
                    {r.email || "-"}
                  </Td>

                  <Td>
                    <StatusBadge
                      status={
                        r.status
                      }
                    />
                  </Td>

                  <Td right>
                    <div className="flex justify-end gap-2">
                      {r.status ===
                      "dihapus" ? (
                        <IconBtn
                          onClick={() =>
                            restore(
                              r.id
                            )
                          }
                        >
                          <RotateCcw
                            size={15}
                          />
                        </IconBtn>
                      ) : (
                        <>
                          <IconBtn
                            onClick={() => {
                              if (
                                r.email
                              ) {
                                setEmailTarget(
                                  r
                                );
                                setEmailBaru(
                                  ""
                                );
                                setShowEmail(
                                  true
                                );
                              } else {
                                bukaBuatAkun(
                                  r
                                );
                              }
                            }}
                          >
                            <Mail
                              size={15}
                            />
                          </IconBtn>

                          <IconBtn
                            onClick={() =>
                              resetPass(
                                r.id
                              )
                            }
                          >
                            <KeyRound
                              size={15}
                            />
                          </IconBtn>

                          <IconBtn
                            onClick={() =>
                              ubahStatus(
                                r
                              )
                            }
                          >
                            <Power
                              size={15}
                            />
                          </IconBtn>

                          <IconBtn
                            danger
                            onClick={() =>
                              hapus(
                                r
                              )
                            }
                          >
                            <Trash2
                              size={15}
                            />
                          </IconBtn>
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EMAIL */}
      {showEmail &&
        emailTarget && (
          <ModalWrap
            title="Ganti Email"
            subtitle={
              emailTarget.nama
            }
            icon={
              <Mail
                size={20}
              />
            }
            close={() =>
              setShowEmail(
                false
              )
            }
          >
            <Field label="Email Baru">
              <input
                value={
                  emailBaru
                }
                onChange={(
                  e
                ) =>
                  setEmailBaru(
                    e.target
                      .value
                  )
                }
                placeholder="emailbaru@gmail.com"
                className="input-premium"
              />
            </Field>

            <FooterBtn
              cancel={() =>
                setShowEmail(
                  false
                )
              }
              submit={
                simpanEmail
              }
              loading={
                emailLoading
              }
              text="Simpan"
            />
          </ModalWrap>
        )}

      {/* MODAL BUAT */}
      {showBuat &&
        buatTarget && (
          <ModalWrap
            title="Buat Akun"
            subtitle={
              buatTarget.nama
            }
            icon={
              <Plus
                size={20}
              />
            }
            close={() =>
              setShowBuat(
                false
              )
            }
          >
            <Field label="Email Login">
              <input
                value={
                  buatEmail
                }
                onChange={(
                  e
                ) =>
                  setBuatEmail(
                    e.target
                      .value
                  )
                }
                placeholder="email@gmail.com"
                className="input-premium"
              />
            </Field>

            <p className="text-sm text-gray-500">
              Password default:
              12345678
            </p>

            <FooterBtn
              cancel={() =>
                setShowBuat(
                  false
                )
              }
              submit={
                simpanBuatAkun
              }
              loading={
                buatLoading
              }
              text="Buat Akun"
            />
          </ModalWrap>
        )}

      <ConfirmModal
        open={confirmOpen}
        title={
          confirmData?.title
        }
        desc={
          confirmData?.desc
        }
        danger={
          confirmData?.danger
        }
        loading={
          confirmLoading
        }
        onClose={() =>
          setConfirmOpen(
            false
          )
        }
        onConfirm={
          runConfirm
        }
      />
    </section>
  );
}

/* COMPONENT */

function CardRow({
  row,
  tab,
  bukaBuatAkun,
  setEmailTarget,
  setShowEmail,
  setEmailBaru,
  resetPass,
  ubahStatus,
  hapus,
  restore,
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-gray-900">
            {row.nama}
          </h3>
          <p className="text-sm text-gray-500">
            {tab === "guru"
              ? row.nip || "-"
              : `Kelas ${
                  row.kelas ||
                  "-"
                }`}
          </p>
        </div>

        <StatusBadge
          status={
            row.status
          }
        />
      </div>

      <p className="text-sm text-gray-500 break-all">
        {row.email ||
          "Belum ada akun"}
      </p>

      <div className="grid grid-cols-4 gap-2">
        {row.status ===
        "dihapus" ? (
          <button
            onClick={() =>
              restore(
                row.id
              )
            }
            className="min-h-[44px] rounded-2xl bg-green-50 text-green-600 font-bold"
          >
            ↺
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                if (
                  row.email
                ) {
                  setEmailTarget(
                    row
                  );
                  setEmailBaru(
                    ""
                  );
                  setShowEmail(
                    true
                  );
                } else {
                  bukaBuatAkun(
                    row
                  );
                }
              }}
              className="min-h-[44px] rounded-2xl bg-gray-100"
            >
              <Mail
                size={16}
                className="mx-auto"
              />
            </button>

            <button
              onClick={() =>
                resetPass(
                  row.id
                )
              }
              className="min-h-[44px] rounded-2xl bg-gray-100"
            >
              <KeyRound
                size={16}
                className="mx-auto"
              />
            </button>

            <button
              onClick={() =>
                ubahStatus(
                  row
                )
              }
              className="min-h-[44px] rounded-2xl bg-gray-100"
            >
              <Power
                size={16}
                className="mx-auto"
              />
            </button>

            <button
              onClick={() =>
                hapus(
                  row
                )
              }
              className="min-h-[44px] rounded-2xl bg-rose-50 text-rose-600"
            >
              <Trash2
                size={16}
                className="mx-auto"
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  green,
  red,
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-black uppercase text-gray-400">
            {title}
          </p>
          <h3 className="text-3xl font-black text-gray-900 mt-1">
            {value}
          </h3>
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            green
              ? "bg-emerald-100 text-emerald-600"
              : red
              ? "bg-rose-100 text-rose-600"
              : "bg-[#715445]/10 text-[#715445]"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  const cls =
    status === "aktif"
      ? "bg-emerald-50 text-emerald-700"
      : status ===
        "dihapus"
      ? "bg-rose-50 text-rose-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center justify-center h-9 min-w-[84px] px-3 rounded-full text-[11px] font-black uppercase ${cls}`}
    >
      {status}
    </span>
  );
}

function IconBtn({
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
  right,
}) {
  return (
    <th
      className={`px-6 py-4 text-xs font-black uppercase text-gray-400 ${
        right
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
  right,
}) {
  return (
    <td
      className={`px-6 py-4 text-sm ${
        bold
          ? "font-bold text-gray-900"
          : "text-gray-600"
      } ${
        right
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
      Tidak ada data akun
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
        <div className="min-h-full flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-xl bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex justify-between gap-3">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#715445]/10 text-[#715445] flex items-center justify-center">
                  {icon}
                </div>

                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500">
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
    <div className="space-y-2">
      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
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
    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
      <button
        onClick={cancel}
        className="min-h-[52px] rounded-2xl bg-gray-100 font-bold"
      >
        Batal
      </button>

      <button
        onClick={submit}
        disabled={loading}
        className="min-h-[52px] rounded-2xl bg-[#715445] text-white font-bold inline-flex items-center justify-center gap-2"
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