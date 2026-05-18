const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 0. Melihat Daftar Perizinan (multi-role)
const getDaftarIzin = async (req, res) => {
  try {
    const { id, role } = req.user;
    let whereClause = {};

    if (role === "MAHASISWA") {
      // Mahasiswa hanya lihat izin miliknya sendiri
      whereClause = { id_mahasiswa: id };
    } else if (role === "FASILITATOR") {
      // Fasilitator lihat semua izin di gedungnya
      const fasilitator = await prisma.fasilitator.findUnique({
        where: { id_fasilitator: id }
      });
      if (fasilitator) {
        whereClause = {
          mahasiswa: { id_gedung: fasilitator.id_gedung }
        };
      }
    }
    // SUPERADMIN -> tidak ada filter, lihat semua perizinan

    const daftarIzin = await prisma.perizinan.findMany({
      where: whereClause,
      include: {
        mahasiswa: { select: { nama: true, nim: true, nomor_kamar: true, gedung: { select: { nama_gedung: true } } } },
        fasilitator: { select: { nama: true } },
        konfirmasis: true
      },
      orderBy: { tanggal_pengajuan: 'desc' }
    });

    res.json({
      status: "Sukses",
      data: daftarIzin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data perizinan." });
  }
};

// 1. Mahasiswa Mengajukan Izin
const ajukanIzin = async (req, res) => {
  const { jenis_izin, tanggal_mulai, tanggal_selesai, alasan, dokumen_pendukung } = req.body;

  try {
    const id_mahasiswa = req.user.id;

    // Pastikan yang mengakses adalah Mahasiswa
    if (req.user.role !== "MAHASISWA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya mahasiswa yang dapat mengajukan izin." });
    }

    // Hitung otomatis durasi hari (misal tgl 10 sampai 12 = 3 hari)
    const mulai = new Date(tanggal_mulai);
    const selesai = new Date(tanggal_selesai);
    const durasi_hari = Math.ceil((selesai - mulai) / (1000 * 60 * 60 * 24)) + 1;

    // Pengecekan Izin Aktif (memblokir jika ada izin MENUNGGU/DISETUJUI yg belum lewat tgl selesai)
    const izinAktif = await prisma.perizinan.findFirst({
      where: {
        id_mahasiswa,
        status_pengajuan: {
          in: ['MENUNGGU', 'DISETUJUI']
        },
        tanggal_selesai: {
          gte: new Date() // Belum melewati tanggal selesai
        }
      }
    });

    if (izinAktif) {
      return res.status(400).json({
        message: 'Kamu masih memiliki pengajuan izin yang aktif. Selesaikan atau batalkan terlebih dahulu sebelum mengajukan izin baru.',
        izin_aktif: {
          id: izinAktif.id_perizinan,
          status: izinAktif.status_pengajuan,
          tanggal_selesai: izinAktif.tanggal_selesai
        }
      });
    }

    // Pengecekan Overlap: cek izin aktif yang tanggalnya bentrok
    const overlap = await prisma.perizinan.findFirst({
      where: {
        id_mahasiswa,
        status_pengajuan: { in: ["MENUNGGU", "DISETUJUI"] },
        AND: [
          { tanggal_mulai:   { lte: selesai } },
          { tanggal_selesai: { gte: mulai   } },
        ]
      }
    });
    if (overlap) {
      const fmt = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      return res.status(400).json({
        message: `Tanggal bentrok dengan izin yang sudah ada (${fmt(overlap.tanggal_mulai)} – ${fmt(overlap.tanggal_selesai)}). Pilih tanggal lain.`
      });
    }

    // Cek apakah ada upload file multer
    const urlDokumen = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

    // Simpan ke tabel Perizinan
    const izinBaru = await prisma.perizinan.create({
      data: {
        jenis_izin,
        tanggal_mulai: mulai,
        tanggal_selesai: selesai,
        durasi_hari,
        alasan,
        dokumen_pendukung: urlDokumen || dokumen_pendukung || null,
        id_mahasiswa,
        status_pengajuan: "MENUNGGU"
      }
    });

    // Beritahukan fasilitator yang mengurus gedung ini
    const mhs = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa },
      include: { gedung: { include: { fasilitators: true } } }
    });
    
    if (mhs && mhs.gedung && mhs.gedung.fasilitators) {
      const namaIzin = jenis_izin.replace('_', ' ').toLowerCase();
      const notifPromises = mhs.gedung.fasilitators.map(fasil =>
        prisma.notifikasi.create({
          data: {
            judul: `Pengajuan Izin Baru: ${mhs.nama}`,
            pesan: `${mhs.nama} mengajukan izin ${namaIzin} untuk ${durasi_hari} hari.`,
            tipe_notifikasi: 'IZIN',
            id_fasilitator: fasil.id_fasilitator,
            id_referensi: izinBaru.id_perizinan,
            link_tujuan: '/fasilitator/validasi-izin',
          }
        })
      );
      await Promise.all(notifPromises);
    }

    res.status(201).json({
      status: "Sukses",
      message: "Pengajuan izin berhasil dikirim dan menunggu validasi Fasilitator.",
      data: izinBaru
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengajukan izin." });
  }
};

