const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Inisialisasi web-push dengan VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@simbima.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ VAPID keys belum diatur di .env. Push Notification tidak akan berfungsi.');
}

/**
 * Kirim Push Notification ke user berdasarkan role dan id
 * @param {Object} target { id_mahasiswa, id_fasilitator, id_ketua_pokja } (salah satu saja)
 * @param {Object} payload { title, body, url }
 */
const sendPush = async (target, payload) => {
  try {
    // Cari semua subscription dari user target (bisa multiple device)
    const subscriptions = await prisma.pushSubscription.findMany({
      where: target
    });

    if (!subscriptions || subscriptions.length === 0) {
      return; // Target belum mengizinkan notifikasi
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/'
    });

    // Kirim ke semua device dari user tersebut
    const sendPromises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth
        }
      };

      try {
        await webpush.sendNotification(pushSub, payloadString);
        console.log('[web-push] Push berhasil dikirim ke endpoint:', pushSub.endpoint.substring(0, 30) + '...');
      } catch (err) {
        // Jika expired/unsubscribed (410), hapus dari DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log('[web-push] Subscription expired/not found. Menghapus dari DB:', sub.id);
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error('[web-push] Error mengirim notifikasi:', err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error('[sendPush] Error:', error);
  }
};

module.exports = {
  webpush,
  sendPush
};
