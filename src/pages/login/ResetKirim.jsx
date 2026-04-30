import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import AuthLayout from "../../layouts/AuthLayout";
import toast from "react-hot-toast";

export default function ResetKirim() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const id =
        toast.loading(
          "Mengirim link reset..."
        );

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              "https://rpl-ashen.vercel.app/update-password",
          }
        );

      if (error) {
        toast.error(
          error.message,
          { id }
        );
        return;
      }

      toast.success(
        "Link reset berhasil dikirim ke email",
        { id }
      );
    } catch (err) {
      toast.error(
        "Terjadi kesalahan saat mengirim link"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* RESPONSIVE FIX */}
      {/* NOTE:
          Panel kanan harus dihandle di AuthLayout:
          hidden md:flex / hidden lg:flex
          File ini dibuat fokus panel kiri only
      */}

      <div
        className="
          w-full
          max-w-sm
          mx-auto
        "
      >
        {/* TITLE */}
        <h1
          className="
            text-[26px] sm:text-[30px]
            leading-tight
            font-black
            text-[#4A342B]
            tracking-tight
            text-center sm:text-left
          "
        >
          Reset Password
        </h1>

        {/* LINE */}
        <div
          className="
            w-14 h-1.5
            rounded-full
            bg-[#715445]
            mt-3 mb-4
            mx-auto sm:mx-0
          "
        />

        {/* DESC */}
        <p
          className="
            text-[13px] sm:text-sm
            text-gray-500
            leading-relaxed
            font-medium
            text-center sm:text-left
            mb-6
          "
        >
          Masukkan email Anda untuk
          menerima tautan reset
          password.
        </p>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* INPUT */}
          <div>
            <label
              className="
                block mb-2
                text-[13px]
                font-bold
                text-[#4A342B]
              "
            >
              Email
            </label>

            <div
              className="
                h-11 sm:h-12
                rounded-xl sm:rounded-2xl
                border border-gray-300
                bg-white
                px-4
                flex items-center gap-3
                transition-all duration-200
                focus-within:border-[#715445]
                focus-within:ring-4
                focus-within:ring-[#715445]/10
              "
            >
              <Mail
                size={17}
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
                placeholder="Masukkan Email"
                className="
                  w-full
                  bg-transparent
                  outline-none
                  text-sm
                  placeholder:text-gray-400
                "
              />
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full h-11 sm:h-12
              rounded-xl sm:rounded-2xl
              bg-[#715445]
              hover:bg-[#5c4337]
              text-white
              text-sm font-black
              shadow-md shadow-[#715445]/20
              transition-all duration-200
              active:scale-[0.98]
              disabled:opacity-70
              disabled:cursor-not-allowed
            "
          >
            {loading
              ? "Mengirim..."
              : "Kirim Link"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-gray-200" />

          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Atau
          </span>

          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* BACK */}
        <Link
          to="/login"
          className="
            h-10 sm:h-11
            w-full
            rounded-xl sm:rounded-2xl
            border border-gray-300
            bg-white/80
            text-sm font-bold
            text-gray-600
            hover:text-[#715445]
            hover:border-[#715445]/20
            transition-all duration-200
            active:scale-[0.98]
            flex items-center justify-center gap-2
          "
        >
          <ArrowLeft size={15} />
          Kembali ke Login
        </Link>
      </div>
    </AuthLayout>
  );
}