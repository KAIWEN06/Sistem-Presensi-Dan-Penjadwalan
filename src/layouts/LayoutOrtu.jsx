import bg from "../assets/foto/background.png";
import logo from "../assets/foto/logo.png";

export default function AuthLayout({ children }) {
  return (
<div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden">

  {/* Background */}
  <div
    className="absolute inset-0 bg-cover bg-center z-0"
    style={{
      backgroundImage: `url(${bg})`,
    }}
  />

  {/* Overlay */}
  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10"></div>

  {/* Card */}
  <div className="relative z-20 w-full max-w-[920px] h-[500px] rounded-[32px] overflow-hidden shadow-2xl border border-white/20">

    <div className="flex flex-col md:flex-row h-full">

      {/* LEFT */}
      <div className="w-full md:w-1/2 h-full bg-[#D1D1D1] px-8 py-10 lg:px-12 lg:py-12 flex items-center justify-center">
        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden md:flex w-full md:w-1/2 h-full bg-[#362B26] px-8 py-10 lg:px-12 lg:py-12 items-center justify-center text-center relative overflow-hidden">

        {/* Top Glow */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-white/10 to-transparent" />

        <div className="relative z-10">
          <img
            src={logo}
            alt="Logo"
            className="w-[135px] h-[135px] object-contain mx-auto mb-7 drop-shadow-2xl"
          />

          <h2 className="text-white text-[24px] lg:text-[28px] font-bold leading-[1.45] tracking-tight">
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