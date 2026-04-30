// FooterAdmin.jsx
export default function FooterAdmin() {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-6 md:py-4 shrink-0 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        
        {/* SISI KIRI: Branding & Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 order-2 md:order-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#715445] animate-pulse" />
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-700 uppercase tracking-widest">
              SD GMIM 12 MANADO
            </p>
          </div>
          
          <span className="hidden md:block text-gray-300">|</span>
          
          <p className="text-[10px] sm:text-[11px] font-medium text-gray-400">
            © 2026 Semua Hak Dilindungi.
          </p>
        </div>

        {/* SISI KANAN: Versi & Status */}
        <div className="flex items-center order-1 md:order-2 bg-gray-50 md:bg-transparent px-4 py-2 md:p-0 rounded-full border border-gray-100 md:border-none">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Sistem v1.0.0 <span className="text-[#715445] hidden sm:inline ml-1">• PRO</span>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}