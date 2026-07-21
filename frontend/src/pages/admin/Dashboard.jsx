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

// Chart-chart dipisah menjadi komponen tersendiri
import StatusPengisianChart from '../../components/dashboard/StatusPengisianChart';
import StatusPengisianGrupChart from '../../components/dashboard/StatusPengisianGrupChart';
import SebaranNilaiChart from '../../components/dashboard/SebaranNilaiChart';
import TopSkorChart from '../../components/dashboard/TopSkorChart';

import { LayoutGrid, ClipboardList, FileCheck2, FilePlus2, Wrench, Calendar, Users } from 'lucide-react';

const statConfig = [
  { key: 'tableCount', label: 'Total Tabel', icon: <LayoutGrid /> },
  { key: 'criteriaCount', label: 'Total Kriteria', icon: <ClipboardList /> },
  { key: 'variableCount', label: 'Total Variabel', icon: <Wrench /> },
  { key: 'groupCount', label: 'Total Grup (Akan Dinilai)', icon: <Users /> },
  { key: 'assessmentCount', label: 'Total Penilaian', icon: <FileCheck2 /> },
];

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

        // Total Grup yang "akan dinilai": grup dihitung hanya jika timnya
        // punya minimal 1 calon penilai (user non-admin di tim yang sama).
        // TIDAK dipengaruhi filter sesi, karena grup & tim tidak punya
        // atribut session/semester (cuma assessment yang punya sessionId).
        const participantUsersAll = users.filter(u => u.role !== 'admin');
        const groupCount = groups.filter(g => {
          const targetAssessorCount = participantUsersAll.filter(u => u.teamId === g.teamId).length;
          return targetAssessorCount > 0;
        }).length;

        setRawData({
          tables, criteria, variables, assessments, users, groups, teams,
          tableCount: tables.length,
          criteriaCount: criteria.length,
          variableCount: actualVariableCount,
          groupCount,
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

    // Status pengisian GRUP (untuk pie chart 2 kategori + daftar nama grup).
    // Berbeda dari status per user: satu grup dianggap "Sudah Dinilai" jika
    // MINIMAL SATU juri/peserta sudah mengisi, tidak peduli berapa target
    // penilai untuk grup itu. Target penilai = jumlah user non-admin di tim
    // yang sama dengan grup; grup dengan target = 0 (tidak ada penilai
    // tersedia) dikecualikan dari perhitungan.
    const sudahDinilaiList = [];
    const belumDinilaiList = [];

    teams.forEach(team => {
      const teamGroups = groups.filter(g => g.teamId === team.id);
      const targetAssessorCount = participantUsers.filter(u => u.teamId === team.id).length;

      teamGroups.forEach(g => {
        if (targetAssessorCount === 0) return; // tidak ada penilai tersedia, skip dari perhitungan

        const assessorIds = new Set(
          filteredAssessments.filter(a => a.groupId === g.id).map(a => a.userId)
        );
        const assessedCount = assessorIds.size;
        const name = g.name || 'Grup Tanpa Nama';
        const teamName = team.name || 'Tim Tidak Diketahui';

        if (assessedCount > 0) {
          sudahDinilaiList.push({ name, teamName, assessedCount });
        } else {
          belumDinilaiList.push({ name, teamName });
        }
      });
    });

    sudahDinilaiList.sort((a, b) => a.name.localeCompare(b.name));
    belumDinilaiList.sort((a, b) => a.name.localeCompare(b.name));

    const groupPieData = [
      { name: 'Sudah Dinilai', value: sudahDinilaiList.length },
      { name: 'Belum Dinilai', value: belumDinilaiList.length }
    ];

    // Sebaran Nilai: berbasis SEMUA GRUP (universe sama dengan "Total Grup
    // Akan Dinilai" & chart Status Pengisian Grup), bukan per submission
    // assessment. Tiap grup diwakili SATU nilai = RATA-RATA skor dari semua
    // penilai (kalau penilai cuma 1, hasilnya = skor itu sendiri; kalau
    // lebih dari 1, dijumlah lalu dibagi jumlah penilai). Grup yang belum
    // ada satupun assessment masuk -> dihitung skor 0 (masuk kriteria 0 - 20).
    const scoreBuckets = {
      '80 - 100': { value: 0, groups: [] },
      '60 - 80': { value: 0, groups: [] },
      '40 - 60': { value: 0, groups: [] },
      '20 - 40': { value: 0, groups: [] },
      '0 - 20': { value: 0, groups: [] },
    };

    teams.forEach(team => {
      const teamGroups = groups.filter(g => g.teamId === team.id);
      const targetAssessorCount = participantUsers.filter(u => u.teamId === team.id).length;

      teamGroups.forEach(g => {
        if (targetAssessorCount === 0) return; // grup tanpa calon penilai, skip dari perhitungan (sama dgn Total Grup)

        const groupScores = filteredAssessments
          .filter(a => a.groupId === g.id)
          .map(a => a.results?.total || 0);
        const groupScore = groupScores.length > 0
          ? groupScores.reduce((sum, s) => sum + s, 0) / groupScores.length
          : 0;

        const groupName = g.name || 'Grup Tanpa Nama';

        if (groupScore >= 80) {
          scoreBuckets['80 - 100'].value++;
          scoreBuckets['80 - 100'].groups.push(groupName);
        } else if (groupScore >= 60) {
          scoreBuckets['60 - 80'].value++;
          scoreBuckets['60 - 80'].groups.push(groupName);
        } else if (groupScore >= 40) {
          scoreBuckets['40 - 60'].value++;
          scoreBuckets['40 - 60'].groups.push(groupName);
        } else if (groupScore >= 20) {
          scoreBuckets['20 - 40'].value++;
          scoreBuckets['20 - 40'].groups.push(groupName);
        } else {
          scoreBuckets['0 - 20'].value++;
          scoreBuckets['0 - 20'].groups.push(groupName);
        }
      });
    });

    const sebaranNilaiPieData = Object.entries(scoreBuckets).map(([name, data]) => ({ 
      name, 
      value: data.value,
      groups: data.groups 
    }));
    
    const totalNilai = Object.values(scoreBuckets).reduce((sum, v) => sum + v.value, 0);

    // Nilai per GRUP (bukan per user/juri lagi). Basis grup sama dengan
    // chart Status Pengisian Grup & Sebaran Nilai: grup dihitung hanya jika
    // timnya punya minimal 1 calon penilai. Grup yang belum ada assessment
    // sama sekali tetap masuk daftar dengan skor 0. Nilai grup = RATA-RATA
    // skor dari semua penilai (kalau penilai cuma 1, hasilnya = skor itu
    // sendiri; kalau lebih dari 1, dijumlah lalu dibagi jumlah penilai).
    const barData = [];
    teams.forEach(team => {
      const teamGroups = groups.filter(g => g.teamId === team.id);
      const targetAssessorCount = participantUsers.filter(u => u.teamId === team.id).length;

      teamGroups.forEach(g => {
        if (targetAssessorCount === 0) return; // grup tanpa calon penilai, skip

        const groupScores = filteredAssessments
          .filter(a => a.groupId === g.id)
          .map(a => a.results?.total || 0);
        const avgScore = groupScores.length > 0
          ? groupScores.reduce((sum, s) => sum + s, 0) / groupScores.length
          : 0;

        barData.push({
          name: g.name || 'Grup Tanpa Nama',
          Skor: Number(avgScore.toFixed(2))
        });
      });
    });

    barData.sort((a, b) => b.Skor - a.Skor); // Semua grup diurutkan, tidak dibatasi 10

    return {
      recentAssessments,
      pieData,
      barData,
      lengkapList,
      belumLengkapList,
      belumIsiList,
      groupPieData,
      sudahDinilaiList,
      belumDinilaiList,
      sebaranNilaiPieData,
      totalNilai,
      totalAssessmentFiltered: filteredAssessments.length,
      totalParticipants: lengkapList.length + belumLengkapList.length + belumIsiList.length,
      totalGroups: sudahDinilaiList.length + belumDinilaiList.length
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6">
        {statConfig.map(({ key, label, icon }) => {
          // Cek apakah ini stat yang dinamis (terpengaruh filter)
          const isDynamic = key === 'assessmentCount';
          const value = isDynamic ? processedData?.totalAssessmentFiltered : rawData?.[key];

          return (
            <Card 
              key={key} 
              // Berikan styling khusus untuk card yang dinamis
              className={`p-4 md:p-6 relative overflow-hidden transition-all ${
                isDynamic 
                  ? 'ring-1 ring-[#C8933E] bg-gradient-to-br from-white to-[#C8933E]/5 shadow-md' 
                  : 'border border-slate-100'
              }`}
            >
              {/* Badge penanda untuk card dinamis */}
              {isDynamic && (
                <div className="absolute top-0 right-0 bg-[#C8933E] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg z-10">
                  Sesi Aktif
                </div>
              )}

              <div className="flex flex-col items-center text-center gap-2 md:flex-row md:items-center md:text-left md:gap-4 relative z-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl md:text-2xl bg-[#C8933E]/10 text-[#C8933E] shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-xs md:text-sm text-slate-500 leading-tight">
                    {/* Hapus teks (Akan Dinilai) yang kepanjangan jika ada, atau biarkan */}
                    {isDynamic ? 'Total Penilaian' : label} 
                  </p>
                  <p className="font-serif text-xl md:text-2xl font-semibold text-[#17203A] mt-0.5">
                    {/* Tampilkan Loading state kecil jika processedData belum siap */}
                    {value !== undefined ? value : '-'}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* PANEL STATUS PENGISIAN: PER USER, PER GRUP, & SEBARAN NILAI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <StatusPengisianChart
          pieData={processedData?.pieData}
          lengkapList={processedData?.lengkapList}
          belumLengkapList={processedData?.belumLengkapList}
          belumIsiList={processedData?.belumIsiList}
          totalParticipants={processedData?.totalParticipants}
        />
        <StatusPengisianGrupChart
          pieData={processedData?.groupPieData}
          sudahList={processedData?.sudahDinilaiList}
          belumList={processedData?.belumDinilaiList}
          totalGroups={processedData?.totalGroups}
        />
        <SebaranNilaiChart
          pieData={processedData?.sebaranNilaiPieData}
          totalNilai={processedData?.totalNilai}
        />
      </div>

      {/* PANEL RATA-RATA NILAI SEMUA GRUP */}
      <div className="mb-6">
        <TopSkorChart barData={processedData?.barData} />
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