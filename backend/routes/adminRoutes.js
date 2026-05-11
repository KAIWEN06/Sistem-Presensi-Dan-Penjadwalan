const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const requireAuth = require("../middleware/auth");
const { todayManado } = require("../utils/timezone");
const multer = require("multer");
const XLSX = require("xlsx");

const upload = multer({
  storage: multer.memoryStorage()
});

/* =====================================================
   HELPERS
===================================================== */

function cekLibur(kalenderList, tanggal, kelasId = null) {
  for (const k of kalenderList || []) {

    const mulai = new Date(k.tanggal_mulai);
    const selesai = new Date(k.tanggal_selesai);
    const tgl = new Date(tanggal);

    // reset jam
    mulai.setHours(0,0,0,0);
    selesai.setHours(23,59,59,999);
    tgl.setHours(12,0,0,0);

    const kenaTanggal =
      tgl >= mulai &&
      tgl <= selesai;

    if (!kenaTanggal) continue;

    // semua kelas
    if (k.semua_kelas) {
      return {
        is_libur: k.jenis === "libur",
        jenis: k.jenis,
        keterangan: k.keterangan
      };
    }

    // kelas tertentu
    if (
      kelasId !== null &&
      kelasId !== undefined
    ) {
      const match = (k.kalender_kelas || []).some(
        (kk) =>
          Number(kk.kelas) === Number(kelasId)
      );

      if (match) {
        return {
          is_libur: k.jenis === "libur",
          jenis: k.jenis,
          keterangan: k.keterangan
        };
      }
    }
  }

  return {
    is_libur: false,
    jenis: null,
    keterangan: null
  };
}

async function getKalenderByTanggal(tanggal, kelasId) {
  const { data, error } = await supabase
    .from("kalender_akademik")
   .select(`
      id,
      tanggal_mulai,
      tanggal_selesai,
      semua_kelas,
      jenis,
      keterangan,
      kalender_kelas ( kelas )
    `)
    .lte("tanggal_mulai", tanggal)
    .gte("tanggal_selesai", tanggal);

  if (error) throw error;

  if (!data || data.length === 0) {
    return { is_libur: false };
  }

  for (const k of data) {
    // semua kelas
    if (k.semua_kelas) {
      return {
        is_libur: true,
        jenis: k.jenis,
        keterangan: k.keterangan
      };
    }

    // kelas tertentu
    const match = (k.kalender_kelas || []).some(
      (kk) => Number(kk.kelas) === Number(kelasId)
    );

    if (match) {
  return {
    is_libur: true,
    jenis: k.jenis,
    keterangan: k.keterangan
  };
}
  }

  return {
  is_libur: false,
  jenis: null,
  keterangan: null
};
}

const hariUrut = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 7
};

function formatTanggal(tgl) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/* =====================================================
   ROOT
===================================================== */

router.get("/", (req, res) => {
  res.json({ message: "admin aktif" });
});

/* =====================================================
   DASHBOARD
===================================================== */

router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    /* ambil tahun ajaran aktif */
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    const [muridRes, guruRes, mapelRes, kelasRes] = await Promise.all([
      /* murid hanya tahun aktif */
      supabase
        .from("kelas_siswa")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("tahun_id", tahunAktif.id)
        .eq("status", "aktif"),

      supabase
        .from("guru")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("status", "aktif"),

      supabase
        .from("mapel")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("status", "aktif"),

      supabase
        .from("kelas")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("status", "aktif")
    ]);

    res.json({
      murid: muridRes.count || 0,
      guru: guruRes.count || 0,
      mapel: mapelRes.count || 0,
      kelas: kelasRes.count || 0
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Gagal mengambil dashboard"
    });
  }
});

/* =====================================================
   GURU
===================================================== */

router.get("/guru", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("guru")
      .select("id_guru,nama,nip,status")
      .order("nama");

    if (error) throw error;

    res.json(
      (data || []).map(g => ({
        id: g.id_guru,
        nip: g.nip || "-",
        nama: g.nama,
        telepon: "-",
        status: g.status || "aktif"
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data guru" });
  }
});

router.post("/guru", requireAuth, async (req, res) => {
  try {
    const { nip, nama, status } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({
        error: "Nama guru wajib diisi"
      });
    }

    // ambil ID terakhir
    const { data: lastGuru } = await supabase
      .from("guru")
      .select("id_guru")
      .order("id_guru", { ascending: false })
      .limit(1)
      .maybeSingle();

    let newId = "G001";

    if (lastGuru?.id_guru) {
      const angka = parseInt(
        lastGuru.id_guru.replace("G", "")
      );

      newId =
        "G" +
        String(angka + 1).padStart(3, "0");
    }

    const payload = {
      id_guru: newId,
      nama: nama.trim(),
      nip: nip?.trim() || null,
      status: status || "aktif"
    };

    const { data, error } = await supabase
      .from("guru")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: "Guru berhasil ditambah",
      data
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.delete("/guru/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // cek jadwal mengajar
    const { data: jadwal1 } = await supabase
      .from("jadwal")
      .select("id_jadwal")
      .eq("id_guru", id)
      .limit(1);

    // cek pengawas ujian
    const { data: jadwal2 } = await supabase
      .from("jadwal")
      .select("id_jadwal")
      .eq("pengawas_id", id)
      .limit(1);

    // cek absensi
    const { data: absensi } = await supabase
      .from("absensi")
      .select("id")
      .eq("id_guru", id)
      .limit(1);

    const dipakai =
      (jadwal1 || []).length ||
      (jadwal2 || []).length ||
      (absensi || []).length;

    if (dipakai) {
      return res.status(400).json({
        error: "Guru sudah dipakai pada data sistem dan tidak bisa dihapus"
      });
    }

    // hapus akun profile terkait (optional)
    await supabase.from("profiles").delete().eq("id_guru", id);

    // hapus guru
    const { error } = await supabase.from("guru").delete().eq("id_guru", id);

    if (error) throw error;

    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: "Gagal hapus guru"
    });
  }
});

