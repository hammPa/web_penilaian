import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import { ClipboardList, Pencil, Trash, ArrowLeft, Wrench } from 'lucide-react';

export default function TableDetail() {
  const { tableId } = useParams();
  const [table, setTable] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [variableCounts, setVariableCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [tableData, criteriaData, allVariables] = await Promise.all([
        tableService.getById(tableId),
        criteriaService.getAll(tableId),
        variableService.getAll()
      ]);
      setTable(tableData);
      setCriteria(criteriaData);
      const counts = {};
      allVariables.forEach(v => {
        counts[v.criteriaId] = (counts[v.criteriaId] || 0) + 1;
      });
      setVariableCounts(counts);
    } catch (err) {
      showToast('Gagal memuat data kriteria', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableId]);

  const openCreate = () => {
    setEditItem(null);
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
      showToast('Nama kriteria wajib diisi', 'error');
      return;
    }
    try {
      if (editItem) {
        await criteriaService.update(editItem.id, form);
        showToast('Kriteria berhasil diperbarui', 'success');
      } else {
        await criteriaService.create({ ...form, tableId });
        showToast('Kriteria berhasil ditambahkan', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus kriteria ini? Semua variabel di dalamnya juga akan terhapus.')) return;
    try {
      await criteriaService.remove(id);
      showToast('Kriteria dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus', 'error');
    }
  };

  if (loading) return <Loading />;
  if (!table) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">Tabel tidak ditemukan</p>
      </div>
    );
  }

  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  // Balik ke halaman Tabel Penilaian milik sesi ini (bukan /admin/tables yang sudah tidak ada)
  const backLink = table.sessionId ? `/admin/sessions/${table.sessionId}/tables` : '/admin/sessions';

  return (
    <div>
      <Link
        to={backLink}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#17203A] transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Tabel
      </Link>

      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Tabel</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
            {table.name}
          </h1>
          {table.description && (
            <p className="mt-1 text-sm text-slate-500">{table.description}</p>
          )}
        </div>
        <button
          onClick={openCreate}
          className="bg-[#17203A] cursor-pointer hover:bg-[#232f52] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm shrink-0"
        >
          + Tambah Kriteria
        </button>
      </div>

      {criteria.length === 0 ? (
        <EmptyState message="Belum ada kriteria pada tabel ini" icon={<ClipboardList />} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            headers={['Nama', 'Deskripsi', 'Variabel', 'Aksi']}
            data={criteria}
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-4 font-medium text-[#17203A]">{item.name}</td>
                <td className="px-6 py-4 text-slate-500">{item.description || '-'}</td>
                <td className="px-6 py-4">
                  <Link
                    to={`/admin/tables/${tableId}/criteria/${item.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#17203A] hover:text-[#C8933E] transition-colors"
                  >
                    <Wrench size={14} /> {variableCounts[item.id] || 0} variabel
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4 text-sm font-medium">
                    <button onClick={() => openEdit(item)} className="text-[#17203A] cursor-pointer hover:text-[#C8933E] transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-[#C1443A] cursor-pointer hover:text-[#a3372f] transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Kriteria' : 'Tambah Kriteria'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nama</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              required
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
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-[#17203A] hover:bg-[#232f52] text-white rounded-lg text-sm font-semibold transition-colors">
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}