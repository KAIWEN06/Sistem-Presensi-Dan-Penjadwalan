const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const requireAuth = require("../middleware/auth");
const multer = require("multer");
const XLSX = require("xlsx");

const upload = multer({
  storage: multer.memoryStorage()
});

/* =====================================================
   HELPERS
===================================================== */

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
/* =====================================================
   ROLLOVER TAHUN AJARAN
===================================================== */

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
      .select(
        `
          nis,
          kelas,
          status,
          murid (
            nama,
            nama_ortu
          )
        `
      )
      .eq("tahun_id", tahunAktif.id)
      .order("kelas", { ascending: true });

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
      .select(
        `
            nis,
            kelas,
            tahun_id,
            murid(nama)
          `
      )
      .eq("status", "lulus")
      .order("tahun_id", {
        ascending: false
      });

    if (error) throw error;

    res.json(
      (data || []).map(x => ({
        nis: x.nis,
        nama: (x.murid && x.murid.nama) || "-",
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

      let gagal = 0;
      let berhasil = 0;

      const tahun = await supabase
        .from("tahun_ajaran")
        .select("id")
        .eq("aktif", true)
        .single();

      const tahunId = (tahun.data && tahun.data.id) || null;
      for (const row of rows) {
        const nis = String(row.NIS || "").trim();

        const nama = String(row.NAMA || "").trim();

        const namaOrtu = String(
          row.NAMA_ORANG_TUA || ""
        ).trim();

        const namaKelas = String(
          row.KELAS || ""
        ).trim();

        // VALIDASI WAJIB
        if (!nis || !nama || !namaKelas) {
          gagal++;
          continue;
        }

        const { data: kelasDb } = await supabase
          .from("kelas")
          .select("id")
          .eq("nama", namaKelas)
          .eq("status", "aktif")
          .single();

        if (!kelasDb) {
          gagal++;
          continue;
        }

        await supabase.from("murid").upsert([
          {
            nis,
            nama,
            nama_ortu: namaOrtu || null
          }
        ]);

        await supabase.from("kelas_siswa").upsert([
          {
            nis,
            kelas: kelasDb.id,
            tahun_id: tahunId,
            status: "aktif"
          }
        ]);

        berhasil++;
      }

      res.json({
        message: "Upload berhasil"
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

    const hasil = (data || []).map((j) => ({
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
      pengawas_id: j.pengawas_id,
      rentangWaktu:
        `${(j.mulai || "--:--").slice(0,5)} - ${(j.selesai || "--:--").slice(0,5)}`
    }));

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
      selesai
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

/* =====================================================
   DASHBOARD JADWAL HARI INI
===================================================== */

router.get("/jadwal/hari-ini", async (req, res) => {
  try {
    const hariList = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu"
    ];

    const now = new Date();
    const hariIni = hariList[now.getDay()];
    const tgl = now.toISOString().slice(0, 10);

    /* tahun aktif */
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    const { data: jadwal, error } = await supabase
      .from("jadwal")
      .select("*")
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", { ascending: true });

    if (error) throw error;

    const { data: guru } = await supabase
      .from("guru")
      .select("id_guru,nama");

    const { data: mapel } = await supabase
      .from("mapel")
      .select("id_mapel,nama");

    const hasil = (jadwal || [])
      .filter((j) =>
        (j.jenis === "pelajaran" && j.hari === hariIni) ||
        (j.jenis === "ujian" && j.tanggal === tgl)
      )
      .map((j) => {
        const g = (guru || []).find(
          (x) => x.id_guru === j.id_guru
        );

        const m = (mapel || []).find(
          (x) => x.id_mapel === j.id_mapel
        );

        return {
          id: j.id_jadwal,
          tipe: j.jenis,
          kelas: `Kelas ${j.kelas}`,
          hari: hariIni,
          mapel: m?.nama || "-",
          guru: g?.nama || "-",
          time:
            `${String(j.mulai).slice(0,5)} - ${String(j.selesai).slice(0,5)}`
        };
      });

    res.json(hasil);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

/* =====================================================
   DASHBOARD JADWAL MINGGU INI
===================================================== */

router.get("/jadwal/minggu-ini", async (req, res) => {
  try {
    const now = new Date();

    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const senin = new Date(now);
    senin.setDate(now.getDate() + diff);

    const minggu = new Date(senin);
    minggu.setDate(senin.getDate() + 6);

    const start = senin.toISOString().slice(0,10);
    const end = minggu.toISOString().slice(0,10);

    const hariMap = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu"
    ];

    /* tahun aktif */
    const { data: tahunAktif, error: errTahun } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .single();

    if (errTahun) throw errTahun;

    const { data: jadwal, error } = await supabase
      .from("jadwal")
      .select("*")
      .eq("status", "aktif")
      .eq("tahun_id", tahunAktif.id)
      .order("mulai", { ascending: true });

    if (error) throw error;

    const { data: guru } = await supabase
      .from("guru")
      .select("id_guru,nama");

    const { data: mapel } = await supabase
      .from("mapel")
      .select("id_mapel,nama");

    const hasil = (jadwal || [])
      .filter((j) => {
        if (j.jenis === "pelajaran") return true;

        if (
          j.jenis === "ujian" &&
          j.tanggal >= start &&
          j.tanggal <= end
        ) return true;

        return false;
      })
      .map((j) => {
        let hari = j.hari;

        if (j.jenis === "ujian" && j.tanggal) {
          hari = hariMap[new Date(j.tanggal).getDay()];
        }

        const g = (guru || []).find(
          (x) => x.id_guru === j.id_guru
        );

        const m = (mapel || []).find(
          (x) => x.id_mapel === j.id_mapel
        );

        return {
          id: j.id_jadwal,
          tipe: j.jenis,
          kelas: `Kelas ${j.kelas}`,
          hari,
          mapel: m?.nama || "-",
          guru: g?.nama || "-",
          time:
            `${String(j.mulai).slice(0,5)} - ${String(j.selesai).slice(0,5)}`
        };
      });

    res.json(hasil);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
