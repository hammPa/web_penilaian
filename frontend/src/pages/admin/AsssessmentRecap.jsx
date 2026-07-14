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

  // Data Source
  const [sessions, setSessions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [users, setUsers] = useState([]);

  // Filter States
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');

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
        if (teamData.length > 0) setSelectedTeamId(teamData[0].id);
      } catch (err) {
        showToast('Gagal memuat data rekapitulasi', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  // Filter Grup berdasarkan Tim yang dipilih
  const filteredGroups = groups.filter(g => g.teamId === selectedTeamId);

  // Proses Kalkulasi Data Report
  const reportData = filteredGroups.map(group => {
    // Cari semua penilaian untuk grup ini pada sesi yang dipilih
    const groupAssessments = assessments.filter(
      a => a.groupId === group.id && a.sessionId === selectedSessionId
    );

    // Dapatkan detail tiap penilai (nama dan total skor)
    const assessorDetails = groupAssessments.map(a => {
      const u = users.find(user => user.id === a.userId);
      return {
        name: u?.name || 'Unknown',
        score: a.results?.total || 0
      };
    });

    // Hitung Rata-rata
    const totalAllScores = assessorDetails.reduce((sum, current) => sum + current.score, 0);
    const average = assessorDetails.length > 0 ? (totalAllScores / assessorDetails.length).toFixed(2) : 0;

    return {
      ...group,
      assessors: assessorDetails,
      average
    };
  });

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Laporan</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
            Rekapitulasi Nilai
          </h1>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sesi / Semester</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#C8933E] shadow-sm appearance-none min-w-[200px]"
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
                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#C8933E] shadow-sm appearance-none min-w-[200px]"
              >
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {filteredGroups.length === 0 ? (
        <EmptyState message="Tidak ada grup pada tim ini" icon={<Calculator />} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Nama Grup & Gugus</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Rincian Penilai & Skor</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Nilai Rata-Rata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((data) => (
                <tr key={data.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#17203A] text-base">{data.name}</p>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">{data.gugus}</p>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      data.assessors.length >= 3 ? 'bg-[#0F9D6D]/10 text-[#0F9D6D]' : 
                      data.assessors.length > 0 ? 'bg-[#C8933E]/10 text-[#C8933E]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {data.assessors.length} / 3 Selesai
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {data.assessors.length === 0 ? (
                      <span className="text-slate-400 italic text-xs">Belum ada penilaian</span>
                    ) : (
                      <ul className="space-y-2">
                        {data.assessors.map((assessor, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm">
                            <span className="w-5 h-5 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-700 min-w-[120px]">{assessor.name}</span>
                            <span className="text-slate-400 border-l border-slate-200 pl-3">
                              Skor: <strong className="text-[#17203A]">{assessor.score}</strong>
                            </span>
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
      )}
    </div>
  );
}