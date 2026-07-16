import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import sessionService from '../../services/sessionService';
import tableService from '../../services/tableService';
import { Layers, Pencil, Trash, ArrowRight, Copy, FilePlus2 } from 'lucide-react';

export default function SessionList() {
  const [sessions, setSessions] = useState([]);
  const [tableCounts, setTableCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [mode, setMode] = useState('blank'); // 'blank' | 'duplicate'
  const [sourceSessionId, setSourceSessionId] = useState('');
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [sessionData, tableData] = await Promise.all([
        sessionService.getAll(),
        tableService.getAll()
      ]);
      setSessions(sessionData);
      const counts = {};
      tableData.forEach((t) => {
        counts[t.sessionId] = (counts[t.sessionId] || 0) + 1;
      });
      setTableCounts(counts);
    } catch (err) {
      showToast('Gagal memuat data sesi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setMode('blank');
    setSourceSessionId('');
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast('Nama sesi wajib diisi', 'error');
      return;
    }
    try {
      if (editItem) {
        await sessionService.update(editItem.id, form);
        showToast('Sesi berhasil diperbarui', 'success');
      } else if (mode === 'duplicate') {
        if (!sourceSessionId) {
          showToast('Pilih sesi sumber untuk diduplikat', 'error');
          return;
        }
        await sessionService.duplicate(sourceSessionId, form);
        showToast('Sesi berhasil diduplikat', 'success');
      } else {
        await sessionService.create(form);
        showToast('Sesi berhasil dibuat', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus sesi ini? Semua Tabel, Kriteria, dan Variabel di dalamnya ikut terhapus permanen.')) return;
    try {
      await sessionService.remove(id);
      showToast('Sesi dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus', 'error');
    }
  };

  if (loading) return <Loading />;

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Master Data</p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#17203A]">
            Sesi Assessment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tiap sesi (mis. "Semester 1 2026") punya Tabel Penilaian, Kriteria, dan Variabel sendiri.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#17203A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#232f52] transition-colors shadow-sm shrink-0"
        >
          <FilePlus2 size={16} /> Buat Assessment Baru
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState message="Belum ada sesi assessment" icon={<Layers />} />
      ) : (
        <>
          {/* MOBILE — daftar card, satu kolom */}
          <div className="md:hidden space-y-3">
            {sessions.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/sessions/${item.id}/tables`}
                      className="font-medium text-[#17203A] text-sm hover:text-[#C8933E] transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {item.description || '-'}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#C8933E]/10 text-[#8a6224]">
                    {tableCounts[item.id] || 0} tabel
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>

                <Link
                  to={`/admin/sessions/${item.id}/tables`}
                  className="mt-3 flex items-center justify-center gap-1 w-full py-2 rounded-lg border border-slate-200 text-[#17203A] text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Kelola <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          {/* DESKTOP — tabel seperti semula */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <Table
              headers={['Nama Sesi', 'Deskripsi', 'Jumlah Tabel', 'Dibuat', 'Aksi']}
              data={sessions}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/admin/sessions/${item.id}/tables`} className="font-medium text-[#17203A] hover:text-[#C8933E] transition-colors">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{item.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#C8933E]/10 text-[#8a6224]">
                      {tableCounts[item.id] || 0} tabel
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4 text-sm font-medium items-center">
                      <Link
                        to={`/admin/sessions/${item.id}/tables`}
                        className="text-[#17203A] hover:text-[#C8933E] transition-colors inline-flex items-center gap-1"
                      >
                        Kelola <ArrowRight size={14} />
                      </Link>
                      <button onClick={() => openEdit(item)} className="text-[#17203A] hover:text-[#C8933E] transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-[#C1443A] hover:text-[#a3372f] transition-colors">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            />
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Sesi' : 'Buat Assessment Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editItem && (
            <div>
              <label className={labelClass}>Mulai dari</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('blank')}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    mode === 'blank' ? 'border-[#C8933E] bg-[#C8933E]/5 text-[#8a6224]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Kosong
                </button>
                <button
                  type="button"
                  onClick={() => setMode('duplicate')}
                  disabled={sessions.length === 0}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode === 'duplicate' ? 'border-[#C8933E] bg-[#C8933E]/5 text-[#8a6224]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Copy size={14} /> Duplikat
                </button>
              </div>
            </div>
          )}

          {!editItem && mode === 'duplicate' && (
            <div>
              <label className={labelClass}>Duplikat dari Sesi</label>
              <select
                value={sourceSessionId}
                onChange={(e) => setSourceSessionId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">-- Pilih Sesi Sumber --</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Semua Tabel, Kriteria, dan Variabel dari sesi ini akan disalin sebagai titik awal.
              </p>
            </div>
          )}

          <div>
            <label className={labelClass}>Nama Sesi</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Misal: Semester 1 2026"
              required
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              rows="2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
            <button type="submit" className="px-4 py-2 bg-[#17203A] text-white rounded-lg text-sm font-semibold hover:bg-[#232f52]">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}