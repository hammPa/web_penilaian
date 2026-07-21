import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Swal from 'sweetalert2';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Cek apakah aplikasi sudah terinstal (mode standalone)
    const checkStandalone = () => {
      const isRunningStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(isRunningStandalone);
    };
    checkStandalone();

    // Tangkap event beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e); // simpan event untuk dipakai nanti
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Tampilkan SweetAlert dengan tombol install
      Swal.fire({
        title: 'Instal Aplikasi',
        text: 'Pasang aplikasi ini di perangkat Anda agar lebih mudah diakses.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Install Sekarang',
        cancelButtonText: 'Nanti Saja',
        confirmButtonColor: '#C8933E',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          // User klik Install → langsung muncul prompt bawaan browser
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            setDeferredPrompt(null);
            Swal.fire('Berhasil!', 'Aplikasi sedang diinstal.', 'success');
          } else {
            Swal.fire('Dibatalkan', 'Anda bisa instal nanti.', 'info');
          }
        }
      });
    } else {
      // Fallback jika browser tidak mendukung (misal Safari atau sudah ditolak)
      Swal.fire({
        title: 'Cara Install Manual',
        html: `
          <div style="text-align:left; font-size:14px;">
            <p>Browser Anda tidak mendukung instalasi otomatis. Silakan instal manual:</p>
            <ol style="padding-left:20px;">
              <li>Klik menu <b>⋮</b> (titik tiga) di pojok kanan atas.</li>
              <li>Pilih <b>'Install aplikasi'</b> atau <b>'Tambahkan ke Layar Utama'</b>.</li>
            </ol>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Mengerti',
        confirmButtonColor: '#C8933E',
      });
    }
  };

  // Jika sudah terinstal, sembunyikan tombol
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