/* =====================================================
   KELAS
===================================================== */

router.get("/kelas", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("kelas")
      .select(`
        id,
        nama,
        status,
        wali_kelas_id,
        guru:wali_kelas_id (
          id_guru,
          nama
        )
      `);

    if (error) throw error;

    const urut = (data || []).sort((a, b) => {
      const pa = a.nama.match(/^(\d+)([A-Z]*)$/i) || [];
      const pb = b.nama.match(/^(\d+)([A-Z]*)$/i) || [];

      const angkaA = Number(pa[1] || 99);
      const angkaB = Number(pb[1] || 99);

      if (angkaA !== angkaB) return angkaA - angkaB;

      return String(pa[2] || "").localeCompare(String(pb[2] || ""));
    });

    res.json(
      urut.map((k) => ({
        ...k,
        wali_kelas: k.guru?.nama || "-"
      }))
    );
  } catch (err) {
    res.status(500).json({
      error: "Gagal mengambil data kelas"
    });
  }
});
/* ===============================
   GET AKTIF
=============================== */
router.get("/kelas/aktif", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("kelas")
      .select("id,nama,status")
      .eq("status", "aktif");

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({
      error: "Gagal mengambil kelas aktif"
    });
  }
});

/* ===============================
   TAMBAH
=============================== */
router.get("/guru/calon-wali", requireAuth, async (req, res) => {
  try {
    const { data: guru } = await supabase
      .from("guru")
      .select("id_guru,nama")
      .eq("status", "aktif")
      .order("nama");

    const { data: kelas } = await supabase
      .from("kelas")
      .select("nama,wali_kelas_id")
      .not("wali_kelas_id", "is", null);

    const hasil = (guru || []).map((g) => {
      const pegang = (kelas || [])
        .filter((k) => k.wali_kelas_id === g.id_guru)
        .map((k) => k.nama);

      return {
        ...g,
        label:
          pegang.length > 0
            ? `${g.nama} • Wali Kelas ${pegang.join(" & ")}`
            : g.nama
      };
    });

    res.json(hasil);

  } catch (err) {
    res.status(500).json({
      error: "Gagal ambil guru"
    });
  }
});

router.post("/kelas", requireAuth, async (req, res) => {
  try {
    let { nama, wali_kelas_id } = req.body;

    nama = String(nama || "").trim().toUpperCase();

    if (!nama) {
      return res.status(400).json({
        error: "Nama kelas wajib diisi"
      });
    }

    const valid = /^[1-6][A-Z]?$/.test(nama);

    if (!valid) {
      return res.status(400).json({
        error: "Format kelas tidak valid"
      });
    }

    const { data: cek } = await supabase
      .from("kelas")
      .select("id")
      .ilike("nama", nama)
      .maybeSingle();

    if (cek) {
      return res.status(400).json({
        error: "Kelas sudah ada"
      });
    }

    const { error } = await supabase
      .from("kelas")
      .insert([
        {
          nama,
          status: "aktif",
          wali_kelas_id: wali_kelas_id || null
        }
      ]);

    if (error) throw error;

    res.json({
      message: "Kelas berhasil ditambah"
    });
  } catch (err) {
    res.status(500).json({
      error: "Gagal tambah kelas"
    });
  }
});

/* ===============================
   EDIT NAMA KELAS
=============================== */
router.patch("/kelas/:id", requireAuth, async (req, res) => {
  try {
    let { nama, wali_kelas_id } = req.body;

    nama = String(nama || "").trim().toUpperCase();

    if (!nama) {
      return res.status(400).json({
        error: "Nama kelas wajib diisi"
      });
    }

    const { error } = await supabase
      .from("kelas")
      .update({
        nama,
        wali_kelas_id: wali_kelas_id || null
      })
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Kelas berhasil diupdate"
    });

  } catch (err) {
    res.status(500).json({
      error: "Gagal update kelas"
    });
  }
});

/* ===============================
   STATUS
=============================== */
router.patch("/kelas/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const { error } = await supabase
      .from("kelas")
      .update({
        status
      })
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({
      message: "Status kelas diubah"
    });
  } catch (err) {
    res.status(500).json({
      error: "Gagal update status"
    });
  }
});

/* ===============================
   HAPUS KELAS
=============================== */
router.delete("/kelas/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    /* cek dipakai murid */
    const { count, error: errCheck } = await supabase
      .from("kelas_siswa")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("kelas", id)
      .neq("status", "lulus");

    if (errCheck) throw errCheck;

    if (count > 0) {
      return res.status(400).json({
        error: "Kelas masih dipakai murid"
      });
    }

    const { error } = await supabase.from("kelas").delete().eq("id", id);

    if (error) throw error;

    res.json({
      message: "Kelas dihapus"
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Gagal hapus kelas"
    });
  }
});
/* =====================================================
   MURID
===================================================== */

router.get("/tahun-ajaran", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tahun_ajaran")
      .select("id, aktif")
      .order("id", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({
      error: "Gagal ambil tahun ajaran"
    });
  }
});

