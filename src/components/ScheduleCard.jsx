export default function ScheduleCard({
  type,
  grade,
  day,
  subject,
  teacher,
  time,
  is_libur,
  keterangan_libur
}) {
  return (
    <div
      className={`border rounded-2xl p-4 shadow-sm space-y-2 transition-all ${
        is_libur
          ? "bg-red-50 border-red-300 shadow-red-100"
          : "bg-white border-gray-200"
      }`}
    >

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <span
          className={`text-xs px-2 py-1 rounded ${
            is_libur
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {type}
        </span>

        <span className="text-xs text-gray-500">
          {day}
        </span>
      </div>

      {/* TITLE */}
      <h3
        className={`font-semibold text-base ${
          is_libur ? "text-red-600" : "text-[#715445]"
        }`}
      >
        {subject}
      </h3>

      {/* INFO */}
      <p className="text-sm text-gray-600">
        {grade}
      </p>

      <p className="text-sm text-gray-500">
        {teacher}
      </p>

      <p
        className={`text-sm font-medium ${
          is_libur ? "text-red-500" : "text-gray-700"
        }`}
      >
        {time}
      </p>

      {/* 🔥 LABEL LIBUR */}
      {is_libur && (
        <div className="mt-2 px-2 py-1 rounded-md bg-red-100 text-red-600 text-xs font-semibold">
          Libur: {keterangan_libur}
        </div>
      )}
    </div>
  );
}