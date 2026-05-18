import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiGetMahasiswaAsrama, apiBuatKegiatan } from '../../utils/api';

const MENU = [
  { path: '/fasilitator/dashboard',  label: 'Dashboard',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { path: '/fasilitator/kegiatan',   label: 'Kelola Kegiatan', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/perizinan',  label: 'Validasi Izin',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/kepulangan', label: 'Kepulangan',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg> },
  { path: '/fasilitator/rekap',      label: 'Rekap Absensi',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/></svg> },
];

// 10 opsi blok tetap
const SLOT_OPTIONS = [
  '1-A', '1-B', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B', '5-A', '5-B'
];
const TOTAL_SLOT = 10;

function labelSlot(key) {
  const [lantai, blok] = key.split('-');
  return `Lantai ${lantai}  blok ${blok}`;
}

function PilihPetugasPage() {
  const navigate = useNavigate();

  const [draft, setDraft]               = useState(null);
  const [mahasiswaAll, setMahasiswaAll] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');

  // Dropdown pilihan lantai-blok aktif
  const [selectedSlot, setSelectedSlot] = useState('');

  // Map slot → petugas terpilih: { lantai, blok, id_mahasiswa, nama, nim }
  const [petugasMap, setPetugasMap] = useState({});

  useEffect(() => {
    const raw = sessionStorage.getItem('draft_kegiatan');
    if (!raw) { navigate('/fasilitator/kegiatan/tambah'); return; }
    setDraft(JSON.parse(raw));

    apiGetMahasiswaAsrama()
      .then(res => { if (res.data) setMahasiswaAll(res.data); })
      .finally(() => setLoading(false));
  }, []);

  // ── Filter mahasiswa berdasarkan slot yang dipilih ──────────
  const getMhsFiltered = (slot) => {
    if (!slot) return [];
    const [lantai, blok] = slot.split('-');
    return mahasiswaAll.filter(m =>
      m.lantai === Number(lantai) &&
      m.nomor_kamar?.toUpperCase().startsWith(blok)
    );
  };

  const listFiltered = getMhsFiltered(selectedSlot);

  // ── Tunjuk petugas ───────────────────────────────────────────
  const handleTunjuk = (mhs) => {
    if (!selectedSlot) return;
    const [lantai, blok] = selectedSlot.split('-');
    setPetugasMap(prev => ({
      ...prev,
      [selectedSlot]: {
        lantai:       Number(lantai),
        blok,
        id_mahasiswa: mhs.id_mahasiswa,
        nama:         mhs.nama,
        nim:          mhs.nim,
      }
    }));
  };

  // ── Progress ─────────────────────────────────────────────────
  const terisiCount = Object.keys(petugasMap).length;
  const semuaTerisi = terisiCount === TOTAL_SLOT;
  const progressPct = Math.round((terisiCount / TOTAL_SLOT) * 100);

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true); setError('');

    const petugasList = Object.values(petugasMap).map(p => ({
      lantai:       p.lantai,
      blok:         p.blok,
      id_mahasiswa: p.id_mahasiswa,
    }));

    try {
      const res = await apiBuatKegiatan({ ...draft, petugas: petugasList });
      if (res.status === 'Sukses') {
        sessionStorage.removeItem('draft_kegiatan');
        sessionStorage.setItem('kegiatan_success', 'Kegiatan berhasil dibuat dan petugas sudah ditugaskan!');
        setSuccessMsg('Kegiatan berhasil dibuat! Mengalihkan...');
        setTimeout(() => navigate('/fasilitator/kegiatan'), 1200);
      } else {
        setError(res.message || 'Terjadi kesalahan saat menyimpan.');
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout menuItems={MENU}>
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ height: '56px', borderRadius: '12px' }} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── Petugas terpilih di slot aktif ───────────────────────────
  const petugasSlotAktif = selectedSlot ? petugasMap[selectedSlot] : null;

  return (
    <DashboardLayout menuItems={MENU}>
      <div className="page-enter" style={{ padding: '32px', maxWidth: '800px' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px', color: '#94a3b8' }}>
          <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => navigate('/fasilitator/kegiatan')}>Kelola Kegiatan</span>
          <span>›</span>
          <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => navigate('/fasilitator/kegiatan/tambah')}>Tambah Kegiatan</span>
          <span>›</span>
          <span style={{ color: '#1e293b', fontWeight: '600' }}>Pilih Petugas</span>
        </div>

        {/* ── Step Indicator ── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
          {[{ n: 1, label: 'Info Kegiatan', done: true }, { n: 2, label: 'Pilih Petugas', active: true }].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: s.done ? 'white' : '#10b981',
                  color: s.done ? '#10b981' : 'white',
                  border: s.done ? '2px solid #10b981' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '14px',
                }}>{s.done ? '✓' : s.n}</div>
                <span style={{ fontWeight: s.active ? '600' : '400', color: s.active ? '#1e293b' : '#94a3b8', fontSize: '14px' }}>{s.label}</span>
              </div>
              {i < 1 && <div style={{ width: '48px', height: '2px', background: '#10b981', margin: '0 12px' }} />}
            </div>
          ))}
        </div>

        {/* ── Alert ── */}
        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
            ⚠ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#047857', fontSize: '13px', marginBottom: '16px' }}>
            ✓ {successMsg}
          </div>
        )}

        {/* ── Card Utama ── */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '20px' }}>

          {/* Header card */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>Pilih Petugas Absensi</h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Pilih 1 mahasiswa sebagai petugas untuk setiap blok di tiap lantai</p>
            </div>
          </div>

          <div style={{ padding: '24px' }}>

            {/* ── 1. Dropdown Pilih Lantai & Blok ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                1. Pilih Lantai &amp; Blok
              </label>
              <select
                value={selectedSlot}
                onChange={e => setSelectedSlot(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  border: `1.5px solid ${selectedSlot ? '#10b981' : '#e2e8f0'}`,
                  background: selectedSlot ? '#f0fdf4' : '#f8fafc',
                  color: selectedSlot ? '#065f46' : '#374151',
                  fontSize: '14px', fontWeight: '500',
                  outline: 'none', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <option value="">- Pilih Lantai &amp; Blok -</option>
                {SLOT_OPTIONS.map(slot => (
                  <option key={slot} value={slot}>
                    {labelSlot(slot)}
                    {petugasMap[slot] ? ` ✓ (${petugasMap[slot].nama})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* ── 2. Tabel Mahasiswa ── */}
            {selectedSlot && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                  2. Daftar Mahasiswa — {labelSlot(selectedSlot)}
                  <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '400', color: '#94a3b8' }}>
                    ({listFiltered.length} mahasiswa)
                  </span>
                </label>

                {listFiltered.length === 0 ? (
                  <div style={{ padding: '24px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '10px', color: '#92400e', textAlign: 'center', fontSize: '14px' }}>
                    ⚠ Tidak ada mahasiswa di {labelSlot(selectedSlot)}
                  </div>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['No', 'Nama', 'NIM', 'Kamar', 'Aksi'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {listFiltered.map((mhs, i) => {
                          const isTerpilih = petugasMap[selectedSlot]?.id_mahasiswa === mhs.id_mahasiswa;
                          return (
                            <tr key={mhs.id_mahasiswa} style={{ background: isTerpilih ? '#f0fdf4' : 'white', borderTop: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                              <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', width: '48px' }}>{i + 1}</td>
                              <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: isTerpilih ? '600' : '400' }}>
                                {mhs.nama}
                                {isTerpilih && (
                                  <span style={{ marginLeft: '8px', background: '#10b981', color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
                                    ✓ Terpilih
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>{mhs.nim}</td>
                              <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{mhs.nomor_kamar}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <button
                                  onClick={() => handleTunjuk(mhs)}
                                  style={{
                                    padding: '6px 14px', borderRadius: '8px', border: 'none',
                                    background: isTerpilih ? '#d1fae5' : '#10b981',
                                    color: isTerpilih ? '#065f46' : 'white',
                                    fontSize: '12px', fontWeight: '600',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {isTerpilih ? '✓ Sudah Ditunjuk' : 'Tunjuk Petugas'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Placeholder jika belum pilih slot */}
            {!selectedSlot && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Pilih lantai & blok di atas untuk melihat daftar mahasiswa</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Progress & Summary ── */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Progress Penugasan</span>
            <span style={{
              fontSize: '13px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px',
              background: semuaTerisi ? '#d1fae5' : (terisiCount > 0 ? '#fef3c7' : '#f1f5f9'),
              color: semuaTerisi ? '#065f46' : (terisiCount > 0 ? '#92400e' : '#64748b'),
            }}>
              {terisiCount} / {TOTAL_SLOT} blok
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              background: semuaTerisi ? '#10b981' : 'linear-gradient(90deg, #10b981, #34d399)',
              width: `${progressPct}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Daftar blok yg sudah terisi */}
          {terisiCount > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SLOT_OPTIONS.map(slot => {
                const p = petugasMap[slot];
                if (!p) return null;
                return (
                  <span key={slot} style={{
                    background: selectedSlot === slot ? '#10b981' : '#ecfdf5',
                    color: selectedSlot === slot ? 'white' : '#065f46',
                    border: `1px solid ${selectedSlot === slot ? '#10b981' : '#a7f3d0'}`,
                    fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                    borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onClick={() => setSelectedSlot(slot)}
                    title={`${labelSlot(slot)}: ${p.nama}`}
                  >
                    {labelSlot(slot)}: {p.nama.split(' ')[0]}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tombol Aksi ── */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/fasilitator/kegiatan/tambah')}
            style={{
              flexShrink: 0, padding: '13px 24px', borderRadius: '10px',
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              color: '#64748b', fontWeight: '600', fontSize: '14px',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            Kembali
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1, padding: '13px 24px', borderRadius: '10px', border: 'none',
              background: !submitting
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : '#e2e8f0',
              color: !submitting ? 'white' : '#94a3b8',
              fontWeight: '700', fontSize: '15px',
              cursor: !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              boxShadow: !submitting ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
            }}
          >
            {submitting ? ' Menyimpan...' : ' Simpan Kegiatan'}
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default PilihPetugasPage;
