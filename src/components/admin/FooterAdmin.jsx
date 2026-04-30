// FooterAdmin.jsx
export default function FooterAdmin() {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 px-6 md:px-12 py-5 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Sisi Kiri: Copyright */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#715445]" />
          <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-[0.1em]">
            © 2026 <span className="text-gray-600 font-bold">SD GMIM 12 MANADO</span>. All Rights Reserved.
          </p>
        </div>

        {/* Sisi Kanan: Versi & Status */}
        <div className="flex items-center gap-4">
          <div className="h-4 w-px bg-gray-200 hidden md:block" />
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Smart School Platform <span className="text-[#715445] ml-1">v1.0.0</span>
          </p>
        </div>

      </div>
    </footer>
  );
}