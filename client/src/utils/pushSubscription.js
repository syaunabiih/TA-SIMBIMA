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

    // 2. Minta izin ke user
    const permission = await Notification.requestPermission();
    console.log('[pushSubscription] Notification permission:', permission);
    
    if (permission !== 'granted') {
      console.warn('Izin notifikasi ditolak oleh pengguna. (Cek pengaturan browser chrome://settings/content/notifications)');
      return;
    }

    // 3. Pastikan service worker sudah ready
    const registration = await navigator.serviceWorker.ready;

    // 4. Subscribe ke Push Service
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY tidak ditemukan di environment variables.');
      return;
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    console.log('[pushSubscription] Subscription berhasil dibuat:', subscription);

    // 5. Kirim subscription ke backend untuk disimpan
    // Ambil token JWT dari localStorage jika ada
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
