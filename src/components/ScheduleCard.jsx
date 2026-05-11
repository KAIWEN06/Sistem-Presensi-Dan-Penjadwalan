export default function ScheduleCard({
  type,
  grade,
  day,
  subject,
  teacher,
  time,
  is_libur,
  keterangan_libur,
  jenis
}) {

  let cardStyle = "bg-white border-gray-200";
  let badgeStyle = "bg-gray-100 text-gray-600";
  let titleStyle = "text-[#715445]";
  let timeStyle = "text-gray-700";

  if (jenis === "libur") {
    cardStyle =
      "bg-red-50 border-red-300 shadow-red-100";

    badgeStyle =
      "bg-red-100 text-red-600";

    titleStyle = "text-red-600";

    timeStyle = "text-red-500";
  }

  if (jenis === "kegiatan") {
    cardStyle =
      "bg-blue-50 border-blue-300 shadow-blue-100";

    badgeStyle =
      "bg-blue-100 text-blue-600";

    titleStyle = "text-blue-700";

    timeStyle = "text-blue-600";
  }

  if (jenis === "lainnya") {
    cardStyle =
      "bg-green-50 border-green-300 shadow-green-100";

    badgeStyle =
      "bg-green-100 text-green-600";

    titleStyle = "text-green-700";

    timeStyle = "text-green-600";
  }
  

  return (
    <div
      className={`border rounded-2xl p-4 shadow-sm space-y-2 transition-all ${cardStyle}`}
    >

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <span
          className={`text-xs px-2 py-1 rounded ${badgeStyle}`}
        >
          {type}
        </span>

        <span className="text-xs text-gray-500">
          {day}
        </span>
      </div>

      {/* TITLE */}
      <h3
        className={`font-semibold text-base ${titleStyle}`}
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
        className={`text-sm font-medium ${timeStyle}`}
      >
        {time}
      </p>

      {/* LABEL LIBUR */}
{jenis && (
  <div
    className={`
      mt-2 px-2 py-1 rounded-md text-xs font-semibold
      ${
        jenis === "libur"
          ? "bg-red-100 text-red-600"
          : jenis === "kegiatan"
          ? "bg-blue-100 text-blue-600"
          : "bg-green-100 text-green-600"
      }
    `}
  >
    {jenis === "libur"
      ? "Libur"
      : jenis === "kegiatan"
      ? "Kegiatan"
      : "Agenda"}{" "}
    : {keterangan_libur}
  </div>
)}
    </div>
  );
}