import { useEffect, useRef } from "react";
import socket from "../lib/socket";

/**
 * Hook untuk subscribe ke event Socket.io.
 * Otomatis unsubscribe saat komponen unmount.
 * Menggunakan useRef agar listener tidak perlu di-re-register
 * setiap kali referensi callback berubah.
 *
 * @param {string}   event    Nama event socket (e.g. "perizinan:update")
 * @param {Function} callback Fungsi yang dipanggil saat event diterima
 */
export const useSocket = (event, callback) => {
  // Simpan callback terbaru di ref agar selalu up-to-date tanpa re-subscribe
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    const handler = (...args) => cbRef.current?.(...args);
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event]); // hanya re-subscribe jika nama event berubah
};
