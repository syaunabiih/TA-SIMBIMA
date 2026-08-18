/**
 * Menghitung jarak antara dua koordinat latitude dan longitude dalam meter
 * menggunakan Formula Haversine.
 * 
 * @param {number} lat1 Latitude titik 1
 * @param {number} lon1 Longitude titik 1
 * @param {number} lat2 Latitude titik 2
 * @param {number} lon2 Longitude titik 2
 * @returns {number} Jarak dalam meter
 */
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Jarak dalam kilometer
  return d * 1000; // Konversi ke meter
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = {
  getDistanceFromLatLonInM
};
