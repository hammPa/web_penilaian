import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import assessmentService from '../../services/assessmentService';

const LEVELS = [0, 1, 2, 3, 4, 5];

export default function AssessmentForm() {
  const [tables, setTables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selections, setSelections] = useState({}); // { variableId: level or null }
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tableData, critData, varData] = await Promise.all([
          tableService.getAll(),
          criteriaService.getAll(),
          variableService.getAll()
        ]);
        setTables(tableData);
        setCriteria(critData);
        setVariables(varData);
        const initial = {};
        varData.forEach(v => { initial[v.id] = null; });
        setSelections(initial);
      } catch (err) {
        showToast('Gagal memuat data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLevelChange = (variableId, level) => {
    setSelections(prev => ({ ...prev, [variableId]: level }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectionArray = Object.entries(selections)
      .filter(([_, level]) => level !== null)
      .map(([variableId, level]) => ({
        variableId,
        selectedLevel: level
      }));

    if (selectionArray.length === 0) {
      showToast('Pilih setidaknya satu variabel', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await assessmentService.create(selectionArray);
      showToast('Penilaian berhasil disimpan', 'success');

      // PERBAIKAN: hindari "cannot read properties of undefined (reading 'id')"
      // jika response API ternyata tidak berbentuk { id: ... } secara langsung
      const newId = result?.id ?? result?.data?.id ?? result?.data?.data?.id;
      if (newId) {
        navigate(`/assessments/${newId}`);
      } else {
        // Response tersimpan tapi bentuknya tidak sesuai dugaan, jangan crash.
        console.warn('assessmentService.create() tidak mengembalikan id yang jelas:', result);
        navigate('/assessments');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err?.message || 'Gagal menyimpan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (tables.length === 0 || criteria.length === 0 || variables.length === 0) {
    return <EmptyState message="Data tabel/kriteria/variabel belum tersedia" />;
  }

  // Kelompokkan: tabel -> kriteria -> variabel
  const groupedTables = tables.map(t => {
    const tableCriteria = criteria.filter(c => c.tableId === t.id);
    return {
      table: t,
      criteria: tableCriteria.map(c => ({
        criteria: c,
        variables: variables.filter(v => v.criteriaId === c.id)
      }))
    };
  });

  // Hitung progress: jumlah variabel yang sudah dipilih level
  const answeredCount = Object.values(selections).filter(level => level !== null).length;
  const totalCount = variables.length;
  const progressPct = totalCount ? Math.round((answeredCount / totalCount) * 100) : 0;

  // PERBAIKAN: Fungsi untuk mendapatkan level yang tersedia
  const getAvailableLevels = (variable) => {
    // Ambil object variables, jika undefined beri fallback object kosong
    const variableData = variable.variables || {};

    // Petakan dari konstanta LEVELS (0-5) untuk menjaga urutan
    return LEVELS.map((level) => ({
      level: level,
      description: variableData[level]?.description || ''
    })).filter(item => {
      const desc = item.description.trim();
      // Sembunyikan yang deskripsinya kosong ATAU hanya berisi "-"
      return desc !== '' && desc !== '-';
    });
  };

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      {/* Sticky progress header */}
      <div className="sticky top-0 z-10 -mx-6 md:-mx-8 mb-6 border-b border-slate-200 bg-[#F3F4F7]/90 backdrop-blur px-6 md:px-8 py-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Baru</p>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#17203A]">
              Penilaian Baru
            </h1>
          </div>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {answeredCount}/{totalCount} terisi
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C8933E] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {groupedTables.map(({ table, criteria: tableCriteria }) => (
            <div key={table.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-serif text-xl font-semibold text-[#17203A]">{table.name}</h2>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              {table.description && (
                <p className="text-sm text-slate-500 mb-3 -mt-2">{table.description}</p>
              )}

              <div className="space-y-5">
                {tableCriteria.length === 0 ? (
                  <p className="text-sm text-slate-400">Belum ada kriteria pada tabel ini</p>
                ) : (
                  tableCriteria.map(({ criteria: crit, variables: critVars }) => (
                    <Card key={crit.id}>
                      <div className="mb-1">
                        <h3 className="font-serif text-lg font-semibold text-[#17203A]">{crit.name}</h3>
                        {crit.description && (
                          <p className="text-sm text-slate-500 mt-1">{crit.description}</p>
                        )}
                      </div>

                      {critVars.length === 0 ? (
                        <p className="text-sm text-slate-400">Tidak ada variabel</p>
                      ) : (
                        <div className="divide-y divide-slate-100 border-t border-slate-100 mt-3">
                          {critVars.map(variable => {
                            const availableLevels = getAvailableLevels(variable);
                            const selectedLevel = selections[variable.id];
                            return (
                              <div key={variable.id} className="py-4">
                                <div className="flex items-baseline justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-700">{variable.name}</span>
                                  <span className="text-xs text-slate-400">Bobot {variable.weight}</span>
                                </div>
                                {variable.description && (
                                  <p className="text-xs text-slate-500 mb-3">{variable.description}</p>
                                )}
                                {availableLevels.length === 0 ? (
                                  <p className="text-xs text-red-500">Tidak ada level tersedia</p>
                                ) : (
                                  <div className="flex flex-wrap gap-3">
                                    <label
                                      className={`flex items-center gap-2 cursor-pointer rounded-lg border p-3 ${
                                        selectedLevel === null
                                          ? 'border-[#C8933E] bg-[#C8933E]/5'
                                          : 'border-slate-200 hover:border-slate-300'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`var-${variable.id}`}
                                        checked={selectedLevel === null}
                                        onChange={() => handleLevelChange(variable.id, null)}
                                        className="mt-0.5 accent-[#C8933E]"
                                      />
                                      <span className="text-sm">Tidak ada</span>
                                    </label>
                                    {availableLevels.map(({ level, description }) => (
                                      <label
                                        key={level}
                                        className={`flex items-start gap-2 cursor-pointer rounded-lg border p-3 flex-1 min-w-[140px] transition-colors ${
                                          selectedLevel === level
                                            ? 'border-[#C8933E] bg-[#C8933E]/5'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`var-${variable.id}`}
                                          value={level}
                                          checked={selectedLevel === level}
                                          onChange={() => handleLevelChange(variable.id, level)}
                                          className="mt-0.5 accent-[#C8933E]"
                                        />
                                        <div>
                                          <span className="text-sm font-medium">Level {level}</span>
                                          <p className="text-xs text-slate-600 mt-0.5">{description}</p>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#17203A] hover:bg-[#232f52] text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Penilaian'}
          </button>
        </div>
      </form>
    </div>
  );
}