router.patch("/murid/:nis", requireAuth, async (req, res) => {
  try {
    const { nis } = req.params;
    const { nama, kelas, nama_ortu } = req.body;

    /* ambil tahun aktif */
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun || !tahunAktif) {
      return res.status(400).json({
        error: "Tahun ajaran aktif tidak ditemukan"
      });
    }

    /* update data murid */
    const { error: e1 } = await supabase
      .from("murid")
      .update({
        nama,
        nama_ortu
      })
      .eq("nis", nis);

    if (e1) throw e1;

    /* update hanya kelas tahun aktif */
    const { error: e2 } = await supabase
      .from("kelas_siswa")
      .update({
        kelas: Number(kelas)
      })
      .eq("nis", nis)
      .eq("tahun_id", tahunAktif.id);

    if (e2) throw e2;

    res.json({
      success: true,
      message: "Data murid berhasil diupdate"
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Gagal update murid"
    });
  }
});

router.post("/tahun-ajaran/rollover", requireAuth, async (req, res) => {
  try {
    const { tahunBaru, semester1, semester2 } = req.body;

    /* ===============================
         VALIDASI DASAR
      =============================== */
    if (!tahunBaru) {
      return res.status(400).json({
        error: "Tahun ajaran baru wajib dipilih"
      });
    }

    if (
      !semester1 ||
      !semester1.mulai ||
      !semester1.selesai ||
      !semester2 ||
      !semester2.mulai ||
      !semester2.selesai
    ) {
      return res.status(400).json({
        error: "Tanggal semester belum lengkap"
      });
    }

    /* ===============================
         CEK TAHUN AKTIF LAMA
      =============================== */
    const { data: tahunAktif, error: errTahunAktif } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahunAktif || !tahunAktif) {
      return res.status(400).json({
        error: "Tahun ajaran aktif tidak ditemukan"
      });
    }

    const { data: semesterAktif2, error: errSemester } = await supabase
      .from("semester")
      .select("tanggal_selesai")
      .eq("tahun_id", tahunAktif.id)
      .eq("nama", "Genap")
      .single();

    if (errSemester || !semesterAktif2) {
      return res.status(400).json({
        error: "Semester Genap tahun aktif tidak ditemukan"
      });
    }

    const hariIni = new Date();
    const selesai = new Date(semesterAktif2.tanggal_selesai);

    if (hariIni <= selesai) {
      return res.status(400).json({
        error: "Rollover hanya bisa setelah Semester Genap selesai"
      });
    }

    if (tahunAktif.id === tahunBaru) {
      return res.status(400).json({
        error: "Tahun baru tidak boleh sama"
      });
    }

    /* ===============================
         CEK TAHUN BARU SUDAH ADA?
      =============================== */
    const { data: cekTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("id", tahunBaru)
      .maybeSingle();

    if (cekTahun) {
      return res.status(400).json({
        error: "Tahun ajaran baru sudah ada"
      });
    }

    /* ===============================
         AMBIL DATA SISWA TAHUN LAMA
      =============================== */
    const { data: siswaLama, error: errSiswa } = await supabase
      .from("kelas_siswa")
      .select("nis,kelas,status")
      .eq("tahun_id", tahunAktif.id)
      .eq("status", "aktif");

    if (errSiswa) throw errSiswa;

    /* ===============================
         NONAKTIFKAN TAHUN LAMA
      =============================== */
    await supabase
      .from("tahun_ajaran")
      .update({
        aktif: false
      })
      .eq("id", tahunAktif.id);

    /* ===============================
         BUAT TAHUN BARU
      =============================== */
    await supabase.from("tahun_ajaran").insert([
      {
        id: tahunBaru,
        aktif: true
      }
    ]);

    /* ===============================
         BUAT SEMESTER
      =============================== */
    await supabase.from("semester").insert([
      {
        id: tahunBaru + "-1",
        tahun_id: tahunBaru,
        nama: "Ganjil",
        tanggal_mulai: semester1.mulai,
        tanggal_selesai: semester1.selesai,
        aktif: true
      },
      {
        id: tahunBaru + "-2",
        tahun_id: tahunBaru,
        nama: "Genap",
        tanggal_mulai: semester2.mulai,
        tanggal_selesai: semester2.selesai,
        aktif: false
      }
    ]);

    /* ===============================
         NAIK KELAS
      =============================== */
    const insertBaru = [];
    let totalNaik = 0;
    let totalLulus = 0;

    for (const s of siswaLama) {
      const kelasNow = Number(s.kelas);

      if (kelasNow >= 6) {
        /* kelas akhir -> lulus permanen */
        await supabase
          .from("kelas_siswa")
          .update({
            status: "lulus"
          })
          .eq("nis", s.nis)
          .eq("tahun_id", tahunAktif.id);

        totalLulus++;
      } else {
        insertBaru.push({
          nis: s.nis,
          kelas: kelasNow + 1,
          tahun_id: tahunBaru,
          status: "aktif"
        });

        totalNaik++;
      }
    }

    if (insertBaru.length > 0) {
      await supabase.from("kelas_siswa").insert(insertBaru);
    }

    /* ===============================
         RESPONSE
      =============================== */
    res.json({
      message: "Rollover berhasil",
      tahunLama: tahunAktif.id,
      tahunBaru,
      naikKelas: totalNaik,
      lulus: totalLulus
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Gagal rollover tahun ajaran"
    });
  }
});

