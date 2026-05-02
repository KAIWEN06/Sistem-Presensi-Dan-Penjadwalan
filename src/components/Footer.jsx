// FooterAdmin.jsx
export default function FooterAdmin() {
  return (
    <footer className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* KIRI: Copyright Ringkas */}
        <div className="flex items-center gap-2">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-tight">
            © 2026 <span className="text-gray-800">SD GMIM 12 MANADO</span>
          </p>
        </div>

        {/* KANAN: Versi Minimalis */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-green-500" />
          <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
            v1.0.0
          </p>
        </div>

      </div>
    </footer>
  );
}