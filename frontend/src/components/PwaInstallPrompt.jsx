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
      // Tampilkan SweetAlert dengan tombol install
      Swal.fire({
        title: 'Instal Aplikasi',
        text: 'Pasang aplikasi ini di perangkat Anda?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Install',
        cancelButtonText: 'Nanti',
        confirmButtonColor: '#C8933E',
        reverseButtons: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            setDeferredPrompt(null);
            Swal.fire('Berhasil!', 'Aplikasi terinstal.', 'success');
          }
        }
      });
    } else {
      // Fallback manual
      Swal.fire({
        title: 'Cara Install',
        html: `<p>Buka menu browser (⋮) → Install Aplikasi</p>`,
        icon: 'info',
        confirmButtonText: 'OK',
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