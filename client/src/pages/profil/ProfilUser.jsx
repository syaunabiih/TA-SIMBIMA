import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SuperadminLayout from '../../components/layout/SuperadminLayout';
import { apiGetProfil, apiUpdateProfil, apiChangePassword } from '../../utils/api';

const IconHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/></svg>;
const IconMapPin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>;
const IconFileText = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/><polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2"/></svg>;

const MENU_MHS = [
  { path: '/mahasiswa/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/mahasiswa/kehadiran', label: 'Kegiatan', icon: <IconCalendar /> },
  { path: '/mahasiswa/izin', label: 'Perizinan', icon: <IconFile /> },
  { path: '/mahasiswa/rekap', label: 'Rekap Absensi', icon: <IconFileText /> },
];

const MENU_FSL = [
  { path: '/fasilitator/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/fasilitator/kegiatan', label: 'Kelola Kegiatan', icon: <IconCalendar /> },
  { path: '/fasilitator/perizinan', label: 'Validasi Izin', icon: <IconFile /> },
  { path: '/fasilitator/kepulangan', label: 'Kepulangan', icon: <IconMapPin /> },
  { path: '/fasilitator/rekap', label: 'Rekap Absensi', icon: <IconFileText /> },
];

const MENU_PKJ = [
  { path: '/pokja/dashboard', label: 'Dashboard', icon: <IconHome /> },
  { path: '/pokja/monitoring', label: 'Monitoring', icon: <IconMapPin /> },
];

function ProfilUser() {
  const role = localStorage.getItem('simbima_role') || 'MAHASISWA';
  const menuItems = role === 'MAHASISWA' ? MENU_MHS : role === 'FASILITATOR' ? MENU_FSL : MENU_PKJ;

  const [loading, setLoading] = useState(true);
  const [profilData, setProfilData] = useState(null);
  
  const [form, setForm] = useState({ nama: '', email: '', no_telp: '' });
  const [passForm, setPassForm] = useState({ passwordLama: '', passwordBaru: '', konfirmasi: '' });

  const [alertInfo, setAlertInfo] = useState(null);
  const [passAlert, setPassAlert] = useState(null);

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    try {
      const res = await apiGetProfil();
      if (res.status === 'Sukses') {
        setProfilData(res.data);
        setForm({
          nama: res.data.nama || '',
          email: res.data.email || '',
          no_telp: res.data.no_telp || ''
        });
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpdateProfil = async (e) => {
    e.preventDefault();
    try {
       const res = await apiUpdateProfil(form);
       if (res.status === 'Sukses') {
          setAlertInfo({ type: 'success', text: 'Profil berhasil diperbarui!' });
          localStorage.setItem('simbima_nama', form.nama); // Updt header
       } else {
          setAlertInfo({ type: 'error', text: res.message });
       }
    } catch(err) {
       setAlertInfo({ type: 'error', text: 'Server error' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.passwordBaru !== passForm.konfirmasi) {
       return setPassAlert({ type: 'error', text: 'Konfirmasi password tidak cocok!' });
    }
    if (passForm.passwordBaru.length < 8) {
       return setPassAlert({ type: 'error', text: 'Password baru minimal 8 karakter!' });
    }

    try {
       const res = await apiChangePassword({ passwordLama: passForm.passwordLama, passwordBaru: passForm.passwordBaru });
       if (res.status === 'Sukses') {
          setPassAlert({ type: 'success', text: 'Password berhasil diganti!' });
          setPassForm({ passwordLama: '', passwordBaru: '', konfirmasi: '' });
       } else {
          setPassAlert({ type: 'error', text: res.message });
       }
    } catch(err) {
       setPassAlert({ type: 'error', text: 'Gagal menghubungi server' });
    }
  };

  if (loading || !profilData) {
     return <DashboardLayout menuItems={menuItems}><div style={{ padding: '40px', textAlign: 'center' }}>Memuat data profil...</div></DashboardLayout>;
  }

  const roleText = (role === 'SUPERADMIN' || role === 'KETUA_POKJA') ? 'Lembaga / Ketua Pokja' : role === 'FASILITATOR' ? 'Fasilitator Asrama' : 'Mahasiswa Penghuni';
  const getIdentifier = () => profilData.nim || profilData.nip || '-';

  const content = (
      <div className="page-enter" style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
        
        <h1 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Pengaturan Profil</h1>

        {/* Profil Header Card */}
        <div className="card-animate" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
           <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profilData.nama[0].toUpperCase()}
           </div>
           <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>{profilData.nama}</h2>
              <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{roleText} • {getIdentifier()}</div>
              {profilData.gedung && (
                 <div style={{ marginTop: '8px', fontSize: '12px', background: '#f1f5f9', display: 'inline-block', padding: '4px 10px', borderRadius: '20px', color: '#475569', fontWeight: '500' }}>
                    Asrama: {profilData.gedung.nama_gedung}
                 </div>
              )}
           </div>
        </div>

        {/* Form Biodata */}
        <div className="card-animate" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
           <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Informasi Pribadi</h3>
           
           {alertInfo && (
              <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: alertInfo.type === 'success' ? '#ecfdf5' : '#fef2f2', color: alertInfo.type === 'success' ? '#059669' : '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                {alertInfo.text}
              </div>
           )}

           <form onSubmit={handleUpdateProfil} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                 <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Nama Lengkap</label>
                 <input type="text" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Alamat Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
                 </div>
                 <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Nomor Telepon</label>
                    <input type="text" value={form.no_telp} onChange={e => setForm({...form, no_telp: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
                 </div>
              </div>
              <button className="btn-cta" type="submit" style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>Simpan Perubahan</button>
           </form>
        </div>

        {/* Form Ganti Password */}
        <div className="card-animate" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
           <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Keamanan & Password</h3>
           
           {passAlert && (
              <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: passAlert.type === 'success' ? '#ecfdf5' : '#fef2f2', color: passAlert.type === 'success' ? '#059669' : '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                {passAlert.text}
              </div>
           )}

           <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                 <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Password Lama</label>
                 <input type="password" value={passForm.passwordLama} onChange={e => setPassForm({...passForm, passwordLama: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Password Baru</label>
                    <input type="password" value={passForm.passwordBaru} onChange={e => setPassForm({...passForm, passwordBaru: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} placeholder="Min. 8 karakter" required />
                 </div>
                 <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Konfirmasi Password Baru</label>
                    <input type="password" value={passForm.konfirmasi} onChange={e => setPassForm({...passForm, konfirmasi: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
                 </div>
              </div>
              <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: '1px solid #cbd5e1', background: '#fff', color: '#334155' }}>Ganti Password</button>
           </form>
        </div>

      </div>
  );

  if (role === 'SUPERADMIN' || role === 'KETUA_POKJA') {
    return <SuperadminLayout>{content}</SuperadminLayout>;
  }
  return <DashboardLayout menuItems={menuItems}>{content}</DashboardLayout>;
}

export default ProfilUser;
