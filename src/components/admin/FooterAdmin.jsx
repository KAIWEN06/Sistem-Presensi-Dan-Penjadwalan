export default function FooterAdmin() {
  return (
    <footer className="bg-white border-t border-gray-100 px-4 py-2.5 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* KIRI: Branding dengan aksen garis vertikal kecil */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-3 bg-[#715445] rounded-full hidden sm:block" />
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            © 2026 <span className="text-gray-800">SD GMIM 12 MANADO</span>
          </p>
        </div>

        {/* KANAN: Status badge yang modern tapi tipis */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-md">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Active</span>
          </div>
          <p className="text-[9px] font-black text-gray-200 tracking-widest">
            V1.0
          </p>
        </div>

      </div>
    </footer>
  );
}