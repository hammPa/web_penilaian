import { useEffect, useState, useMemo } from 'react';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import tableService from '../../services/tableService';
import criteriaService from '../../services/criteriaService';
import variableService from '../../services/variableService';
import assessmentService from '../../services/assessmentService';
import userService from '../../services/userService';
import groupService from '../../services/groupService';
import teamService from '../../services/teamService';
import sessionService from '../../services/sessionService';

// Import Recharts
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutGrid, ClipboardList, FileCheck2, FilePlus2, Wrench, Calendar } from 'lucide-react';

const statConfig = [
  { key: 'tableCount', label: 'Total Tabel', icon: <LayoutGrid /> },
  { key: 'criteriaCount', label: 'Total Kriteria', icon: <ClipboardList /> },
  { key: 'variableCount', label: 'Total Variabel', icon: <Wrench /> },
  { key: 'assessmentCount', label: 'Total Penilaian', icon: <FileCheck2 /> },
];

// Sudah Lengkap (hijau), Belum Lengkap (kuning/amber), Belum Isi Sama Sekali (merah)
const COLORS = ['#0F9D6D', '#C8933E', '#C1443A'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [tables, criteria, variables, assessments, users, groups, teams, sessionData] = await Promise.all([
          tableService.getAll(),
          criteriaService.getAll(),
          variableService.getAll(),
          assessmentService.getAll(),
          userService.getAll(),
          groupService.getAll(),
          teamService.getAll(),
          sessionService.getAll().catch(() => [])
        ]);

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

        setRawData({
          tables, criteria, variables, assessments, users, groups, teams,
          tableCount: tables.length,
          criteriaCount: criteria.length,
          variableCount: actualVariableCount,
          assessmentCount: assessments.length
        });

        setSessions(sessionData);
        if (sessionData.length > 0) {
          setSelectedSession(sessionData[sessionData.length - 1].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const processedData = useMemo(() => {
    if (!rawData) return null;
    const { assessments, users, groups, teams } = rawData;

    // Semua turunan di bawah ini (pie chart, bar chart top 10, daftar
    // belum mengisi) berbasis filteredAssessments -> otomatis mengikuti
    // sesi yang dipilih di dropdown ("Semua Sesi" jika selectedSession kosong).
    const filteredAssessments = selectedSession
      ? assessments.filter(a => a.sessionId === selectedSession)
      : assessments;

    const sorted = [...filteredAssessments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentAssessments = sorted.slice(0, 5).map(assessment => {
      const user = users.find(u => u.id === assessment.userId) || {};
      const group = groups.find(g => g.id === assessment.groupId) || {};
      const team = teams.find(t => t.id === group.teamId) || {};
      return {
        ...assessment,
        userName: user.name || 'User Tidak Diketahui',
        groupName: group.name || 'Grup Tidak Diketahui',
        teamName: team.name || 'Tim Tidak Diketahui',
        score: assessment.results?.total || 0,
      };
    });

    // Status pengisian peserta (untuk pie chart 3 kategori + daftar nama)
    // Target per user = jumlah grup dalam tim yang sama dengan user (teamId).
    // User yang timnya tidak punya grup sama sekali (target = 0) dikecualikan
    // dari perhitungan karena memang tidak ada yang perlu dinilai.
    const participantUsers = users.filter(u => u.role !== 'admin');

    const lengkapList = [];
    const belumLengkapList = [];
    const belumIsiList = [];

    participantUsers.forEach(u => {
      const teamGroups = groups.filter(g => g.teamId === u.teamId);
      const targetCount = teamGroups.length;
      if (targetCount === 0) return; // tidak ada grup untuk dinilai, skip dari perhitungan

      const assessedGroupIds = new Set(
        filteredAssessments.filter(a => a.userId === u.id).map(a => a.groupId)
      );
      const assessedCount = assessedGroupIds.size;
      const name = u.name || 'Tanpa Nama';

      if (assessedCount === 0) {
        belumIsiList.push(name);
      } else if (assessedCount < targetCount) {
        belumLengkapList.push({ name, assessedCount, targetCount });
      } else {
        lengkapList.push(name);
      }
    });

    belumIsiList.sort((a, b) => a.localeCompare(b));
    belumLengkapList.sort((a, b) => a.name.localeCompare(b.name));

    const pieData = [
      { name: 'Lengkap', value: lengkapList.length },
      { name: 'Belum Lengkap', value: belumLengkapList.length },
      { name: 'Belum Isi', value: belumIsiList.length }
    ];

    // Top 10 Nilai Tertinggi (per sesi terpilih, karena berbasis filteredAssessments)
    const userMaxScores = {};
    filteredAssessments.forEach(a => {
      const currentMax = userMaxScores[a.userId] || 0;
      const totalScore = a.results?.total || 0;
      if (totalScore > currentMax) {
        userMaxScores[a.userId] = totalScore;
      }
    });

    const barData = Object.entries(userMaxScores)
      .map(([userId, maxScore]) => {
        const user = users.find(u => u.id === userId);
        return {
          name: user?.name || 'User Tanpa Nama',
          Skor: Number(maxScore.toFixed(2))
        };
      })
      .sort((a, b) => b.Skor - a.Skor)
      .slice(0, 10); // Top 10 sesuai sesi terpilih

    return {
      recentAssessments,
      pieData,
      barData,
      lengkapList,
      belumLengkapList,
      belumIsiList,
      totalAssessmentFiltered: filteredAssessments.length,
      totalParticipants: lengkapList.length + belumLengkapList.length + belumIsiList.length
    };
  }, [rawData, selectedSession]);

  if (loading) return <Loading />;

  return (
    <div>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Ringkasan</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
            Dashboard Admin
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
          <Calendar size={16} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Sesi:</span>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="">Semua Sesi</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name || s.semester}</option>
            ))}
          </select>
        </div>
      </header>

      {/* CARD STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
        {statConfig.map(({ key, label, icon }) => (
          <Card key={key} className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center gap-2 md:flex-row md:items-center md:text-left md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl md:text-2xl bg-[#C8933E]/10 text-[#C8933E]">
                {icon}
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-500">{label}</p>
                <p className="font-serif text-xl md:text-2xl font-semibold text-[#17203A]">
                  {key === 'assessmentCount' ? processedData?.totalAssessmentFiltered : rawData?.[key]}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* PANEL GRAFIK ANALISIS DATA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pie Chart Status Pengisian */}
        <Card className="p-4 md:p-6 lg:col-span-1 flex flex-col justify-start">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-4">
            Status Pengisian Peserta
          </p>
          <div className="h-64 w-full flex items-center justify-center relative">
            {processedData?.pieData.some(d => d.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={processedData.pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {processedData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} User`, 'Jumlah']} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>

                {/* 1. Overlay Persentase: Pas di tengah lingkaran */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-[10%]">
                  <p className="font-serif text-3xl font-bold text-[#17203A] leading-none">
                    {processedData.totalParticipants > 0
                      ? Math.round((processedData.lengkapList.length / processedData.totalParticipants) * 100)
                      : 0}%
                  </p>
                </div>

                {/* 2. Overlay Teks Pecahan: Di luar lingkaran, di atas legend */}
                <div className="absolute inset-x-0 bottom-[40px] flex items-center justify-center pointer-events-none">
                  <p className="text-xs font-medium text-slate-500">
                    {processedData.lengkapList.length} / {processedData.totalParticipants} Selesai
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">Tidak ada aktivitas pada sesi ini</p>
            )}
          </div>

          {/* Daftar nama peserta: 3 kolom - Belum Isi, Belum Lengkap, Lengkap */}
          <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
            {/* Kolom Belum Isi */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C1443A] mb-1.5">
                Belum Isi ({processedData?.belumIsiList?.length || 0})
              </p>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                {processedData?.belumIsiList?.length > 0 ? (
                  processedData.belumIsiList.map((name, i) => (
                    <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                      <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#C1443A]/60 shrink-0" />
                      <span className="break-words">{name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-300">-</p>
                )}
              </div>
            </div>

            {/* Kolom Belum Lengkap */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C8933E] mb-1.5">
                Belum Lengkap ({processedData?.belumLengkapList?.length || 0})
              </p>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                {processedData?.belumLengkapList?.length > 0 ? (
                  processedData.belumLengkapList.map((item, i) => (
                    <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                      <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#C8933E]/60 shrink-0" />
                      <span className="break-words">
                        {item.name}{' '}
                        <span className="text-slate-400">({item.assessedCount}/{item.targetCount})</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-300">-</p>
                )}
              </div>
            </div>

            {/* Kolom Lengkap */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0F9D6D] mb-1.5">
                Lengkap ({processedData?.lengkapList?.length || 0})
              </p>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                {processedData?.lengkapList?.length > 0 ? (
                  processedData.lengkapList.map((name, i) => (
                    <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                      <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#0F9D6D]/60 shrink-0" />
                      <span className="break-words">{name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-300">-</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Bar Chart Horizontal Top 10 Nilai Tertinggi (per sesi terpilih) */}
        <Card className="p-4 md:p-6 lg:col-span-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-4">
            Top 10 Nilai Tertinggi User
          </p>
          <div className="h-80 w-full">
            {processedData?.barData && processedData.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  layout="vertical"
                  data={processedData.barData}
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#17203A', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="Skor" fill="#C8933E" radius={[0, 4, 4, 0]} barSize={16} />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-slate-400">Belum ada skor yang masuk pada sesi ini</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* DAFTAR AKTIVITAS TERBARU */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            5 Penilaian Terbaru (Sesi Aktif)
          </p>
        </div>

        {processedData?.recentAssessments && processedData.recentAssessments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {processedData.recentAssessments.map((item) => (
              <div key={item.id} className="py-3 md:py-4 flex items-center justify-between gap-3 md:gap-4 group">
                <div className="flex items-center md:items-start gap-3 md:gap-4 min-w-0">
                  <span className="grid place-items-center h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#0F9D6D]/10 text-[#0F9D6D] shrink-0">
                    <FileCheck2 size={16} className="md:hidden" />
                    <FileCheck2 size={20} className="hidden md:block" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <h3 className="font-semibold text-[#17203A] text-sm md:text-base truncate">{item.groupName}</h3>
                      <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium uppercase tracking-wider shrink-0">
                        {item.teamName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 md:hidden truncate">
                      {item.userName} · {item.teamName} · {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="hidden md:block text-sm text-slate-500 mt-1">
                      Dinilai oleh <span className="font-medium text-slate-700">{item.userName}</span>
                    </p>
                    <p className="hidden md:block text-[11px] text-slate-400 mt-1">
                      {new Date(item.createdAt).toLocaleString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Skor Total</p>
                  <p className="font-serif text-lg md:text-2xl font-bold text-[#C8933E]">
                    {Number(item.score).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <FilePlus2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Belum ada penilaian yang masuk pada sesi ini</p>
          </div>
        )}
      </Card>
    </div>
  );
}