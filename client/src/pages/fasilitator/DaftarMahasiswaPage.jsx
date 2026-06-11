import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import * as xlsx from 'xlsx';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

import { FASILITATOR_MENU } from './fasilitatorMenu';

// Local Icons
const IconUpload = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconDownload = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

const IconActionDetail = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconActionEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconActionKey = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IconActionOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>;
const IconActionOn = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>;

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}>*</span>}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required, placeholder }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}>*</span>}</label>
      <select value={value} onChange={onChange} required={required} style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function DaftarMahasiswaPage() {
  const [mahasiswas, setMahasiswas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [fakultasList, setFakultasList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nim: '', nama: '', email: '', lantai: '', nomor_kamar: '', id_fakultas: '', id_jurusan: '', alamat_asal: '', no_telp: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const [importData, setImportData] = useState([]);
  const [importSummary, setImportSummary] = useState({ valid: 0, error: 0 });
  const fileInputRef = useRef(null);
  const [isTAAktif, setIsTAAktif] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/mahasiswa/fasilitator-list`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      if (res.ok) {
        setMahasiswas(json.data || []);
        if (json.isTahunAkademikAktif !== undefined) {
          setIsTAAktif(json.isTahunAkademikAktif);
        }
      } else setError(json.message || 'Gagal memuat daftar mahasiswa.');
    } catch (err) { setError('Tidak bisa terhubung ke server.'); }
    finally { setLoading(false); }
  }, []);

  const loadMasterData = useCallback(async () => {
    try {
      const [resFak, resJur] = await Promise.all([
        fetch(`${API}/api/mahasiswa/fakultas-list`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/mahasiswa/jurusan-list`, { headers: { Authorization: `Bearer ${token()}` } })
      ]);
      if (resFak.ok) setFakultasList((await resFak.json()).data || []);
      if (resJur.ok) setJurusanList((await resJur.json()).data || []);
    } catch {}
  }, []);

  useEffect(() => { loadData(); loadMasterData(); }, [loadData, loadMasterData]);

  const openTambah = () => {
    if (!isTAAktif) {
      setConfirmAction({ title: 'Peringatan', message: 'Tidak dapat menambahkan mahasiswa. Pastikan ada Tahun Akademik yang aktif (Hubungi Superadmin).', isInfo: true });
      return;
    }
    setForm({ nim: '', nama: '', email: '', lantai: '', nomor_kamar: '', id_fakultas: '', id_jurusan: '', alamat_asal: '', no_telp: '' });
    setSelected(null); setModal('tambah'); setMsg('');
  };

  const openEdit = (m) => {
    setForm({ nim: m.nim, nama: m.nama, email: m.email, lantai: String(m.lantai), nomor_kamar: m.nomor_kamar, id_fakultas: m.id_fakultas || '', id_jurusan: m.id_jurusan || '', alamat_asal: m.alamat_asal || '', no_telp: m.no_telp || '' });
    setSelected(m); setModal('edit'); setMsg('');
  };

  const openDetail = (m) => {
    setSelected(m);
    setModal('detail');
    setMsg('');
  };

  const openImport = () => {
    if (!isTAAktif) {
      setConfirmAction({ title: 'Peringatan', message: 'Tidak dapat mengimport mahasiswa. Pastikan ada Tahun Akademik yang aktif (Hubungi Superadmin).', isInfo: true });
      return;
    }
    setImportData([]);
    setImportSummary({ valid: 0, error: 0 });
    setModal('import');
    setMsg('');
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`${API}/api/mahasiswa/fasilitator-template`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) throw new Error('Gagal mendownload template.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Mahasiswa.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setConfirmAction({ title: 'Gagal', message: error.message, isInfo: true });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        
        const rows = data.slice(1);
        let validCount = 0;
        let errorCount = 0;

        const parsedData = rows.map((row, index) => {
          const [nim, nama, email, lantai, nomor_kamar, alamat_asal, no_telp] = row;
          let isValid = true;
          let errorMessage = '';

          if (!nim) { isValid = false; errorMessage = 'NIM kosong'; }
          else if (!nama) { isValid = false; errorMessage = 'Nama kosong'; }
          else if (!email) { isValid = false; errorMessage = 'Email kosong'; }
          else if (!lantai) { isValid = false; errorMessage = 'Lantai kosong'; }
          else if (!nomor_kamar) { isValid = false; errorMessage = 'Nomor kamar kosong'; }

          if (isValid) validCount++;
          else errorCount++;

          return { 
            no: index + 1, 
            nim, nama, email, lantai, nomor_kamar, alamat_asal, no_telp, 
            isValid, errorMessage 
          };
        });

        setImportData(parsedData);
        setImportSummary({ valid: validCount, error: errorCount });
      } catch (error) {
        setMsg('Gagal memproses file Excel.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleKonfirmasiImport = async () => {
    const validData = importData.filter(d => d.isValid).map(d => ({
      nim: String(d.nim),
      nama: d.nama,
      email: d.email,
      lantai: Number(d.lantai),
      nomor_kamar: d.nomor_kamar,
      alamat_asal: d.alamat_asal,
      no_telp: d.no_telp
    }));

    if (validData.length === 0) return;

    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`${API}/api/mahasiswa/fasilitator-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ data: validData })
      });
      const json = await res.json();
      if (res.ok) {
        setModal(null);
        loadData();
        setConfirmAction({ title: 'Import Selesai', message: `Import berhasil diselesaikan!\n\nBerhasil: ${json.data.berhasil} mahasiswa\nGagal: ${json.data.gagal} mahasiswa`, isInfo: true });
      } else {
        setMsg(json.message || 'Gagal import data');
      }
    } catch (error) {
      setMsg('Error koneksi ke server saat import.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const url = modal === 'tambah' ? `${API}/api/mahasiswa/fasilitator-tambah` : `${API}/api/mahasiswa/fasilitator-edit/${selected.id_mahasiswa}`;
      const method = modal === 'tambah' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (res.ok) { setModal(null); loadData(); }
      else setMsg(json.message);
    } catch { setMsg('Error koneksi ke server.'); }
    finally { setSaving(false); }
  };

  const handleNonaktifkan = (m) => {
    setConfirmAction({
      title: 'Konfirmasi Penonaktifan',
      message: `Yakin ingin menonaktifkan "${m.nama}"? (Status akan menjadi ALUMNI)`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/mahasiswa/fasilitator-nonaktif/${m.id_mahasiswa}`, {
            method: 'PATCH', headers: { Authorization: `Bearer ${token()}` }
          });
          if (res.ok) { 
            loadData(); 
            setConfirmAction({ title: 'Sukses', message: 'Mahasiswa berhasil dinonaktifkan.', isInfo: true }); 
          } 
          else setMsg((await res.json()).message || 'Gagal menonaktifkan.');
        } catch { setMsg('Error server.'); }
      }
    });
  };

  const handleAktifkan = (m) => {
    setConfirmAction({
      title: 'Konfirmasi Pengaktifan',
      message: `Yakin ingin mengaktifkan kembali "${m.nama}"? (Status akan menjadi AKTIF)`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/mahasiswa/fasilitator-aktif/${m.id_mahasiswa}`, {
            method: 'PATCH', headers: { Authorization: `Bearer ${token()}` }
          });
          if (res.ok) { 
            loadData(); 
            setConfirmAction({ title: 'Sukses', message: 'Mahasiswa berhasil diaktifkan kembali.', isInfo: true }); 
          } 
          else setMsg((await res.json()).message || 'Gagal mengaktifkan.');
        } catch { setMsg('Error server.'); }
      }
    });
  };

  const handleResetPassword = (m) => {
    setConfirmAction({
      title: 'Reset Password',
      message: `Yakin mereset password "${m.nama}" ke NIM-nya?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/mahasiswa/fasilitator-reset-password/${m.id_mahasiswa}`, {
            method: 'PATCH', headers: { Authorization: `Bearer ${token()}` }
          });
          if (res.ok) { 
            setConfirmAction({ title: 'Sukses', message: 'Password berhasil di-reset!', isInfo: true }); 
          } 
          else setMsg((await res.json()).message || 'Gagal reset password.');
        } catch { setMsg('Error server.'); }
      }
    });
  };

  return (
    <DashboardLayout menuItems={FASILITATOR_MENU}>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Daftar Mahasiswa</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Kelola daftar mahasiswa di gedung Anda</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleDownloadTemplate} style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconDownload /> Download Template
            </button>
            <button onClick={openImport} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <IconUpload /> Import Excel
            </button>
            <button onClick={openTambah} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Tambah Mahasiswa
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Memuat data mahasiswa...
          </div>
        ) : error ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626' }}>{error}</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Nama', 'NIM', 'Fakultas / Jurusan', 'Kamar', 'Email', 'Status', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mahasiswas.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Belum ada data mahasiswa.</td></tr>
                  ) : (
                    mahasiswas.map(m => (
                      <tr key={m.id_mahasiswa} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{m.nama}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>{m.nim}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{m.fakultas ? m.fakultas.nama : '-'}</div>
                          <div style={{ fontSize: '12px', marginTop: '2px' }}>{m.jurusan ? m.jurusan.nama : '-'}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>Lt.{m.lantai} / {m.nomor_kamar}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>{m.email}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                          <span style={{ background: m.status_hunian === 'AKTIF' ? '#ecfdf5' : '#fef2f2', color: m.status_hunian === 'AKTIF' ? '#059669' : '#dc2626', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${m.status_hunian === 'AKTIF' ? '#a7f3d0' : '#fecaca'}` }}>
                            {m.status_hunian}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => openDetail(m)} title="Lihat Detail" style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconActionDetail />
                            </button>
                            <button onClick={() => openEdit(m)} title="Edit Mahasiswa" style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconActionEdit />
                            </button>
                            <button onClick={() => handleResetPassword(m)} title="Reset Password" style={{ background: '#fffbeb', color: '#d97706', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconActionKey />
                            </button>
                            {m.status_hunian === 'AKTIF' ? (
                              <button onClick={() => handleNonaktifkan(m)} title="Nonaktifkan (Jadikan Alumni)" style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconActionOff />
                              </button>
                            ) : (
                              <button onClick={() => handleAktifkan(m)} title="Aktifkan Kembali" style={{ background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconActionOn />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'tambah' ? 'Tambah Mahasiswa' : modal === 'edit' ? 'Edit Mahasiswa' : modal === 'detail' ? 'Detail Mahasiswa' : 'Import Excel'} onClose={() => setModal(null)}>
          {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}
          
          {(modal === 'tambah' || modal === 'edit') && (
            <>
              <Field label="Nama Lengkap" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
              {modal === 'tambah' && <Field label="NIM (Akan jadi password awal)" value={form.nim} onChange={e => setForm({ ...form, nim: e.target.value })} required />}
              <Field label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <SelectField 
                  label="Fakultas" 
                  value={form.id_fakultas} 
                  onChange={e => setForm({ ...form, id_fakultas: e.target.value, id_jurusan: '' })} 
                  placeholder="-- Pilih Fakultas --"
                  options={fakultasList.map(f => ({ value: f.id_fakultas, label: f.nama }))} 
                />
                <SelectField 
                  label="Jurusan / Departemen" 
                  value={form.id_jurusan} 
                  onChange={e => setForm({ ...form, id_jurusan: e.target.value })} 
                  placeholder="-- Pilih Jurusan --"
                  options={jurusanList.filter(j => String(j.id_fakultas) === String(form.id_fakultas)).map(j => ({ value: j.id_jurusan, label: j.nama }))} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Lantai" type="number" value={form.lantai} onChange={e => setForm({ ...form, lantai: e.target.value })} required placeholder="Misal: 1" />
                <Field label="Nomor Kamar" value={form.nomor_kamar} onChange={e => setForm({ ...form, nomor_kamar: e.target.value })} required placeholder="Misal: A01" />
              </div>
              <Field label="Alamat Asal (Opsional)" value={form.alamat_asal} onChange={e => setForm({ ...form, alamat_asal: e.target.value })} />
              <Field label="No. Telp (Opsional)" value={form.no_telp} onChange={e => setForm({ ...form, no_telp: e.target.value })} />
              <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </>
          )}

          {modal === 'detail' && selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', fontSize: '14px' }}>
                <div style={{ color: '#64748b', fontWeight: '500' }}>NIM</div>
                <div style={{ color: '#1e293b', fontWeight: '600' }}>{selected.nim}</div>
                
                <div style={{ color: '#64748b', fontWeight: '500' }}>Nama Lengkap</div>
                <div style={{ color: '#1e293b', fontWeight: '600' }}>{selected.nama}</div>
                
                <div style={{ color: '#64748b', fontWeight: '500' }}>Email</div>
                <div style={{ color: '#1e293b', fontWeight: '600' }}>{selected.email}</div>
                
                <div style={{ color: '#64748b', fontWeight: '500' }}>Fakultas / Jurusan</div>
                <div style={{ color: '#1e293b', fontWeight: '600' }}>
                  {selected.fakultas ? selected.fakultas.nama : '-'} / {selected.jurusan ? selected.jurusan.nama : '-'}
                </div>
                
                <div style={{ color: '#64748b', fontWeight: '500' }}>Kamar</div>
                <div style={{ color: '#1e293b', fontWeight: '600' }}>Lantai {selected.lantai} - {selected.nomor_kamar}</div>
                
                <div style={{ color: '#64748b', fontWeight: '500' }}>Status Hunian</div>
                <div>
                  <span style={{ background: selected.status_hunian === 'AKTIF' ? '#ecfdf5' : '#fef2f2', color: selected.status_hunian === 'AKTIF' ? '#059669' : '#dc2626', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${selected.status_hunian === 'AKTIF' ? '#a7f3d0' : '#fecaca'}` }}>
                    {selected.status_hunian}
                  </span>
                </div>
                
                <div style={{ color: '#64748b', fontWeight: '500' }}>Alamat Asal</div>
                <div style={{ color: '#1e293b', fontWeight: '600' }}>{selected.alamat_asal || '-'}</div>
                
                <div style={{ color: '#64748b', fontWeight: '500' }}>No. Telepon</div>
                <div style={{ color: '#1e293b', fontWeight: '600' }}>{selected.no_telp || '-'}</div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <button onClick={() => setModal(null)} style={{ width: '100%', padding: '11px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Tutup
                </button>
              </div>
            </div>
          )}

          {modal === 'import' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current.click()} style={{ width: '100%', padding: '16px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <IconUpload /> Pilih File Excel (.xlsx)
                </button>
              </div>

              {importData.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                    <span style={{ color: '#059669' }}>{importSummary.valid} baris valid</span>
                    <span style={{ color: '#dc2626' }}>{importSummary.error} baris error</span>
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
                        <tr>
                          {['No', 'NIM', 'Nama', 'Email', 'Kamar', 'Status'].map(h => (
                            <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importData.map(d => (
                          <tr key={d.no} style={{ background: d.isValid ? '#ecfdf5' : '#fef2f2', borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{d.no}</td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{d.nim}</td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{d.nama}</td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>{d.email}</td>
                            <td style={{ padding: '8px', fontSize: '12px' }}>Lt.{d.lantai}/{d.nomor_kamar}</td>
                            <td style={{ padding: '8px', fontSize: '12px', color: d.isValid ? '#059669' : '#dc2626' }}>
                              {d.isValid ? 'Valid' : d.errorMessage}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button 
                onClick={handleKonfirmasiImport} 
                disabled={saving || importSummary.valid === 0} 
                style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: (saving || importSummary.valid === 0) ? 'not-allowed' : 'pointer', opacity: (saving || importSummary.valid === 0) ? 0.7 : 1 }}
              >
                {saving ? 'Mengimport...' : 'Konfirmasi Import'}
              </button>
            </>
          )}
        </Modal>
      )}

      {confirmAction && (
        <Modal title={confirmAction.title} onClose={() => setConfirmAction(null)}>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>{confirmAction.message}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {confirmAction.isInfo ? (
              <button onClick={() => setConfirmAction(null)} style={{ padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Tutup</button>
            ) : (
              <>
                <button onClick={() => setConfirmAction(null)} style={{ padding: '10px 16px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Batal</button>
                <button onClick={confirmAction.onConfirm} style={{ padding: '10px 16px', background: confirmAction.title.includes('Reset') ? '#d97706' : confirmAction.title.includes('Pengaktifan') ? '#059669' : '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Ya, Lanjutkan</button>
              </>
            )}
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