router.get("/murid", requireAuth, async (req, res) => {
  try {
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

const { data, error } = await supabase
  .from("kelas_siswa")
  .select(`
    nis,
    kelas,
    status,
    murid (
      nama,
      nama_ortu
    )
  `)
  .eq("tahun_id", tahunAktif.id)

    if (error) throw error;

const hasil = (data || []).map(row => ({
  nis: row.nis,
  nama: row.murid?.nama || "-",
  nama_ortu: row.murid?.nama_ortu || "-",
  kelas: row.kelas,
  status: row.status
}));
    res.json(hasil);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Gagal mengambil data murid"
    });
  }
});

router.post("/murid", requireAuth, async (req, res) => {
  try {
    const { nis, nama, kelas_id, status, nama_ortu } = req.body;

    const { error: err1 } = await supabase
      .from("murid")
      .upsert([{ nis, nama, nama_ortu: nama_ortu || null }]);

    if (err1) throw err1;

    const tahun = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    const tahunId = (tahun.data && tahun.data.id) || null;

    const { error: err2 } = await supabase.from("kelas_siswa").insert([
      {
        nis,
        kelas: Number(kelas_id),
        tahun_id: tahunId,
        status: status || "aktif"
      }
    ]);

    if (err2) throw err2;

    res.json({ message: "Murid berhasil ditambah" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/murid/lulus", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("kelas_siswa")
      .select(`
        nis,
        kelas,
        tahun_id,
        murid (
          nama,
          nama_ortu
        )
      `)
      .eq("status", "lulus")
      .order("tahun_id", { ascending: false });

    if (error) throw error;

    res.json(
      (data || []).map(x => ({
        nis: x.nis,
        nama: x.murid?.nama || "-",
        nama_ortu: x.murid?.nama_ortu || "-", // 🔥 sekarang muncul
        kelas: x.kelas,
        tahun: x.tahun_id,
        status: "lulus"
      }))
    );
  } catch (err) {
    res.status(500).json({
      error: "Gagal ambil data lulus"
    });
  }
});

router.patch("/guru/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("guru")
      .update({ status })
      .eq("id_guru", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Gagal ubah status guru"
    });
  }
});

router.put("/guru/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nip } = req.body;

    const { data, error } = await supabase
      .from("guru")
      .update({
        nama,
        nip
      })
      .eq("id_guru", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Gagal update guru"
    });
  }
});

router.patch("/murid/:id", requireAuth, async (req, res) => {
  try {
    const { nama, kelas } = req.body;

    const nis = req.params.id;

    const { error: err1 } = await supabase
      .from("murid")
      .update({
        nama,
        nama_ortu
      })
      .eq("nis", nis);

    if (err1) throw err1;

    const { error: err2 } = await supabase
      .from("kelas_siswa")
      .update({
        kelas: Number(kelas)
      })
      .eq("nis", nis);

    if (err2) throw err2;

    res.json({
      message: "Murid berhasil diupdate"
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Gagal update murid"
    });
  }
});

router.put("/mapel/:id", requireAuth, async (req, res) => {
  try {
    const { nama } = req.body;

    const { error } = await supabase
      .from("mapel")
      .update({
        nama: nama.trim()
      })
      .eq("id_mapel", req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Mapel berhasil diupdate"
    });
  } catch (err) {
    res.status(500).json({
      error: "Gagal update mapel"
    });
  }
});

router.delete("/murid/:id", requireAuth, async (req, res) => {
  try {
    const nis = req.params.id;

    await supabase.from("kelas_siswa").delete().eq("nis", nis);

    await supabase.from("murid").delete().eq("nis", nis);

    res.json({
      message: "Murid dihapus"
    });
  } catch (err) {
    res.status(500).json({
      error: "Gagal hapus murid"
    });
  }
});

router.get("/murid/template", requireAuth, async (req, res) => {
  try {
    const XLSX = require("xlsx");

    // =========================
    // DATA TEMPLATE
    // =========================
    const data = [
      ["NIS", "NAMA", "NAMA_ORANG_TUA", "KELAS"],
      ["123456", "Rafael Kairupan", "Yohana Kairupan", "5A"]
    ];

    // =========================
    // BUAT SHEET
    // =========================
    const ws = XLSX.utils.aoa_to_sheet(data);

    // =========================
    // LEBAR KOLOM
    // =========================
    ws["!cols"] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 35 },
      { wch: 15 }
    ];

    // =========================
    // TINGGI BARIS (OPTIONAL)
    // =========================
    ws["!rows"] = [
      { hpt: 22 }, // header
      { hpt: 20 }
    ];

    // =========================
    // ALIGN CENTER SEMUA CELL
    // =========================
    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

        if (!ws[cellAddress]) continue;

        // STYLE HEADER & ISI
        ws[cellAddress].s = {
          alignment: {
            horizontal: "center",
            vertical: "center"
          },
          font: R === 0 ? { bold: true } : {}
        };
      }
    }

    // =========================
    // WORKBOOK
    // =========================
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Murid");

    const buffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
      cellStyles: true
    });

    // =========================
    // RESPONSE DOWNLOAD
    // =========================
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template_murid.xlsx"
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Gagal generate template"
    });
  }
});

