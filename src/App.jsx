import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login/Login";
import ResetPassword from "./pages/login/ResetKirim";
import Reset from "./pages/login/Reset";
import UpdatePassword from "./pages/login/ResetUbah";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { Toaster } from "react-hot-toast";

/* ADMIN */
import AdminLayout from "./layouts/AdminLayout";
import AdminBeranda from "./pages/admin/AdminBeranda";
import AdminKelolaMurid from "./pages/admin/AdminKelolaMurid";
import AdminKelolaGuru from "./pages/admin/AdminKelolaGuru";
import AdminKelolaKelas from "./pages/admin/AdminKelolaKelas";
import AdminKelolaJadwal from "./pages/admin/AdminKelolaJadwal";
import AdminKelolaAkun from "./pages/admin/AdminKelolaAkun";
import AdminKelolaMapel from "./pages/admin/AdminKelolaMapel";
import AdminKalender from "./pages/admin/AdminKalender";

/* ORTU */
import LayoutOrtu from "./layouts/LayoutOrtu";
import DashboardOrtu from "./pages/ortu/DashboardOrtu";
import LihatPresensi from "./pages/ortu/LihatPresensi";
import JadwalOrtu from "./pages/ortu/JadwalOrtu";

/* GURU */
import LayoutGuru from "./layouts/LayoutGuru";
import DashboardGuru from "./pages/guru/DashboardGuru";
import KelolaPresensi from "./pages/guru/KelolaPresensi";
import RiwayatPresensi from "./pages/guru/RiwayatPresensi";
import LihatJadwal from "./pages/guru/LihatJadwal";
import LihatLaporan from "./pages/guru/LaporanGuru";

function App() {
  return (
        <>
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 2600,
          style: {
            borderRadius: "18px",
            padding: "14px 16px",
            fontWeight: 700,
            fontSize: "14px",
            background: "#ffffff",
            color: "#111827",
            border: "1px solid #f1f5f9",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)"
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff"
            }
          }
        }}
      />
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminBeranda />} />
        <Route path="murid" element={<AdminKelolaMurid />} />
        <Route path="guru" element={<AdminKelolaGuru />} />
        <Route path="kelas" element={<AdminKelolaKelas />} />
        <Route path="jadwal" element={<AdminKelolaJadwal />} />
        <Route path="akun" element={<AdminKelolaAkun />} />
        <Route path="mapel" element={<AdminKelolaMapel />} />
        <Route path="kalender" element={<AdminKalender />} />
      </Route>

      {/* ORTU */}
      <Route
        path="/ortu"
        element={
          <ProtectedRoute allowedRoles={["ortu", "orangtua"]}>
            <LayoutOrtu />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOrtu />} />
        <Route path="lihat-presensi" element={<LihatPresensi />} />
        <Route path="lihat-jadwal" element={<JadwalOrtu />} />
      </Route>

      {/* GURU */}
      <Route
        path="/guru"
        element={
          <ProtectedRoute allowedRoles={["guru"]}>
            <LayoutGuru />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardGuru />} />
        <Route path="presensi" element={<KelolaPresensi />} />
        <Route path="riwayat" element={<RiwayatPresensi />} />
        <Route path="jadwal" element={<LihatJadwal />} />
        <Route path="laporan" element={<LihatLaporan />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}

export default App;