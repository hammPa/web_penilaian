import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import { useToast } from '../../hooks/useToast';
import assessmentService from '../../services/assessmentService';
import variableService from '../../services/variableService';
import criteriaService from '../../services/criteriaService';
import tableService from '../../services/tableService';

function ScoreDial({ percentage = 0, size = 116 }) {
  const angle = Math.min(100, Math.max(0, percentage)) * 3.6;
  return (
    <div
      className="relative grid place-items-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#C8933E ${angle}deg, rgba(255,255,255,0.18) ${angle}deg)`,
      }}
    >
      <div className="absolute inset-[7px] rounded-full bg-[#17203A]" />
      <div className="relative flex flex-col items-center">
        <span className="font-serif text-2xl font-semibold text-white tracking-tight">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export default function AssessmentResult() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [variables, setVariables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [tables, setTables] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

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
        {/* Header: judul bisa wrap, subtotal tetap di kanan atas */}
        <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
          <h3 className="font-serif text-lg font-semibold text-[#17203A] break-words flex-1 min-w-0">
            {crit.name}
          </h3>
          <span className="text-sm text-slate-500 whitespace-nowrap flex-shrink-0">
            Subtotal <span className="font-semibold text-[#17203A]">{subtotal}</span>
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
                <div key={vid} className="flex items-start justify-between py-2.5 text-sm">
                  <div className="flex-1 min-w-0 mr-2">
                    {/* Nama variabel di baris pertama */}
                    <div className="text-slate-700 font-medium">{variable?.name || vid}</div>
                    {/* Badge level di baris kedua (bawah) */}
                    {selectedLevel !== undefined ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium bg-[#0F9D6D]/10 text-[#0F9D6D]">
                          Level {selectedLevel}
                          {levelDescription && `: ${levelDescription}`}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium bg-[#C1443A]/10 text-[#C1443A]">
                          Tidak dipilih
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Skor tetap di kanan, sejajar dengan baris pertama */}
                  <span className="text-slate-400 tabular-nums flex-shrink-0 mt-0.5">{score}</span>
                </div>
              );
            })}
          </div>
        ) : (
          varIds.length > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              Klik tombol "Lihat Detail" untuk melihat rincian variabel
            </p>
          )
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Detail</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
            Hasil Penilaian
          </h1>
        </div>
        <Link
          to="/assessments"
          className="text-sm font-medium text-slate-500 hover:text-[#17203A] transition-colors"
        >
          ← Kembali ke Riwayat
        </Link>
      </div>

      {/* Summary band */}
      <div className="mb-8 rounded-xl bg-[#17203A] text-white p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <ScoreDial percentage={percentage} />
        <div className="flex-1 w-full grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Tanggal</p>
            <p className="mt-1 font-medium">
              {new Date(assessment.createdAt).toLocaleString('id-ID')}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Total Nilai</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#C8933E]">
              {total}
              {maxTotal > 0 && <span className="text-base font-normal text-slate-400"> / {maxTotal}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Tombol toggle detail */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="inline-flex items-center gap-2 rounded-full border border-[#17203A] bg-white px-6 py-2.5 text-sm font-medium text-[#17203A] hover:bg-[#17203A] hover:text-white transition-colors shadow-sm"
        >
          {showDetail ? 'Sembunyikan Detail' : 'Lihat Detail'}
        </button>
      </div>

      {/* Daftar tabel dan kriteria */}
      <div className="space-y-8">
        {groupedTables.map(({ table, criteriaIds }) => (
          <div key={table.id}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-serif text-xl font-semibold text-[#17203A]">{table.name}</h2>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-5">
              {criteriaIds.map(renderCriteriaCard)}
            </div>
          </div>
        ))}

        {orphanCriteriaIds.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-serif text-xl font-semibold text-[#17203A]">Lainnya</h2>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-5">
              {orphanCriteriaIds.map(renderCriteriaCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}