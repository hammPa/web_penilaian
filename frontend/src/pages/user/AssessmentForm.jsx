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
  
  // State untuk Foto Dokumentasi
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Ambil groupId dan sessionId dari parameter URL
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const sessionId = searchParams.get('sessionId');

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // Jika tidak ada groupId atau sessionId, kembalikan ke dashboard
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
        
        // Filter tabel agar hanya menampilkan tabel yang sesuai dengan sessionId
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

  // --- Fungsi Handle Foto ---
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos((prev) => [...prev, ...files]);
    
    // Buat URL sementara untuk preview di layar
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };
  // -------------------------

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

    if (selectionArray.length === 0) {
      showToast('Pilih setidaknya satu variabel', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrls = [];

      // TAHAP 1: Jika ada foto, upload dulu ke server
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => formData.append('photos', photo));
        
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls = uploadRes.data.data; // ex: ['/uploads/doc-xxx.jpg']
      }

      // TAHAP 2: Submit data Penilaian beserta groupId, sessionId, dan URL Foto
      const result = await assessmentService.create(groupId, sessionId, selectionArray, uploadedUrls);
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

  const answeredCount = Object.values(selections).filter(level => level !== null).length;
  // Hitung total count hanya untuk variabel yang ada di tabel sesi ini
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
                                  <span className="text-xs text-slate-400">Koefisien {variable.weight}</span>
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

        {/* WIDGET UPLOAD FOTO DOKUMENTASI */}
        <div className="mt-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-[#17203A] mb-4">Dokumentasi Area (Opsional)</h3>
          
          <div className="flex flex-wrap gap-4">
            {previews.map((src, index) => (
              <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group shadow-sm">
                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1.5 right-1.5 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                  title="Hapus foto"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-[#C8933E] hover:bg-[#C8933E]/5 transition-colors text-slate-400 hover:text-[#C8933E]">
              <Camera size={24} className="mb-1" />
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
          <p className="text-xs text-slate-400 mt-4">Upload foto dokumentasi tanpa batasan. Foto akan dikompresi otomatis untuk menghemat ruang.</p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#17203A] hover:bg-[#232f52] text-white px-8 py-3.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm text-sm"
          >
            {submitting ? 'Menyimpan & Mengunggah...' : 'Simpan Penilaian'}
          </button>
        </div>
      </form>
    </div>
  );
}