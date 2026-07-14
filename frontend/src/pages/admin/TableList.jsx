import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import ListModeTable from './list_mode/ListModeTable';
import GridModeTable from './table_mode/GridModeTable';
import { LayoutGrid, List } from 'lucide-react';


export default function TableList() {
  const [tables, setTables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'list' | 'grid'
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [tableData, criteriaData, variableData] = await Promise.all([
        tableService.getAll(),
        criteriaService.getAll(),
        variableService.getAll()
      ]);
      setTables(tableData);
      setCriteria(criteriaData);
      setVariables(variableData);
    } catch (err) {
      showToast('Gagal memuat data tabel', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const criteriaCounts = criteria.reduce((acc, c) => {
    acc[c.tableId] = (acc[c.tableId] || 0) + 1;
    return acc;
  }, {});

  const variablesByCriteria = variables.reduce((acc, v) => {
    if (!acc[v.criteriaId]) acc[v.criteriaId] = [];
    acc[v.criteriaId].push(v);
    return acc;
  }, {});

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditItem(item);
    setForm({ name: item.name, description: item.description });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast('Nama tabel wajib diisi', 'error');
      return;
    }
    try {
      if (editItem) {
        await tableService.update(editItem.id, form);
        showToast('Tabel berhasil diperbarui', 'success');
      } else {
        await tableService.create(form);
        showToast('Tabel berhasil ditambahkan', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm('Hapus tabel ini? Semua kriteria dan variabel di dalamnya juga akan terhapus.')) return;
    try {
      await tableService.remove(id);
      showToast('Tabel dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus', 'error');
    }
  };

  const handleDeleteCriteria = async (id) => {
    if (!window.confirm('Hapus kriteria ini? Semua variabel/level di dalamnya juga akan terhapus.')) return;
    try {
      await criteriaService.remove(id);
      showToast('Kriteria dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus kriteria', 'error');
    }
  };

  if (loading) return <Loading />;

  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Master Data</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
            Tabel Penilaian
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-[#17203A] text-white' : 'text-slate-500 hover:text-[#17203A]'
              }`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-[#17203A] text-white' : 'text-slate-500 hover:text-[#17203A]'
              }`}
            >
              <LayoutGrid size={14} /> Tabel
            </button>
          </div>
          <button
            onClick={openCreate}
            className="bg-[#17203A] cursor-pointer hover:bg-[#232f52] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            + Tambah Tabel
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <EmptyState message="Belum ada tabel penilaian" icon={<LayoutGrid />} />
      ) : viewMode === 'list' ? (
        <ListModeTable 
          tables={tables}
          criteriaCounts={criteriaCounts}
          onEditTable={openEdit}
          onDeleteTable={handleDelete}
        />
      ) : (
        <div className="space-y-6">
          {tables.map((table) => (
            <GridModeTable
              key={table.id}
              table={table}
              criteriaList={criteria.filter((c) => c.tableId === table.id)}
              variablesByCriteria={variablesByCriteria}
              onCriteriaChanged={fetchData}
              onDeleteCriteria={handleDeleteCriteria}
              onEditTable={openEdit}
              onDeleteTable={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Tabel' : 'Tambah Tabel'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nama Tabel</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Misal: Penilaian Kinerja Karyawan"
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