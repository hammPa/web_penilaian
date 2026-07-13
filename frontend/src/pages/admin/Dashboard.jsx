import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import assessmentService from '../../services/assessmentService';
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
        const [tables, criteria, variables, assessments] = await Promise.all([
          tableService.getAll(),
          criteriaService.getAll(),
          variableService.getAll(),
          assessmentService.getAll()
        ]);
        setStats({
          tableCount: tables.length,
          criteriaCount: criteria.length,
          variableCount: variables.length,
          assessmentCount: assessments.length,
          latestAssessment: assessments[0]
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {statConfig.map(({ key, label, icon }) => (
          <Card key={key}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-[#C8933E]/10">
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

      <Card>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-3">
          Aktivitas Terbaru
        </p>
        {stats?.latestAssessment ? (
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-[#0F9D6D]/10 text-[#0F9D6D] shrink-0">
              <FilePlus2 />
            </span>
            <p>
              Penilaian terbaru oleh user ID{' '}
              <span className="font-semibold text-[#17203A]">{stats.latestAssessment.userId}</span>{' '}
              pada{' '}
              <span className="font-medium">
                {new Date(stats.latestAssessment.createdAt).toLocaleString('id-ID')}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Belum ada penilaian</p>
        )}
      </Card>
    </div>
  );
}