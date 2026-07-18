import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Flag untuk mencegah multiple popups/redirects jika ada banyak API call yang gagal bersamaan
let isAlertShowing = false; 

// Interceptor untuk menambahkan token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor untuk menangani error global
api.interceptors.response.use(
  response => response,
  error => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    // Pastikan tidak ada alert atau redirect yang sedang berjalan
    if (error.response?.status === 401 && !isLoginRequest && !isAlertShowing) {
      
      // Ambil pesan error (tambahkan fallback string kosong jika undefined)
      const errorMessage = error.response?.data?.message || '';

      // Gunakan .includes() alih-alih === agar lebih aman dari perbedaan spasi/typo
      const isSessionExpired = errorMessage.toLowerCase().includes('sesi berakhir') || 
                               errorMessage.toLowerCase().includes('perangkat lain');

      if (isSessionExpired) {
        isAlertShowing = true; // Kunci proses

        Swal.fire({
          icon: 'warning',
          title: 'Sesi Berakhir',
          text: errorMessage || 'Sesi berakhir karena akun ini telah login di perangkat lain.',
          confirmButtonText: 'Login Ulang',
          confirmButtonColor: '#C8933E',
          allowOutsideClick: false
        }).then(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        });
        
        return new Promise(() => {}); 
      } else {
        // Blok ELSE ini penting agar request 401 biasa tidak langsung me-redirect 
        // ketika if di atas sedang berjalan (jika tidak pakai flag isAlertShowing)
        isAlertShowing = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // Jika isAlertShowing sudah true (sedang ada alert), 
    // kita matikan error dari request lain yang menyusul agar tidak mengganggu
    if (error.response?.status === 401 && isAlertShowing) {
       return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);

export default api;