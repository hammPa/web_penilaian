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
import { Eye, Search, ArrowUpDown, Trash2 } from 'lucide-react';

import ScoreBadge from '../../components/ScoreBadge';
import AssessmentDetail from './AssessmentDetail';

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [tables, setTables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { showToast } = useToast();
  const [visibleUserId, setVisibleUserId] = useState(null);

  // State untuk kontrol Filter Pencarian & Pengurutan
  const [searchName, setSearchName] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchField, setSearchField] = useState('all');

  // State untuk hapus penilaian
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await assessmentService.remove(toDelete.id);
      setAssessments((prev) => prev.filter((a) => a.id !== toDelete.id));
      showToast('Penilaian berhasil dihapus', 'success');
      setToDelete(null);
    } catch (err) {
      showToast('Gagal menghapus penilaian', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Semua Juri</p>
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
                        <ScoreBadge percentage={item.results.total} />
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelected(item)}
                        className="inline-flex items-center gap-1.5 text-sm text-[#17203A] hover:text-[#C8933E] font-medium transition-colors"
                      >
                        <Eye size={16} /> Lihat
                      </button>
                      <button
                        onClick={() => setToDelete(item)}
                        className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        <Trash2 size={16} /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP — tabel seperti semula */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Table
              headers={['ID', 'User', 'Sesi', 'Grup', 'Tim', 'Tanggal', 'Total', 'Aksi']}
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
                      <ScoreBadge percentage={item.results.total} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelected(item)}
                          className="inline-flex items-center gap-1.5 text-[#17203A] hover:text-[#C8933E] font-medium transition-colors"
                        >
                          <Eye size={16} /> Lihat
                        </button>
                        <button
                          onClick={() => setToDelete(item)}
                          className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          <Trash2 size={16} /> Hapus
                        </button>
                      </div>
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
        title={`Detail Penilaian — ${selected?.name || ''}`}
        size="lg"
      >
        <AssessmentDetail item={selected} tableMap={tableMap} criteriaMap={criteriaMap} variableMap={variableMap} />
      </Modal>

      <Modal
        isOpen={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        title="Hapus Penilaian?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Anda akan menghapus penilaian dari <strong>{toDelete?.name}</strong> untuk grup{' '}
            <strong>{toDelete?.groupName}</strong> pada sesi <strong>{toDelete?.sessionName}</strong>.
            Tindakan ini <strong>tidak bisa dibatalkan</strong>.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setToDelete(null)}
              disabled={deleting}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}