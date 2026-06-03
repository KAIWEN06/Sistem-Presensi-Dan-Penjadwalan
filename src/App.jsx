import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useEffect, useState } from "react";
import SplashScreen from "./components/SplashScreen";
import { Toaster } from "react-hot-toast";

/* LOGIN */
const Login = lazy(() => import("./pages/login/Login"));
const ResetPassword = lazy(() => import("./pages/login/ResetKirim"));
const UpdatePassword = lazy(() => import("./pages/login/ResetUbah"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

/* ADMIN */
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminBeranda = lazy(() => import("./pages/admin/AdminBeranda"));
const AdminKelolaMurid = lazy(() => import("./pages/admin/AdminKelolaMurid"));
const AdminKelolaGuru = lazy(() => import("./pages/admin/AdminKelolaGuru"));
const AdminKelolaKelas = lazy(() => import("./pages/admin/AdminKelolaKelas"));
const AdminKelolaJadwal = lazy(() => import("./pages/admin/AdminKelolaJadwal"));
const AdminKelolaAkun = lazy(() => import("./pages/admin/AdminKelolaAkun"));
const AdminKelolaMapel = lazy(() => import("./pages/admin/AdminKelolaMapel"));
const AdminKalender = lazy(() => import("./pages/admin/AdminKalender"));

/* ORTU */
const LayoutOrtu = lazy(() => import("./layouts/LayoutOrtu"));
const DashboardOrtu = lazy(() => import("./pages/ortu/DashboardOrtu"));
const LihatPresensi = lazy(() => import("./pages/ortu/LihatPresensi"));
const JadwalOrtu = lazy(() => import("./pages/ortu/JadwalOrtu"));

/* GURU */
const LayoutGuru = lazy(() => import("./layouts/LayoutGuru"));
const DashboardGuru = lazy(() => import("./pages/guru/DashboardGuru"));
const KelolaPresensi = lazy(() => import("./pages/guru/KelolaPresensi"));
const RiwayatPresensi = lazy(() => import("./pages/guru/RiwayatPresensi"));
const LihatJadwal = lazy(() => import("./pages/guru/LihatJadwal"));
const LihatLaporan = lazy(() => import("./pages/guru/LaporanGuru"));

function App() {
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => {
    setLoading(false);
  }, 1800);

  return () => clearTimeout(timer);
}, []);

if (loading) {
  return <SplashScreen />;
}
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
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

              <p className="text-sm text-gray-500 font-medium">
                Sedang memuat...
              </p>
            </div>
          </div>
        }
      >
        <Routes>
          {/* LOGIN */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/update-password"
            element={<UpdatePassword />}
          />

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
            <Route
              path="murid"
              element={<AdminKelolaMurid />}
            />
            <Route
              path="guru"
              element={<AdminKelolaGuru />}
            />
            <Route
              path="kelas"
              element={<AdminKelolaKelas />}
            />
            <Route
              path="jadwal"
              element={<AdminKelolaJadwal />}
            />
            <Route
              path="akun"
              element={<AdminKelolaAkun />}
            />
            <Route
              path="mapel"
              element={<AdminKelolaMapel />}
            />
            <Route
              path="kalender"
              element={<AdminKalender />}
            />
          </Route>

          {/* ORTU */}
          <Route
            path="/ortu"
            element={
              <ProtectedRoute
                allowedRoles={["ortu", "orangtua"]}
              >
                <LayoutOrtu />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOrtu />} />

            <Route
              path="lihat-presensi"
              element={<LihatPresensi />}
            />

            <Route
              path="lihat-jadwal"
              element={<JadwalOrtu />}
            />
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

            <Route
              path="presensi"
              element={<KelolaPresensi />}
            />

            <Route
              path="riwayat"
              element={<RiwayatPresensi />}
            />

            <Route
              path="jadwal"
              element={<LihatJadwal />}
            />

            <Route
              path="laporan"
              element={<LihatLaporan />}
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;