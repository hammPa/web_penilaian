import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Gauge, Loader2, User, Lock } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Username dan password wajib diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username, password);
      showToast('Login berhasil', 'success');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Login gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition text-sm placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-[#17203A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient dial motif echoing the scoring theme */}
      <div
        className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'conic-gradient(#C8933E 68%, transparent 68%)' }}
      />
      <div
        className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'conic-gradient(#C8933E 40%, transparent 40%)' }}
      />
      <div
        className="absolute top-1/3 left-10 h-2 w-2 rounded-full bg-[#C8933E]/60 pointer-events-none hidden sm:block"
      />
      <div
        className="absolute bottom-1/4 right-16 h-1.5 w-1.5 rounded-full bg-[#C8933E]/40 pointer-events-none hidden sm:block"
      />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/20 ring-1 ring-black/5 w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-2xl bg-[#C8933E]/10 ring-1 ring-[#C8933E]/20">
            <Gauge className="h-6 w-6 text-[#C8933E]" strokeWidth={2} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C8933E]">Selamat Datang</p>
          <h1 className="font-serif text-2xl font-semibold text-[#17203A] mt-1.5">Sistem Penilaian</h1>
          <p className="text-slate-500 text-sm mt-2">Silakan login untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={2} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={inputClass}
                placeholder="Masukkan username"
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={2} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Masukkan password"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#17203A] hover:bg-[#232f52] text-white font-semibold py-2.5 rounded-lg cursor-pointer transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                Memproses...
              </>
            ) : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
          <p>Demo: admin/admin123 atau user/user123</p>
        </div>
      </div>
    </div>
  );
}