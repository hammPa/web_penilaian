import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Cek apakah aplikasi sudah di-install (berjalan dalam mode standalone)
    const checkStandalone = () => {
      const isRunningStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true;
      setIsStandalone(isRunningStandalone);
    };

    checkStandalone();

    // 2. Tangkap event prompt dari browser jika tersedia
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Jika event browser tersedia, gunakan method prompt() bawaan
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback jika event belum/tidak menembak (memberikan instruksi manual ke pengguna)
      alert(
        "Untuk menginstall aplikasi ini:\n\n" +
        "1. Ketuk menu titik tiga (⋮) di pojok kanan atas browser Anda.\n" +
        "2. Pilih 'Install aplikasi' atau 'Tambahkan ke Layar Utama'."
      );
    }
  };

  // Jika aplikasi sudah dibuka sebagai PWA yang ter-install, sembunyikan tombol
  if (isStandalone) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <button
        onClick={handleInstallClick}
        className="bg-[#C8933E] text-white px-5 py-3 rounded-full shadow-2xl shadow-black/30 flex items-center gap-2 text-sm font-semibold hover:bg-[#a6772f] transition-all border-2 border-white cursor-pointer"
      >
        <Download size={18} strokeWidth={2.5} />
        Install Aplikasi
      </button>
    </div>
  );
}