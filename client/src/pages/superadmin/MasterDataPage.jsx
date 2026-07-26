import { useState, useEffect, useCallback } from 'react';
import SuperadminLayout from '../../components/layout/SuperadminLayout';

const API = import.meta.env.VITE_API_URL || '';
const token = () => localStorage.getItem('simbima_token');

const TABS = [
  { key: 'card', label: 'Card View Gedung' },
  { key: 'table', label: 'Tabel Gedung' },
  { key: 'tahun', label: 'Tahun Akademik' },
  { key: 'fakultas', label: 'Fakultas' },
  { key: 'jurusan', label: 'Jurusan' },
  { key: 'jenis', label: 'Jenis Kegiatan' },
];
// ── Tahun Akademik Tab ────────────────────────────────────────────────────────
function TahunAkademikTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama: '', is_aktif: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmObj, setConfirmObj] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/tahun-akademik`, { headers: { Authorization: `Bearer ${token()}` } });
      const j = await r.json();
      if (r.ok) setList(j.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTambah = () => { setForm({ nama: '', is_aktif: false }); setSelected(null); setModal('tambah'); setMsg(''); };
  const openEdit = (t) => { setForm({ nama: t.nama, is_aktif: t.is_aktif }); setSelected(t); setModal('edit'); setMsg(''); };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    const url = modal === 'tambah' ? `${API}/api/admin/tahun-akademik` : `${API}/api/admin/tahun-akademik/${selected.id_tahun}`;
    const r = await fetch(url, { method: modal === 'tambah' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    const j = await r.json();
    if (r.ok) { setModal(null); load(); } else setMsg(j.message || 'Gagal.');
    setSaving(false);
  };

  const handleHapus = async (t) => {
    setConfirmObj({
      title: 'Hapus Tahun Akademik',
      message: `Hapus tahun akademik "${t.nama}"?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmObj(null);
        const r = await fetch(`${API}/api/admin/tahun-akademik/${t.id_tahun}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
        const j = await r.json();
        if (r.ok) load(); else alert(j.message);
      }
    });
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
              {['Nama', 'Status', 'Aksi'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id_tahun} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{t.nama}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: t.is_aktif ? '#ecfdf5' : '#f1f5f9', color: t.is_aktif ? '#059669' : '#64748b', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${t.is_aktif ? '#a7f3d0' : '#e2e8f0'}` }}>
                      {t.is_aktif ? 'AKTIF' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
          <Field label="Nama (misal: 2024/2025 )" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required placeholder="2024/2025 Genap" />
          <SelectField
            label="Status Aktif"
            value={form.is_aktif ? 'AKTIF' : 'NONAKTIF'}
            onChange={e => setForm({ ...form, is_aktif: e.target.value === 'AKTIF' })}
            options={[
              { value: 'AKTIF', label: 'Aktif' },
              { value: 'NONAKTIF', label: 'Tidak Aktif' }
            ]}
          />
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </Modal>
      )}
      {confirmObj && <ConfirmModal {...confirmObj} onCancel={() => setConfirmObj(null)} />}
    </div>
  );
}


