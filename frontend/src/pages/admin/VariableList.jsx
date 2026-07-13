import { useState, useEffect } from 'react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import variableService from '../../services/variableService';
import criteriaService from '../../services/criteriaService';
import { Pencil, Trash, Wrench } from 'lucide-react';

const defaultLevels = Array.from({ length: 6 }, () => ({ description: '' }));

export default function VariableList() {
  const [variables, setVariables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    criteriaId: '',
    weight: '',
    formula: 'bobot * skor',
    description: '',
    levels: [...defaultLevels]
  });

  const fetchData = async () => {
    try {
      const [vars, crits] = await Promise.all([
        variableService.getAll(),
        criteriaService.getAll()
      ]);
      setVariables(vars);
      setCriteria(crits);
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({
      name: '',
      criteriaId: criteria[0]?.id || '',
      weight: '',
      formula: 'bobot * skor',
      description: '',
      levels: [...defaultLevels]
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      criteriaId: item.criteriaId,
      weight: item.weight,
      formula: item.formula,
      description: item.description,
      levels: item.levels.map(l => ({ description: l.description }))
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.criteriaId || !form.weight || !form.formula) {
      showToast('Nama, kriteria, bobot, dan formula wajib diisi', 'error');
      return;
    }
    try {
      if (editItem) {
        await variableService.update(editItem.id, form);
        showToast('Variabel diperbarui', 'success');
      } else {
        await variableService.create(form);
        showToast('Variabel ditambahkan', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus variabel ini?')) return;
    try {
      await variableService.remove(id);
      showToast('Variabel dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus', 'error');
    }
  };

  const getCriteriaName = (id) => criteria.find(c => c.id === id)?.name || '-';

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
            Daftar Variabel
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#17203A] hover:bg-[#232f52] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          + Tambah Variabel
        </button>
      </div>

      {variables.length === 0 ? (
        <EmptyState message="Belum ada variabel" icon={<Wrench />} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            headers={['Nama', 'Kriteria', 'Bobot', 'Formula', 'Level', 'Aksi']}
            data={variables}
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-4 font-medium text-[#17203A]">{item.name}</td>
                <td className="px-6 py-4 text-slate-600">{getCriteriaName(item.criteriaId)}</td>
                <td className="px-6 py-4">{item.weight}</td>
                <td className="px-6 py-4">
                  <code className="bg-[#C8933E]/10 text-[#8a6224] px-2 py-1 rounded text-xs font-mono">
                    {item.formula}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 text-xs">
                    {item.levels.map((lvl, idx) =>
                      lvl.description ? (
                        <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded">
                          {idx}
                        </span>
                      ) : null
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4 text-sm font-medium">
                    <button onClick={() => openEdit(item)} className="text-[#17203A] hover:text-[#C8933E] transition-colors">
                      <Pencil /> Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-[#C1443A] hover:text-[#a3372f] transition-colors">
                      <Trash /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Variabel' : 'Tambah Variabel'}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className={labelClass}>Nama Variabel</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Kriteria</label>
            <select value={form.criteriaId} onChange={e => setForm({...form, criteriaId: e.target.value})} className={inputClass} required>
              <option value="">Pilih Kriteria</option>
              {criteria.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Bobot</label>
            <input type="number" step="0.1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Formula</label>
            <input type="text" value={form.formula} onChange={e => setForm({...form, formula: e.target.value})} className={inputClass} required />
            <p className="text-xs text-slate-400 mt-1">Gunakan variabel: bobot, skor (skor = level 0-5)</p>
          </div>
          <div>
            <label className={labelClass}>Deskripsi Variabel</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputClass} rows="2" />
          </div>
          <div>
            <label className={labelClass + ' mb-2'}>Deskripsi Level (0-5) — kosongkan jika tidak digunakan</label>
            {form.levels.map((level, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-1">
                <span className="w-6 text-sm font-medium text-slate-500">{idx}</span>
                <input
                  type="text"
                  value={level.description}
                  onChange={e => {
                    const newLevels = [...form.levels];
                    newLevels[idx] = { description: e.target.value };
                    setForm({...form, levels: newLevels});
                  }}
                  placeholder={`Deskripsi level ${idx}`}
                  className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-sm"
                />
              </div>
            ))}
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