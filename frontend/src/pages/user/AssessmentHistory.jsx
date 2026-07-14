import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import assessmentService from '../../services/assessmentService';
import groupService from '../../services/groupService'; // Ditambahkan
import sessionService from '../../services/sessionService'; // Ditambahkan

function ScoreBadge({ percentage }) {
  const tone =
    percentage >= 75
      ? 'bg-[#0F9D6D]/10 text-[#0F9D6D]'
      : percentage >= 50
      ? 'bg-[#C8933E]/10 text-[#a97a30]'
      : 'bg-[#C1443A]/10 text-[#C1443A]';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {percentage}%
    </span>
  );
}

// maxTotal diturunkan dari percentage = total / maxTotal * 100
function getMaxTotal(total, percentage) {
  return percentage > 0 ? Math.round(total / (percentage / 100)) : 0;
}

export default function AssessmentHistory() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data assessment, group, dan session sekaligus
    Promise.all([
      assessmentService.getAll(),
      groupService.getAll(),
      sessionService.getAll()
    ])
      .then(([assessmentsData, groupsData, sessionsData]) => {
        // Gabungkan data agar assessment punya nama grup dan nama sesi
        const mappedAssessments = assessmentsData.map(assessment => {
          const group = groupsData.find(g => g.id === assessment.groupId);
          const session = sessionsData.find(s => s.id === assessment.sessionId);
          
          return {
            ...assessment,
            groupName: group?.name || 'Grup Tidak Diketahui',
            sessionName: session?.name || 'Sesi Tidak Diketahui'
          };
        });

        // Urutkan dari yang paling baru
        const sortedAssessments = mappedAssessments.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setAssessments(sortedAssessments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      <header className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Arsip</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
          Riwayat Penilaian
        </h1>
      </header>

      {assessments.length === 0 ? (
        <EmptyState message="Belum ada penilaian" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">
                  Grup
                </th>
                <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">
                  Sesi
                </th>
                <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">
                  Tanggal
                </th>
                <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">
                  Total
                </th>
                <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">
                  Persentase
                </th>
                <th className="text-right font-medium text-[11px] uppercase tracking-[0.1em] text-slate-400 px-6 py-3">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map(item => {
                const maxTotal = getMaxTotal(item.results.total, item.results.percentage);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#17203A]">
                      {item.groupName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.sessionName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(item.createdAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 font-serif font-semibold text-[#17203A]">
                      {item.results.total}
                      {maxTotal > 0 && (
                        <span className="text-sm font-normal text-slate-400"> / {maxTotal}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge percentage={item.results.percentage} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/assessments/${item.id}`}
                        className="text-[#C8933E] hover:text-[#a97a30] font-medium"
                      >
                        Lihat →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}