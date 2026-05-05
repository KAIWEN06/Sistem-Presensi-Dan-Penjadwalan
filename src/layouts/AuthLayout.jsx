import bg from "../assets/foto/background.png";
import logo from "../assets/foto/logo.png";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden">

  {/* Background */}
  <div
    className="absolute inset-0 bg-cover bg-center z-0 scale-105"
    style={{
      backgroundImage: `url(${bg})`,
    }}
  ></div>

  {/* Cinematic Overlay */}
  <div className="absolute inset-0 z-10
    bg-gradient-to-br from-black/70 via-black/50 to-black/70
    backdrop-blur-md">
  </div>

  {/* Soft vignette (biar fokus ke tengah) */}
  <div className="absolute inset-0 z-10 pointer-events-none
    bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.55))]">
  </div>

  {/* Card */}
  <div className="relative z-20 w-full max-w-[920px] h-[500px]
    rounded-[32px] overflow-hidden
    shadow-[0_25px_80px_rgba(0,0,0,0.55)]
    border border-white/10">

    <div className="flex flex-col md:flex-row h-full">

      {/* LEFT - FORM */}
      <div className="w-full md:w-1/2 h-full
        bg-[#F5F3EF]
        px-8 py-10 lg:px-12 lg:py-12
        flex items-center justify-center">

        <div className="w-full max-w-[360px]">
          {children}
        </div>

      </div>

      {/* Divider halus */}
      <div className="hidden md:block w-[1px] bg-white/10"></div>

      {/* RIGHT - BRANDING */}
      <div className="hidden md:flex w-full md:w-1/2 h-full
        bg-gradient-to-br from-[#4a3a33] via-[#2f2521] to-[#1b1412]
        px-8 py-10 lg:px-12 lg:py-12
        items-center justify-center text-center relative overflow-hidden">

        {/* Light top glow */}
        <div className="absolute top-0 inset-x-0 h-32
          bg-gradient-to-b from-white/10 to-transparent">
        </div>

        {/* Subtle ambient glow */}
        <div className="absolute -bottom-20 -right-20 w-72 h-72
          bg-white/5 blur-3xl rounded-full">
        </div>

        <div className="relative z-10">

          <img
            src={logo}
            alt="Logo"
            className="w-[135px] h-[135px] object-contain mx-auto mb-7
              drop-shadow-[0_10px_35px_rgba(255,255,255,0.25)]"
          />

          <h2 className="text-white/90 text-[24px] lg:text-[28px]
            font-semibold leading-[1.45] tracking-tight
            drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
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