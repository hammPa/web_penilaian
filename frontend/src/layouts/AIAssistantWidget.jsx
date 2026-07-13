import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ====== MENU KHUSUS ADMIN ======
const MENU_OPTIONS_ADMIN = [
  {
    id: 'admin-dashboard',
    label: 'Buka dashboard admin',
    path: '/admin/dashboard',
    reply: 'Dashboard admin sedang disiapkan. Anda akan diarahkan ke halaman utama.',
  },
  {
    id: 'admin-tables',
    label: 'Kelola tabel & buat tabel baru',
    path: '/admin/tables',
    reply: 'Mengarahkan ke manajemen tabel. Gunakan tombol "Buat Tabel" untuk memulai.',
  },
  {
    id: 'admin-assessments',
    label: 'Lihat semua penilaian user',
    path: '/admin/assessments',
    reply: 'Menampilkan rekap penilaian dari seluruh user.',
  },
  {
    id: 'ask-copypaste',
    label: 'Tanya fitur salin-tempel',
    reply: 'Anda dapat menyalin 5 kolom sekaligus dan menempelkannya di kolom pertama — khusus untuk kolom variabel.',
  },
];

// ====== MENU KHUSUS USER ======
const MENU_OPTIONS_USER = [
  {
    id: 'user-dashboard',
    label: 'Buka dashboard',
    path: '/dashboard',
    reply: 'Dashboard utama sedang dibuka.',
  },
  {
    id: 'new-assessment',
    label: 'Isi penilaian baru',
    path: '/assessment/new',
    reply: 'Membuka formulir penilaian baru. Silakan isi data dengan lengkap.',
  },
  {
    id: 'history',
    label: 'Lihat riwayat penilaian saya',
    path: '/assessments',
    reply: 'Menampilkan daftar penilaian yang telah Anda isi sebelumnya.',
  },
];

const LOADING_STEPS = [
  'Menganalisis permintaan…',
  'Menghubungkan ke data…',
  'Menyusun tampilan…',
  'Siap menampilkan halaman…',
];

const GREETING_ADMIN = 'Selamat datang, Admin. Pilih opsi di bawah untuk memulai.';
const GREETING_USER = 'Selamat datang. Pilih opsi di bawah untuk memulai.';

let msgCounter = 0;
const nextId = () => `m-${++msgCounter}-${Date.now()}`;

// ====== KOMPONEN TYPING INDICATOR ======
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0s' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.15s' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.3s' }} />
    </div>
  );
}