// 2. Fasilitator Memvalidasi (Setuju/Tolak) Izin
const validasiIzin = async (req, res) => {
  const { id_perizinan } = req.params; // Diambil dari URL
  const { status_pengajuan, catatan_fasilitator } = req.body; // "DISETUJUI" atau "DITOLAK"

  try {
    const id_fasilitator = req.user.id;

    // Cek apakah data izin ada
    const izin = await prisma.perizinan.findUnique({ 
      where: { id_perizinan: Number(id_perizinan) } 
    });

    if (!izin) {
      return res.status(404).json({ message: "Data pengajuan izin tidak ditemukan." });
    }

    // Update status izin
    const izinUpdate = await prisma.perizinan.update({
      where: { id_perizinan: Number(id_perizinan) },
      data: {
        status_pengajuan,
        catatan_fasilitator,
        id_fasilitator_validasi: id_fasilitator,
        tanggal_validasi: new Date()
      }
    });

    // Jika DISETUJUI dan jenisnya PULANG_KAMPUNG, potong kuota mahasiswa
    if (status_pengajuan === "DISETUJUI" && izin.jenis_izin === "PULANG_KAMPUNG") {
      await prisma.mahasiswa.update({
        where: { id_mahasiswa: izin.id_mahasiswa },
        data: {
          kuota_izin_pulang: {
            decrement: izin.durasi_hari // Kurangi kuota
          }
        }
      });
    }

    // ====================================================
    // 👉 TAMBAHAN: KIRIM NOTIFIKASI OTOMATIS KE MAHASISWA
    // ====================================================
    let pesanNotif = `Pengajuan izin ${izin.jenis_izin.replace('_', ' ').toLowerCase()} Anda telah ${status_pengajuan} oleh Fasilitator.`;
    if (catatan_fasilitator) {
      pesanNotif += ` Catatan: ${catatan_fasilitator}`;
    }

    await prisma.notifikasi.create({
      data: {
        judul: `Status Pengajuan Izin: ${status_pengajuan}`,
        pesan: pesanNotif,
        tipe_notifikasi: "IZIN",
        id_mahasiswa: izin.id_mahasiswa,
        id_referensi: izin.id_perizinan,
        link_tujuan: `/mahasiswa/izin/${izin.id_perizinan}`,
      }
    });
    // ====================================================

    res.json({
      status: "Sukses",
      message: `Pengajuan izin berhasil di-${status_pengajuan} dan notifikasi telah dikirim!`,
      data: izinUpdate
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat validasi izin." });
  }
};

// 3. Mahasiswa Konfirmasi (Tiba di tujuan / Kembali ke asrama)
const konfirmasiIzin = async (req, res) => {
  const { id_perizinan, jenis_konfirmasi, lokasi_konfirmasi, keterangan, foto_bukti } = req.body;
  // jenis_konfirmasi wajib berisi: "SAMPAI_TUJUAN" atau "KEMBALI_ASRAMA"

  try {
    const id_mahasiswa = req.user.id;

    // Pastikan yang mengakses adalah Mahasiswa
    if (req.user.role !== "MAHASISWA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya mahasiswa yang dapat melakukan konfirmasi." });
    }

    // Cari data izinnya
    const izin = await prisma.perizinan.findUnique({ 
      where: { id_perizinan: Number(id_perizinan) } 
    });

    // Validasi apakah izin ada, milik dia, dan sudah di-ACC
    if (!izin || izin.id_mahasiswa !== id_mahasiswa) {
      return res.status(404).json({ message: "Data perizinan tidak ditemukan atau bukan milik Anda." });
    }
    if (izin.status_pengajuan !== "DISETUJUI") {
      return res.status(400).json({ message: "Izin ini belum disetujui, tidak bisa melakukan konfirmasi." });
    }

    // Cek apakah ada file yang diupload multer
    const urlFoto = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

    // Simpan data konfirmasi ke tabel KonfirmasiPerizinan
    const konfirmasiBaru = await prisma.konfirmasiPerizinan.create({
      data: {
        id_perizinan: Number(id_perizinan),
        jenis_konfirmasi, 
        lokasi_konfirmasi,
        keterangan,
        foto_bukti: urlFoto || foto_bukti || null // Pakai hasil multer jika ada
      }
    });

    // Jika konfirmasinya adalah KEMBALI_ASRAMA, ubah status izin jadi SELESAI
    if (jenis_konfirmasi === "KEMBALI_ASRAMA") {
      await prisma.perizinan.update({
        where: { id_perizinan: Number(id_perizinan) },
        data: { status_pengajuan: "SELESAI" }
      });
    }

    // ===========================================
    // UPDATE: NOTIFIKASI KE FASILITATOR (PROMPT 5)
    // ===========================================
    if (izin.id_fasilitator_validasi) {
      const mhs = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa } });
      const namaAsli = mhs ? mhs.nama : 'Seorang Mahasiswa';
      
      const judulNotif = jenis_konfirmasi === "SAMPAI_TUJUAN" ? `Konfirmasi Tiba - ${namaAsli}` : `Konfirmasi Kembali - ${namaAsli}`;
      const isiNotif = jenis_konfirmasi === "SAMPAI_TUJUAN" 
        ? `${namaAsli} sudah tiba di tujuan dan mengirim bukti foto.` 
        : `${namaAsli} sudah kembali ke asrama.`;
      const tipeNotif = jenis_konfirmasi === "SAMPAI_TUJUAN" ? "FOTO_BERANGKAT" : "FOTO_PULANG";

      await prisma.notifikasi.create({
        data: {
          judul: judulNotif,
          pesan: isiNotif,
          tipe_notifikasi: tipeNotif,
          id_fasilitator: izin.id_fasilitator_validasi,
          id_referensi: izin.id_perizinan,
          link_tujuan: '/fasilitator/kepulangan',
        }
      });
    }

    res.status(201).json({
      status: "Sukses",
      message: `Konfirmasi ${jenis_konfirmasi} berhasil dicatat!`,
      data: konfirmasiBaru
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat menyimpan konfirmasi." });
  }
};

