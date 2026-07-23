import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { getDeferredPrompt, clearDeferredPrompt, onInstallPromptAvailable } from '../pwaInstall';

export default function PwaInstallPrompt() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Ambil langsung kalau event sudah tertangkap sebelum komponen ini mount
  const [deferredPrompt, setDeferredPrompt] = useState(() => getDeferredPrompt());
  const [isStandalone, setIsStandalone] = useState(false);
  // Hanya relevan di halaman SELAIN login -- kontrol tab kecil vs tombol penuh
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Cek apakah aplikasi sudah terinstal (mode standalone)
    const checkStandalone = () => {
      const isRunningStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(isRunningStandalone);
    };
    checkStandalone();

    // Subscribe ke event global — kalau event sudah ada, callback langsung
    // dipanggil sekali; kalau belum, akan dipanggil saat event benar-benar fire
    const unsubscribe = onInstallPromptAvailable((event) => {
      setDeferredPrompt(event);
    });

    return unsubscribe;
  }, []);

  // Setiap pindah halaman, balikin lagi ke kondisi "collapsed" (nyembul dikit
  // di pinggir) supaya tidak nyangkut kebuka terus pas navigasi ke page lain.
  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Tampilkan SweetAlert konfirmasi dulu (opsional, bisa dihapus
      // kalau mau langsung munculkan popup native browser tanpa dialog ini)
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
          // Munculkan prompt install NATIVE bawaan browser
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            clearDeferredPrompt();
            setDeferredPrompt(null);
            Swal.fire('Berhasil!', 'Aplikasi sedang diinstal.', 'success');
          } else {
            Swal.fire('Dibatalkan', 'Anda bisa instal nanti.', 'info');
          }
        }
      });
    } else {
      // Fallback ini SEHARUSNYA jarang muncul sekarang.
      // Kalau masih sering muncul di Chrome/Edge Android, artinya:
      // - manifest/service worker belum lolos syarat installability, atau
      // - browser memang tidak mendukung (Safari/iOS/Firefox desktop)
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

  // Jika sudah terinstal, sembunyikan tombol sepenuhnya
  if (isStandalone) return null;

  // Di halaman SELAIN login dan belum di-klik: tampilkan tab kecil nyembul
  // dari pinggir kanan layar. Klik sekali -> baru meleber jadi tombol penuh.
  const showCollapsedTab = !isLoginPage && !isExpanded;

  if (showCollapsedTab) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        title="Install Aplikasi"
        className="fixed bottom-6 right-0 z-50 bg-[#C8933E] text-white pl-3 pr-4 py-3 rounded-l-full shadow-lg shadow-black/20 flex items-center border-2 border-r-0 border-white translate-x-3 hover:translate-x-0 transition-transform duration-300 cursor-pointer"
      >
        <Download size={18} strokeWidth={2.5} />
      </button>
    );
  }

  // Tombol penuh: selalu tampil apa adanya di halaman login,
  // atau di halaman lain setelah tab kecil di atas diklik (isExpanded = true)
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