// ====== KOMPONEN LOADING STEPS ======
function LoadingSteps({ steps }) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= steps.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 480);
    return () => clearTimeout(t);
  }, [visibleCount, steps.length]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500 space-y-2 shadow-sm">
      <div className="flex items-center gap-2.5 text-slate-400 text-[11px] font-medium tracking-wide uppercase">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300 animate-pulse" />
        Sedang memproses
      </div>
      {steps.slice(0, visibleCount).map((step, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-200 text-[8px] font-bold flex items-center justify-center">
            {i === visibleCount - 1 ? (
              <span className="inline-block h-2 w-2 rounded-full border border-slate-300 border-t-slate-600 animate-spin" />
            ) : (
              <span className="text-slate-400">✓</span>
            )}
          </span>
          <span className={i === visibleCount - 1 ? 'text-slate-700 font-medium' : 'text-slate-400'}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}

// ====== KOMPONEN UTAMA ======
export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const timeouts = useRef([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // State untuk drag & auto-hide
  const [dragOffset, setDragOffset] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const buttonRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const autoHideTimer = useRef(null);

  const isAdmin = user?.role === 'admin';
  const menuOptions = isAdmin ? MENU_OPTIONS_ADMIN : MENU_OPTIONS_USER;
  const greeting = isAdmin ? GREETING_ADMIN : GREETING_USER;

  // ====== FUNGSI UNTUK AUTO-HIDE ======
  const hideButton = () => {
    if (!open && !isDragging.current) {
      const buttonWidth = buttonRef.current?.offsetWidth || 150;
      setIsHidden(true);
      setDragOffset(buttonWidth - 10); // sisakan 10px
    }
  };

  const showButton = () => {
    setIsHidden(false);
    setDragOffset(0);
  };

  const resetAutoHideTimer = () => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    // Mulai timer auto-hide jika tombol tidak disembunyikan dan panel tertutup
    if (!isHidden && !open) {
      autoHideTimer.current = setTimeout(() => {
        hideButton();
      }, 5000); // 5 detik
    }
  };

  // Jalankan auto-hide saat komponen mount atau state berubah
  useEffect(() => {
    resetAutoHideTimer();
    return () => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    };
  }, [open, isHidden]);

  // Saat hover atau interaksi, batalkan auto-hide dan tampilkan tombol
  const handleButtonInteraction = () => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    if (isHidden) {
      showButton();
    }
    // Timer akan direset ulang setelah interaksi selesai (di mouseleave atau touchend)
  };

  const handleButtonLeave = () => {
    // Reset timer setelah beberapa saat
    if (!open && !isDragging.current) {
      setTimeout(() => resetAutoHideTimer(), 1000);
    }
  };

  const schedule = (fn, delay) => {
    const t = setTimeout(fn, delay);
    timeouts.current.push(t);
    return t;
  };

  useEffect(() => {
    return () => timeouts.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const handleOpen = () => {
    // Jika tombol dalam keadaan tersembunyi, tampilkan dulu
    if (isHidden) {
      showButton();
      // Hapus timer auto-hide sementara
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
        autoHideTimer.current = null;
      }
      // Buka panel setelah animasi selesai
      setTimeout(() => {
        setOpen(true);
        timeouts.current.forEach(clearTimeout);
        timeouts.current = [];
        setBusy(false);
        setMessages([
          { id: nextId(), from: 'ai', type: 'text', content: greeting },
          { id: nextId(), from: 'ai', type: 'options', content: menuOptions },
        ]);
      }, 200);
      return;
    }

    setOpen(true);
    // Batalkan auto-hide saat panel dibuka
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setBusy(false);
    setMessages([
      { id: nextId(), from: 'ai', type: 'text', content: greeting },
      { id: nextId(), from: 'ai', type: 'options', content: menuOptions },
    ]);
  };

  const handleClosePanel = () => {
    setOpen(false);
    // Reset timer auto-hide setelah panel ditutup
    setTimeout(() => resetAutoHideTimer(), 1000);
  };

  const handleOptionClick = (option) => {
    if (busy) return;
    setBusy(true);

    setMessages((prev) => [
      ...prev.filter((m) => m.type !== 'options'),
      { id: nextId(), from: 'user', type: 'text', content: option.label },
    ]);

    schedule(() => {
      setMessages((prev) => [...prev, { id: nextId(), from: 'ai', type: 'typing' }]);
    }, 300);

    schedule(() => {
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== 'typing'),
        { id: nextId(), from: 'ai', type: 'text', content: option.reply },
      ]);

      if (!option.path) {
        setBusy(false);
        schedule(() => {
          setMessages((prev) => [
            ...prev,
            { id: nextId(), from: 'ai', type: 'options', content: menuOptions },
          ]);
        }, 800);
        return;
      }
    }, 1000);

    if (option.path) {
      schedule(() => {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), from: 'ai', type: 'loading', content: LOADING_STEPS },
        ]);
      }, 1400);

      const totalLoadingTime = 1400 + LOADING_STEPS.length * 480 + 300;
      schedule(() => {
        navigate(option.path);
        setOpen(false);
        setBusy(false);
        // Setelah navigasi, reset auto-hide
        setTimeout(() => resetAutoHideTimer(), 1000);
      }, totalLoadingTime);
    }
  };

  const handleReset = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setBusy(false);
    setMessages([
      { id: nextId(), from: 'ai', type: 'text', content: greeting },
      { id: nextId(), from: 'ai', type: 'options', content: menuOptions },
    ]);
  };

  // ====== DRAG / SWIPE LOGIC ======
  const handleDragStart = (e) => {
    if (open) return;
    // Batalkan auto-hide saat mulai drag
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    // Jika sedang tersembunyi, tampilkan dulu
    if (isHidden) {
      showButton();
    }
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startX.current = clientX - dragOffset;
    isDragging.current = true;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('touchend', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!isDragging.current || open) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let newOffset = clientX - startX.current;
    if (newOffset < 0) newOffset = 0;
    const buttonWidth = buttonRef.current?.offsetWidth || 150;
    const maxOffset = buttonWidth - 10;
    if (newOffset > maxOffset) newOffset = maxOffset;
    setDragOffset(newOffset);
    currentX.current = newOffset;
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);

    const buttonWidth = buttonRef.current?.offsetWidth || 150;
    if (currentX.current > buttonWidth * 0.6) {
      setIsHidden(true);
      setDragOffset(buttonWidth - 10);
    } else {
      setIsHidden(false);
      setDragOffset(0);
    }
    // Reset auto-hide setelah drag selesai
    setTimeout(() => resetAutoHideTimer(), 1000);
  };

  if (!user) return null;

  return (
    <>
      {/* ====== TOMBOL PEMBUKA ====== */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        onMouseEnter={handleButtonInteraction}
        onMouseLeave={handleButtonLeave}
        onTouchStart={(e) => {
          // Touch start juga memicu interaksi
          handleButtonInteraction();
          handleDragStart(e);
        }}
        onMouseDown={handleDragStart}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        className={`fixed bottom-18 right-6 z-50 items-center gap-3 rounded-full bg-[#1a1a2e] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-black/20 hover:bg-[#2a2a44] transition-colors duration-200 cursor-pointer ${
          open ? 'hidden' : 'flex'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span>Bantuan</span>
      </button>

      {/* ====== PANEL CHAT ====== */}
      <div
        className={`fixed bottom-6 right-6 z-50 h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/15 border border-slate-200/80 ${
          open ? 'flex' : 'hidden'
        }`}
      >
        {/* ---- HEADER ---- */}
        <div className="flex items-center justify-between bg-[#1a1a2e] px-5 py-4">
          <div>
            <p className="font-serif text-sm font-semibold text-white/90 tracking-wide leading-tight">Asisten</p>
            <p className="text-[10px] text-white/40 font-light tracking-widest uppercase mt-0.5">
              {busy ? 'Memproses…' : `${isAdmin ? 'Admin' : 'User'} · Siap`}
            </p>
          </div>
          <button
            onClick={handleClosePanel}
            className="text-white/30 hover:text-white/70 transition-colors cursor-pointer text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* ---- BODY ---- */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#f8f9fc] px-4 py-5 space-y-4">
          {messages.map((m) => {
            if (m.type === 'options') {
              return (
                <div key={m.id} className="flex flex-col gap-2.5">
                  {m.content.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt)}
                      disabled={busy}
                      className="text-left rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1a1a2e] font-medium hover:border-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              );
            }

            if (m.type === 'typing') {
              return (
                <div key={m.id} className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 shadow-sm">
                    <TypingDots />
                  </div>
                </div>
              );
            }

            if (m.type === 'loading') {
              return (
                <div key={m.id} className="flex justify-start w-full">
                  <div className="w-full">
                    <LoadingSteps steps={m.content} />
                  </div>
                </div>
              );
            }

            const isUser = m.from === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'rounded-br-sm bg-[#1a1a2e] text-white'
                      : 'rounded-bl-sm bg-white border border-slate-200/80 text-slate-700 shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- FOOTER ---- */}
        <div className="border-t border-slate-200/80 bg-white px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-light tracking-wide">Asisten navigasi internal</span>
          <button
            onClick={handleReset}
            disabled={busy}
            className="text-[11px] font-medium text-slate-400 hover:text-[#1a1a2e] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mulai ulang
          </button>
        </div>
      </div>
    </>
  );
}