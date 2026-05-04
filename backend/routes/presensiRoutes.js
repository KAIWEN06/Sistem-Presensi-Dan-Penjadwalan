const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const requireAuth = require("../middleware/auth");

router.get("/:nis", requireAuth, async (req, res) => {
  try {
    const { nis } = req.params;
    const { bulan, tahun, semester, hari } = req.query;
    console.log("LOG DEBUG SD GMIM 12:");
    console.log("Param dari Frontend:", { bulan, tahun });
    console.log("Total data dari DB:", rows?.length);

    /* ================= AMBIL DATA DASAR ================= */
    const { data: rows, error } = await supabase
      .from("absensi")
      .select(
        `
        *,
        mapel (nama) 
      `
      )
      .eq("nis", nis)
      .order("tanggal", { ascending: false });

    if (error) throw error;

    let filtered = rows || [];

    /* ================= FILTER TAHUN ================= */
    if (tahun) {
      filtered = filtered.filter(r => String(r.tanggal).startsWith(tahun));
    }

    /* ================= FILTER BULAN ================= */
    if (bulan) {
      const bln = String(bulan).padStart(2, "0");

      filtered = filtered.filter(r => String(r.tanggal).slice(5, 7) === bln);
    }

    /* ================= FILTER SEMESTER ================= */
    if (semester) {
      filtered = filtered.filter(r => {
        const b = Number(String(r.tanggal).slice(5, 7));

        if (semester === "ganjil") {
          return b >= 7 && b <= 12;
        }

        if (semester === "genap") {
          return b >= 1 && b <= 6;
        }

        return true;
      });
    }

    /* ================= HARI MAP ================= */
    const hariMap = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu"
    ];

    /* ================= FILTER HARI ================= */
    if (hari) {
      filtered = filtered.filter(r => {
        const [y, m, d] = String(r.tanggal).split("-");

        const dt = new Date(Number(y), Number(m) - 1, Number(d));

        return hariMap[dt.getDay()] === hari;
      });
    }

    /* ================= STATISTIK ================= */
    const stats = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      total: 0
    };

    const chartMap = {
      Hadir: 0,
      Izin: 0,
      Sakit: 0,
      Alpha: 0
    };

    const riwayat = [];

    for (const r of filtered) {
      const status = (r.status || "").toLowerCase();

      if (status === "hadir") {
        stats.hadir++;
        chartMap.Hadir++;
      } else if (status === "izin") {
        stats.izin++;
        chartMap.Izin++;
      } else if (status === "sakit") {
        stats.sakit++;
        chartMap.Sakit++;
      } else {
        stats.alpha++;
        chartMap.Alpha++;
      }

      stats.total++;

      /* ================= NAMA MAPEL ================= */
      let namaMapel = r.mapel?.nama || "-";

      /* ================= FORMAT TANGGAL ================= */
      const [y, m, d] = String(r.tanggal).split("-");

      const dt = new Date(Number(y), Number(m) - 1, Number(d));

      riwayat.push({
        tanggal: dt.toLocaleDateString("id-ID"),
        hari: hariMap[dt.getDay()],
        jam: new Date(r.created_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        mapel: namaMapel,
        status: r.status
      });
    }

    /* ================= CHART ================= */
    const chartData = [
      {
        name: "Hadir",
        value: chartMap.Hadir
      },
      {
        name: "Izin",
        value: chartMap.Izin
      },
      {
        name: "Sakit",
        value: chartMap.Sakit
      },
      {
        name: "Alpha",
        value: chartMap.Alpha
      }
    ];

    res.json({
      stats,
      riwayat,
      chartData
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Gagal mengambil presensi"
    });
  }
});

module.exports = router;
