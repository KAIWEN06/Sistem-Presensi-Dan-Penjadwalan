const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const requireAuth = require("../middleware/auth");

const {
  todayManado,
  dayNameManado,
  timeManado,
} = require("../utils/timezone");

function capitalize(text = "") {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ======================================
   AMBIL DATA GURU LOGIN
====================================== */
async function getGuruLogin(userId) {
  const { data, error } =
    await supabase
      .from("guru")
      .select("*")
      .eq("user_id", userId)
      .single();

  if (error || !data) {
    throw new Error("Guru tidak ditemukan");
  }

  return data;
}

/* ======================================
   FILTER TANGGAL
====================================== */
async function applyFilter(dbQuery, mode, nilai, reqQuery) {
  if (!mode || !nilai) return dbQuery;

  /* HARI */
  if (mode === "hari") {
    return dbQuery.eq("tanggal", nilai);
  }

  /* BULAN */
  if (mode === "bulan") {
    let tahun = Number(todayManado().slice(0, 4));
    
    if (reqQuery && reqQuery.tahun_id) {
       const [tAwal, tAkhir] = reqQuery.tahun_id.split("/");
       if (tAwal && tAkhir) {
          const m = Number(nilai); // 1-12
          tahun = (m >= 7) ? Number(tAwal) : Number(tAkhir);
       }
    }

    const awal = `${tahun}-${nilai}-01`;

    const lastDay = new Date(
      tahun,
      Number(nilai),
      0
    ).getDate();

    const akhir =
      `${tahun}-${nilai}-${String(lastDay).padStart(2, "0")}`;

    return dbQuery
      .gte("tanggal", awal)
      .lte("tanggal", akhir);
  }

  /* SEMESTER */
  if (mode === "semester") {
    const { data: sem, error } = await supabase
      .from("semester")
      .select("tanggal_mulai,tanggal_selesai")
      .eq("id", nilai)
      .single();

    if (!error && sem) {
      return dbQuery
        .gte("tanggal", sem.tanggal_mulai)
        .lte("tanggal", sem.tanggal_selesai);
    }
  }

  return dbQuery;
}

/* ======================================
   FILTER PENGAJAR
====================================== */
router.get("/laporan/pengajar/filter", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);

    const { data, error } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("status", "aktif")
      .eq("jenis", "pelajaran")
      .order("kelas", { ascending: true });

    if (error) throw error;

    const hasil = (data || []).map((x) => ({
      id: x.id_jadwal,
      label: `${x.mapel?.nama || "-"} - Kelas ${x.kelas}`,
    }));

    res.json(hasil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   LAPORAN PENGAJAR
====================================== */
router.get("/laporan/pengajar", requireAuth, async (req, res) => {
  try {
    const { jadwal, mode, nilai } = req.query;

    if (!jadwal) {
      return res.status(400).json({
        error: "jadwal wajib dipilih",
      });
    }

    let query = supabase
      .from("absensi")
      .select("nis,kelas,status,tanggal")
      .eq("id_jadwal", jadwal);

    query = await applyFilter(query, mode, nilai, req.query);

    const { data, error } = await query;

    if (error) throw error;

    const nisList = [...new Set((data || []).map((x) => x.nis))];

    const { data: murid } = await supabase
      .from("murid")
      .select("nis,nama")
      .in("nis", nisList);

    const namaMap = {};

    (murid || []).forEach((m) => {
      namaMap[m.nis] = m.nama;
    });

    const hasil = {};

    (data || []).forEach((x) => {
      if (!hasil[x.nis]) {
        hasil[x.nis] = {
          nama: namaMap[x.nis] || x.nis,
          kelas: x.kelas,
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpha: 0,
        };
      }

      const st = x.status?.toLowerCase();

      if (st === "hadir") hasil[x.nis].hadir++;
      else if (st === "sakit") hasil[x.nis].sakit++;
      else if (st === "izin") hasil[x.nis].izin++;
      else hasil[x.nis].alpha++;
    });

    res.json(Object.values(hasil));
  } catch (err) {
    console.log("ERROR PENGAJAR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   FILTER WALI KELAS
====================================== */
router.get("/laporan/wali/filter", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);

    const { data, error } = await supabase
      .from("kelas")
      .select("id,nama")
      .eq("wali_kelas_id", guru.id_guru)
      .eq("status", "aktif")
      .order("nama", { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   LAPORAN WALI KELAS
====================================== */
router.get("/laporan/wali", requireAuth, async (req, res) => {
  try {
    const { kelas, mode, nilai } = req.query;

    if (!kelas) {
      return res.status(400).json({
        error: "kelas wajib dipilih",
      });
    }

    /* ===============================
       AMBIL DATA KELAS
    =============================== */
    const { data: kelasData, error: kelasErr } = await supabase
      .from("kelas")
      .select("id,nama")
      .eq("id", kelas)
      .single();

    if (kelasErr || !kelasData) {
      return res.json([]);
    }

    /* ===============================
       AMBIL SEMUA SISWA DI KELAS
    =============================== */
    const { data: siswa, error: siswaErr } = await supabase
      .from("kelas_siswa")
      .select(`
        nis,
        murid:nis(nama)
      `)
      .eq("kelas", kelasData.nama)
      .eq("status", "aktif");

    if (siswaErr) throw siswaErr;

    const hasil = {};

    (siswa || []).forEach((x) => {
      hasil[x.nis] = {
        nama: x.murid?.nama || x.nis,
        kelas: kelasData.nama,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0,
      };
    });

    /* ===============================
       AMBIL ABSENSI
    =============================== */
    let query = supabase
      .from("absensi")
      .select("nis,status,tanggal")
      .eq("kelas", kelasData.nama);

    query = await applyFilter(query, mode, nilai, req.query);

    const { data: absensi, error: absErr } = await query;

    if (absErr) throw absErr;

    (absensi || []).forEach((x) => {
      if (!hasil[x.nis]) return;

      const st = x.status?.toLowerCase();

      if (st === "hadir") hasil[x.nis].hadir++;
      else if (st === "sakit") hasil[x.nis].sakit++;
      else if (st === "izin") hasil[x.nis].izin++;
      else hasil[x.nis].alpha++;
    });

    const rows = Object.values(hasil).sort((a, b) =>
      a.nama.localeCompare(b.nama)
    );

    res.json(rows);
  } catch (err) {
    console.log("ERROR WALI:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   LIST TAHUN AJARAN
====================================== */
router.get("/tahun/list", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tahun_ajaran")
      .select("id,aktif")
      .order("id", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   LIST SEMESTER BY TAHUN
====================================== */
router.get("/semester/list", requireAuth, async (req, res) => {
  try {
    const { tahun_id } = req.query;

    let query = supabase
      .from("semester")
      .select("id,nama,aktif,tahun_id")
      .order("tanggal_mulai", { ascending: true });

    if (tahun_id) {
      query = query.eq("tahun_id", tahun_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.log("SEMESTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   DASHBOARD
====================================== */
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);

    const today = todayManado();

    const localTomorrow = new Date(`${today}T12:00:00`);
    localTomorrow.setDate(localTomorrow.getDate() + 1);

    const tomorrow = todayManado(localTomorrow);

    const hariIniStr = capitalize(dayNameManado());
    const besokStr = capitalize(dayNameManado(localTomorrow));

    /* ==========================
       TAHUN AJARAN AKTIF
    ========================== */
    const {
      data: tahunAktif,
      error: errTahun,
    } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    /* ==========================
       HARI INI - PELAJARAN
    ========================== */
    const {
      data: pelajaranHariIni,
      error: err1,
    } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        id_mapel,
        mulai,
        selesai,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("jenis", "pelajaran")
      .eq("hari", hariIniStr)
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", {
        ascending: true,
      });

    if (err1) throw err1;

    /* ==========================
       HARI INI - UJIAN
    ========================== */
    const {
      data: ujianHariIni,
      error: err2,
    } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        id_mapel,
        mulai,
        selesai,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("jenis", "ujian")
      .eq("tanggal", today)
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", {
        ascending: true,
      });

    if (err2) throw err2;

    /* ==========================
       BESOK - PELAJARAN
    ========================== */
    const {
      data: pelajaranBesok,
      error: err3,
    } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        id_mapel,
        mulai,
        selesai,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("jenis", "pelajaran")
      .eq("hari", besokStr)
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", {
        ascending: true,
      });

    if (err3) throw err3;

    /* ==========================
       BESOK - UJIAN
    ========================== */
    const {
      data: ujianBesok,
      error: err4,
    } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        id_mapel,
        mulai,
        selesai,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("jenis", "ujian")
      .eq("tanggal", tomorrow)
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", {
        ascending: true,
      });

    if (err4) throw err4;

    const semuaHariIni = [
      ...(pelajaranHariIni || []),
      ...(ujianHariIni || []),
    ];

    const semuaBesok = [
      ...(pelajaranBesok || []),
      ...(ujianBesok || []),
    ];

    let totalSiswa = 0;
    let sudahPresensi = 0;
    let belumPresensi = 0;

    const jadwalHariIniFormatted = [];

    for (const j of semuaHariIni) {
      const { count } =
        await supabase
          .from("kelas_siswa")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("kelas", j.kelas)
          .eq("status", "aktif");

      const {
        data: cekAbsen,
      } = await supabase
        .from("absensi")
        .select("id")
        .eq("id_jadwal", j.id_jadwal)
        .eq("tanggal", today)
        .limit(1);

      let stat = "belum";

      if (
        cekAbsen &&
        cekAbsen.length > 0
      ) {
        stat = "sudah";
        sudahPresensi++;
      } else {
        belumPresensi++;
      }

      totalSiswa += count || 0;

      jadwalHariIniFormatted.push({
        id_jadwal: j.id_jadwal,
        kelas_id: j.kelas,
        id_mapel: j.id_mapel,

        jam: `${String(
          j.mulai
        ).slice(0, 5)} - ${String(
          j.selesai
        ).slice(0, 5)}`,

        kelas: `Kelas ${j.kelas} - ${
          j.mapel?.nama || "-"
        }`,

        status: stat,
      });
    }

    const jadwalBesokFormatted =
      semuaBesok.map((j) => ({
        id_jadwal: j.id_jadwal,

        jam: `${String(
          j.mulai
        ).slice(0, 5)} - ${String(
          j.selesai
        ).slice(0, 5)}`,

        kelas: `Kelas ${j.kelas} - ${
          j.mapel?.nama || "-"
        }`,
      }));

    res.json({
      jadwalHariIni:
        jadwalHariIniFormatted,

      jadwalBesok:
        jadwalBesokFormatted,

      totalSiswa,
      totalMengajar:
        semuaHariIni.length,

      sudahPresensi,
      belumPresensi,
    });
  } catch (err) {
    console.log(
      "DASHBOARD ERROR:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

/* ======================================
   KELAS AJAR (untuk kelola presensi)
====================================== */
router.get("/kelas-ajar", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);
    const { tanggal } = req.query;

    if (!tanggal) {
      return res.status(400).json({
        error: "Tanggal diperlukan",
      });
    }

    /* ==========================
       TAHUN AJARAN AKTIF
    ========================== */
    const {
      data: tahunAktif,
      error: errTahun,
    } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    const hariStr =
      capitalize(
        dayNameManado(tanggal)
      );

    /* ==========================
       JADWAL PELAJARAN
       SAMA SEPERTI KELOLA ADMIN
    ========================== */
    const {
      data: pelajaran,
      error: err1,
    } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        mulai,
        selesai,
        id_mapel,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("jenis", "pelajaran")
      .eq("hari", hariStr)
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id);

    if (err1) throw err1;

    /* ==========================
       JADWAL UJIAN
       SAMA SEPERTI KELOLA ADMIN
    ========================== */
    const {
      data: ujian,
      error: err2,
    } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        mulai,
        selesai,
        id_mapel,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("jenis", "ujian")
      .eq("tanggal", tanggal)
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id);

    if (err2) throw err2;

    /* ==========================
       GABUNGKAN + SORT
    ========================== */
    const semua = [
      ...(pelajaran || []),
      ...(ujian || []),
    ];

    semua.sort((a, b) =>
      String(a.mulai).localeCompare(
        String(b.mulai)
      )
    );

    const today = todayManado();

    /* ==========================
       FORMAT + STATUS PRESENSI
    ========================== */
    const hasil = [];

    for (const j of semua) {
      const {
        data: cekAbsen,
      } = await supabase
        .from("absensi")
        .select("id")
        .eq("id_jadwal", j.id_jadwal)
        .eq("tanggal", tanggal)
        .limit(1);

      let statusPresensi =
        "belum";

      if (
        cekAbsen &&
        cekAbsen.length > 0
      ) {
        statusPresensi =
          "sudah";
      } else if (
        tanggal < today
      ) {
        statusPresensi =
          "terlambat";
      }

      hasil.push({
        id_jadwal: j.id_jadwal,
        kelas_id: j.kelas,
        id_mapel: j.id_mapel,

        waktu: `${String(
          j.mulai
        ).slice(0, 5)} - ${String(
          j.selesai
        ).slice(0, 5)}`,

        kelas: `Kelas ${j.kelas} - ${
          j.mapel?.nama || "-"
        }`,

        status_presensi:
          statusPresensi,
      });
    }

    res.json(hasil);

  } catch (err) {
    console.log(
      "KELAS AJAR ERROR:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/presensi-tertunda", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);

      const now = new Date();
      const today = todayManado();

    const hasil = [];

    /* cek 7 hari ke belakang */
    for (let i = 1; i <= 7; i++) {
      const dt = new Date(
        now.getTime() - i * 86400000
      );

      const tanggal = todayManado(dt);
      const hariStr = capitalize(dayNameManado(dt));

      /* pelajaran */
      const { data: pelajaran } =
        await supabase
          .from("jadwal")
          .select(`
            id_jadwal,
            kelas,
            mulai,
            selesai,
            id_mapel,
            mapel:id_mapel(nama)
          `)
          .eq("id_guru", guru.id_guru)
          .eq("jenis", "pelajaran")
          .eq("hari", hariStr)
          .eq("status", "aktif");

      /* ujian */
      const { data: ujian } =
        await supabase
          .from("jadwal")
          .select(`
            id_jadwal,
            kelas,
            mulai,
            selesai,
            id_mapel,
            mapel:id_mapel(nama)
          `)
          .eq("id_guru", guru.id_guru)
          .eq("jenis", "ujian")
          .eq("tanggal", tanggal)
          .eq("status", "aktif");

      const semua = [
        ...(pelajaran || []),
        ...(ujian || []),
      ];

      for (const j of semua) {
        const { data: cek } =
          await supabase
            .from("absensi")
            .select("id")
            .eq("id_jadwal", j.id_jadwal)
            .eq("tanggal", tanggal)
            .limit(1);

        if (!cek || cek.length === 0) {
          hasil.push({
            tanggal,
            id_jadwal: j.id_jadwal,
            kelas_id: j.kelas,
            id_mapel: j.id_mapel,
            waktu: `${String(
              j.mulai
            ).slice(0,5)} - ${String(
              j.selesai
            ).slice(0,5)}`,
            kelas: `Kelas ${j.kelas} - ${
              j.mapel?.nama || "-"
            }`,
          });
        }
      }
    }

    hasil.sort((a, b) =>
      b.tanggal.localeCompare(a.tanggal)
    );

    res.json(hasil);

  } catch (err) {
    console.log(
      "TERTUNDA ERROR:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});
/* ======================================
   SISWA KELAS (untuk kelola presensi)
====================================== */
router.get("/siswa-kelas/:id_jadwal", requireAuth, async (req, res) => {
  try {
    const { id_jadwal } = req.params;
    const { tanggal } = req.query;

    const { data: jadwal } = await supabase.from("jadwal").select("kelas").eq("id_jadwal", id_jadwal).single();
    if (!jadwal) return res.status(404).json({ error: "Jadwal tidak ditemukan" });

    const { data: kelasSiswa } = await supabase
      .from("kelas_siswa")
      .select(`
        nis,
        kelas,
        murid:nis(nama)
      `)
      .eq("kelas", jadwal.kelas)
      .eq("status", "aktif");

    const { data: presensi } = await supabase
      .from("absensi")
      .select("nis,status")
      .eq("id_jadwal", id_jadwal)
      .eq("tanggal", tanggal);

    const presensiMap = {};
    (presensi || []).forEach(p => {
        presensiMap[p.nis] = p.status;
    });

    const listSiswa = (kelasSiswa || []).map(k => ({
      nis: k.nis,
      nama: k.murid?.nama || "-",
      kelas: `Kelas ${k.kelas}`,
      // Status dipastikan berhuruf depan kapital dlm client list view
      status: presensiMap[k.nis] ? (presensiMap[k.nis].charAt(0).toUpperCase() + presensiMap[k.nis].slice(1)) : "Hadir"
    }));

    // sort
    listSiswa.sort((a,b) => a.nama.localeCompare(b.nama));

    res.json(listSiswa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   SIMPAN PRESENSI
====================================== */
router.post("/presensi", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);
    const { tanggal, id_jadwal, kelas_id, id_mapel, presensi } = req.body;

    if (!presensi || !Array.isArray(presensi)) {
      return res.status(400).json({ error: "Data presensi tidak valid" });
    }

    const { data: existing } = await supabase
        .from("absensi")
        .select("id, nis")
        .eq("id_jadwal", id_jadwal)
        .eq("tanggal", tanggal);
    
    const existingMap = {};
    (existing || []).forEach(e => {
        existingMap[e.nis] = e.id;
    });

    const payload = presensi.map(p => {
        const item = {
            nis: p.nis,
            id_guru: guru.id_guru,
            id_mapel: id_mapel,
            kelas: kelas_id,
            tanggal: tanggal,
            status: p.status.toLowerCase(),
            id_jadwal: id_jadwal
        };
        if (existingMap[p.nis]) {
            item.id = existingMap[p.nis];
        }
        return item;
    });

    const { error } = await supabase.from("absensi").upsert(payload);
    if (error) throw error;

    res.json({ success: true, message: "Presensi berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   JADWAL PENGAJAR (Lihat Jadwal)
====================================== */
router.get("/jadwal", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);

    const today = todayManado();

    /* ==========================
       TAHUN AJARAN AKTIF
    ========================== */
    const {
      data: tahunAktif,
      error: errTahun,
    } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    /* ==========================
       JADWAL PELAJARAN
    ========================== */
    const {
      data: pelajaran,
      error: err1,
    } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        mulai,
        selesai,
        hari,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("jenis", "pelajaran")
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", {
        ascending: true,
      });

    if (err1) throw err1;

    const hasilPelajaran = {
      Senin: [],
      Selasa: [],
      Rabu: [],
      Kamis: [],
      Jumat: [],
      Sabtu: [],
    };

    (pelajaran || []).forEach((j) => {
      if (hasilPelajaran[j.hari]) {
        hasilPelajaran[j.hari].push({
          jam: `${String(j.mulai).slice(0, 5)} - ${String(j.selesai).slice(0, 5)}`,
          mapel: `Kelas ${j.kelas} - ${j.mapel?.nama || "-"}`,
        });
      }
    });

    /* ==========================
       JADWAL UJIAN
    ========================== */
    const {
      data: ujian,
      error: err2,
    } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        mulai,
        selesai,
        tanggal,
        mapel:id_mapel(nama)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("jenis", "ujian")
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .gte("tanggal", today)
      .order("tanggal", {
        ascending: true,
      })
      .order("mulai", {
        ascending: true,
      });

    if (err2) throw err2;

    const hasilUjian = (ujian || []).map((j) => ({
      tanggal: j.tanggal,
      jam: `${String(j.mulai).slice(0, 5)} - ${String(j.selesai).slice(0, 5)}`,
      mapel: `Kelas ${j.kelas} - ${j.mapel?.nama || "-"}`,
    }));

    res.json({
      pelajaran: hasilPelajaran,
      ujian: hasilUjian,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ======================================
   RIWAYAT PRESENSI
====================================== */
router.get("/riwayat", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 15);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("absensi")
      .select(
        `
        tanggal,
        created_at,
        kelas,
        id_jadwal,
        jadwal:id_jadwal(mulai, selesai, hari),
        mapel:id_mapel(nama)
      `,
        { count: "exact" }
      )
      .eq("id_guru", guru.id_guru)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const grouped = {};

    (data || []).forEach((r) => {
      const key = `${r.tanggal}_${r.id_jadwal}`;

      if (!grouped[key]) {
        const jam = r.jadwal
          ? `${String(r.jadwal.mulai).slice(0, 5)} - ${String(
              r.jadwal.selesai
            ).slice(0, 5)}`
          : "-";

        const hari = r.jadwal?.hari || "-";

        const w = new Date(r.created_at);

        grouped[key] = {
          hari,
          tanggal: r.tanggal,
          kelas: `Kelas ${r.kelas}`,
          mapel: r.mapel?.nama || "-",
          jam,
          status: "sudah",
          info: `Diisi : ${timeManado(w)}\nOleh : ${guru.nama}`,
          id_jadwal: r.id_jadwal,
        };
      }
    });

    const rows = Object.values(grouped);

    res.json({
      data: rows,
      page,
      limit,
      total: count || 0,
      hasMore: to + 1 < (count || 0),
    });
  } catch (err) {
    console.log("Riwayat error", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================
   DETAIL RIWAYAT PRESENSI
====================================== */
router.get("/riwayat/:tanggal/:id_jadwal", requireAuth, async (req, res) => {
  try {
    const guru = await getGuruLogin(req.user.id);
    const { tanggal, id_jadwal } = req.params;

    const { data, error } = await supabase
      .from("absensi")
      .select(`
        nis,
        status,
        murid:nis(nama),
        mapel:id_mapel(nama),
        jadwal:id_jadwal(kelas,mulai,selesai,hari)
      `)
      .eq("id_guru", guru.id_guru)
      .eq("tanggal", tanggal)
      .eq("id_jadwal", id_jadwal)
      .order("nis", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({
        header: null,
        detail: []
      });
    }

    const first = data[0];

    const header = {
      tanggal,
      hari: first.jadwal?.hari || "-",
      kelas: `Kelas ${first.jadwal?.kelas || "-"}`,
      mapel: first.mapel?.nama || "-",
      jam: `${String(first.jadwal?.mulai).slice(0,5)} - ${String(first.jadwal?.selesai).slice(0,5)}`
    };

    const detail = data.map((x, i) => ({
      no: i + 1,
      nis: x.nis,
      nama: x.murid?.nama || "-",
      status: x.status
    }));

    res.json({
      header,
      detail
    });

  } catch (err) {
    console.log("DETAIL RIWAYAT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;