// 4. Detail Izin
const getIzinDetail = async (req, res) => {
  const { id_perizinan } = req.params;
  try {
    const izin = await prisma.perizinan.findUnique({
      where: { id_perizinan: Number(id_perizinan) },
      include: {
        mahasiswa: { select: { nama: true, nim: true, nomor_kamar: true } },
        fasilitator: { select: { nama: true } },
        konfirmasis: { orderBy: { tanggal_konfirmasi: 'asc' } }
      }
    });

    if (!izin) return res.status(404).json({ message: "Data tidak ditemukan." });

    if (req.user.role === "MAHASISWA" && izin.id_mahasiswa !== req.user.id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    res.json({ status: "Sukses", data: izin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil detail izin" });
  }
};

// 5. Upload Foto Berangkat
const uploadFotoBerangkat = async (req, res) => {
  const { id_perizinan } = req.params;
  try {
    const id_mahasiswa = req.user.id;

    const izin = await prisma.perizinan.findUnique({
      where: { id_perizinan: Number(id_perizinan) }
    });

    if (!izin) return res.status(404).json({ message: "Data perizinan tidak ditemukan." });
    if (izin.id_mahasiswa !== id_mahasiswa) return res.status(403).json({ message: "Akses ditolak." });
    if (izin.status_pengajuan !== "DISETUJUI") {
      return res.status(400).json({ message: "Foto hanya bisa diupload jika izin sudah disetujui." });
    }
    if (!req.file) return res.status(400).json({ message: "File foto tidak ditemukan dalam request." });

    const fotoUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    const updated = await prisma.perizinan.update({
      where: { id_perizinan: Number(id_perizinan) },
      data: { foto_berangkat: fotoUrl }
    });

    // Kirim notifikasi ke fasilitator
    const mhs = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa },
      include: { gedung: { include: { fasilitators: true } } }
    });
    if (mhs?.gedung?.fasilitators?.length) {
      await Promise.all(mhs.gedung.fasilitators.map(fasil =>
        prisma.notifikasi.create({
          data: {
            judul: `Bukti Keberangkatan: ${mhs.nama}`,
            pesan: `${mhs.nama} telah mengunggah foto bukti tiba di tujuan.`,
            tipe_notifikasi: 'FOTO_BERANGKAT',
            id_fasilitator: fasil.id_fasilitator,
            id_referensi: Number(id_perizinan),
            link_tujuan: '/fasilitator/kepulangan',
          }
        })
      ));
    }

    res.json({ status: "Sukses", message: "Foto bukti keberangkatan berhasil diupload.", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan saat upload foto berangkat." });
  }
};

// 6. Upload Foto Pulang
const uploadFotoPulang = async (req, res) => {
  const { id_perizinan } = req.params;
  try {
    const id_mahasiswa = req.user.id;

    const izin = await prisma.perizinan.findUnique({
      where: { id_perizinan: Number(id_perizinan) }
    });

    if (!izin) return res.status(404).json({ message: "Data perizinan tidak ditemukan." });
    if (izin.id_mahasiswa !== id_mahasiswa) return res.status(403).json({ message: "Akses ditolak." });
    if (izin.status_pengajuan !== "DISETUJUI") {
      return res.status(400).json({ message: "Foto hanya bisa diupload jika izin sudah disetujui." });
    }
    // Pastikan foto berangkat sudah diupload lebih dulu
    if (!izin.foto_berangkat) {
      return res.status(400).json({
        message: "Upload foto bukti tiba di tujuan terlebih dahulu sebelum upload foto kepulangan."
      });
    }
    if (!req.file) return res.status(400).json({ message: "File foto tidak ditemukan dalam request." });

    const fotoUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    const updated = await prisma.perizinan.update({
      where: { id_perizinan: Number(id_perizinan) },
      data: { foto_pulang: fotoUrl }
    });

    // Jika kedua foto sudah ada, ubah status menjadi SELESAI
    const izinUpdated = await prisma.perizinan.findUnique({
      where: { id_perizinan: Number(id_perizinan) }
    });
    if (izinUpdated.foto_berangkat && izinUpdated.foto_pulang) {
      await prisma.perizinan.update({
        where: { id_perizinan: Number(id_perizinan) },
        data: { status_pengajuan: "SELESAI" }
      });
    }

    // Kirim notifikasi ke fasilitator
    const mhs2 = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa },
      include: { gedung: { include: { fasilitators: true } } }
    });
    if (mhs2?.gedung?.fasilitators?.length) {
      await Promise.all(mhs2.gedung.fasilitators.map(fasil =>
        prisma.notifikasi.create({
          data: {
            judul: `Bukti Kepulangan: ${mhs2.nama}`,
            pesan: `${mhs2.nama} telah mengunggah foto bukti kembali ke asrama.`,
            tipe_notifikasi: 'FOTO_PULANG',
            id_fasilitator: fasil.id_fasilitator,
            id_referensi: Number(id_perizinan),
            link_tujuan: '/fasilitator/kepulangan',
          }
        })
      ));
    }

    res.json({ status: "Sukses", message: "Foto bukti kepulangan berhasil diupload.", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan saat upload foto pulang." });
  }
};

// 7. Total Hari Izin Mahasiswa Bulan Ini (untuk fasilitator — ditampilkan di modal review)
const getTotalHariBulanIni = async (req, res) => {
  const { id_mahasiswa } = req.params;
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const izinBulanIni = await prisma.perizinan.findMany({
      where: {
        id_mahasiswa: Number(id_mahasiswa),
        status_pengajuan: 'DISETUJUI',
        tanggal_mulai: { gte: startOfMonth },
        tanggal_selesai: { lte: endOfMonth },
      },
      select: { durasi_hari: true }
    });

    const totalHari = izinBulanIni.reduce((sum, i) => sum + (i.durasi_hari || 0), 0);

    const namaBulan = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    res.json({
      status: 'Sukses',
      data: { total_hari: totalHari, nama_bulan: namaBulan }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil total hari izin.' });
  }
};

// 8. Batalkan Pengajuan (Mahasiswa)
const batalkanIzin = async (req, res) => {
  const { id_perizinan } = req.params;
  try {
    const id_mahasiswa = req.user.id;

    const izin = await prisma.perizinan.findUnique({
      where: { id_perizinan: Number(id_perizinan) }
    });

    if (!izin || izin.id_mahasiswa !== id_mahasiswa) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    if (izin.status_pengajuan !== 'MENUNGGU') {
      return res.status(400).json({ message: "Pengajuan hanya bisa dibatalkan jika masih berstatus MENUNGGU" });
    }

    const updatedIzin = await prisma.perizinan.update({
      where: { id_perizinan: Number(id_perizinan) },
      data: { 
        status_pengajuan: 'DIBATALKAN',
        updated_at: new Date()
      }
    });

    res.json({ status: "Sukses", message: "Pengajuan berhasil dibatalkan", data: updatedIzin });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat membatalkan pengajuan." });
  }
};

module.exports = { getDaftarIzin, ajukanIzin, validasiIzin, konfirmasiIzin, getIzinDetail, uploadFotoBerangkat, uploadFotoPulang, getTotalHariBulanIni, batalkanIzin };
