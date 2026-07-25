self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[SW] Push event tanpa data, diabaikan.');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.warn('[SW] Push data bukan JSON valid. Menggunakan text mentah:', e.message);
    // Fallback: gunakan teks mentah sebagai body notifikasi
    data = {
      title: 'Notifikasi SIMBIMA',
      body: event.data.text()
    };
  }

  console.log('[SW] Push event diterima:', data);

  const title = data.title || 'SIMBIMA';
  const options = {
    body: data.body || 'Ada notifikasi baru.',
    tag: data.tag || 'simbima-notif',        // grouping notif sejenis
    renotify: true,                            // tetap tampil meski tag sama
    vibrate: [200, 100, 200],
    requireInteraction: false,                 // auto-dismiss setelah beberapa detik
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] Notifikasi berhasil ditampilkan:', title))
      .catch(err => console.error('[SW] Gagal tampilkan notifikasi:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  console.log('[SW] Notification diklik, URL:', event.notification.data?.url);

  if (event.notification.data && event.notification.data.url) {
    const targetUrl = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Fokuskan tab yang sudah ada
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Buka tab baru jika belum ada
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
});

// Install event: paksa SW baru langsung aktif
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Aktifkan SW baru langsung tanpa menunggu tab lama ditutup
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
