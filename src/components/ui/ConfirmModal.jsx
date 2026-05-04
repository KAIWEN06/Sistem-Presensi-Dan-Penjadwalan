export default function ConfirmModal({
  open,
  title,
  desc,
  onConfirm,
  onClose,
  confirmText = "Ya",
  cancelText = "Batal",
  danger = false,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-80">
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-gray-500 mt-2">{desc}</p>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-200"
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-3 py-1 rounded text-white ${
              danger ? "bg-red-500" : "bg-[#715445]"
            }`}
          >
            {loading ? "Loading..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}