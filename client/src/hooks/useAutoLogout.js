import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useAutoLogout — Hook untuk auto-logout otomatis
 *
 * Fitur:
 * 1. Deteksi token JWT expired → logout segera
 * 2. Deteksi tidak ada aktivitas selama X menit → logout
 *
 * @param {number} inactivityMinutes - Waktu inaktivitas sebelum logout (default: 30 menit)
 */
function useAutoLogout(inactivityMinutes = 30) {
  const navigate = useNavigate();
  const inactivityTimer = useRef(null);
  const tokenExpiryTimer = useRef(null);

  // ─── Fungsi Logout ────────────────────────────────────────────────────────
  const logout = useCallback((reason = 'session_expired') => {
    // Hapus semua data sesi dari localStorage
    localStorage.removeItem('simbima_token');
    localStorage.removeItem('simbima_role');
    localStorage.removeItem('simbima_user');

    // Simpan alasan logout supaya LoginPage bisa tampilkan notif
    sessionStorage.setItem('simbima_logout_reason', reason);

    // Redirect ke halaman login
    navigate('/', { replace: true });
  }, [navigate]);

  // ─── Decode JWT (tanpa library) ───────────────────────────────────────────
  const getTokenExpiry = useCallback(() => {
    const token = localStorage.getItem('simbima_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // konversi ke ms
    } catch {
      return null;
    }
  }, []);

  // ─── Reset Timer Inaktivitas ──────────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    const token = localStorage.getItem('simbima_token');
    if (!token) return; // Tidak perlu timer kalau belum login

    inactivityTimer.current = setTimeout(() => {
      logout('inactivity');
    }, inactivityMinutes * 60 * 1000);
  }, [inactivityMinutes, logout]);

  // ─── Setup Token Expiry Timer ─────────────────────────────────────────────
  const setupTokenExpiryTimer = useCallback(() => {
    if (tokenExpiryTimer.current) clearTimeout(tokenExpiryTimer.current);

    const expiryMs = getTokenExpiry();
    if (!expiryMs) return;

    const timeUntilExpiry = expiryMs - Date.now();

    if (timeUntilExpiry <= 0) {
      // Token sudah expired sejak awal
      logout('token_expired');
      return;
    }

    tokenExpiryTimer.current = setTimeout(() => {
      logout('token_expired');
    }, timeUntilExpiry);
  }, [getTokenExpiry, logout]);

  // ─── Effect Utama ─────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('simbima_token');
    if (!token) return; // Tidak lakukan apa-apa kalau belum login

    // 1. Setup timer token expiry
    setupTokenExpiryTimer();

    // 2. Setup timer inaktivitas
    resetInactivityTimer();

    // 3. Pantau aktivitas user di browser
    const activityEvents = [
      'mousedown', 'mousemove', 'keydown',
      'scroll', 'touchstart', 'click', 'keypress'
    ];

    activityEvents.forEach(event =>
      window.addEventListener(event, resetInactivityTimer, { passive: true })
    );

    // 4. Cek token ketika tab kembali aktif (user buka tab lain lalu kembali)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const expiryMs = getTokenExpiry();
        if (!expiryMs || Date.now() >= expiryMs) {
          logout('token_expired');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup saat komponen unmount
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (tokenExpiryTimer.current) clearTimeout(tokenExpiryTimer.current);
      activityEvents.forEach(event =>
        window.removeEventListener(event, resetInactivityTimer)
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setupTokenExpiryTimer, resetInactivityTimer, getTokenExpiry, logout]);
}

export default useAutoLogout;
