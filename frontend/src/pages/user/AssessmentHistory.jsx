import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import assessmentService from '../../services/assessmentService';
import groupService from '../../services/groupService';
import sessionService from '../../services/sessionService';
import { Search, ArrowUpDown, Pencil, Eye } from 'lucide-react';

function ScoreBadge({ percentage }) {
  const tone =
    percentage >= 75
      ? 'bg-[#0F9D6D]/10 text-[#0F9D6D]'
      : percentage >= 50
      ? 'bg-[#C8933E]/10 text-[#a97a30]'
      : 'bg-[#C1443A]/10 text-[#C1443A]';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {percentage}
    </span>
  );
}

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  useEffect(() => {
    Promise.all([
      assessmentService.getAll(),
      groupService.getAll(),
      sessionService.getAll()
    ])
      .then(([assessmentsData, groupsData, sessionsData]) => {
        const mappedAssessments = assessmentsData.map(assessment => {
          const group = groupsData.find(g => g.id === assessment.groupId);
          const session = sessionsData.find(s => s.id === assessment.sessionId);
          return {
            ...assessment,
            groupName: group?.name || 'Grup Tidak Diketahui',
            sessionName: session?.name || 'Sesi Tidak Diketahui'
          };
        });

        setAssessments(mappedAssessments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const processedAssessments = useMemo(() => {
    let result = [...assessments];

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.groupName?.toLowerCase().includes(q) ||
          item.sessionName?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [assessments, searchTerm, sortOrder]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      <header className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Arsip</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
          Riwayat Penilaian
        </h1>
      </header>

      {/* Toolbar Filter & Sort */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari grup atau sesi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:border-[#C8933E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C8933E] transition-all"
          />
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
        <EmptyState message={searchTerm ? "Tidak ditemukan" : "Belum ada penilaian"} />
      ) : (
        <>
          {/* TAMPILAN MOBILE: kartu bertumpuk */}
          <div className="space-y-4 md:hidden">
            {processedAssessments.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-base text-[#17203A]">
                      {item.groupName}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {item.sessionName}
                  </p>
                  <p className="text-xs text-slate-400 mt-3">
                    {new Date(item.createdAt).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Skor Total</span>
                    <span className="font-serif font-semibold text-lg text-[#17203A]">
                      <ScoreBadge percentage={Number(item.results.total.toFixed(2))} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/assessments/${item.id}/edit`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Pencil size={14} /> Edit
                    </Link>
                    <Link
                      to={`/assessments/${item.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C8933E]/10 px-3 py-2 text-sm font-medium text-[#C8933E] hover:bg-[#C8933E]/20 transition-colors"
                    >
                      <Eye size={14} /> Lihat
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TAMPILAN DESKTOP: tabel */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">Grup</th>
                  <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">Sesi</th>
                  <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">Tanggal</th>
                  <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">Total</th>
                  <th className="text-right font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedAssessments.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#17203A]">{item.groupName}</td>
                    <td className="px-6 py-4 text-slate-600">{item.sessionName}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(item.createdAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4"><ScoreBadge percentage={Number(item.results.total).toFixed(2)} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/assessments/${item.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#17203A] font-medium transition-colors"
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                        <Link
                          to={`/assessments/${item.id}`}
                          className="inline-flex items-center gap-1.5 text-[#C8933E] hover:text-[#a97a30] font-medium transition-colors"
                        >
                          Lihat →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}