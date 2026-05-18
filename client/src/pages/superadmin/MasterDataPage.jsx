import { useState, useEffect, useCallback } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

const TABS = [
  { key: 'card', label: 'Card View' },
  { key: 'table', label: 'Tabel Gedung' },
  { key: 'tahun', label: 'Tahun Akademik' },
  { key: 'jenis', label: 'Jenis Kegiatan' },
];

// ── Tahun Akademik Tab ────────────────────────────────────────────────────────
function TahunAkademikTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama: '', semester: 'Ganjil' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/tahun-akademik`, { headers: { Authorization: `Bearer ${token()}` } });
      const j = await r.json();
      if (r.ok) setList(j.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTambah = () => { setForm({ nama: '', semester: 'Ganjil' }); setSelected(null); setModal('tambah'); setMsg(''); };
  const openEdit = (t) => { setForm({ nama: t.nama, semester: t.semester }); setSelected(t); setModal('edit'); setMsg(''); };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    const url = modal === 'tambah' ? `${API}/api/admin/tahun-akademik` : `${API}/api/admin/tahun-akademik/${selected.id_tahun}`;
    const r = await fetch(url, { method: modal === 'tambah' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    const j = await r.json();
    if (r.ok) { setModal(null); load(); } else setMsg(j.message || 'Gagal.');
    setSaving(false);
  };

  const handleSetAktif = async (t) => {
    const r = await fetch(`${API}/api/admin/tahun-akademik/${t.id_tahun}/aktif`, { method: 'PATCH', headers: { Authorization: `Bearer ${token()}` } });
    const j = await r.json();
    if (r.ok) load(); else alert(j.message);
  };

  const handleHapus = async (t) => {
    if (!window.confirm(`Hapus "${t.nama} ${t.semester}"?`)) return;
    const r = await fetch(`${API}/api/admin/tahun-akademik/${t.id_tahun}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    const j = await r.json();
    if (r.ok) load(); else alert(j.message);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>{list.length} tahun akademik</span>
        <button onClick={openTambah} style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Tambah Tahun Akademik</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              {['Nama','Semester','Status','Aksi'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id_tahun} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{t.nama}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{t.semester}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: t.is_aktif ? '#ecfdf5' : '#f1f5f9', color: t.is_aktif ? '#059669' : '#64748b', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${t.is_aktif ? '#a7f3d0' : '#e2e8f0'}` }}>
                      {t.is_aktif ? 'AKTIF' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {!t.is_aktif && <button onClick={() => handleSetAktif(t)} style={{ background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '7px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Set Aktif</button>}
                      <button onClick={() => openEdit(t)} style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleHapus(t)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title={modal === 'tambah' ? 'Tambah Tahun Akademik' : 'Edit Tahun Akademik'} onClose={() => setModal(null)}>
          {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}
          <Field label="Nama (misal: 2024/2025)" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required placeholder="2024/2025" />
          <SelectField label="Semester" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required options={[{ value: 'Ganjil', label: 'Ganjil' }, { value: 'Genap', label: 'Genap' }]} />
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </Modal>
      )}
    </div>
  );
}

// ── Jenis Kegiatan Tab ────────────────────────────────────────────────────────
function JenisKegiatanTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama: '', kode: '', deskripsi: '', is_aktif: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/jenis-kegiatan`, { headers: { Authorization: `Bearer ${token()}` } });
      const j = await r.json();
      if (r.ok) setList(j.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTambah = () => { setForm({ nama: '', kode: '', deskripsi: '', is_aktif: true }); setSelected(null); setModal('tambah'); setMsg(''); };
  const openEdit = (j) => { setForm({ nama: j.nama, kode: j.kode, deskripsi: j.deskripsi || '', is_aktif: j.is_aktif }); setSelected(j); setModal('edit'); setMsg(''); };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    const url = modal === 'tambah' ? `${API}/api/admin/jenis-kegiatan` : `${API}/api/admin/jenis-kegiatan/${selected.id}`;
    const r = await fetch(url, { method: modal === 'tambah' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    const j = await r.json();
    if (r.ok) { setModal(null); load(); } else setMsg(j.message || 'Gagal.');
    setSaving(false);
  };

  const handleHapus = async (item) => {
    if (!window.confirm(`Hapus jenis kegiatan "${item.nama}"?`)) return;
    const r = await fetch(`${API}/api/admin/jenis-kegiatan/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    const j = await r.json();
    if (r.ok) load(); else alert(j.message);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>{list.length} jenis kegiatan</span>
        <button onClick={openTambah} style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Tambah Jenis Kegiatan</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              {['Nama','Kode','Deskripsi','Status','Aksi'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{item.nama}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#374151', fontFamily: 'monospace' }}>{item.kode}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', maxWidth: '200px' }}>{item.deskripsi || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: item.is_aktif ? '#ecfdf5' : '#fef2f2', color: item.is_aktif ? '#059669' : '#dc2626', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${item.is_aktif ? '#a7f3d0' : '#fecaca'}` }}>
                      {item.is_aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(item)} style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleHapus(item)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title={modal === 'tambah' ? 'Tambah Jenis Kegiatan' : 'Edit Jenis Kegiatan'} onClose={() => setModal(null)}>
          {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}
          <Field label="Nama Jenis Kegiatan" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required placeholder="Shalat Subuh Berjamaah" />
          {modal === 'tambah' && <Field label="Kode (huruf besar, tanpa spasi)" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value.toUpperCase() })} required placeholder="SHALAT_SUBUH" />}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Deskripsi</label>
            <textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={3} placeholder="Opsional" style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <SelectField label="Status" value={form.is_aktif ? 'true' : 'false'} onChange={e => setForm({ ...form, is_aktif: e.target.value === 'true' })} required options={[{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Nonaktif' }]} />
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </Modal>
      )}
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
          borderRadius: '8px', fontSize: '14px', color: '#1e293b',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
          borderRadius: '8px', fontSize: '14px', color: '#1e293b',
          outline: 'none', background: '#fff', boxSizing: 'border-box',
        }}
      >
        <option value="">-- Pilih --</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function GedungCard({ gedung, onEdit }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      border: '1px solid #e2e8f0',
      padding: '18px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.2s ease',
      position: 'relative',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.12)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
    >
      <button 
        onClick={() => onEdit(gedung)} 
        style={{ 
          position: 'absolute', top: '16px', right: '16px', 
          background: '#ede9fe', color: '#7c3aed', border: 'none', 
          borderRadius: '50%', width: '28px', height: '28px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          cursor: 'pointer', fontSize: '12px' 
        }}
        title="Edit Gedung"
      >
        ✏️
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', paddingRight: '32px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{gedung.nama_gedung}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Kode: {gedung.kode_gedung}</div>
        </div>
        <span style={{
          background: gedung.status_gedung === 'AKTIF' ? '#ecfdf5' : '#fef2f2',
          color: gedung.status_gedung === 'AKTIF' ? '#059669' : '#dc2626',
          fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
          border: `1px solid ${gedung.status_gedung === 'AKTIF' ? '#a7f3d0' : '#fecaca'}`,
        }}>
          {gedung.status_gedung}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Mahasiswa', value: gedung.jumlahMahasiswa },
          { label: 'Fasilitator', value: gedung.jumlahFasilitator },
          { label: 'Kapasitas', value: gedung.kapasitas_mahasiswa },
          { label: 'Lantai', value: gedung.jumlah_lantai },
        ].map(item => (
          <div key={item.label} style={{
            background: '#f8fafc', borderRadius: '8px', padding: '10px',
            border: '1px solid #e2e8f0', textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{item.value}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('card');
  const [gedungs, setGedungs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [modal, setModal] = useState(null); // null | 'tambah' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama_gedung: '', kode_gedung: '', alamat: '', jumlah_lantai: '', kapasitas_mahasiswa: '', status_gedung: 'AKTIF' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/gedung`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (res.ok) setGedungs(json.data || []);
      else setError(json.message || 'Gagal memuat data gedung.');
    } catch {
      setError('Tidak bisa terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openTambah = () => {
    setForm({ nama_gedung: '', kode_gedung: '', alamat: '', jumlah_lantai: '', kapasitas_mahasiswa: '', status_gedung: 'AKTIF' });
    setSelected(null); setModal('tambah'); setMsg('');
  };

  const openEdit = (g) => {
    setForm({ 
      nama_gedung: g.nama_gedung, 
      kode_gedung: g.kode_gedung, 
      alamat: g.alamat || '', 
      jumlah_lantai: String(g.jumlah_lantai), 
      kapasitas_mahasiswa: String(g.kapasitas_mahasiswa), 
      status_gedung: g.status_gedung 
    });
    setSelected(g); setModal('edit'); setMsg('');
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const url = modal === 'tambah' ? `${API}/api/admin/gedung` : `${API}/api/admin/gedung/${selected.id_gedung}`;
      const method = modal === 'tambah' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) { setModal(null); loadData(); }
      else setMsg(json.message || 'Gagal menyimpan.');
    } catch { setMsg('Error server saat menyimpan.'); }
    finally { setSaving(false); }
  };

  const handleHapus = async (g) => {
    if (!window.confirm(`Yakin ingin menghapus gedung "${g.nama_gedung}"?`)) return;
    try {
      const res = await fetch(`${API}/api/admin/gedung/${g.id_gedung}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (res.ok) loadData();
      else alert(json.message || 'Gagal menghapus.');
    } catch { alert('Error server saat menghapus.'); }
  };

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>
            Kelola Gedung (Master Data)
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Informasi dan manajemen gedung penghuni asrama
          </p>
        </div>

        {/* Summary row */}
        <div style={{
          background: 'linear-gradient(135deg, #0f0a1e, #1e1340)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          gap: '32px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Total Gedung', value: gedungs.length },
            { label: 'Total Mahasiswa', value: gedungs.reduce((s, g) => s + (g.jumlahMahasiswa || 0), 0).toLocaleString('id-ID') },
            { label: 'Total Fasilitator', value: gedungs.reduce((s, g) => s + (g.jumlahFasilitator || 0), 0) },
            { label: 'Total Kapasitas', value: gedungs.reduce((s, g) => s + (g.kapasitas_mahasiswa || 0), 0).toLocaleString('id-ID') },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#c4b5fd', fontSize: '26px', fontWeight: '800' }}>{item.value}</div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease',
                  background: activeTab === t.key ? '#fff' : 'transparent',
                  color: activeTab === t.key ? '#7c3aed' : '#64748b',
                  boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >{t.label}</button>
            ))}
          </div>
          <button onClick={openTambah} style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff',
            border: 'none', borderRadius: '10px', padding: '9px 18px',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Tambah Gedung
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Memuat data gedung...
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {!loading && !error && activeTab === 'tahun' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <TahunAkademikTab />
          </div>
        )}

        {!loading && !error && activeTab === 'jenis' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <JenisKegiatanTab />
          </div>
        )}

        {!loading && !error && activeTab === 'card' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {gedungs.map(g => <GedungCard key={g.id_gedung} gedung={g} onEdit={openEdit} />)}
          </div>
        )}

        {!loading && !error && activeTab === 'table' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Nama Gedung', 'Kode', 'Status', 'Mahasiswa', 'Fasilitator', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gedungs.map(g => (
                    <tr key={g.id_gedung} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{g.nama_gedung}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{g.kode_gedung}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          background: g.status_gedung === 'AKTIF' ? '#ecfdf5' : '#fef2f2',
                          color: g.status_gedung === 'AKTIF' ? '#059669' : '#dc2626',
                          fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                          border: `1px solid ${g.status_gedung === 'AKTIF' ? '#a7f3d0' : '#fecaca'}`,
                        }}>
                          {g.status_gedung}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{g.jumlahMahasiswa} / {g.kapasitas_mahasiswa}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{g.jumlahFasilitator}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => openEdit(g)} style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleHapus(g)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      {modal && (
        <Modal title={modal === 'tambah' ? 'Tambah Gedung Baru' : 'Edit Data Gedung'} onClose={() => setModal(null)}>
          {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}
          
          <Field label="Nama Gedung" value={form.nama_gedung} onChange={e => setForm({ ...form, nama_gedung: e.target.value })} required placeholder="Misal: Asrama Rusunawa" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Kode Gedung" value={form.kode_gedung} onChange={e => setForm({ ...form, kode_gedung: e.target.value })} required placeholder="Misal: B" />
            <SelectField label="Status Gedung" value={form.status_gedung} onChange={e => setForm({ ...form, status_gedung: e.target.value })} required options={[
              { value: 'AKTIF', label: 'AKTIF' },
              { value: 'RENOVASI', label: 'RENOVASI' },
              { value: 'NON_AKTIF', label: 'NON_AKTIF' }
            ]} />
          </div>

          <Field label="Alamat / Deskripsi Lokasi" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} required placeholder="Alamat lengkap gedung" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Jumlah Lantai" type="number" value={form.jumlah_lantai} onChange={e => setForm({ ...form, jumlah_lantai: e.target.value })} required placeholder="Misal: 5" />
            <Field label="Kapasitas Mahasiswa" type="number" value={form.kapasitas_mahasiswa} onChange={e => setForm({ ...form, kapasitas_mahasiswa: e.target.value })} required placeholder="Misal: 360" />
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '11px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', marginTop: '8px',
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Menyimpan...' : 'Simpan Gedung'}
          </button>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </SuperadminLayout>
  );
}
