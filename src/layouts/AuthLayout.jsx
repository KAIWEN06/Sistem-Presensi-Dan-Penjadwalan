import bg from "../assets/foto/background.png";
import logo from "../assets/foto/logo.png";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 pointer-events-none"
        style={{
          backgroundImage: `url(${bg})`,
        }}
      />

      {/* Overlay ringan (tidak gelap & tidak block klik) */}
      <div className="absolute inset-0 z-10 bg-black/15 backdrop-blur-[1px] pointer-events-none" />

      {/* Card */}
      <div
        className="
          relative z-20 w-full max-w-[920px] h-[500px]
          rounded-[32px] overflow-hidden
          border border-white/20
          bg-white/5 backdrop-blur-[6px]
          shadow-[0_20px_60px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.4)]
        "
        style={{
          animation: "fadeScale 0.4s ease-out",
        }}
      >
        <div className="flex flex-col md:flex-row h-full">

          {/* LEFT */}
          <div className="w-full md:w-1/2 h-full
            bg-gradient-to-b from-[#F8F6F2] to-[#EFEAE4]
            px-8 py-10 lg:px-12 lg:py-12
            flex items-center justify-center">

            <div className="w-full max-w-[360px] space-y-4">
              {children}
            </div>

          </div>

          {/* Divider */}
          <div className="hidden md:block w-[1px] bg-black/10"></div>

          {/* RIGHT */}
          <div className="hidden md:flex w-full md:w-1/2 h-full
            bg-gradient-to-br from-[#5a463d] via-[#3a2d27] to-[#221917]
            px-8 py-10 lg:px-12 lg:py-12
            items-center justify-center text-center relative overflow-hidden">

            {/* Glow halus */}
            <div className="absolute -top-10 -right-10 w-60 h-60
              bg-[#ffd89b]/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">

              <img
                src={logo}
                alt="Logo"
                className="w-[135px] h-[135px] object-contain mx-auto mb-7
                drop-shadow-[0_10px_30px_rgba(255,255,255,0.25)]"
              />

              <h2 className="text-white/90 text-[24px] lg:text-[28px]
                font-semibold leading-[1.45] tracking-tight
                drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                Sistem Presensi dan
                <br />
                Penjadwalan SD GMIM 12
              </h2>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}