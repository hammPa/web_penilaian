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
import { Eye, Image as ImageIcon, Search, ArrowUpDown, Download, Calendar, Users, Shield, User, MessageSquare, CheckCircle } from 'lucide-react';
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

  const sortedSections = useMemo(() => {
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

    const sectionsArray = Object.entries(byTable).map(([tableId, criteriaObj]) => {
      const criteriaArray = Object.entries(criteriaObj).map(([criteriaId, items]) => {
        return {
          criteriaId,
          criteriaName: criteriaMap[criteriaId]?.name || 'Kriteria tidak diketahui',
          items,
          subtotal: subtotals[criteriaId] || 0
        };
      });

      criteriaArray.sort((a, b) => a.criteriaName.localeCompare(b.criteriaName, undefined, { numeric: true }));

      return {
        tableId,
        tableName: tableMap[tableId]?.name || 'Tabel tidak diketahui',
        criteria: criteriaArray
      };
    });

    sectionsArray.sort((a, b) => a.tableName.localeCompare(b.tableName, undefined, { numeric: true }));

    return sectionsArray;
  }, [details, variableMap, criteriaMap, tableMap, subtotals]);

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
    <div className="space-y-6">
      {/* --- KARTU HEADER & META INFO --- */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#C8933E]"></div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-slate-200 pb-4 mb-4 mt-1">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#17203A]">Ringkasan Penilaian</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono break-all">UID: {item.userId}</p>
          </div>
          <div className="flex flex-row items-center gap-4 shrink-0 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm w-full sm:w-auto">
            <div className="text-left sm:text-right flex-1 sm:flex-none">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Skor</p>
              <p className="text-2xl font-serif font-bold text-[#C8933E] leading-none mt-1">
                {Number(total).toFixed(2)}
                {maxTotal > 0 && <span className="text-base text-slate-300 font-normal"> / {Number(maxTotal).toFixed(2)}</span>}
              </p>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#17203A] text-white hover:bg-[#253256] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0 shadow-sm"
              title="Download PDF"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* METADATA: Diubah menjadi 1 kolom di layar kecil, dan 2 kolom di layar agak besar agar menyusun ke bawah dan tidak terpotong */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Calendar size={14}/></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Sesi</p>
              <p className="text-sm font-medium text-slate-700 truncate">{item.sessionName || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Users size={14}/></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Grup</p>
              <p className="text-sm font-medium text-slate-700 truncate">{item.groupName || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Shield size={14}/></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Tim</p>
              <p className="text-sm font-medium text-slate-700 truncate">{item.teamName || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0"><User size={14}/></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Penilai</p>
              <p className="text-sm font-medium text-slate-700 truncate">{item.name || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOTO DOKUMENTASI --- */}
      {item.photos && item.photos.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-[#17203A]">
            <ImageIcon size={18} className="text-[#C8933E]" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Foto Dokumentasi</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {item.photos.map((photoUrl, idx) => (
              <a
                key={idx}
                href={`${baseUrl}${photoUrl}`}
                target="_blank"
                rel="noreferrer"
                className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:ring-2 hover:ring-[#C8933E] hover:shadow-md transition-all shrink-0"
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

      {/* --- REKOMENDASI --- */}
      {item.recommendation && item.recommendation.trim() !== '' && (
        <div className="bg-[#C8933E]/10 border border-[#C8933E]/30 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#a97a30]">
            <MessageSquare size={16} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Rekomendasi & Catatan</h3>
          </div>
          <p className="text-sm text-[#17203A] leading-relaxed italic whitespace-pre-line">{item.recommendation}</p>
        </div>
      )}

      {/* --- TABEL DETAIL JAWABAN (SUDAH DIURUTKAN) --- */}
      {sortedSections.length === 0 ? (
        <EmptyState message="Tidak ada rincian jawaban tersedia." />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <h3 className="font-serif text-lg font-semibold text-[#17203A] border-b border-slate-200 pb-2">Rincian Penilaian</h3>
          
          {sortedSections.map((section) => (
            <div key={section.tableId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#17203A] px-4 sm:px-5 py-3">
                <h3 className="text-white font-serif text-sm font-semibold tracking-wide">
                  {section.tableName}
                </h3>
              </div>
              
              <div className="p-0">
                {section.criteria.map((crit, idx, arr) => (
                  <div key={crit.criteriaId} className={`border-slate-100 ${idx !== arr.length - 1 ? 'border-b' : ''}`}>
                    <div className="bg-slate-50 px-4 sm:px-5 py-2.5 flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                        <CheckCircle size={14} className="text-[#C8933E] shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
                          {crit.criteriaName}
                        </h4>
                      </div>
                      <span className="shrink-0 text-[11px] sm:text-xs font-semibold bg-white border border-slate-200 px-2 sm:px-2.5 py-1 rounded text-[#C8933E] shadow-sm">
                        Subtotal: {Number(crit.subtotal).toFixed(2)}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {crit.items.map((d) => {
                        const levelDesc = d.variable?.levels?.[d.level]?.description;
                        return (
                          <div key={d.variableId} className="px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="pr-0 sm:pr-4 min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#17203A] mb-1.5 leading-snug">
                                {d.variable?.name || 'Variabel tidak diketahui'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center justify-center rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                  Level {d.level}
                                </span>
                                {levelDesc && <span className="text-xs text-slate-500 line-clamp-2">{levelDesc}</span>}
                              </div>
                            </div>
                            <div className="self-end sm:self-start shrink-0 font-serif font-bold text-base sm:text-lg text-[#17203A] bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 mt-2 sm:mt-0">
                              {Number(d.score).toFixed(2)}
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
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [searchField, setSearchField] = useState('all'); 

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

  const processedAssessments = useMemo(() => {
    let result = [...assessments];

    if (searchName.trim() !== '') {
      const keyword = searchName.toLowerCase();
      result = result.filter((item) => {
        if (searchField === 'name') return item.name?.toLowerCase().includes(keyword);
        if (searchField === 'group') return item.groupName?.toLowerCase().includes(keyword);
        return item.name?.toLowerCase().includes(keyword) || item.groupName?.toLowerCase().includes(keyword);
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [assessments, searchName, sortOrder, searchField]);

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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau grup..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-[#C8933E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C8933E] transition-all"
            />
          </div>

          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:border-[#C8933E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C8933E] transition-all cursor-pointer shrink-0"
          >
            <option value="all">Semua</option>
            <option value="name">Nama</option>
            <option value="group">Grup</option>
          </select>
        </div>

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
                      <p className="text-xs text-slate-500 mt-1">
                        {item.sessionName} · {item.groupName} · {item.teamName}
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
              headers={['ID', 'User', 'Sesi', 'Grup', 'Tim', 'Tanggal', 'Total', 'Detail']}
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
                    
                    <td className="px-6 py-4 text-slate-600 text-sm">{item.sessionName || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{item.groupName || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{item.teamName || '-'}</td>

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

      {/* Modal Detail dengan penyesuaian (pastikan prop 'size' atau prop penunjang lebar ada jika didukung) */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Detail Penilaian — ${selected?.name || ''}`}
        size="lg"
      >
        <AssessmentDetail item={selected} tableMap={tableMap} criteriaMap={criteriaMap} variableMap={variableMap} />
      </Modal>
    </div>
  );
}