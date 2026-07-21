import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Cek apakah sudah terinstal (mode standalone)
    const checkStandalone = () => {
      const isRunningStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(isRunningStandalone);
    };
    checkStandalone();

    // Handler untuk beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Tampilkan SweetAlert dengan tombol Install
      Swal.fire({
        title: 'Instal Aplikasi',
        text: 'Ingin memasang aplikasi ini di perangkat Anda?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Install Sekarang',
        cancelButtonText: 'Nanti Saja',
        confirmButtonColor: '#C8933E',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          // User mengklik Install
          if (e) {
            e.prompt();
            const { outcome } = await e.userChoice;
            if (outcome === 'accepted') {
              setDeferredPrompt(null);
              Swal.fire('Berhasil!', 'Aplikasi akan segera terinstal.', 'success');
            } else {
              Swal.fire('Dibatalkan', 'Anda dapat menginstal nanti.', 'info');
            }
          }
        } else {
          // User memilih Nanti, simpan prompt untuk digunakan nanti
          setDeferredPrompt(e);
          Swal.fire({
            title: 'Instalasi ditunda',
            text: 'Kamu bisa instal kapan saja melalui menu browser.',
            icon: 'info',
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Jika sudah standalone, tidak tampilkan apapun
  if (isStandalone) return null;

  // Tidak ada tombol floating, semua melalui SweetAlert
  return null;
}