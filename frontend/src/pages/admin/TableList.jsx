import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import { LayoutGrid, List, Pencil, Trash, ArrowRight, Plus, Check, X } from 'lucide-react';

const LEVELS = [0, 1, 2, 3, 4, 5];

function CriteriaSpreadsheet({ tableId, tableName, criteria, variables }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="border border-slate-300 bg-[#F7D9B8] px-3 py-2 text-left font-bold text-[#17203A] w-56 align-middle"
            >
              KRITERIA&nbsp;{tableName?.toUpperCase()}
            </th>
            <th
              colSpan={LEVELS.length}
              className="border border-slate-300 bg-[#F7D9B8] px-3 py-1.5 text-center font-bold text-[#17203A]"
            >
              NILAI {tableName?.toUpperCase()}
            </th>
          </tr>
          <tr>
            {LEVELS.map((lvl) => (
              <th
                key={lvl}
                className="border border-slate-300 bg-slate-100 px-3 py-1.5 text-center font-semibold text-slate-600 w-32"
              >
                {lvl}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variables.length === 0 ? (
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium text-slate-700">-</td>
              <td colSpan={LEVELS.length} className="border border-slate-300 px-3 py-3 text-center text-slate-400">
                Belum ada variabel
              </td>
            </tr>
          ) : (
            variables.map((v) => (
              <tr key={v.id}>
                <td className="border border-slate-300 px-3 py-3 font-medium text-[#17203A] align-top">
                  <Link
                    to={`/admin/tables/${tableId}/criteria/${criteria.id}`}
                    className="hover:text-[#C8933E] transition-colors"
                  >
                    {criteria.name}
                  </Link>
                </td>
                {LEVELS.map((lvl) => (
                  <td key={lvl} className="border border-slate-300 px-3 py-3 text-center text-slate-600 align-top">
                    {v.levels?.[lvl]?.description || '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
          <tr>
            <td colSpan={LEVELS.length + 1} className="border border-slate-300 px-3 py-2 bg-slate-50/60">
              <Link
                to={`/admin/tables/${tableId}/criteria/${criteria.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C8933E] hover:text-[#a97a30] transition-colors"
              >
                <Plus size={14} /> Tambah Variabel
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GridModeTable({ table, criteriaList, variablesByCriteria, onCriteriaChanged, onEditTable, onDeleteTable }) {
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const startAddRow = () => {
    setNewRow({ name: '', description: '' });
    setAddingRow(true);
  };

  const cancelAddRow = () => setAddingRow(false);

  const saveRow = async () => {
    if (!newRow.name.trim()) {
      showToast('Nama kriteria wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      await criteriaService.create({ ...newRow, tableId: table.id });
      showToast('Kriteria ditambahkan', 'success');
      setAddingRow(false);
      onCriteriaChanged();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menambah kriteria', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-[#17203A]">{table.name}</h2>
          {table.description && (
            <p className="text-xs text-slate-500 mt-0.5">{table.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/admin/tables/${table.id}`}
            className="text-xs font-medium text-slate-500 hover:text-[#17203A] transition-colors inline-flex items-center gap-1"
          >
            Kelola detail <ArrowRight size={12} />
          </Link>
          <button
            onClick={() => onEditTable(table)}
            className="text-[#17203A] hover:text-[#C8933E] transition-colors"
            aria-label="Edit nama tabel"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteTable(table.id)}
            className="text-[#C1443A] hover:text-[#a3372f] transition-colors"
            aria-label="Hapus tabel"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {criteriaList.length === 0 && !addingRow && (
          <p className="text-sm text-slate-400 px-2">Belum ada kriteria pada tabel ini</p>
        )}

        {criteriaList.map((criteria) => (
          <CriteriaSpreadsheet
            key={criteria.id}
            tableId={table.id}
            tableName={table.name}
            criteria={criteria}
            variables={variablesByCriteria[criteria.id] || []}
          />
        ))}

        {addingRow ? (
          <div className="flex items-center gap-2 rounded-lg border border-[#C8933E]/40 bg-[#C8933E]/5 p-3">
            <input
              autoFocus
              type="text"
              value={newRow.name}
              onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
              placeholder="Nama kriteria baru"
              className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRow();
                if (e.key === 'Escape') cancelAddRow();
              }}
            />
            <input
              type="text"
              value={newRow.description}
              onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
              placeholder="Deskripsi (opsional)"
              className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRow();
                if (e.key === 'Escape') cancelAddRow();
              }}
            />
            <button
              onClick={saveRow}
              disabled={saving}
              className="text-[#0F9D6D] hover:text-[#0c7d58] transition-colors disabled:opacity-50"
              aria-label="Simpan"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={cancelAddRow}
              className="text-slate-400 hover:text-[#17203A] transition-colors"
              aria-label="Batal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={startAddRow}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C8933E] hover:text-[#a97a30] transition-colors"
          >
            <Plus size={16} /> Tambah Kriteria
          </button>
        )}
      </div>
    </div>
  );
}

export default function TableList() {
  const [tables, setTables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            headers={['Nama Tabel', 'Deskripsi', 'Jumlah Kriteria', 'Aksi']}
            data={tables}
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/admin/tables/${item.id}`} className="font-medium text-[#17203A] hover:text-[#C8933E] transition-colors">
                    {item.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-500">{item.description || '-'}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#C8933E]/10 text-[#8a6224]">
                    {criteriaCounts[item.id] || 0} kriteria
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4 text-sm font-medium items-center">
                    <Link
                      to={`/admin/tables/${item.id}`}
                      className="text-[#17203A] hover:text-[#C8933E] transition-colors inline-flex items-center gap-1"
                    >
                      Kelola <ArrowRight size={14} />
                    </Link>
                    <button onClick={(e) => openEdit(item, e)} className="text-[#17203A] cursor-pointer hover:text-[#C8933E] transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(item.id, e)} className="text-[#C1443A] cursor-pointer hover:text-[#a3372f] transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {tables.map((table) => (
            <GridModeTable
              key={table.id}
              table={table}
              criteriaList={criteria.filter((c) => c.tableId === table.id)}
              variablesByCriteria={variablesByCriteria}
              onCriteriaChanged={fetchData}
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