// ── Fakultas Tab ─────────────────────────────────────────────────────────────
function FakultasTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmObj, setConfirmObj] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/fakultas`, { headers: { Authorization: `Bearer ${token()}` } });
      const j = await r.json();
      if (r.ok) setList(j.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTambah = () => { setForm({ nama: '' }); setSelected(null); setModal('tambah'); setMsg(''); };
  const openEdit = (t) => { setForm({ nama: t.nama }); setSelected(t); setModal('edit'); setMsg(''); };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    const url = modal === 'tambah' ? `${API}/api/admin/fakultas` : `${API}/api/admin/fakultas/${selected.id_fakultas}`;
    const r = await fetch(url, { method: modal === 'tambah' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    const j = await r.json();
    if (r.ok) { setModal(null); load(); } else setMsg(j.message || 'Gagal.');
    setSaving(false);
  };

  const handleHapus = async (t) => {
    setConfirmObj({
      title: 'Hapus Fakultas',
      message: `Hapus Fakultas "${t.nama}"?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmObj(null);
        const r = await fetch(`${API}/api/admin/fakultas/${t.id_fakultas}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
        const j = await r.json();
        if (r.ok) load(); else alert(j.message);
      }
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>{list.length} Fakultas</span>
        <button onClick={openTambah} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Tambah Fakultas</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px' }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Nama Fakultas</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Aksi</th>
            </tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id_fakultas} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{t.nama}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(t)} style={{ background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
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
        <Modal title={modal === 'tambah' ? 'Tambah Fakultas' : 'Edit Fakultas'} onClose={() => setModal(null)}>
          {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}
          <Field label="Nama Fakultas" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required placeholder="Misal: Teknik" />
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </Modal>
      )}
      {confirmObj && <ConfirmModal {...confirmObj} onCancel={() => setConfirmObj(null)} />}
    </div>
  );
}

// ── Jurusan Tab ──────────────────────────────────────────────────────────────
function JurusanTab() {
  const [list, setList] = useState([]);
  const [fakultasList, setFakultasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama: '', id_fakultas: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmObj, setConfirmObj] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API}/api/admin/jurusan`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/admin/fakultas`, { headers: { Authorization: `Bearer ${token()}` } })
      ]);
      const j1 = await r1.json();
      const j2 = await r2.json();
      if (r1.ok) setList(j1.data || []);
      if (r2.ok) setFakultasList(j2.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTambah = () => { setForm({ nama: '', id_fakultas: '' }); setSelected(null); setModal('tambah'); setMsg(''); };
  const openEdit = (t) => { setForm({ nama: t.nama, id_fakultas: t.id_fakultas }); setSelected(t); setModal('edit'); setMsg(''); };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    const url = modal === 'tambah' ? `${API}/api/admin/jurusan` : `${API}/api/admin/jurusan/${selected.id_jurusan}`;
    const r = await fetch(url, { method: modal === 'tambah' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    const j = await r.json();
    if (r.ok) { setModal(null); load(); } else setMsg(j.message || 'Gagal.');
    setSaving(false);
  };

  const handleHapus = async (t) => {
    setConfirmObj({
      title: 'Hapus Jurusan',
      message: `Hapus Jurusan "${t.nama}"?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmObj(null);
        const r = await fetch(`${API}/api/admin/jurusan/${t.id_jurusan}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
        const j = await r.json();
        if (r.ok) load(); else alert(j.message);
      }
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>{list.length} Jurusan</span>
        <button onClick={openTambah} style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Tambah Jurusan</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px' }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Nama Jurusan</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Fakultas</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Aksi</th>
            </tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id_jurusan} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{t.nama}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>{t.fakultas?.nama}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(t)} style={{ background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
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
        <Modal title={modal === 'tambah' ? 'Tambah Jurusan' : 'Edit Jurusan'} onClose={() => setModal(null)}>
          {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>{msg}</div>}
          <Field label="Nama Jurusan" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required placeholder="Misal: Sistem Informasi" />
          <SelectField label="Fakultas" value={form.id_fakultas} onChange={e => setForm({ ...form, id_fakultas: e.target.value })} required options={fakultasList.map(f => ({ value: f.id_fakultas, label: f.nama }))} />
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </Modal>
      )}
      {confirmObj && <ConfirmModal {...confirmObj} onCancel={() => setConfirmObj(null)} />}
    </div>
  );
}

// ── Jenis Kegiatan Tab ───────────────────────────────────────────────────────
function JenisKegiatanTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama_jenis: '', is_wajib: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmObj, setConfirmObj] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/jenis-kegiatan`, { headers: { Authorization: `Bearer ${token()}` } });
      const j = await r.json();
      if (r.ok) setList(j.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTambah = () => { setForm({ nama_jenis: '', is_wajib: true }); setSelected(null); setModal('tambah'); setMsg(''); };
  const openEdit = (t) => { setForm({ nama_jenis: t.nama_jenis, is_wajib: t.is_wajib }); setSelected(t); setModal('edit'); setMsg(''); };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    const url = modal === 'tambah' ? `${API}/api/admin/jenis-kegiatan` : `${API}/api/admin/jenis-kegiatan/${selected.id_jenis_kegiatan}`;
    const r = await fetch(url, { method: modal === 'tambah' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    const j = await r.json();
    if (r.ok) { setModal(null); load(); } else setMsg(j.message || 'Gagal.');
    setSaving(false);
  };

  const handleHapus = async (t) => {
    setConfirmObj({
      title: 'Hapus Jenis Kegiatan',
      message: `Hapus Jenis Kegiatan "${t.nama_jenis}"?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmObj(null);
        const r = await fetch(`${API}/api/admin/jenis-kegiatan/${t.id_jenis_kegiatan}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
        const j = await r.json();
        if (r.ok) load(); else alert(j.message);
      }
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>{list.length} Jenis Kegiatan</span>
        <button onClick={openTambah} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Tambah Jenis Kegiatan</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px' }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Nama Kegiatan</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Tipe</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Aksi</th>
            </tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id_jenis_kegiatan} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{t.nama_jenis}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: t.is_wajib ? '#fef2f2' : '#eff6ff', color: t.is_wajib ? '#dc2626' : '#2563eb', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${t.is_wajib ? '#fecaca' : '#bfdbfe'}` }}>
                      {t.is_wajib ? '🔴 Wajib' : '🔵 Mandiri'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {t.is_wajib ? (
                        <>
                          <button onClick={() => openEdit(t)} style={{ background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleHapus(t)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Hapus</button>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Terkunci (Sistem)</span>
                      )}
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
          <Field label="Nama Jenis Kegiatan" value={form.nama_jenis} onChange={e => setForm({ ...form, nama_jenis: e.target.value })} required placeholder="Misal: Kajian Rutin" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <span style={{ fontSize: '18px' }}>🔴</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>Tipe: Kegiatan Wajib</div>
              <div style={{ fontSize: '11px', color: '#b91c1c' }}>Hanya kegiatan berstatus Wajib yang dapat ditambah/diubah.</div>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </Modal>
      )}
      {confirmObj && <ConfirmModal {...confirmObj} onCancel={() => setConfirmObj(null)} />}
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

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title = 'Konfirmasi', message, type = 'danger', onConfirm, onCancel }) {
  const btnColor = type === 'danger' ? '#dc2626' : '#059669';
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px',
        padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{title}</h3>
        <p style={{ margin: '0 0 24px 0', color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', background: btnColor, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Ya, Lanjutkan</button>
        </div>
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
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.15)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
    >
      <button
        onClick={() => onEdit(gedung)}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: '#ecfdf5', color: '#059669', border: 'none',
          borderRadius: '50%', width: '28px', height: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '12px'
        }}
        title="Edit Gedung"
      >
        Edit
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

const IconBuilding = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>;
const IconUsers = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const IconUserCheck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>;
const IconMaximize2 = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>;

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('card');
  const [gedungs, setGedungs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [modal, setModal] = useState(null); // null | 'tambah' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nama_gedung: '', kode_gedung: '', jumlah_lantai: '', kapasitas_mahasiswa: '', status_gedung: 'AKTIF' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmObj, setConfirmObj] = useState(null);

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
    setForm({ nama_gedung: '', kode_gedung: '', jumlah_lantai: '', kapasitas_mahasiswa: '', status_gedung: 'AKTIF' });
    setSelected(null); setModal('tambah'); setMsg('');
  };

  const openEdit = (g) => {
    setForm({
      nama_gedung: g.nama_gedung,
      kode_gedung: g.kode_gedung,
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
    setConfirmObj({
      title: 'Hapus Gedung',
      message: `Yakin ingin menghapus gedung "${g.nama_gedung}"?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmObj(null);
        try {
          const res = await fetch(`${API}/api/admin/gedung/${g.id_gedung}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
          });
          const json = await res.json();
          if (res.ok) loadData();
          else alert(json.message || 'Gagal menghapus.');
        } catch { alert('Error server saat menghapus.'); }
      }
    });
  };

  return (
    <SuperadminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '22px', fontWeight: '800' }}>Master Data</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Kelola data gedung, tahun akademik, dan jenis kegiatan
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Card 1 - Total Gedung */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">{gedungs.length}</div>
              <div className="text-sm text-slate-500 mt-1 font-medium">gedung / asrama</div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-100 text-orange-500">
              <IconBuilding />
            </div>
          </div>

          {/* Card 2 - Total Mahasiswa */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">{gedungs.reduce((s, g) => s + (g.jumlahMahasiswa || 0), 0).toLocaleString('id-ID')}</div>
              <div className="text-sm text-slate-500 mt-1 font-medium">mahasiswa terdaftar aktif</div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
              <IconUsers />
            </div>
          </div>

          {/* Card 3 - Total Fasilitator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">{gedungs.reduce((s, g) => s + (g.jumlahFasilitator || 0), 0)}</div>
              <div className="text-sm text-slate-500 mt-1 font-medium">fasilitator aktif</div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-500">
              <IconUserCheck />
            </div>
          </div>

          {/* Card 4 - Total Kapasitas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-800">{gedungs.reduce((s, g) => s + (g.kapasitas_mahasiswa || 0), 0).toLocaleString('id-ID')}</div>
              <div className="text-sm text-slate-500 mt-1 font-medium">kapasitas total kamar</div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100 text-purple-500">
              <IconMaximize2 />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ marginBottom: '20px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  background: activeTab === t.key ? '#fff' : 'transparent',
                  color: activeTab === t.key ? '#059669' : '#64748b',
                  boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Memuat data gedung...
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626' }}>
            {error}
          </div>
        )}



        {/* Tambah Gedung button — hanya muncul di tab card/table */}
        {(activeTab === 'card' || activeTab === 'table') && !loading && !error && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={openTambah} style={{
              background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
              border: 'none', borderRadius: '10px', padding: '9px 18px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Tambah Gedung
            </button>
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
                          <button onClick={() => openEdit(g)} style={{ background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '7px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
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

        {activeTab === 'tahun' && <TahunAkademikTab />}
        {activeTab === 'fakultas' && <FakultasTab />}
        {activeTab === 'jurusan' && <JurusanTab />}
        {activeTab === 'jenis' && <JenisKegiatanTab />}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Jumlah Lantai" type="number" value={form.jumlah_lantai} onChange={e => setForm({ ...form, jumlah_lantai: e.target.value })} required placeholder="Misal: 5" />
            <Field label="Kapasitas Mahasiswa" type="number" value={form.kapasitas_mahasiswa} onChange={e => setForm({ ...form, kapasitas_mahasiswa: e.target.value })} required placeholder="Misal: 360" />
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '11px', background: 'linear-gradient(135deg, #10b981, #059669)', marginTop: '8px',
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Menyimpan...' : 'Simpan Gedung'}
          </button>
        </Modal>
      )}

      {confirmObj && <ConfirmModal {...confirmObj} onCancel={() => setConfirmObj(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </SuperadminLayout>
  );
}
