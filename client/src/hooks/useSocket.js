import { useEffect } from "react";
import socket from "../lib/socket";

/**
 * Hook untuk subscribe ke event Socket.io.
 * Otomatis unsubscribe saat komponen unmount.
 *
 * @param {string}   event    Nama event socket (e.g. "perizinan:update")
 * @param {Function} callback Fungsi yang dipanggil saat event diterima
 */
export const useSocket = (event, callback) => {
  useEffect(() => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, [event, callback]);
};
