// pwaInstall.js
// Menangkap event 'beforeinstallprompt' SEDINI MUNGKIN,
// bahkan sebelum React selesai mount. Ini wajib supaya event
// tidak pernah "kelewatan" oleh komponen yang mount belakangan.

let deferredPromptEvent = null;
let hasFired = false;
const listeners = new Set();

// Pasang listener di module-level, dieksekusi begitu file ini di-import
// (harus di-import paling awal, sebelum ReactDOM.render/createRoot)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPromptEvent = e;
  hasFired = true;
  // Beri tahu semua komponen yang sudah subscribe
  listeners.forEach((cb) => cb(e));
});

// Dipanggil browser setelah app benar-benar terinstall
window.addEventListener('appinstalled', () => {
  deferredPromptEvent = null;
  hasFired = false;
});

export function getDeferredPrompt() {
  return deferredPromptEvent;
}

export function clearDeferredPrompt() {
  deferredPromptEvent = null;
}

// Komponen panggil ini di useEffect untuk subscribe.
// Kalau event SUDAH tertangkap sebelum komponen mount,
// callback langsung dipanggil sekali dengan event yang tersimpan.
export function onInstallPromptAvailable(callback) {
  if (hasFired && deferredPromptEvent) {
    callback(deferredPromptEvent);
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
}