import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import assessmentService from '../../services/assessmentService';

// Tambahkan 3 service ini untuk mengambil nama user, grup, dan tim
import userService from '../../services/userService';
import groupService from '../../services/groupService';
import teamService from '../../services/teamService';

import { LayoutGrid, ClipboardList, FileCheck2, FilePlus2, Wrench } from 'lucide-react';

const statConfig = [
  { key: 'tableCount', label: 'Total Tabel', icon: <LayoutGrid /> },
  { key: 'criteriaCount', label: 'Total Kriteria', icon: <ClipboardList /> },
  { key: 'variableCount', label: 'Total Variabel', icon: <Wrench /> },
  { key: 'assessmentCount', label: 'Total Penilaian', icon: <FileCheck2 /> },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch SEMUA data sekaligus
        const [tables, criteria, variables, assessments, users, groups, teams] = await Promise.all([
          tableService.getAll(),
          criteriaService.getAll(),
          variableService.getAll(),
          assessmentService.getAll(),
          userService.getAll(),
          groupService.getAll(),
          teamService.getAll()
        ]);

        // Menghitung HANYA variabel level (0-5) yang deskripsinya benar-benar sudah diisi
        const actualVariableCount = variables.reduce((total, config) => {
          if (config.variables && typeof config.variables === 'object') {
            const levelsData = Object.values(config.variables);
            const filledCount = levelsData.filter(
              (level) => level && level.description && level.description.trim() !== ''
            ).length;
            return total + filledCount;
          }
          return total;
        }, 0);

        // Mengurutkan penilaian dari yang paling baru
        const sortedAssessments = assessments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Ambil 5 penilaian terbaru dan gabungkan dengan data relasinya (User, Grup, Tim)
        const recentAssessments = sortedAssessments.slice(0, 5).map(assessment => {
          const user = users.find(u => u.id === assessment.userId) || {};
          const group = groups.find(g => g.id === assessment.groupId) || {};
          // Cari tim berdasarkan teamId dari grup (atau fallback ke 'Tim Tidak Diketahui')
          const team = teams.find(t => t.id === group.teamId) || {};

          return {
            ...assessment,
            userName: user.name || 'User Tidak Diketahui',
            groupName: group.name || 'Grup Tidak Diketahui',
            teamName: team.name || 'Tim Tidak Diketahui',
            score: assessment.results?.total || 0,
            percentage: assessment.results?.percentage || 0
          };
        });

        setStats({
          tableCount: tables.length,
          criteriaCount: criteria.length,
          variableCount: actualVariableCount,
          assessmentCount: assessments.length,
          recentAssessments // Simpan array penilaian terbaru
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Ringkasan</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
          Dashboard Admin
        </h1>
      </header>

      {/* CARD STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {statConfig.map(({ key, label, icon }) => (
          <Card key={key}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-[#C8933E]/10 text-[#C8933E]">
                {icon}
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="font-serif text-2xl font-semibold text-[#17203A]">
                  {stats?.[key]}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* DAFTAR AKTIVITAS TERBARU */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            5 Penilaian Terbaru
          </p>
        </div>

        {stats?.recentAssessments && stats.recentAssessments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentAssessments.map((item) => (
              <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-start gap-4">
                  <span className="grid place-items-center h-10 w-10 rounded-full bg-[#0F9D6D]/10 text-[#0F9D6D] shrink-0 mt-0.5">
                    <FileCheck2 size={20} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#17203A] text-base">{item.groupName}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium uppercase tracking-wider">
                        {item.teamName}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Dinilai oleh <span className="font-medium text-slate-700">{item.userName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(item.createdAt).toLocaleString('id-ID', {
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Skor Total</p>
                  <p className="font-serif text-2xl font-bold text-[#C8933E]">
                    {item.score}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <FilePlus2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Belum ada penilaian yang masuk</p>
          </div>
        )}
      </Card>
    </div>
  );
}