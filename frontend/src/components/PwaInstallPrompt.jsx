import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Swal from 'sweetalert2';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isRunningStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true;
      setIsStandalone(isRunningStandalone);
    };

    checkStandalone();

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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Menggunakan SweetAlert agar estetik dan selaras dengan tema aplikasi
      Swal.fire({
        title: 'Cara Install Aplikasi',
        html: `
          <div style="text-align: left; font-size: 14px; color: #475569; line-height: 1.6;">
            <p style="margin-bottom: 8px;">Agar aplikasi lebih mudah diakses seperti aplikasi native:</p>
            <ol style="padding-left: 20px; margin: 0;">
              <li>Ketuk menu <b>titik tiga (⋮)</b> di pojok kanan atas browser Anda.</li>
              <li>Pilih opsi <b>'Install aplikasi'</b> atau <b>'Tambahkan ke Layar Utama'</b>.</li>
            </ol>
          </div>
        `,
        icon: 'info',
        confirmButtonText: mengerti,
        confirmButtonColor: '#C8933E'
      });
    }
  };

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