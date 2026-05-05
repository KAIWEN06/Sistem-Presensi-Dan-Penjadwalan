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
  />

  {/* Base overlay (ringan, jangan gelap) */}
  <div className="absolute inset-0 bg-black/15 backdrop-blur-[1.5px] z-10" />

  {/* Golden sunlight (utama) */}
  <div className="absolute inset-0 z-10 pointer-events-none
    bg-[radial-gradient(circle_at_20%_25%,rgba(255,200,120,0.45),transparent_60%)]">
  </div>

  {/* Warm ambient tone */}
  <div className="absolute inset-0 z-10 pointer-events-none
    bg-gradient-to-br from-[#ffedd5]/20 via-transparent to-[#fde68a]/20">
  </div>

  {/* Exposure lift (biar gak kusam) */}
  <div className="absolute inset-0 z-10 pointer-events-none bg-white/10" />

  {/* Card */}
  <div className="relative z-20 w-full max-w-[920px] h-[500px]
    rounded-[32px] overflow-hidden
    shadow-[0_25px_80px_rgba(0,0,0,0.25)]
    border border-white/20">

    <div className="flex flex-col md:flex-row h-full">

      {/* LEFT - FORM */}
      <div className="w-full md:w-1/2 h-full
        bg-[#FAF7F2]
        px-8 py-10 lg:px-12 lg:py-12
        flex items-center justify-center">

        <div className="w-full max-w-[360px]">
          {children}
        </div>

      </div>

      {/* Divider halus */}
      <div className="hidden md:block w-[1px] bg-black/5"></div>

      {/* RIGHT - BRANDING */}
      <div className="hidden md:flex w-full md:w-1/2 h-full
        bg-gradient-to-br from-[#6b4f3f] via-[#4a372c] to-[#2a1f1a]
        px-8 py-10 lg:px-12 lg:py-12
        items-center justify-center text-center relative overflow-hidden">

        {/* Golden top glow */}
        <div className="absolute top-0 inset-x-0 h-32
          bg-gradient-to-b from-[#fde68a]/30 to-transparent">
        </div>

        {/* Soft warm glow */}
        <div className="absolute -top-10 -left-10 w-60 h-60
          bg-[#fcd34d]/20 blur-3xl rounded-full">
        </div>

        <div className="relative z-10">

          <img
            src={logo}
            alt="Logo"
            className="w-[135px] h-[135px] object-contain mx-auto mb-7
              drop-shadow-[0_8px_25px_rgba(255,220,150,0.4)]"
          />

          <h2 className="text-white text-[24px] lg:text-[28px]
            font-semibold leading-[1.45] tracking-tight
            drop-shadow-[0_3px_15px_rgba(0,0,0,0.4)]">
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