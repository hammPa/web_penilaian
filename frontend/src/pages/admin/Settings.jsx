import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { useToast } from '../../hooks/useToast';
import settingService from '../../services/settingService';
import { Save, Phone } from 'lucide-react';

export default function Settings() {
  const [waNumber, setWaNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchWa = async () => {
      try {
        const data = await settingService.get('whatsapp_admin');
        setWaNumber(data.value || '');
      } catch (err) {
        showToast('Gagal memuat pengaturan', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchWa();
  }, [showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingService.update('whatsapp_admin', waNumber);
      showToast('Pengaturan disimpan', 'success');
    } catch (err) {
      showToast('Gagal menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Memuat pengaturan...</div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-[#17203A]">Pengaturan Aplikasi</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola konfigurasi sistem secara umum.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nomor WhatsApp Bantuan Admin
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={waNumber}
                onChange={e => setWaNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C8933E]/40 outline-none"
                placeholder="Misal: 6281234567890"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Gunakan awalan kode negara tanpa tombol + (contoh: 62 untuk Indonesia). Nomor ini ditampilkan di halaman Login.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#17203A] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#232f52] transition-colors"
            >
              <Save size={16} />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}