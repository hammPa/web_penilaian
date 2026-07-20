import { useState, useEffect } from 'react';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import groupService from '../../services/groupService';
import teamService from '../../services/teamService';
import assessmentService from '../../services/assessmentService';
import userService from '../../services/userService';
import sessionService from '../../services/sessionService';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import { Calculator, CalendarDays, Shield, Download } from 'lucide-react';
import { rekapNilai } from '../../utils/rekapNilaiExport';
import { groupRecapPdfExport } from '../../utils/rekapGrupPdfExport';
import { rekapNilaiPdf } from '../../utils/rekapNilaiPdfExport';

export default function AssessmentRecap() {
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [variables, setVariables] = useState([]);

  // Filter States: Default ke 'all'
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessData, teamData, groupData, assessData, userData, tableData, criteriaData, variableData] = await Promise.all([
          sessionService.getAll(),
          teamService.getAll(),
          groupService.getAll(),
          assessmentService.getAll(),
          userService.getAll(),
          tableService.getAll(),
          criteriaService.getAll(),
          variableService.getAll()
        ]);

        // 1. URUTKAN DATA SESI SECARA NUMERIK/ALFABET
        sessData.sort((a, b) => 
          (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
        );

        // 2. URUTKAN DATA TIM SECARA NUMERIK/ALFABET
        teamData.sort((a, b) => 
          (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
        );

        setSessions(sessData);
        setTeams(teamData);
        setGroups(groupData);
        setAssessments(assessData);
        setUsers(userData);
        setTables(tableData);
        setCriteria(criteriaData);
        setVariables(variableData);

        // Karena sudah diurutkan, index 0 akan selalu mengambil sesi paling pertama secara logis
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

  // Map bantu untuk lookup cepat nama tabel/kriteria/variabel dari id
  const tableMap = {};
  tables.forEach(t => { tableMap[t.id] = t; });

  const criteriaMap = {};
  criteria.forEach(c => { criteriaMap[c.id] = c; });

  const variableMap = {};
  variables.forEach(v => { variableMap[v.id] = v; });

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
      const subtotals = a.results?.subtotals || {};
      const details = a.results?.details || [];

      // Breakdown per kriteria
      const perCriteria = Object.entries(subtotals).map(([criteriaId, score]) => {
        const crit = criteriaMap[criteriaId];
        const table = crit ? tableMap[crit.tableId] : null;
        return {
          tableName: table?.name || 'Tabel Tidak Diketahui',
          criteriaName: crit?.name || 'Kriteria Tidak Diketahui',
          score
        };
      });

      // Breakdown per tabel
      const perTableMap = {};
      perCriteria.forEach(c => {
        if (!perTableMap[c.tableName]) perTableMap[c.tableName] = 0;
        perTableMap[c.tableName] += c.score;
      });
      const perTable = Object.entries(perTableMap).map(([tableName, score]) => ({ tableName, score }));

      // Breakdown per variabel
      const perVariable = details.map(d => {
        const variable = variableMap[d.variableId];
        const crit = variable ? criteriaMap[variable.criteriaId] : null;
        const table = crit ? tableMap[crit.tableId] : null;
        return {
          tableName: table?.name || 'Tabel Tidak Diketahui',
          criteriaName: crit?.name || 'Kriteria Tidak Diketahui',
          variableName: variable?.name || 'Variabel Tidak Diketahui',
          level: d.level,
          score: d.score
        };
      });

      return {
        name: u?.name || 'Unknown',
        score: a.results?.total || 0,
        recommendation: a.recommendation || '',
        perTable,
        perCriteria,
        perVariable
      };
    });

    const totalAllScores = assessorDetails.reduce((sum, current) => sum + current.score, 0);
    const average = assessorDetails.length > 0 ? (totalAllScores / assessorDetails.length).toFixed(2) : "0.00";

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

  // Memanggil fungsi export dari file helper
  const handleExportXLSX = () => {
    rekapNilai({
      reportData,
      sessions,
      selectedSessionId,
      tables,
      criteria,
      teams,
      showToast
    });
  };

  const handleExportGroupPdf = (groupItem) => {
    const sessionName = sessions.find(s => s.id === selectedSessionId)?.name;
    const teamName = teams.find(t => t.id === groupItem.teamId)?.name;
    groupRecapPdfExport({ group: { ...groupItem, teamName }, sessionName });
  };

  const handleExportRekapPdf = () => {
    rekapNilaiPdf({
      reportData,
      sessions,
      selectedSessionId,
      tables,
      criteria,
      teams,
      showToast
    });
  };

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-4 p-4 sm:-m-6 sm:p-6 md:-m-8 md:p-8">
      <header className="mb-6 md:mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Laporan</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#17203A]">
            Rekapitulasi Nilai
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0 flex-wrap items-stretch sm:items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sesi / Semester</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#C8933E] shadow-sm appearance-none sm:min-w-[160px] cursor-pointer"
              >
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tim Penilai</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#C8933E] shadow-sm appearance-none sm:min-w-[160px] cursor-pointer"
              >
                <option value="all">Semua Tim</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleExportXLSX}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#17203A] text-white rounded-lg text-sm font-medium hover:bg-[#253053] transition-colors shadow-sm"
          >
            <Download size={16} />
            Export Excel
          </button>
          <button
            onClick={handleExportRekapPdf}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C8933E] text-white rounded-lg text-sm font-medium hover:bg-[#b17f30] transition-colors shadow-sm"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </header>

      {filteredGroups.length === 0 ? (
        <EmptyState message="Tidak ada data grup ditemukan" icon={<Calculator />} />
      ) : (
        <>
          {/* MOBILE & TABLET: card list (di bawah md) */}
          <div className="grid gap-3 md:hidden w-full max-w-full">
            {reportData.map((data) => (
              <div key={data.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-hidden">
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
                <button
                  onClick={() => handleExportGroupPdf(data)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#17203A] text-white rounded-lg text-xs font-medium hover:bg-[#253053] transition-colors"
                >
                  <Download size={14} />
                  Export PDF
                </button>
              </div>
            ))}
          </div>

          {/* DESKTOP: table (md ke atas) */}
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
                    <th className="px-6 py-4 font-semibold text-slate-700 text-center">Aksi</th>
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
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleExportGroupPdf(data)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#17203A] text-white rounded-lg text-xs font-medium hover:bg-[#253053] transition-colors"
                        >
                          <Download size={13} />
                          PDF
                        </button>
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