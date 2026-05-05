import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import AuthLayout from "../../layouts/AuthLayout";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();

  // SAFE LOGIN FUNCTION PRESERVED
  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const id =
        toast.loading(
          "Memverifikasi akun..."
        );

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        toast.error(
          error.message,
          { id }
        );
        return;
      }

      const userId =
        data.user.id;

      localStorage.setItem(
        "token",
        data.session.access_token
      );

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (
        profileError ||
        !profile
      ) {
        toast.error(
          "Profil user tidak ditemukan",
          { id }
        );
        return;
      }

      if (
        profile.status !==
        "aktif"
      ) {
        toast.error(
          "Akun Anda tidak aktif",
          { id }
        );
        return;
      }

const role = profile.role.toLowerCase().trim();
localStorage.setItem("role", role);


      localStorage.setItem(
        "nama",
        profile.nama || ""
      );
      localStorage.setItem(
        "user_id",
        profile.id
      );

      const harusGanti =
        data.user?.user_metadata
          ?.harus_ganti_password;

      if (harusGanti) {
        toast.success(
          "Silakan ubah password",
          { id }
        );
        navigate(
          "/update-password"
        );
        return;
      }

      toast.success(
        "Login berhasil",
        { id }
      );

      if (
        profile.role ===
        "admin"
      ) {
        navigate("/admin");
      } else if (
        profile.role ===
        "guru"
      ) {
        navigate("/guru");
      } else if (
        profile.role ===
          "ortu" ||
        profile.role ===
          "orangtua"
      ) {
        navigate("/ortu");
      } else {
        toast.error(
          "Role akun tidak dikenali",
          { id }
        );
      }
    } catch (err) {
      toast.error(
        "Terjadi kesalahan saat login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* PREMIUM LOGIN UI */}
      <div className="w-full">
  
        {/* TITLE */}
        <h1 className="text-3xl sm:text-4xl font-black text-[#4A342B] tracking-tight text-center sm:text-left">
          Selamat Datang!
        </h1>

        <div className="w-16 sm:w-20 h-1.5 bg-[#715445] rounded-full mt-3 mb-5 mx-auto sm:mx-0" />

        <p className="text-sm sm:text-[15px] text-gray-500 leading-relaxed font-medium mb-8 text-center sm:text-left">
          Masuk ke sistem presensi dan penjadwalan
        </p>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* EMAIL */}
          <div>
            <label className="block mb-2 text-sm font-bold text-[#4A342B]">
              Email
            </label>

            <div
              className="
                h-12 rounded-2xl
                border border-gray-200
                bg-white
                px-4
                flex items-center gap-3
                transition-all
                focus-within:border-[#715445]
                focus-within:ring-4
                focus-within:ring-[#715445]/10
              "
            >
              <User
                size={18}
                className="text-gray-400 shrink-0"
              />

              <input
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="Masukkan Email Anda"
                className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block mb-2 text-sm font-bold text-[#4A342B]">
              Password
            </label>

            <div
              className="
                h-12 rounded-2xl
                border border-gray-200
                bg-white
                px-4
                flex items-center gap-3
                transition-all
                focus-within:border-[#715445]
                focus-within:ring-4
                focus-within:ring-[#715445]/10
              "
            >
              <Lock
                size={18}
                className="text-gray-400 shrink-0"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                required
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Masukkan Password Anda"
                className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
              >
                {showPassword ? (
                  <Eye size={18} />
                ) : (
                  <EyeOff size={18} />
                )}
              </button>
            </div>
          </div>

          {/* LINK */}
          <div className="flex justify-end">
            <Link
              to="/reset-password"
              className="text-sm font-semibold text-gray-500 hover:text-[#715445] transition-colors"
            >
              Lupa Password?
            </Link>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full h-12
              rounded-2xl
              bg-[#715445]
              hover:bg-[#5c4337]
              text-white
              text-sm sm:text-base
              font-black
              shadow-lg shadow-[#715445]/20
              transition-all
              active:scale-[0.98]
              disabled:opacity-70
              disabled:cursor-not-allowed
            "
          >
            {loading
              ? "Memproses..."
              : "Masuk"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}