router.post(
  "/murid/upload",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "File wajib diupload"
        });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const tahun = await supabase
        .from("tahun_ajaran")
        .select("id")
        .eq("aktif", true)
        .single();

      const tahunId = tahun.data?.id || null;

      let gagal = 0;
      let berhasil = 0;
      const errors = [];

      let index = 0;

      for (const row of rows) {
        index++;

        const nis = String(row.NIS || "").trim();
        const nama = String(row.NAMA || "").trim();
        const namaOrtu = String(row.NAMA_ORANG_TUA || "").trim();
        const namaKelas = String(row.KELAS || "").trim();

        // VALIDASI WAJIB
        if (!nis || !nama || !namaKelas) {
          gagal++;
          errors.push({ row: index + 1, reason: "Data wajib kosong" });
          continue;
        }

        // VALIDASI LANJUTAN
        if (nis.length < 3) {
          gagal++;
          errors.push({ row: index + 1, reason: "NIS terlalu pendek" });
          continue;
        }

        if (nama.length < 3) {
          gagal++;
          errors.push({ row: index + 1, reason: "Nama terlalu pendek" });
          continue;
        }

        if (!/^[0-9A-Z]+$/i.test(nis)) {
          gagal++;
          errors.push({ row: index + 1, reason: "Format NIS tidak valid" });
          continue;
        }

        // CEK KELAS
        const { data: kelasDb, error: errKelas } = await supabase
          .from("kelas")
          .select("id")
          .eq("nama", namaKelas)
          .eq("status", "aktif")
          .single();

        if (errKelas || !kelasDb) {
          gagal++;
          errors.push({ row: index + 1, reason: "Kelas tidak ditemukan" });
          continue;
        }

        try {
          // INSERT MURID
          const { error: err1 } = await supabase.from("murid").upsert([
            {
              nis,
              nama,
              nama_ortu: namaOrtu || null
            }
          ]);

          if (err1) throw err1;

          // INSERT KELAS
          const { error: err2 } = await supabase.from("kelas_siswa").upsert([
            {
              nis,
              kelas: kelasDb.id,
              tahun_id: tahunId,
              status: "aktif"
            }
          ]);

          if (err2) throw err2;

          berhasil++;

        } catch (e) {
          gagal++;
          errors.push({
            row: index + 1,
            reason: "Gagal simpan ke database"
          });
        }
      }

      res.json({
        message: "Upload selesai",
        berhasil,
        gagal,
        total: rows.length,
        errors
      });

    } catch (err) {
      console.log(err);

      res.status(500).json({
        error: "Gagal upload murid"
      });
    }
  }
);
router.get("/tahun-ajaran/aktif", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tahun_ajaran")
      .select("id, aktif")
      .eq("aktif", true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({
        id: "-"
      });
    }

    res.json(data);
  } catch (err) {
    console.log("ERROR:", err);

    res.status(500).json({
      error: "Gagal mengambil tahun aktif"
    });
  }
});

router.patch("/murid/:nis/status", requireAuth, async (req, res) => {
  try {
    const { nis } = req.params;
    const { status } = req.body;

    /* validasi status */
    const allowed = ["aktif", "nonaktif", "lulus"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: "Status tidak valid"
      });
    }

    /* ambil tahun aktif */
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun || !tahunAktif) {
      return res.status(400).json({
        error: "Tahun ajaran aktif tidak ditemukan"
      });
    }

    /* update hanya tahun aktif */
    const { error } = await supabase
      .from("kelas_siswa")
      .update({ status })
      .eq("nis", nis)
      .eq("tahun_id", tahunAktif.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Status murid berhasil diubah"
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Gagal update status murid"
    });
  }
});
/* =====================================================
   MAPEL
===================================================== */

