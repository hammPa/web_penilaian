import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Event ini hanya akan ditembak oleh browser JIKA syarat PWA terpenuhi (ada icon PNG & manifest valid)
    const handleBeforeInstallPrompt = (e) => {
      // Mencegah prompt bawaan browser muncul secara otomatis
      e.preventDefault();
      // Simpan event ke state agar bisa dipanggil nanti saat tombol diklik
      setDeferredPrompt(e);
      // Tampilkan tombol kita
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Tampilkan prompt instalasi bawaan OS/Browser
    deferredPrompt.prompt();
    
    // Tunggu respons user
    const { outcome } = await deferredPrompt.userChoice;
    
    // Setelah prompt dijawab, sembunyikan tombol
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-bounce">
      <button
        onClick={handleInstallClick}
        className="bg-[#C8933E] text-white px-5 py-3 rounded-full shadow-xl shadow-black/20 flex items-center gap-2 text-sm font-semibold hover:bg-[#a6772f] transition-all border-2 border-white"
      >
        <Download size={18} strokeWidth={2.5} />
        Install Aplikasi
      </button>
    </div>
  );
}