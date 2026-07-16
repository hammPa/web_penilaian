import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import { useToast } from '../../hooks/useToast';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import { ArrowLeft, Save, Plus, Minus } from 'lucide-react';

const DEFAULT_LEVEL_COUNT = 5;
const MIN_LEVEL_COUNT = 2;
const makeDefaultVariables = (count) => Array.from({ length: count }, () => ({ description: '' }));

export default function CriteriaVariables() {
  const { tableId, criteriaId } = useParams();
  const [criteria, setCriteria] = useState(null);

  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    weight: '',
    formula: 'bobot * skor',
    variables: makeDefaultVariables(DEFAULT_LEVEL_COUNT)
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [critData, varData] = await Promise.all([
          criteriaService.getById(criteriaId),
          variableService.getAll(criteriaId)
        ]);
        setCriteria(critData);

        if (varData && varData.length > 0) {
          const item = varData[0];
          setExistingId(item.id);
          setForm({
            name: item.name || '',
            weight: item.weight,
            formula: item.formula,
            variables: item.variables.map(v => ({ description: v.description }))
          });
        }
      } catch (err) {
        showToast('Gagal memuat data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [criteriaId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || form.weight === '' || !form.formula) {
      showToast('Nama, bobot, dan formula wajib diisi', 'error');
      return;
    }
    if (form.variables.length < MIN_LEVEL_COUNT) {
      showToast(`Minimal harus ada ${MIN_LEVEL_COUNT} kolom skor`, 'error');
      return;
    }

    setSaving(true);
    try {
      if (existingId) {
        await variableService.update(existingId, form);
        showToast('Pengaturan berhasil diperbarui', 'success');
      } else {
        const res = await variableService.create({ ...form, criteriaId });
        setExistingId(res.id);
        showToast('Pengaturan berhasil disimpan', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addColumn = () => {
    setForm(prev => ({
      ...prev,
      variables: [...prev.variables, { description: '' }]
    }));
  };

  const removeColumn = () => {
    if (form.variables.length <= MIN_LEVEL_COUNT) {
      showToast(`Minimal harus ada ${MIN_LEVEL_COUNT} kolom skor`, 'error');
      return;
    }
    setForm(prev => ({
      ...prev,
      variables: prev.variables.slice(0, -1)
    }));
  };

  if (loading) return <Loading />;
  if (!criteria) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">Kriteria tidak ditemukan</p>
      </div>
    );
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition bg-white";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <div className="max-w-4xl pb-12">
      <Link
        to={`/admin/tables/${tableId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#17203A] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Kembali ke {criteria.name ? 'Daftar Kriteria' : 'Tabel'}
      </Link>

      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Pengaturan Kriteria</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
          {criteria.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Atur nama variabel, bobot, formula, dan deskripsi skor untuk kriteria ini.</p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm space-y-8">

        {/* Section 1: Konfigurasi Dasar */}
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Nama Variabel</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Contoh: NILAI CONTROL BOARD"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Bobot Kriteria</label>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
                className={inputClass}
                placeholder="Contoh: 1.5"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Formula Penilaian</label>
              <input
                type="text"
                value={form.formula}
                onChange={e => setForm({ ...form, formula: e.target.value })}
                className={inputClass}
                required
              />
              <p className="text-xs text-slate-500 mt-1.5 font-medium">Gunakan variabel: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">bobot</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">skor</code></p>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Section 2: Variabel / Skor (jumlah kolom fleksibel) */}
        <div>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Deskripsi Skor</h3>
              <p className="text-xs text-slate-500">
                Kosongkan kolom jika skor tersebut tidak memiliki deskripsi khusus. Skor tertinggi = {form.variables.length - 1}.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={removeColumn}
                disabled={form.variables.length <= MIN_LEVEL_COUNT}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={14} /> Kolom
              </button>
              <button
                type="button"
                onClick={addColumn}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#C8933E]/40 bg-[#C8933E]/5 text-xs font-medium text-[#8a6224] hover:bg-[#C8933E]/10 transition-colors"
              >
                <Plus size={14} /> Kolom
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {form.variables.map((v, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-3 sm:p-0 sm:border-0 sm:bg-transparent"
              >
                <div className="flex items-center gap-3 sm:items-start">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-10 flex items-center justify-center bg-[#17203A] text-white font-bold rounded-lg shadow-sm text-sm">
                    {idx}
                  </div>

                  <textarea
                    value={v.description}
                    onChange={e => {
                      const newVars = [...form.variables];
                      newVars[idx] = { description: e.target.value };
                      setForm({ ...form, variables: newVars });
                    }}
                    placeholder={`Masukkan deskripsi untuk skor ${idx}...`}
                    className={`${inputClass} min-h-[44px] resize-y py-2.5 flex-1`}
                    rows="2"
                  />

                  {form.variables.length > MIN_LEVEL_COUNT && idx === form.variables.length - 1 && (
                    <button
                      type="button"
                      onClick={removeColumn}
                      className="shrink-0 p-2 -m-2 sm:mt-1.5 sm:m-0 text-slate-300 hover:text-[#C1443A] active:text-[#C1443A] transition-colors rounded-lg"
                      title="Hapus kolom skor tertinggi ini"
                      aria-label="Hapus kolom skor tertinggi ini"
                    >
                      <Minus size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addColumn}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#C8933E] hover:text-[#a97a30] transition-colors"
          >
            <Plus size={14} /> Tambah kolom skor {form.variables.length}
          </button>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#17203A] hover:bg-[#232f52] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-70"
          >
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>

      </form>
    </div>
  );
}