router.get("/mapel", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("mapel")
      .select("id_mapel,nama,status")
      .order("nama");

    if (error) throw error;

    res.json(
      (data || []).map(m => ({
        id: m.id_mapel,
        nama: m.nama,
        status: m.status
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil mapel" });
  }
});

router.post("/mapel", requireAuth, async (req, res) => {
  try {
    const { nama } = req.body;

    const id = "MP" + Date.now();

    const { data, error } = await supabase
      .from("mapel")
      .insert([
        {
          id_mapel: id,
          nama,
          status: "aktif"
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "Mapel berhasil ditambah", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/mapel/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const { error } = await supabase
      .from("mapel")
      .update({ status })
      .eq("id_mapel", req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Gagal update status" });
  }
});

router.delete("/mapel/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from("mapel")
      .delete()
      .eq("id_mapel", req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Gagal hapus mapel" });
  }
});

/* =====================================================
   JADWAL
===================================================== */


async function autoUpdateStatusUjian() {
  try {
    const now = new Date();

    const today =
      now.toLocaleDateString(
        "en-CA",
        {
          timeZone:
            "Asia/Makassar",
        }
      );

    const jamNow =
      now.toLocaleTimeString(
        "en-GB",
        {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          timeZone:
            "Asia/Makassar",
        }
      );

    const { data, error } =
      await supabase
        .from("jadwal")
        .select(
          "id_jadwal,tanggal,selesai,status"
        )
        .eq(
          "jenis",
          "ujian"
        )
        .eq(
          "status",
          "aktif"
        );

    if (error) throw error;

    const selesaiIds =
      (data || [])
        .filter((j) => {
          if (
            !j.tanggal
          )
            return false;

          if (
            j.tanggal <
            today
          )
            return true;

          if (
            j.tanggal ===
              today &&
            String(
              j.selesai
            ).slice(
              0,
              5
            ) <=
              jamNow
          ) {
            return true;
          }

          return false;
        })
        .map(
          (j) =>
            j.id_jadwal
        );

    if (
      selesaiIds.length >
      0
    ) {
      await supabase
        .from("jadwal")
        .update({
          status:
            "selesai",
        })
        .in(
          "id_jadwal",
          selesaiIds
        );
    }
  } catch (err) {
    console.log(
      "AUTO STATUS ERROR:",
      err
    );
  }
}

router.get("/jadwal", requireAuth, async (req, res) => {
  try {
    /* ambil tahun aktif */
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    const { data, error } = await supabase
      .from("jadwal")
      .select(`
        id_jadwal,
        kelas,
        hari,
        mulai,
        selesai,
        jenis,
        tanggal,
        status,
        id_mapel,
        id_guru,
        pengawas_id,
        tahun_id,
        mapel:id_mapel ( nama ),
        guru:id_guru ( nama )
      `)
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", { ascending: true });

    if (error) throw error;

      const hasil = await Promise.all(
        (data || []).map(async (j) => {
          const tanggalCek = j.tanggal || todayManado();

          const libur = await getKalenderByTanggal(
            tanggalCek,
            j.kelas
          );

          return {
            id: j.id_jadwal,
            kelas: j.kelas,
            kelas_id: j.kelas,
            hari: j.hari,
            mulai: j.mulai,
            selesai: j.selesai,
            tipe: j.jenis,
            tanggal: j.tanggal,
            status: j.status,
            mapel: j.mapel?.nama || "-",
            mapel_id: j.id_mapel,
            guru: j.guru?.nama || "-",
            guru_id: j.id_guru,

            rentangWaktu:
              `${(j.mulai || "--:--").slice(0,5)} - ${(j.selesai || "--:--").slice(0,5)}`,

            is_libur: libur.is_libur,
            jenis: libur.jenis || null,
            keterangan_libur: libur.keterangan
          };
        })
      );
    res.json(hasil);

  } catch (err) {
    console.log("GET jadwal error:", err);
    res.status(500).json({
      error: "Gagal mengambil jadwal"
    });
  }
});

/* =====================================================
   TAMBAH JADWAL
===================================================== */

router.post("/jadwal", requireAuth, async (req, res) => {
  try {
    const {
      jenis,
      kelas,
      mapel,
      guru,
      hari,
      tanggal,
      mulai,
      selesai
    } = req.body;

    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun || !tahunAktif) throw errTahun;

    /* ===============================
       CEK BENTROK JADWAL
    =============================== */
    const { data: semuaJadwal, error: errJadwal } =
      await supabase
        .from("jadwal")
        .select("*")
        .eq("tahun_id", tahunAktif.id)
        .eq("status", "aktif");

    if (errJadwal) throw errJadwal;

    const bentrok = (semuaJadwal || []).find((j) => {
      const waktuSama =
        jenis === "pelajaran"
          ? (
              j.jenis === "pelajaran" &&
              j.hari === hari
            )
          : (
              j.jenis === "ujian" &&
              j.tanggal === tanggal
            );

      if (!waktuSama) return false;

      const jamBentrok =
        mulai < j.selesai &&
        selesai > j.mulai;

      if (!jamBentrok) return false;

      const kelasBentrok =
        Number(j.kelas) === Number(kelas);

      const guruBentrok =
        guru &&
        (
          j.id_guru === guru ||
          j.pengawas_id === guru
        );

      return kelasBentrok || guruBentrok;
    });

    if (bentrok) {
      if (Number(bentrok.kelas) === Number(kelas)) {
        return res.status(400).json({
          error: "Kelas bentrok dengan jadwal lain di jam yang sama"
        });
      }

      return res.status(400).json({
        error: "Guru bentrok dengan jadwal lain di jam yang sama"
      });
    }

    /* ===============================
       INSERT DATA
    =============================== */
    const idBaru = "J" + Date.now();

    const { error } = await supabase
      .from("jadwal")
      .insert([
        {
          id_jadwal: idBaru,
          kelas: Number(kelas),
          hari: jenis === "pelajaran" ? hari : null,
          mulai,
          selesai,
          tahun_id: tahunAktif.id,
          jenis,
          tanggal: jenis === "ujian" ? tanggal : null,
          pengawas_id: jenis === "ujian" ? guru || null : null,
          id_mapel: mapel,
          id_guru: guru || null,
          status: "aktif"
        }
      ]);

    if (error) throw error;

    res.json({ success: true });

  } catch (err) {
    console.log("POST jadwal:", err);
    res.status(500).json({
      error: err.message
    });
  }
});

/* =====================================================
   EDIT JADWAL
===================================================== */

router.put("/jadwal/:id", requireAuth, async (req, res) => {
  try {
    const {
      jenis,
      kelas,
      mapel,
      guru,
      hari,
      tanggal,
      mulai,
      selesai,
      status
    } = req.body;

    const { error } = await supabase
      .from("jadwal")
      .update({
        kelas: Number(kelas),
        hari: jenis === "pelajaran" ? hari : null,
        mulai,
        selesai,
        jenis,
        tanggal: jenis === "ujian" ? tanggal : null,
        pengawas_id: jenis === "ujian" ? guru || null : null,
        id_mapel: mapel,
        id_guru: guru || null
      })
      .eq("id_jadwal", req.params.id);

    if (error) throw error;

    res.json({ success: true });

  } catch (err) {
    console.log("PUT jadwal:", err);
    res.status(500).json({
      error: err.message
    });
  }
});

/* =====================================================
   STATUS JADWAL
===================================================== */

router.patch("/jadwal/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const { error } = await supabase
      .from("jadwal")
      .update({ status })
      .eq("id_jadwal", req.params.id);

    if (error) throw error;

    res.json({ success: true });

  } catch (err) {
    console.log("PATCH jadwal:", err);
    res.status(500).json({
      error: "Gagal ubah status"
    });
  }
});

/* =====================================================
   HAPUS JADWAL
===================================================== */

router.delete("/jadwal/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from("jadwal")
      .delete()
      .eq("id_jadwal", req.params.id);

    if (error) throw error;

    res.json({
      message: "Jadwal berhasil dihapus"
    });

  } catch (err) {
    res.status(500).json({
      error: "Gagal menghapus jadwal"
    });
  }
});


