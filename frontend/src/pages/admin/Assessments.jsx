import { useState, useEffect, useMemo } from 'react';
import Table from '../../components/Table';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import assessmentService from '../../services/assessmentService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import tableService from '../../services/tableService';
import { useToast } from '../../hooks/useToast';
import { Eye, Image as ImageIcon } from 'lucide-react';

function ScoreBadge({ percentage }) {
  const tone =
    percentage >= 75
      ? 'bg-[#0F9D6D]/10 text-[#0F9D6D]'
      : percentage >= 50
      ? 'bg-[#C8933E]/10 text-[#a97a30]'
      : 'bg-[#C1443A]/10 text-[#C1443A]';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {Number(percentage).toFixed(2)}%
    </span>
  );
}

function AssessmentDetail({ item, tableMap, criteriaMap, variableMap }) {
  if (!item) return null;
  const { subtotals = {}, total, percentage, details = [] } = item.results || {};

  // maxTotal diturunkan dari percentage = total / maxTotal * 100
  const maxTotal = percentage > 0 ? Math.round(total / (percentage / 100)) : 0;

  // Base URL untuk file statis (uploads), dipisah dari /api
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

  // Kelompokkan jawaban: tabel -> kriteria -> variabel
  const groupedByTable = useMemo(() => {
    const byCriteria = {};
    details.forEach((d) => {
      const variable = variableMap[d.variableId];
      const criteriaId = variable?.criteriaId || 'unknown';
      if (!byCriteria[criteriaId]) byCriteria[criteriaId] = [];
      byCriteria[criteriaId].push({ ...d, variable });
    });

    const byTable = {};
    Object.entries(byCriteria).forEach(([criteriaId, items]) => {
      const tableId = criteriaMap[criteriaId]?.tableId || 'unknown';
      if (!byTable[tableId]) byTable[tableId] = {};
      byTable[tableId][criteriaId] = items;
    });
    return byTable;
  }, [details, variableMap, criteriaMap]);

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total Skor</p>
          <p className="font-serif text-xl font-semibold text-[#17203A]">
            {Number(total).toFixed(2)}
            {maxTotal > 0 && <span className="text-sm font-normal text-slate-400"> / {Number(maxTotal).toFixed(2)}</span>}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Persentase</p>
          <p className="font-serif text-xl font-semibold text-[#17203A]">{Number(percentage).toFixed(2)}%</p>
        </div>
      </div>

      {/* Foto Dokumentasi */}
      {item.photos && item.photos.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-[#17203A]">
            <ImageIcon size={16} />
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#C8933E]">
              Foto Dokumentasi
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {item.photos.map((photoUrl, idx) => (
              <a
                key={idx}
                href={`${baseUrl}${photoUrl}`}
                target="_blank"
                rel="noreferrer"
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:ring-2 hover:ring-[#C8933E] transition-all"
              >
                <img
                  src={`${baseUrl}${photoUrl}`}
                  alt={`Dokumentasi ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {Object.keys(groupedByTable).length === 0 ? (
        <p className="text-sm text-slate-400">Tidak ada rincian jawaban.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByTable).map(([tableId, criteriaGroups]) => (
            <div key={tableId}>
              <p className="text-sm font-serif font-semibold text-[#17203A] mb-3">
                {tableMap[tableId]?.name || 'Tabel tidak diketahui'}
              </p>
              <div className="space-y-5">
                {Object.entries(criteriaGroups).map(([criteriaId, items]) => (
                  <div key={criteriaId}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#C8933E]">
                        {criteriaMap[criteriaId]?.name || 'Kriteria tidak diketahui'}
                      </p>
                      <span className="text-xs font-semibold text-slate-500">
                        Subtotal: {subtotals[criteriaId] ?? '-'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {items.map((d) => {
                        const levelDesc = d.variable?.levels?.[d.level]?.description;
                        return (
                          <div
                            key={d.variableId}
                            className="rounded-lg border border-slate-100 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium text-[#17203A]">
                                {d.variable?.name || 'Variabel tidak diketahui'}
                              </p>
                              <span className="shrink-0 font-serif font-semibold text-[#17203A]">
                                {d.score}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                Level {d.level}
                              </span>
                              {levelDesc && (
                                <span className="text-xs text-slate-500">{levelDesc}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [tables, setTables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [assessmentData, tableData, criteriaData, variableData] = await Promise.all([
          assessmentService.getAll(),
          tableService.getAll(),
          criteriaService.getAll(),
          variableService.getAll(),
        ]);
        setAssessments(assessmentData);
        setTables(tableData);
        setCriteria(criteriaData);
        setVariables(variableData);
      } catch (err) {
        showToast('Gagal memuat data penilaian', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const tableMap = useMemo(() => {
    const map = {};
    tables.forEach((t) => { map[t.id] = t; });
    return map;
  }, [tables]);

  const criteriaMap = useMemo(() => {
    const map = {};
    criteria.forEach((c) => { map[c.id] = c; });
    return map;
  }, [criteria]);

  const variableMap = useMemo(() => {
    const map = {};
    variables.forEach((v) => { map[v.id] = v; });
    return map;
  }, [variables]);

  if (loading) return <Loading />;

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Semua User</p>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#17203A]">
          Hasil Penilaian
        </h1>
      </header>

      {assessments.length === 0 ? (
        <EmptyState message="Belum ada penilaian" />
      ) : (
        <>
          {/* MOBILE — daftar card, satu kolom */}
          <div className="md:hidden space-y-3">
            {assessments.map((item) => {
              const maxTotal = item.results.percentage > 0
                ? Number(item.results.total / (item.results.percentage / 100)).toFixed(2)
                : null;
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-slate-400">{item.id.slice(0, 8)}</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">User: {item.userId}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <ScoreBadge percentage={item.results.percentage} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total Skor</p>
                      <p className="font-serif text-lg font-semibold text-[#17203A]">
                        {Number(item.results.total).toFixed(2)}
                        {maxTotal && <span className="text-xs font-normal text-slate-400"> / {maxTotal}</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(item)}
                      className="inline-flex items-center gap-1.5 text-sm text-[#17203A] hover:text-[#C8933E] font-medium transition-colors"
                    >
                      <Eye size={16} /> Lihat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP — tabel seperti semula */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Table
              headers={['ID', 'User ID', 'Tanggal', 'Total', 'Persentase', 'Detail']}
              data={assessments}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{item.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-slate-600">{item.userId}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(item.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 font-serif font-semibold text-[#17203A]">
                    {Number(item.results.total).toFixed(2)}
                    {item.results.percentage > 0 && (
                      <span className="text-sm font-normal text-slate-400">
                        {' '}/ {Number(item.results.total / (item.results.percentage / 100)).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <ScoreBadge percentage={item.results.percentage} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelected(item)}
                      className="inline-flex items-center gap-1.5 text-[#17203A] hover:text-[#C8933E] font-medium transition-colors"
                    >
                      <Eye size={16} /> Lihat
                    </button>
                  </td>
                </tr>
              )}
            />
          </div>
        </>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Detail Penilaian${selected ? ' — ' + selected.id.slice(0, 8) : ''}`}
      >
        <AssessmentDetail item={selected} tableMap={tableMap} criteriaMap={criteriaMap} variableMap={variableMap} />
      </Modal>
    </div>
  );
}