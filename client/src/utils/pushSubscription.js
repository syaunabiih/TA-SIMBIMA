// Removed axios import

// Helper untuk mengubah base64 URL safe VAPID key ke Uint8Array (dibutuhkan oleh pushManager)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribePush = async () => {
  try {
    // 1. Cek apakah service worker dan push manager didukung browser
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging tidak didukung oleh browser ini.');
      return;
    }

    // 2. Pastikan service worker sudah ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Cek apakah sudah ada subscription aktif di browser
    const existingSub = await registration.pushManager.getSubscription();
    
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY tidak ditemukan di environment variables.');
      return;
    }

    let subscription = existingSub;

    // Cek apakah permission ditolak di level OS / Browser
    if (Notification.permission === 'denied') {
      console.warn('Izin notifikasi diblokir oleh browser. Silakan izinkan dari pengaturan situs.');
      // Munculkan alert kecil atau UI peringatan jika perlu
      alert("Peringatan: Notifikasi browser diblokir. Anda tidak akan menerima pemberitahuan push. Silakan izinkan dari gembok URL di atas.");
      return;
    }

    // 4. Jika belum ada subscription atau belum diizinkan, minta izin & buat baru
    if (!subscription || Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      console.log('[pushSubscription] Notification permission:', permission);
      
      if (permission !== 'granted') {
        console.warn('Izin notifikasi ditolak oleh pengguna.');
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        console.log('[pushSubscription] Subscription baru dibuat:', subscription);
      } catch (err) {
        console.warn('[pushSubscription] Gagal subscribe, mencoba menghapus subscription lama...', err);
        // Terkadang gagal karena VAPID key berubah, coba hapus yang lama (jika ada tersembunyi) lalu ulangi
        if (existingSub) await existingSub.unsubscribe();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }
    } else {
      console.log('[pushSubscription] Menggunakan subscription yang sudah ada.');
    }

    // 5. Kirim subscription ke backend untuk disimpan (upsert berdasarkan endpoint)
    const token = localStorage.getItem('simbima_token');
    if (!token) return;

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    console.log('✅ Push notification berhasil di-subscribe.');
  } catch (error) {
    console.error('Gagal subscribe push notification:', error);
  }
};

export const unsubscribePush = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;

      // Hapus langganan di browser
      await subscription.unsubscribe();
      console.log('[pushSubscription] Subscription dihapus dari browser.');

      // Beritahu backend untuk hapus dari database
      const token = localStorage.getItem('simbima_token');
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ endpoint })
        });
        console.log('✅ Push notification berhasil di-unsubscribe dari server.');
      }
    }
  } catch (error) {
    console.error('Gagal unsubscribe push notification:', error);
  }
};
