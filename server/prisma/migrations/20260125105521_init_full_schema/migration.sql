-- CreateTable
CREATE TABLE `gedung` (
    `id_gedung` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_gedung` VARCHAR(191) NOT NULL,
    `kode_gedung` VARCHAR(191) NOT NULL,
    `alamat` TEXT NOT NULL,
    `jumlah_lantai` INTEGER NOT NULL,
    `kapasitas_mahasiswa` INTEGER NOT NULL,
    `status_gedung` ENUM('AKTIF', 'RENOVASI', 'NON_AKTIF') NOT NULL DEFAULT 'AKTIF',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gedung_nama_gedung_key`(`nama_gedung`),
    UNIQUE INDEX `gedung_kode_gedung_key`(`kode_gedung`),
    PRIMARY KEY (`id_gedung`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mahasiswa` (
    `id_mahasiswa` INTEGER NOT NULL AUTO_INCREMENT,
    `nim` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `lantai` INTEGER NOT NULL,
    `nomor_kamar` VARCHAR(191) NOT NULL,
    `alamat_asal` VARCHAR(191) NULL,
    `no_telp` VARCHAR(191) NULL,
    `foto_profil` VARCHAR(191) NULL,
    `kuota_izin_pulang` INTEGER NOT NULL DEFAULT 10,
    `status_reward` ENUM('AMAN', 'PERINGATAN_1', 'PERINGATAN_2', 'DROP_OUT', 'REWARD_TERBAIK') NOT NULL DEFAULT 'AMAN',
    `status_hunian` ENUM('AKTIF', 'ALUMNI', 'KELUAR', 'SKORSING') NOT NULL DEFAULT 'AKTIF',
    `id_gedung` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mahasiswa_nim_key`(`nim`),
    UNIQUE INDEX `mahasiswa_email_key`(`email`),
    PRIMARY KEY (`id_mahasiswa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fasilitator_asrama` (
    `id_fasilitator` INTEGER NOT NULL AUTO_INCREMENT,
    `nip` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `no_telp` VARCHAR(191) NULL,
    `foto_profil` VARCHAR(191) NULL,
    `id_gedung` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fasilitator_asrama_nip_key`(`nip`),
    UNIQUE INDEX `fasilitator_asrama_email_key`(`email`),
    PRIMARY KEY (`id_fasilitator`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ketua_pokja_asrama` (
    `id_ketua_pokja` INTEGER NOT NULL AUTO_INCREMENT,
    `nip` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `no_telp` VARCHAR(191) NULL,
    `foto_profil` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ketua_pokja_asrama_nip_key`(`nip`),
    UNIQUE INDEX `ketua_pokja_asrama_email_key`(`email`),
    PRIMARY KEY (`id_ketua_pokja`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kegiatan_pembinaan` (
    `id_kegiatan` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_kegiatan` VARCHAR(191) NOT NULL,
    `deskripsi` TEXT NULL,
    `tanggal_kegiatan` DATE NOT NULL,
    `waktu_mulai` TIME NOT NULL,
    `waktu_selesai` TIME NOT NULL,
    `lokasi` VARCHAR(191) NOT NULL,
    `jenis_kegiatan` ENUM('SHALAT_SUBUH', 'APEL_MALAM', 'KAJIAN', 'SENAM', 'GOTONG_ROYONG', 'LAINNYA') NOT NULL,
    `status_kegiatan` ENUM('TERJADWAL', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN') NOT NULL DEFAULT 'TERJADWAL',
    `id_gedung` INTEGER NOT NULL,
    `id_fasilitator` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_kegiatan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `petugas_absensi` (
    `id_petugas` INTEGER NOT NULL AUTO_INCREMENT,
    `lantai_tanggung_jawab` INTEGER NOT NULL,
    `tanggal_penugasan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status_tugas` ENUM('DITUGASKAN', 'SELESAI', 'TIDAK_MENGERJAKAN') NOT NULL DEFAULT 'DITUGASKAN',
    `waktu_submit` DATETIME(3) NULL,
    `id_kegiatan` INTEGER NOT NULL,
    `id_mahasiswa` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_petugas`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kehadiran` (
    `id_kehadiran` INTEGER NOT NULL AUTO_INCREMENT,
    `status_kehadiran` ENUM('HADIR', 'IZIN', 'SAKIT', 'ALPHA') NOT NULL,
    `waktu_absen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` TEXT NULL,
    `id_kegiatan` INTEGER NOT NULL,
    `id_mahasiswa` INTEGER NOT NULL,
    `id_petugas_input` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_kehadiran`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rekap_absensi` (
    `id_rekap` INTEGER NOT NULL AUTO_INCREMENT,
    `bulan` INTEGER NOT NULL,
    `tahun` INTEGER NOT NULL,
    `total_kegiatan` INTEGER NOT NULL,
    `total_hadir` INTEGER NOT NULL,
    `total_izin` INTEGER NOT NULL,
    `total_alpha` INTEGER NOT NULL,
    `persentase_kehadiran` DECIMAL(5, 2) NOT NULL,
    `status_reward` ENUM('AMAN', 'PERINGATAN_1', 'PERINGATAN_2', 'DROP_OUT', 'REWARD_TERBAIK') NOT NULL,
    `tanggal_generate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggal_publikasi` DATETIME(3) NULL,
    `status_publikasi` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `id_gedung` INTEGER NOT NULL,
    `id_mahasiswa` INTEGER NOT NULL,
    `id_fasilitator_generate` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_rekap`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perizinan` (
    `id_perizinan` INTEGER NOT NULL AUTO_INCREMENT,
    `jenis_izin` ENUM('PULANG_KAMPUNG', 'KEGIATAN_LUAR') NOT NULL,
    `tanggal_pengajuan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NOT NULL,
    `durasi_hari` INTEGER NOT NULL,
    `alasan` TEXT NOT NULL,
    `dokumen_pendukung` VARCHAR(191) NULL,
    `status_pengajuan` ENUM('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN', 'SELESAI') NOT NULL DEFAULT 'MENUNGGU',
    `tanggal_validasi` DATETIME(3) NULL,
    `catatan_fasilitator` TEXT NULL,
    `id_mahasiswa` INTEGER NOT NULL,
    `id_fasilitator_validasi` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_perizinan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `konfirmasi_perizinan` (
    `id_konfirmasi` INTEGER NOT NULL AUTO_INCREMENT,
    `jenis_konfirmasi` ENUM('SAMPAI_TUJUAN', 'KEMBALI_ASRAMA') NOT NULL,
    `tanggal_konfirmasi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `foto_bukti` VARCHAR(191) NULL,
    `lokasi_konfirmasi` VARCHAR(191) NULL,
    `keterangan` TEXT NULL,
    `id_perizinan` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_konfirmasi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluasi_pembinaan` (
    `id_evaluasi` INTEGER NOT NULL AUTO_INCREMENT,
    `tanggal_evaluasi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `catatan_evaluasi` TEXT NOT NULL,
    `tindak_lanjut` TEXT NULL,
    `bulan_periode` INTEGER NOT NULL,
    `tahun_periode` INTEGER NOT NULL,
    `id_ketua_pokja` INTEGER NOT NULL,
    `id_fasilitator` INTEGER NOT NULL,
    `id_gedung` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_evaluasi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifikasi` (
    `id_notifikasi` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(191) NOT NULL,
    `pesan` TEXT NOT NULL,
    `tanggal_kirim` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status_baca` BOOLEAN NOT NULL DEFAULT false,
    `tipe_notifikasi` ENUM('INFO', 'PERINGATAN', 'PENGUMUMAN', 'IZIN') NOT NULL,
    `id_referensi` INTEGER NULL,
    `dibaca_pada` DATETIME(3) NULL,
    `id_mahasiswa` INTEGER NULL,
    `id_fasilitator` INTEGER NULL,
    `id_ketua_pokja` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_notifikasi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_id_gedung_fkey` FOREIGN KEY (`id_gedung`) REFERENCES `gedung`(`id_gedung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fasilitator_asrama` ADD CONSTRAINT `fasilitator_asrama_id_gedung_fkey` FOREIGN KEY (`id_gedung`) REFERENCES `gedung`(`id_gedung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan_pembinaan` ADD CONSTRAINT `kegiatan_pembinaan_id_gedung_fkey` FOREIGN KEY (`id_gedung`) REFERENCES `gedung`(`id_gedung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan_pembinaan` ADD CONSTRAINT `kegiatan_pembinaan_id_fasilitator_fkey` FOREIGN KEY (`id_fasilitator`) REFERENCES `fasilitator_asrama`(`id_fasilitator`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `petugas_absensi` ADD CONSTRAINT `petugas_absensi_id_kegiatan_fkey` FOREIGN KEY (`id_kegiatan`) REFERENCES `kegiatan_pembinaan`(`id_kegiatan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `petugas_absensi` ADD CONSTRAINT `petugas_absensi_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `mahasiswa`(`id_mahasiswa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kehadiran` ADD CONSTRAINT `kehadiran_id_kegiatan_fkey` FOREIGN KEY (`id_kegiatan`) REFERENCES `kegiatan_pembinaan`(`id_kegiatan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kehadiran` ADD CONSTRAINT `kehadiran_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `mahasiswa`(`id_mahasiswa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kehadiran` ADD CONSTRAINT `kehadiran_id_petugas_input_fkey` FOREIGN KEY (`id_petugas_input`) REFERENCES `petugas_absensi`(`id_petugas`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rekap_absensi` ADD CONSTRAINT `rekap_absensi_id_gedung_fkey` FOREIGN KEY (`id_gedung`) REFERENCES `gedung`(`id_gedung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rekap_absensi` ADD CONSTRAINT `rekap_absensi_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `mahasiswa`(`id_mahasiswa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rekap_absensi` ADD CONSTRAINT `rekap_absensi_id_fasilitator_generate_fkey` FOREIGN KEY (`id_fasilitator_generate`) REFERENCES `fasilitator_asrama`(`id_fasilitator`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perizinan` ADD CONSTRAINT `perizinan_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `mahasiswa`(`id_mahasiswa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perizinan` ADD CONSTRAINT `perizinan_id_fasilitator_validasi_fkey` FOREIGN KEY (`id_fasilitator_validasi`) REFERENCES `fasilitator_asrama`(`id_fasilitator`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `konfirmasi_perizinan` ADD CONSTRAINT `konfirmasi_perizinan_id_perizinan_fkey` FOREIGN KEY (`id_perizinan`) REFERENCES `perizinan`(`id_perizinan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluasi_pembinaan` ADD CONSTRAINT `evaluasi_pembinaan_id_ketua_pokja_fkey` FOREIGN KEY (`id_ketua_pokja`) REFERENCES `ketua_pokja_asrama`(`id_ketua_pokja`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluasi_pembinaan` ADD CONSTRAINT `evaluasi_pembinaan_id_fasilitator_fkey` FOREIGN KEY (`id_fasilitator`) REFERENCES `fasilitator_asrama`(`id_fasilitator`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluasi_pembinaan` ADD CONSTRAINT `evaluasi_pembinaan_id_gedung_fkey` FOREIGN KEY (`id_gedung`) REFERENCES `gedung`(`id_gedung`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_id_mahasiswa_fkey` FOREIGN KEY (`id_mahasiswa`) REFERENCES `mahasiswa`(`id_mahasiswa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_id_fasilitator_fkey` FOREIGN KEY (`id_fasilitator`) REFERENCES `fasilitator_asrama`(`id_fasilitator`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_id_ketua_pokja_fkey` FOREIGN KEY (`id_ketua_pokja`) REFERENCES `ketua_pokja_asrama`(`id_ketua_pokja`) ON DELETE SET NULL ON UPDATE CASCADE;