/* =========================
   KALENDER AKADEMIK
========================= */
router.get("/kalender", requireAuth, async (req, res) => {
  try {
    const { data: kalender, error } = await supabase
      .from("kalender_akademik")
      .select(`
        id,
        tanggal_mulai,
        tanggal_selesai,
        jenis,
        keterangan,
        semua_kelas,
        kalender_kelas (kelas)
      `)
      .order("tanggal_mulai", { ascending: false });

    if (error) throw error;

  const data = kalender.map((row) => ({
    id: row.id,
    title: row.keterangan,
    start: row.tanggal_mulai,
    end: row.tanggal_selesai,
    jenis: row.jenis,
      color:
        row.jenis === "libur"
          ? "#E16766"
          : row.jenis === "kegiatan"
          ? "#5B88C7"
          : "#999",
      semua_kelas: row.semua_kelas,
      kelas: row.kalender_kelas?.map((k) => k.kelas) || [],
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil kalender" });
  }
});

  /* =========================
    CREATE KALENDER
  ========================= */
  router.post("/kalender", requireAuth, async (req, res) => {
    const {
      tanggal_mulai,
      tanggal_selesai,
      jenis,
      keterangan,
      semua_kelas,
      kelas,
    } = req.body;

    try {
      const { data: insertData, error: insertError } = await supabase
        .from("kalender_akademik")
        .insert([
          {
            tanggal_mulai,
            tanggal_selesai,
            jenis,
            keterangan,
            semua_kelas,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const kalenderId = insertData.id;

      if (!semua_kelas && kelas?.length > 0) {
        const payload = kelas.map((k) => ({
          kalender_id: kalenderId,
          kelas: k,
        }));

        const { error: kelasError } = await supabase
          .from("kalender_kelas")
          .insert(payload);

        if (kelasError) throw kelasError;
      }

      res.json({ message: "Kalender berhasil dibuat" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Gagal simpan kalender" });
    }
  });

/* =========================
   UPDATE KALENDER
========================= */
router.put("/kalender/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    tanggal_mulai,
    tanggal_selesai,
    jenis,
    keterangan,
    semua_kelas,
    kelas,
  } = req.body;

  try {
    const { error: updateError } = await supabase
      .from("kalender_akademik")
      .update({
        tanggal_mulai,
        tanggal_selesai,
        jenis,
        keterangan,
        semua_kelas,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // hapus relasi lama
    const { error: deleteError } = await supabase
      .from("kalender_kelas")
      .delete()
      .eq("kalender_id", id);

    if (deleteError) throw deleteError;

    // insert ulang
    if (!semua_kelas && kelas?.length > 0) {
      const uniqueKelas = [...new Set(kelas)];
      const payload = uniqueKelas.map((k) => ({
        kalender_id: id,
        kelas: k,
      }));

      const { error: kelasError } = await supabase
        .from("kalender_kelas")
        .insert(payload);

      if (kelasError) throw kelasError;
    }

    res.json({
      success: true,
      message: "Kalender berhasil diupdate",
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
/* =========================
   DELETE KALENDER
========================= */
router.delete("/kalender/:id", requireAuth, async (req, res) => {
  try {
    await supabase
      .from("kalender_kelas")
      .delete()
      .eq("kalender_id", req.params.id);

    // hapus utama
    const { error } = await supabase
      .from("kalender_akademik")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Kalender dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hapus kalender" });
  }
});
/* =====================================================
   DASHBOARD JADWAL HARI INI
===================================================== */

router.get("/jadwal/hari-ini", async (req, res) => {
  try {
    const today = todayManado();

    await autoUpdateStatusUjian();

    const hariList = [
      "Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"
    ];

    const now = new Date();
    const hariIni = hariList[now.getDay()];
    const tgl = today;

    const normalizeDate = (d) => d ? String(d).slice(0,10) : null;

    /* ================= TAHUN AKTIF ================= */
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    /* ================= KALENDER ================= */
    const { data: kalenderList, error: errKal } = await supabase
      .from("kalender_akademik")
      .select(`
        tanggal_mulai,
        tanggal_selesai,
        keterangan,
        jenis,
        semua_kelas,
        kalender_kelas (kelas)
      `)
      .lte("tanggal_mulai", today)
      .gte("tanggal_selesai", today);

    if (errKal) throw errKal;

    /* ================= LIBUR GLOBAL ================= */
    const globalLibur = cekLibur(kalenderList, today);

    const isLibur = globalLibur.is_libur;
    const keteranganLibur = globalLibur.keterangan;

    /* ================= JADWAL ================= */
    const { data: jadwal, error: errJadwal } = await supabase
      .from("jadwal")
      .select("*")
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", { ascending: true });

    if (errJadwal) throw errJadwal;

    const { data: guru } = await supabase
      .from("guru")
      .select("id_guru,nama");

    const { data: mapel } = await supabase
      .from("mapel")
      .select("id_mapel,nama");

    /* ================= FILTER + MAP ================= */
    const hasil = (jadwal || [])
      .filter((j) =>
        (j.jenis === "pelajaran" && j.hari === hariIni) ||
        (j.jenis === "ujian" && normalizeDate(j.tanggal) === tgl)
      )
      .map((j) => {
      const g = guru?.find(x => x.id_guru === j.id_guru);
      const m = mapel?.find(x => x.id_mapel === j.id_mapel);

      const tanggal =
        j.jenis === "pelajaran"
          ? today
          : normalizeDate(j.tanggal);

      const libur = cekLibur(kalenderList, tanggal, j.kelas);

      return {
        id: j.id_jadwal,
        tipe: j.jenis,
        kelas: `Kelas ${j.kelas}`,
        hari: hariIni,
        mapel: m?.nama || "-",
        guru: g?.nama || "-",
        time: `${String(j.mulai).slice(0,5)} - ${String(j.selesai).slice(0,5)}`,

        is_libur: libur.is_libur,
        jenis: libur.jenis || null,
        keterangan_libur: libur.keterangan
         };
      });

    res.json({
      isLibur,
      keterangan: keteranganLibur,
      data: hasil
    });

  } catch (err) {
    console.error("hari ini error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   DASHBOARD JADWAL MINGGU INI (FINAL FIX)
===================================================== */

router.get("/jadwal/minggu-ini", async (req, res) => {
  try {
    await autoUpdateStatusUjian();

    /* ================= HITUNG RANGE MINGGU ================= */
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const senin = new Date(now);
    senin.setDate(now.getDate() + diff);

    const minggu = new Date(senin);
    minggu.setDate(senin.getDate() + 6);

    const toLocalDate = (date) =>
      date.toLocaleDateString("en-CA", {
        timeZone: "Asia/Makassar"
      });

    const start = toLocalDate(senin);
    const end = toLocalDate(minggu);

    const hariMap = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

    /* ================= HELPER ================= */
    const hariKeIndex = {
      Minggu:0, Senin:1, Selasa:2, Rabu:3, Kamis:4, Jumat:5, Sabtu:6
    };

    const getTanggal = (hari) => {
      const index = hariKeIndex[hari];
      if (index === undefined) return null;

      const tgl = new Date(senin);
      const offset = index === 0 ? 6 : index - 1;

      tgl.setDate(senin.getDate() + offset);

      return tgl.toLocaleDateString("en-CA", {
        timeZone: "Asia/Makassar"
      });
    };

    const normalizeDate = (d) => d ? String(d).slice(0,10) : null;

    /* ================= TAHUN ================= */
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    /* ================= 🔥 FIX UTAMA DI SINI ================= */
    const { data: kalenderList, error: errKal } = await supabase
      .from("kalender_akademik")
      .select(`
        tanggal_mulai,
        tanggal_selesai,
        keterangan,
        jenis,
        semua_kelas,
        kalender_kelas (kelas)
      `); // ❗ TANPA FILTER (INI YANG FIX)

    if (errKal) throw errKal;

    /* ================= JADWAL ================= */
    const { data: jadwal, error: errJadwal } = await supabase
      .from("jadwal")
      .select("*")
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", { ascending: true });

    if (errJadwal) throw errJadwal;

    const { data: guru } = await supabase
      .from("guru")
      .select("id_guru,nama");

    const { data: mapel } = await supabase
      .from("mapel")
      .select("id_mapel,nama");

    /* ================= MAP ================= */
    const hasil = (jadwal || [])
      .filter((j) => {
        if (j.jenis === "pelajaran") {
          const tgl = getTanggal(j.hari);
          return tgl && tgl >= start && tgl <= end;
        }

        if (j.jenis === "ujian") {
          const tgl = normalizeDate(j.tanggal);
          return tgl >= start && tgl <= end;
        }

        return false;
      })
      .map((j) => {
        let hari = j.hari;
        let tanggal = null;

        if (j.jenis === "ujian") {
          hari = hariMap[new Date(j.tanggal).getDay()];
          tanggal = normalizeDate(j.tanggal);
        }

        if (j.jenis === "pelajaran") {
          tanggal = getTanggal(j.hari);
        }

        /* ================= MATCH LIBUR ================= */
        const match = kalenderList?.find((k) => {
        const mulai = normalizeDate(k.tanggal_mulai);
        const selesai = normalizeDate(k.tanggal_selesai);

        const kenaTanggal =
          tanggal &&
          tanggal >= mulai &&
          tanggal <= selesai;

        const kenaKelas =
          k.semua_kelas ||
          k.kalender_kelas?.some(
            (kk) => String(kk.kelas) === String(j.kelas)
          );

        return kenaTanggal && kenaKelas;
      });

        const g = guru?.find(x => x.id_guru === j.id_guru);
        const m = mapel?.find(x => x.id_mapel === j.id_mapel);

        return {
          id: j.id_jadwal,
          tipe: j.jenis,
          kelas: j.kelas,
          hari,
          mapel: m?.nama || "-",
          guru: g?.nama || "-",
          time: `${String(j.mulai).slice(0,5)} - ${String(j.selesai).slice(0,5)}`,

          is_libur: match?.jenis === "libur",
          jenis: match?.jenis || null,
          keterangan_libur: match?.keterangan || null
        };
      });

    res.json(hasil);

  } catch (err) {
    console.log("minggu ini error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
