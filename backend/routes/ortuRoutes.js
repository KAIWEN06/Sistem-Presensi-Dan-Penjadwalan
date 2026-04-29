const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const requireAuth = require("../middleware/auth");


const {
  todayManado,
  timeManado,
  dayNameManado,
} = require("../utils/timezone");

/* ===================================================
   GET DATA ANAK ORTU LOGIN
=================================================== */
router.get("/anak", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ortu_anak")
      .select(`
        nis,
        murid (
          nis,
          nama
        )
      `)
      .eq("ortu_id", req.user.id);

    if (error) throw error;

    const hasil = await Promise.all(
      (data || []).map(async (item) => {
        const { data: kelasData } = await supabase
          .from("kelas_siswa")
          .select(`
            kelas,
            kelas_ref:kelas (
              nama
            )
          `)
          .eq("nis", item.nis)
          .eq("status", "aktif")
          .limit(1)
          .maybeSingle();

        return {
          nis: item.nis,
          nama: item.murid?.nama || "-",
          kelas: kelasData?.kelas_ref?.nama
            ? `Kelas ${kelasData.kelas_ref.nama}`
            : "-",
        };
      })
    );

    res.json(hasil);
  } catch (err) {
    res.status(500).json({
      error: "Gagal mengambil data anak",
    });
  }
});

