import { useState, useEffect } from 'react';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import groupService from '../../services/groupService';
import teamService from '../../services/teamService';
import assessmentService from '../../services/assessmentService';
import userService from '../../services/userService';
import sessionService from '../../services/sessionService';
import { Calculator, CalendarDays, Shield } from 'lucide-react';

export default function AssessmentRecap() {
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [users, setUsers] = useState([]);

  // Filter States: Default ke 'all'
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessData, teamData, groupData, assessData, userData] = await Promise.all([
          sessionService.getAll(),
          teamService.getAll(),
          groupService.getAll(),
          assessmentService.getAll(),
          userService.getAll()
        ]);

        setSessions(sessData);
        setTeams(teamData);
        setGroups(groupData);
        setAssessments(assessData);
        setUsers(userData);

        if (sessData.length > 0) setSelectedSessionId(sessData[0].id);
        setSelectedTeamId('all');
      } catch (err) {
        showToast('Gagal memuat data rekapitulasi', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  // Logika Filter: Jika 'all' maka tampilkan semua grup, jika tidak filter berdasarkan teamId
  const filteredGroups = selectedTeamId === 'all'
    ? groups
    : groups.filter(g => g.teamId === selectedTeamId);

  // Proses Kalkulasi Data Report
  const reportData = filteredGroups.map(group => {
    const groupAssessments = assessments.filter(
      a => a.groupId === group.id && a.sessionId === selectedSessionId
    );

    const assessorDetails = groupAssessments.map(a => {
      const u = users.find(user => user.id === a.userId);
      return {
        name: u?.name || 'Unknown',
        score: a.results?.total || 0
      };
    });

    const totalAllScores = assessorDetails.reduce((sum, current) => sum + current.score, 0);
    const average = assessorDetails.length > 0 ? (totalAllScores / assessorDetails.length).toFixed(2) : 0;

    return {
      ...group,
      assessors: assessorDetails,
      average
    };
  });

  const statusBadgeClass = (count) =>
    count >= 3
      ? 'bg-[#0F9D6D]/10 text-[#0F9D6D]'
      : count > 0
        ? 'bg-[#C8933E]/10 text-[#C8933E]'
        : 'bg-slate-100 text-slate-400';

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-4 p-4 sm:-m-6 sm:p-6 md:-m-8 md:p-8">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Laporan</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#17203A]">
            Rekapitulasi Nilai
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sesi / Semester</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#C8933E] shadow-sm appearance-none sm:min-w-[200px] cursor-pointer"
              >
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tim Penilai</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#C8933E] shadow-sm appearance-none sm:min-w-[200px] cursor-pointer"
              >
                <option value="all">Semua Tim</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {filteredGroups.length === 0 ? (
        <EmptyState message="Tidak ada data grup ditemukan" icon={<Calculator />} />
      ) : (
        <>
          {/* MOBILE & TABLET: card list (di bawah md) */}
          <div className="grid gap-3 md:hidden">
            {reportData.map((data) => (
              <div key={data.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#17203A] text-base truncate">{data.name}</p>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1 truncate">{data.gugus}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusBadgeClass(data.assessors.length)}`}>
                    {data.assessors.length}/3
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    {teams.find(t => t.id === data.teamId)?.name || '-'}
                  </span>
                  {data.assessors.length > 0 ? (
                    <span className="font-serif text-xl font-bold text-[#C8933E]">{data.average}</span>
                  ) : (
                    <span className="text-slate-300 font-serif text-lg">-</span>
                  )}
                </div>

                {data.assessors.length === 0 ? (
                  <p className="mt-3 pt-3 border-t border-slate-100 text-slate-400 italic text-xs">
                    Belum ada penilaian
                  </p>
                ) : (
                  <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    {data.assessors.map((assessor, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{assessor.name}</span>
                        <span className="text-slate-400">{Number(assessor.score).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* DESKTOP: table (md ke atas), dengan scroll horizontal sebagai pengaman */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[760px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Grup & Gugus</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Tim</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Penilai</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Rata-Rata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((data) => (
                    <tr key={data.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#17203A] text-base">{data.name}</p>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">{data.gugus}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 font-medium">
                          {teams.find(t => t.id === data.teamId)?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusBadgeClass(data.assessors.length)}`}>
                          {data.assessors.length} / 3 Selesai
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {data.assessors.length === 0 ? (
                          <span className="text-slate-400 italic text-xs">Belum ada penilaian</span>
                        ) : (
                          <ul className="space-y-1">
                            {data.assessors.map((assessor, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-slate-700">{assessor.name}</span>
                                <span className="text-slate-400">({Number(assessor.score).toFixed(2)})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {data.assessors.length > 0 ? (
                          <span className="font-serif text-2xl font-bold text-[#C8933E]">
                            {data.average}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-serif text-xl">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}