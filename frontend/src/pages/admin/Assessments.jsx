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
import { Eye, Image as ImageIcon, Search, ArrowUpDown, Download } from 'lucide-react';
import { adminAssessmentPdfExport } from '../../utils/historyPdfExport';

function ScoreBadge({ percentage }) {
  const tone =
    percentage >= 75
      ? 'bg-[#0F9D6D]/10 text-[#0F9D6D]'
      : percentage >= 50
      ? 'bg-[#C8933E]/10 text-[#a97a30]'
      : 'bg-[#C1443A]/10 text-[#C1443A]';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {Number(percentage).toFixed(2)}
    </span>
  );
}

function AssessmentDetail({ item, tableMap, criteriaMap, variableMap }) {
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();


  if (!item) return null;
  const { subtotals = {}, total, percentage, details = [] } = item.results || {};
  const maxTotal = percentage > 0 ? Math.round(total / (percentage / 100)) : 0;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

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

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await adminAssessmentPdfExport({ item, tableMap, criteriaMap, variableMap, baseUrl });
    } catch (err) {
      showToast('Gagal membuat PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };


  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="rounded-lg bg-slate-50 px-4 py-3 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total Skor</p>
          <p className="font-serif text-xl font-semibold text-[#17203A]">
            {Number(total).toFixed(2)}
            {maxTotal > 0 && <span className="text-sm font-normal text-slate-400"> / {Number(maxTotal).toFixed(2)}</span>}
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 text-xs font-medium text-white bg-[#17203A] hover:bg-[#0F9D6D] transition-colors px-3 py-2 rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          <Download size={14} /> {downloading ? 'Membuat...' : 'PDF'}
        </button>
      </div>

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
                        Subtotal: {Number(subtotals[criteriaId]).toFixed(2) ?? '-'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {items.map((d) => {
                        const levelDesc = d.variable?.levels?.[d.level]?.description;
                        return (
                          <div key={d.variableId} className="rounded-lg border border-slate-100 px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium text-[#17203A]">
                                {d.variable?.name || 'Variabel tidak diketahui'}
                              </p>
                              <span className="shrink-0 font-serif font-semibold text-[#17203A]">
                                {Number(d.score).toFixed(2)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                Level {d.level}
                              </span>
                              {levelDesc && <span className="text-xs text-slate-500">{levelDesc}</span>}
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
  const [visibleUserId, setVisibleUserId] = useState(null);

  // State baru untuk kontrol Filter Pencarian & Pengurutan
  const [searchName, setSearchName] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // default: 'newest' (terbaru)

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

  // Logika memproses data (Filtering berdasarkan nama + Sorting secara dinamis)
  const processedAssessments = useMemo(() => {
    let result = [...assessments];

    // 1. Jalankan filter nama jika input diisi (none / kosong = tampilkan semua)
    if (searchName.trim() !== '') {
      result = result.filter((item) =>
        item.name?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // 2. Jalankan pengurutan data sesuai opsi state
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [assessments, searchName, sortOrder]);

  if (loading) return <Loading />;

  return (
    <div>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Semua User</p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#17203A]">
            Hasil Penilaian
          </h1>
        </div>
      </header>

      {/* Toolbar Filter & Sort Kontrol */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
        {/* Kolom Input Pencarian Nama */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-[#C8933E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C8933E] transition-all"
          />
        </div>

        {/* Dropdown Pilihan Urutan (Terbaru / Terlama) */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <ArrowUpDown size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-500 hidden md:inline">Urutkan:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full sm:w-auto text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:border-[#C8933E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C8933E] transition-all cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
      </div>

      {processedAssessments.length === 0 ? (
        <EmptyState message={searchName ? "Nama tidak ditemukan" : "Belum ada penilaian"} />
      ) : (
        <>
          {/* MOBILE — daftar card, satu kolom */}
          <div className="md:hidden space-y-3">
            {processedAssessments.map((item) => {
              const isIdVisible = visibleUserId === item.id;
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 w-full">
                      <p className="font-mono text-[11px] text-slate-400">{item.id.slice(0, 8)}</p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                        <button 
                          onClick={() => setVisibleUserId(isIdVisible ? null : item.id)}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded transition-colors"
                        >
                          {isIdVisible ? 'Sembunyikan ID' : 'Lihat ID'}
                        </button>
                      </div>

                      {isIdVisible && (
                        <p className="text-xs text-slate-400 font-mono mt-1 bg-slate-50 p-1 rounded border border-slate-100 break-all">
                          UID: {item.userId}
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total Skor</p>
                      <p className="font-serif text-lg font-semibold text-[#17203A]">
                        <ScoreBadge percentage={Number(item.results.total).toFixed(2)} />
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
              headers={['ID', 'User', 'Tanggal', 'Total', 'Detail']}
              data={processedAssessments}
              renderRow={(item) => {
                const isIdVisible = visibleUserId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{item.id.slice(0, 8)}</td>
                    
                    <td className="px-6 py-4 text-slate-600">
                      <div className="relative flex items-center gap-2">
                        <span className="font-medium text-[#17203A]">{item.name}</span>
                        
                        <button
                          onClick={() => setVisibleUserId(isIdVisible ? null : item.id)}
                          title="Tampilkan / Sembunyikan User ID"
                          className={`p-1 rounded-md hover:bg-slate-100 transition-colors ${isIdVisible ? 'text-[#C8933E]' : 'text-slate-400'}`}
                        >
                          <Eye size={12} />
                        </button>

                        {isIdVisible && (
                          <div className="absolute left-0 top-full mt-1 z-10 bg-[#17203A] text-white text-[11px] font-mono px-2 py-1 rounded shadow-md border border-slate-700 whitespace-nowrap">
                            ID: {item.userId}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(item.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge percentage={Number(item.results.total).toFixed(2)} />
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
                );
              }}
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