/* ===================================================
   DASHBOARD ORTU
=================================================== */
router.get("/dashboard/:nis", requireAuth, async (req, res) => {
  try {
    const { nis } = req.params;

    const today = todayManado();
    const hariIni = dayNameManado();
    const awalBulan = `${today.slice(0, 8)}01`;

    /* kelas aktif */
    const { data: kelasRows, error: errKelas } =
      await supabase
      .from("kelas_siswa")
      .select("kelas,tahun_id")
      .eq("nis", nis)
      .eq("status", "aktif")
      .order("id", { ascending: false })
      .limit(1);

    if (errKelas) throw errKelas;

    const kelasAktif =
      kelasRows?.length > 0
        ? kelasRows[0].kelas
        : null;

    // FIX: tahunAktif sebelumnya tidak dideklarasikan di sini
    const tahunAktif =
      kelasRows?.length > 0
        ? kelasRows[0].tahun_id
        : null;

    if (!kelasAktif) {
      return res.json({
        hariIni: [],
        ringkasan: {
          Hadir: 0,
          Izin: 0,
          Sakit: 0,
          Alpha: 0,
        },
        updateTerakhir: "-",
      });
    }

    const selectFields = `
      id_jadwal, mulai, selesai, jenis, tanggal, hari,
      mapel ( nama ),
      guru_pengajar:id_guru ( nama )
    `;

    /* jadwal pelajaran hari ini */
    const { data: pelajaranHari, error: errPel } =
      await supabase
        .from("jadwal")
        .select(selectFields)
        .eq("kelas", kelasAktif)
        .eq("tahun_id", tahunAktif)
        .eq("jenis", "pelajaran")
        .eq("hari", hariIni)
        .eq("status", "aktif")
        .order("mulai");

    if (errPel) throw errPel;

    /* jadwal ujian hari ini */
    const { data: ujianHari, error: errUj } =
      await supabase
        .from("jadwal")
        .select(selectFields)
        .eq("kelas", kelasAktif)
        .eq("status", "aktif")
        .eq("jenis", "ujian")
        .eq("tanggal", today);

    if (errUj) throw errUj;

    const jadwalHari = [
      ...(pelajaranHari || []),
      ...(ujianHari || []),
    ].sort((a, b) =>
      String(a.mulai).localeCompare(
        String(b.mulai)
      )
    );

    /* absensi hari ini */
    const { data: absenHari, error: errAbsen } =
      await supabase
        .from("absensi")
        .select("*")
        .eq("nis", nis)
        .eq("tanggal", today);

    if (errAbsen) throw errAbsen;

    /* ringkasan bulan ini */
    const { data: bulanIni, error: errBulan } =
      await supabase
        .from("absensi")
        .select("status")
        .eq("nis", nis)
        .gte("tanggal", awalBulan);

    if (errBulan) throw errBulan;

    const ringkasan = {
      Hadir: 0,
      Izin: 0,
      Sakit: 0,
      Alpha: 0,
    };

    (bulanIni || []).forEach((x) => {
      const s = (x.status || "").toLowerCase();
      if (s === "hadir") ringkasan.Hadir++;
      else if (s === "izin") ringkasan.Izin++;
      else if (s === "sakit") ringkasan.Sakit++;
      else ringkasan.Alpha++;
    });

    /* update terakhir */
    let updateTerakhir = "-";

    if (absenHari?.length > 0) {
      const sorted = [...absenHari].sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      updateTerakhir =
        timeManado(sorted[0].created_at) + " WITA";
    }

    /* susun hasil — gunakan data join, tidak perlu loop query lagi */
    const hasil = jadwalHari.map((j) => {
      const absen = (absenHari || []).find(
        (a) => a.id_jadwal === j.id_jadwal
      );

      return {
        mapel: j.mapel?.nama || "-",
        guru: j.guru_pengajar?.nama || "-",
        jam: `${String(j.mulai).slice(0, 5)} - ${String(j.selesai).slice(0, 5)}`,
        status: absen?.status || "Belum",
      };
    });

    res.json({
      hariIni: hasil,
      ringkasan,
      updateTerakhir,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   JADWAL ORTU
=================================================== */
router.get("/jadwal/:nis", requireAuth, async (req, res) => {
  try {
    const { nis } = req.params;

    /* ===============================
       AMBIL KELAS AKTIF SISWA
    =============================== */
    const { data: kelasRows, error: errKelas } =
      await supabase
        .from("kelas_siswa")
        .select("kelas,tahun_id")
        .eq("nis", nis)
        .eq("status", "aktif")
        .order("id", { ascending: false })
        .limit(1);

    if (errKelas) throw errKelas;

    const kelasAktif =
      kelasRows?.length > 0
        ? kelasRows[0].kelas
        : null;

    const tahunAktif =
      kelasRows?.length > 0
        ? kelasRows[0].tahun_id
        : null;

    if (!kelasAktif) {
      return res.json({
        pelajaran: {},
        ujian: [],
      });
    }

    /* ===============================
       AMBIL DATA JADWAL TANPA JOIN
    =============================== */
    const { data: rows, error } =
      await supabase
        .from("jadwal")
        .select(`
          id_jadwal,
          hari,
          mulai,
          selesai,
          jenis,
          tanggal,
          id_mapel,
          id_guru,
          status,
          tahun_id
        `)
        .eq("kelas", kelasAktif)
        .eq("status", "aktif")
        .order("tanggal", { ascending: true })
        .order("mulai", { ascending: true });

    if (error) throw error;

    console.log("[JADWAL] kelas:", kelasAktif);
    console.log("[JADWAL] tahun:", tahunAktif);
    console.log("[JADWAL] total rows:", rows?.length);

      /* ===============================
        INIT DATA
      =============================== */
      const hariList = [
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
      ];

      const pelajaran = {};
      const ujian = [];

      hariList.forEach((h) => {
        pelajaran[h] = [];
      });

    /* ===============================
       LOOP DATA
    =============================== */
    for (const j of rows || []) {
      let namaMapel = "-";
      let namaGuru = "-";

      /* MAPEL */
      const { data: mapel } =
        await supabase
          .from("mapel")
          .select("nama")
          .eq("id_mapel", j.id_mapel)
          .limit(1);

      if (mapel?.length > 0) {
        namaMapel = mapel[0].nama;
      }

      /* GURU */
      const { data: guru } =
        await supabase
          .from("guru")
          .select("nama")
          .eq("id_guru", j.id_guru)
          .limit(1);

      if (guru?.length > 0) {
        namaGuru = guru[0].nama;
      }

      const item = {
        jam: `${String(j.mulai).slice(0, 5)} - ${String(j.selesai).slice(0, 5)}`,
        mapel: namaMapel,
        guru: namaGuru,
      };

      const jenis =
        String(j.jenis || "")
          .trim()
          .toLowerCase();

      /* ===============================
         UJIAN
      =============================== */
      if (
        jenis.includes("ujian")
      ) {
        ujian.push({
          tanggal: j.tanggal,
          jam: item.jam,
          mapel: item.mapel,
          guru: item.guru,
        });

        continue;
      }

      /* ===============================
         PELAJARAN (TAHUN AKTIF)
      =============================== */
      if (
        jenis === "pelajaran" &&
        String(j.tahun_id) ===
          String(tahunAktif)
      ) {
        if (
          j.hari &&
          pelajaran[j.hari]
        ) {
          pelajaran[j.hari].push(item);
        }
      }
    }

    console.log("[JADWAL] ujian:", ujian.length);

    /* ===============================
       RESPONSE
    =============================== */
    res.json({
      pelajaran,
      ujian,
    });

  } catch (err) {
    console.error(
      "[JADWAL ERROR]",
      err.message
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   TEST ROUTE
=================================================== */
router.get("/", (req, res) => {
  res.json({
    message: "ortu aktif",
  });
});

module.exports = router;