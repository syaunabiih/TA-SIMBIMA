import { useState, useEffect, useCallback } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';

const API = 'http://localhost:5000';
const token = () => localStorage.getItem('simbima_token');

const TABS = [
  { key: 'fasilitator', label: 'Fasilitator' },
  { key: 'mahasiswa', label: 'Mahasiswa' },
];

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

// ── Fasilitator Tab ───────────────────────────────────────────────────────────
function FasilitatorTab({ gedungs }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'tambah' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nip: '', nama: '', email: '', password: '', id_gedung: '', no_telp: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/fasilitator`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      if (res.ok) setList(json.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTambah = () => {
    setForm({ nip: '', nama: '', email: '', password: '', id_gedung: '', no_telp: '' });
    setSelected(null); setModal('tambah'); setMsg('');
  };

  const openEdit = (f) => {
    setForm({ nip: f.nip, nama: f.nama, email: f.email, password: '', id_gedung: String(f.id_gedung), no_telp: f.no_telp || '' });
    setSelected(f); setModal('edit'); setMsg('');
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const url = modal === 'tambah' ? `${API}/api/admin/fasilitator` : `${API}/api/admin/fasilitator/${selected.id_fasilitator}`;
      const method = modal === 'tambah' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) { setModal(null); load(); }
      else setMsg(json.message || 'Gagal menyimpan.');
    } catch { setMsg('Error server.'); }
    finally { setSaving(false); }
  };

  const handleHapus = async (f) => {
    if (!window.confirm(`Hapus fasilitator "${f.nama}"?`)) return;
    try {
      const res = await fetch(`${API}/api/admin/fasilitator/${f.id_fasilitator}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (res.ok) load();
      else alert(json.message);
    } catch { alert('Error server.'); }
  };

  const gedungOptions = gedungs.map(g => ({ value: String(g.id_gedung), label: `${g.nama_gedung} (${g.kode_gedung})` }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>{list.length} fasilitator terdaftar</span>
        <button onClick={openTambah} style={{
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff',
          border: 'none', borderRadius: '10px', padding: '9px 18px',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Tambah Fasilitator
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Nama', 'Username', 'Blok Tugas', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(f => (
                <tr key={f.id_fasilitator} style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{f.nama}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{f.nip}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{f.gedung?.nama_gedung}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(f)} style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleHapus(f)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'tambah' ? 'Tambah Fasilitator' : 'Edit Fasilitator'} onClose={() => setModal(null)}>
          {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}
          <Field label="Nama" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
          {modal === 'tambah' && <Field label="Username (NIP)" value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} required placeholder="contoh: FASIL-A1" />}
          <Field label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <Field label={`Password ${modal === 'edit' ? '(kosong = tidak diubah)' : ''}`} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal === 'tambah'} />
          <SelectField label="Blok Tugas (Gedung)" value={form.id_gedung} onChange={e => setForm({ ...form, id_gedung: e.target.value })} options={gedungOptions} required />
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '11px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── Mahasiswa Tab ─────────────────────────────────────────────────────────────
function MahasiswaTab({ gedungs }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGedung, setFilterGedung] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nim: '', nama: '', email: '', password: '', lantai: '', nomor_kamar: '', id_gedung: '', no_telp: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filterGedung ? `?gedung=${filterGedung}` : '';
      const res = await fetch(`${API}/api/admin/mahasiswa${q}`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      if (res.ok) setList(json.data || []);
    } finally { setLoading(false); }
  }, [filterGedung]);

  useEffect(() => { load(); }, [load]);

  const openTambah = () => {
    setForm({ nim: '', nama: '', email: '', password: '', lantai: '', nomor_kamar: '', id_gedung: '', no_telp: '' });
    setSelected(null); setModal('tambah'); setMsg('');
  };

  const openEdit = (m) => {
    setForm({ nim: m.nim, nama: m.nama, email: m.email, password: '', lantai: String(m.lantai), nomor_kamar: m.nomor_kamar, id_gedung: String(m.id_gedung), no_telp: m.no_telp || '' });
    setSelected(m); setModal('edit'); setMsg('');
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const url = modal === 'tambah' ? `${API}/api/admin/mahasiswa` : `${API}/api/admin/mahasiswa/${selected.id_mahasiswa}`;
      const method = modal === 'tambah' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) { setModal(null); load(); }
      else setMsg(json.message || 'Gagal menyimpan.');
    } catch { setMsg('Error server.'); }
    finally { setSaving(false); }
  };

  const handleHapus = async (m) => {
    if (!window.confirm(`Hapus mahasiswa "${m.nama}"?`)) return;
    try {
      const res = await fetch(`${API}/api/admin/mahasiswa/${m.id_mahasiswa}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
      });
      const json = await res.json();
      if (res.ok) load();
      else alert(json.message);
    } catch { alert('Error server.'); }
  };

  const gedungOptions = gedungs.map(g => ({ value: String(g.id_gedung), label: `${g.nama_gedung} (${g.kode_gedung})` }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="Cari Nama atau NIM..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{
              padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
              fontSize: '13px', color: '#1e293b', outline: 'none', flex: 1, maxWidth: '250px'
            }}
          />
          <select value={filterGedung} onChange={e => setFilterGedung(e.target.value)} style={{
            padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '13px', color: '#374151', background: '#fff',
          }}>
            <option value="">Semua Gedung</option>
            {gedungOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={{ color: '#64748b', fontSize: '13px' }}>{list.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || m.nim.toLowerCase().includes(search.toLowerCase())).length} mahasiswa</span>
        </div>
        <button onClick={openTambah} style={{
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff',
          border: 'none', borderRadius: '10px', padding: '9px 18px',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Tambah Mahasiswa
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['NIM', 'Nama', 'Kamar', 'Username', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.filter(m => m.nama.toLowerCase().includes(search.toLowerCase()) || m.nim.toLowerCase().includes(search.toLowerCase())).map(m => (
                <tr key={m.id_mahasiswa} style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{m.nim}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{m.nama}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b' }}>Lt.{m.lantai} {m.nomor_kamar} - {m.gedung?.nama_gedung}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{m.nim}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(m)} style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleHapus(m)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'tambah' ? 'Tambah Mahasiswa' : 'Edit Mahasiswa'} onClose={() => setModal(null)}>
          {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}
          <Field label="Nama" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
          {modal === 'tambah' && <Field label="Username (NIM)" value={form.nim} onChange={e => setForm({ ...form, nim: e.target.value })} required placeholder="contoh: 23F10001" />}
          <Field label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <Field label={`Password ${modal === 'edit' ? '(kosong = tidak diubah)' : ''}`} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal === 'tambah'} />
          <SelectField label="Gedung" value={form.id_gedung} onChange={e => setForm({ ...form, id_gedung: e.target.value })} options={gedungOptions} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Lantai" type="number" value={form.lantai} onChange={e => setForm({ ...form, lantai: e.target.value })} required placeholder="1–5" />
            <Field label="Nomor Kamar" value={form.nomor_kamar} onChange={e => setForm({ ...form, nomor_kamar: e.target.value })} required placeholder="A01" />
          </div>
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '11px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KelolaAkunPage() {
  const [activeTab, setActiveTab] = useState('fasilitator');
  const [gedungs, setGedungs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/gedung`, { headers: { Authorization: `Bearer ${token()}` } });
        const json = await res.json();
        if (res.ok) setGedungs(json.data || []);
      } catch {}
    })();
  }, []);

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Kelola Akun</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Manajemen akun fasilitator dan mahasiswa</p>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '12px', padding: '4px', width: 'fit-content', marginBottom: '20px' }}>
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

        {/* Tab Content */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          {activeTab === 'fasilitator' && <FasilitatorTab gedungs={gedungs} />}
          {activeTab === 'mahasiswa' && <MahasiswaTab gedungs={gedungs} />}
        </div>
      </div>
    </SuperadminLayout>
  );
}
