import { createPortal } from 'react-dom';

/**
 * Modal wrapper global — di-render langsung ke document.body via portal
 * sehingga overlay mencakup seluruh viewport, termasuk sidebar & header.
 *
 * Props:
 *   isOpen   {boolean}  — tampilkan modal
 *   onClose  {function} — dipanggil saat klik backdrop atau tombol ✕
 *   children {node}     — isi modal (tanpa div wrapper tambahan)
 *   maxWidth {string}   — lebar maksimum konten (default '480px')
 *   noPadding {boolean} — jika true, hapus padding bawaan konten wrapper
 */
export default function Modal({ isOpen, onClose, children, maxWidth = '480px', noPadding = false }) {
  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          padding: noPadding ? 0 : '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
