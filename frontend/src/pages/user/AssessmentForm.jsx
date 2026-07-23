import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import assessmentService from '../../services/assessmentService';
import api from '../../api/axiosInstance';
import { Camera, X } from 'lucide-react';

const LEVELS = [0, 1, 2, 3, 4, 5];

export default function AssessmentForm() {
  const [tables, setTables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selections, setSelections] = useState({});
  
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [recommendation, setRecommendation] = useState('');

  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const sessionId = searchParams.get('sessionId');

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (!groupId || !sessionId) {
      showToast('Akses tidak valid. Silakan pilih grup dari Dashboard.', 'error');
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [tableData, critData, varData] = await Promise.all([
          tableService.getAll(),
          criteriaService.getAll(),
          variableService.getAll()
        ]);
        
        const filteredTables = tableData.filter(t => t.sessionId === sessionId);
        setTables(filteredTables);
        
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
  }, [groupId, sessionId, navigate]);

  const handleLevelChange = (variableId, level) => {
    setSelections(prev => ({ ...prev, [variableId]: level }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos((prev) => [...prev, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupId || !sessionId) {
      showToast('Data Grup atau Sesi tidak valid.', 'error');
      return;
    }

    const selectionArray = Object.entries(selections)
      .filter(([_, level]) => level !== null)
      .map(([variableId, level]) => ({
        variableId,
        selectedLevel: level
      }));

    const relevantVariables = variables.filter(v => {
      const crit = criteria.find(c => c.id === v.criteriaId);
      return crit && tables.some(t => t.id === crit.tableId);
    });
    const requiredVariables = relevantVariables.filter(v => getAvailableLevels(v).length > 0);
    const unanswered = requiredVariables.filter(v => selections[v.id] === null || selections[v.id] === undefined);

    if (unanswered.length > 0) {
      showToast(`Masih ada ${unanswered.length} variabel yang belum diisi`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrls = [];

      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => formData.append('photos', photo));
        
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls = uploadRes.data.data;
      }

      const result = await assessmentService.create(groupId, sessionId, selectionArray, uploadedUrls, recommendation);
      showToast('Penilaian berhasil disimpan', 'success');

      const newId = result?.id ?? result?.data?.id ?? result?.data?.data?.id;
      if (newId) {
        navigate(`/assessments/${newId}`);
      } else {
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
    return <EmptyState message="Data tabel/kriteria/variabel belum tersedia untuk sesi ini" />;
  }

  // Urutkan tabel berdasarkan abjad (nama) sebelum dikelompokkan
  const sortedTables = [...tables].sort((a, b) =>
    a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
  );

  const groupedTables = sortedTables.map(t => {
    const tableCriteria = criteria.filter(c => c.tableId === t.id);
    return {
      table: t,
      criteria: tableCriteria.map(c => ({
        criteria: c,
        variables: variables.filter(v => v.criteriaId === c.id)
      }))
    };
  });

  const answeredCount = Object.values(selections).filter(level => level !== null).length;
  let totalCount = 0;
  groupedTables.forEach(t => {
    t.criteria.forEach(c => {
      totalCount += c.variables.length;
    });
  });
  
  const progressPct = totalCount ? Math.round((answeredCount / totalCount) * 100) : 0;

  const getAvailableLevels = (variable) => {
    const variableData = variable.variables || {};
    return LEVELS.map((level) => ({
      level: level,
      description: variableData[level]?.description || ''
    })).filter(item => {
      const desc = item.description.trim();
      return desc !== '' && desc !== '-';
    });
  };

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8 pb-32 md:pb-36">
      {/* Header Statis Bersih di Atas */}
      <div className="mb-6">
        <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Baru</p>
        <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#17203A]">
          Penilaian Baru
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6 sm:space-y-8">
          {groupedTables.map(({ table, criteria: tableCriteria }) => (
            <div key={table.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#17203A] truncate">{table.name}</h2>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              {table.description && (
                <p className="text-xs sm:text-sm text-slate-500 mb-3 -mt-2">{table.description}</p>
              )}

              <div className="space-y-4 sm:space-y-5">
                {tableCriteria.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-400">Belum ada kriteria pada tabel ini</p>
                ) : (
                  tableCriteria.map(({ criteria: crit, variables: critVars }) => (
                    <Card key={crit.id}>
                      <div className="mb-1">
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-[#17203A]">{crit.name}</h3>
                        {crit.description && (
                          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{crit.description}</p>
                        )}
                      </div>

                      {critVars.length === 0 ? (
                        <p className="text-xs sm:text-sm text-slate-400">Tidak ada variabel</p>
                      ) : (
                        <div className="divide-y divide-slate-100 border-t border-slate-100 mt-3">
                          {critVars.map(variable => {
                            const availableLevels = getAvailableLevels(variable);
                            const selectedLevel = selections[variable.id];
                            return (
                              <div key={variable.id} className="py-4">
                                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                                  <span className="text-sm font-semibold text-slate-700 leading-tight">{variable.name}</span>
                                  {/* <span className="text-[11px] font-medium text-slate-400 bg-slate-50 sm:bg-transparent px-1.5 py-0.5 sm:p-0 rounded self-start sm:self-auto">Koefisien {variable.weight}</span> */}
                                </div>
                                {variable.description && (
                                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">{variable.description}</p>
                                )}
                                {availableLevels.length === 0 ? (
                                  <p className="text-xs text-red-500">Tidak ada level tersedia</p>
                                ) : (
                                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                                    {availableLevels.map(({ level, description }) => (
                                      <label
                                        key={level}
                                        className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 sm:flex-1 sm:min-w-[180px] transition-colors ${
                                          selectedLevel === level
                                            ? 'border-[#C8933E] bg-[#C8933E]/5'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`var-${variable.id}`}
                                          value={level}
                                          checked={selectedLevel === level}
                                          onChange={() => handleLevelChange(variable.id, level)}
                                          className="w-4 h-4 mt-0.5 shrink-0 accent-[#C8933E]"
                                        />
                                        <div className="min-w-0">
                                          <span className="text-sm font-semibold text-slate-800">Level {level}</span>
                                          <p className="text-xs text-slate-600 mt-0.5 leading-normal break-words">{description}</p>
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

        {/* Widget Upload Foto Dokumentasi */}
        <div className="mt-6 sm:mt-8 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-sm sm:text-base text-[#17203A] mb-3 sm:mb-4">Dokumentasi Area (Opsional)</h3>
          
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3">
            {previews.map((src, index) => (
              <div key={index} className="relative aspect-square sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full transition-all cursor-pointer shadow-md"
                  title="Hapus foto"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            <label className="aspect-square sm:w-24 sm:h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-[#C8933E] hover:bg-[#C8933E]/5 transition-colors text-slate-400 hover:text-[#C8933E]">
              <Camera size={22} className="mb-0.5 text-slate-400" />
              <span className="text-[10px] font-medium mt-1">Tambah Foto</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handlePhotoChange} 
                className="hidden" 
              />
            </label>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-3 sm:mt-4 leading-normal">Upload foto dokumentasi tanpa batasan. Foto akan dikompresi otomatis untuk menghemat ruang.</p>
        </div>

        {/* Widget Rekomendasi (Opsional) */}
        <div className="mt-6 sm:mt-8 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-sm sm:text-base text-[#17203A] mb-3">Rekomendasi (Opsional)</h3>
          <textarea
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            rows={4}
            placeholder="Tulis rekomendasi atau catatan tambahan untuk grup ini..."
            className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-[#C8933E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C8933E] transition-all resize-none"
          />
        </div>

        {/* Pendekatan Terbaik: Sticky Action Bar + Progress di Bagian Bawah Halaman */}
        <div className="fixed bottom-20 left-3 right-3 md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-16rem)] z-40 bg-white rounded-xl md:rounded-none border border-slate-200 md:border-t md:border-l-0 md:border-r-0 md:border-b-0 px-6 py-4 shadow-[0_4px_30px_rgba(23,32,58,0.15)] md:shadow-[0_-8px_24px_rgba(23,32,58,0.08)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Indikator Progres Ringkas */}
            <div className="flex-1 min-w-0 max-w-md">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Progres Pengisian</span>
                <span className="text-xs font-bold text-[#17203A] tabular-nums bg-slate-100 px-2 py-0.5 rounded">
                  {answeredCount} / {totalCount} Variabel ({progressPct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C8933E] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Tombol Aksi Utama */}
            <div className="shrink-0">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-[#17203A] hover:bg-[#232f52] text-white px-8 py-3.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm text-sm text-center"
              >
                {submitting ? 'Menyimpan & Mengunggah...' : 'Simpan Penilaian'}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}