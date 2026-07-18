import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import { useToast } from '../../hooks/useToast';
import assessmentService from '../../services/assessmentService';
import variableService from '../../services/variableService';
import criteriaService from '../../services/criteriaService';
import tableService from '../../services/tableService';
import { Image as ImageIcon, ArrowLeft, Download } from 'lucide-react';
import { userHistoryPdfExport } from '../../utils/historyPdfExport';

export default function AssessmentResult() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [variables, setVariables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [tables, setTables] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [assess, vars, crits, tbls] = await Promise.all([
          assessmentService.getById(id),
          variableService.getAll(),
          criteriaService.getAll(),
          tableService.getAll()
        ]);
        setAssessment(assess);
        setVariables(vars);
        setCriteria(crits);
        setTables(tbls);
      } catch (err) {
        showToast('Gagal memuat detail penilaian', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <Loading />;
  if (!assessment) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">Penilaian tidak ditemukan</p>
      </div>
    );
  }

  const variableMap = {};
  variables.forEach(v => { variableMap[v.id] = v; });
  const criteriaMap = {};
  criteria.forEach(c => { criteriaMap[c.id] = c; });

  const selectionMap = {};
  assessment.selections.forEach(s => {
    selectionMap[s.variableId] = s.selectedLevel;
  });

  const { total, percentage } = assessment.results;
  const maxTotal = percentage > 0 ? Math.round(total / (percentage / 100)) : 0;

  const subtotalCriteriaIds = Object.keys(assessment.results.subtotals);
  const groupedTables = tables
    .map(t => ({
      table: t,
      criteriaIds: subtotalCriteriaIds.filter(cid => criteriaMap[cid]?.tableId === t.id)
    }))
    .filter(g => g.criteriaIds.length > 0);

  const orphanCriteriaIds = subtotalCriteriaIds.filter(
    cid => !criteriaMap[cid] || !tables.some(t => t.id === criteriaMap[cid].tableId)
  );
  
  const renderCriteriaCard = (criteriaId) => {
    const subtotal = assessment.results.subtotals[criteriaId];
    const crit = criteriaMap[criteriaId] || { name: criteriaId };
    const varIds = variables.filter(v => v.criteriaId === criteriaId).map(v => v.id);

    return (
      <Card key={criteriaId}>
        {/* Header Card: Responsif antara Nama Kriteria & Subtotal */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 mb-2">
          <h3 className="font-serif text-base sm:text-lg font-semibold text-[#17203A] break-words">
            {crit.name}
          </h3>
          <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap mt-0.5">
            Subtotal <span className="font-semibold text-[#17203A]">{Number(subtotal).toFixed(2)}</span>
          </span>
        </div>

        {showDetail ? (
          <div className="divide-y divide-slate-100 border-t border-slate-100 mt-3">
            {varIds.map(vid => {
              const variable = variableMap[vid];
              const score = assessment.results.variableScores[vid] || 0;
              const selectedLevel = selectionMap[vid];
              const levelList = variable?.variables || variable?.levels;
              const levelDescription = selectedLevel !== undefined
                ? (levelList?.[selectedLevel]?.description || null)
                : null;

              return (
                <div key={vid} className="flex items-start justify-between py-3 text-sm gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Nama variabel */}
                    <div className="text-slate-700 font-medium text-xs sm:text-sm leading-relaxed">
                      {variable?.name || vid}
                    </div>
                    {/* Badge level: Dibuat break-words agar teks keterangan tidak meluap */}
                    {selectedLevel !== undefined ? (
                      <div className="mt-1.5 flex">
                        <span className="inline-block rounded-lg px-2.5 py-1 text-xs font-medium bg-[#0F9D6D]/10 text-[#0F9D6D] break-words max-w-full leading-normal">
                          Level {selectedLevel}
                          {levelDescription && <span className="font-normal text-slate-600 block sm:inline sm:ml-1">({levelDescription})</span>}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1.5 flex">
                        <span className="inline-block rounded-lg px-2.5 py-1 text-xs font-medium bg-[#C1443A]/10 text-[#C1443A]">
                          Tidak dipilih
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Skor di bagian kanan */}
                  <span className="text-slate-500 font-semibold tabular-nums text-xs sm:text-sm pt-0.5">
                    {Number(score).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          varIds.length > 0 && (
            <p className="text-[11px] sm:text-xs text-slate-400 mt-2">
              Klik tombol "Lihat Detail" untuk melihat rincian variabel
            </p>
          )
        )}
      </Card>
    );
  };

  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');


  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await userHistoryPdfExport({ assessment, variables, criteria, tables, baseUrl });
    } catch (err) {
      showToast('Gagal membuat PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      {/* Top Navigation & Header */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Detail</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#17203A] mt-0.5">
            Hasil Penilaian
          </h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/assessments"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-[#17203A] transition-colors bg-white sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg shadow-sm sm:shadow-none border sm:border-none border-slate-200"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white bg-[#17203A] hover:bg-[#0F9D6D] transition-colors px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={16} /> {downloading ? 'Membuat PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Summary Band Card */}
      <div className="mb-6 rounded-xl bg-[#17203A] text-white p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 shadow-sm text-center sm:text-left">
        <div className="flex-1 w-full grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-0 border-t border-white/10 sm:border-none">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400">Tanggal</p>
            <p className="mt-1 text-xs sm:text-sm font-medium leading-tight">
              {new Date(assessment.createdAt).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400">Total Nilai</p>
            <p className="mt-0.5 font-serif text-xl sm:text-2xl font-semibold text-[#C8933E]">
              {Number(total).toFixed(2)}
              {/* {maxTotal > 0 && <span className="text-xs sm:text-base font-normal text-slate-400"> / {maxTotal}</span>} */}
            </p>
          </div>
        </div>
      </div>

      {/* Info Sesi, Grup, Tim, Penilai */}
      <div className="mb-6 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Sesi</p>
            <p className="text-sm font-medium text-[#17203A] mt-0.5 break-words">{assessment.sessionName || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Grup</p>
            <p className="text-sm font-medium text-[#17203A] mt-0.5 break-words">{assessment.groupName || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Tim</p>
            <p className="text-sm font-medium text-[#17203A] mt-0.5">{assessment.teamName || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Penilai</p>
            <p className="text-sm font-medium text-[#17203A] mt-0.5 break-words">{assessment.name || '-'}</p>
          </div>
        </div>
      </div>

      {/* Foto Dokumentasi */}
      {assessment.photos && assessment.photos.length > 0 && (
        <div className="mb-6 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[#17203A]">
            <ImageIcon size={18} />
            <h3 className="font-serif text-base sm:text-lg font-semibold">Foto Dokumentasi</h3>
          </div>
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3">
            {assessment.photos.map((photoUrl, idx) => (
              <a 
                key={idx} 
                href={`${baseUrl}${photoUrl}`}
                target="_blank" 
                rel="noreferrer"
                className="relative aspect-square sm:w-32 sm:h-32 rounded-lg overflow-hidden border border-slate-200 shadow-sm group hover:ring-2 hover:ring-[#C8933E] transition-all"
              >
                <img 
                  src={`${baseUrl}${photoUrl}`}
                  alt={`Dokumentasi ${idx + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom / Floating Toggle Detail Container */}
      <div className="mb-6 flex justify-center sticky top-4 z-10 sm:relative sm:top-0">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="inline-flex items-center gap-2 rounded-full border border-[#17203A] bg-white px-5 py-2 text-xs sm:text-sm font-medium text-[#17203A] hover:bg-[#17203A] hover:text-white transition-colors shadow-md sm:shadow-sm"
        >
          {showDetail ? 'Sembunyikan Detail' : 'Lihat Detail'}
        </button>
      </div>

      {/* Daftar Tabel & Kriteria */}
      <div className="space-y-6 sm:space-y-8">
        {groupedTables.map(({ table, criteriaIds }) => (
          <div key={table.id}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#17203A] truncate">{table.name}</h2>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-4 sm:space-y-5">
              {criteriaIds.map(renderCriteriaCard)}
            </div>
          </div>
        ))}

        {orphanCriteriaIds.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#17203A]">Lainnya</h2>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-4 sm:space-y-5">
              {orphanCriteriaIds.map(renderCriteriaCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}