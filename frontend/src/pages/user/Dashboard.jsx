import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import groupService from '../../services/groupService';
import sessionService from '../../services/sessionService';
import assessmentService from '../../services/assessmentService'; // Ditambahkan
import { Users, ArrowRight, CalendarDays, CheckCircle } from 'lucide-react'; // Ditambahkan CheckCircle

export default function UserDashboard() {
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [assessments, setAssessments] = useState([]); // State untuk riwayat
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data user dari LocalStorage
    const userJson = localStorage.getItem('user');
    const currentUser = userJson ? JSON.parse(userJson) : null;

    if (!currentUser?.teamId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Fetch data grup, sesi, dan riwayat penilaian secara bersamaan
    Promise.all([
      groupService.getAll(),
      sessionService.getAll(),
      assessmentService.getAll() // Mengambil penilaian milik user ini
    ])
      .then(([allGroups, allSessions, allAssessments]) => {
        // Filter grup sesuai tim
        const allowedGroups = allGroups.filter((g) => g.teamId === currentUser.teamId);
        setGroups(allowedGroups);
        
        // Simpan sesi dan set sesi pertama sebagai default
        setSessions(allSessions);
        if (allSessions.length > 0) {
          setSelectedSessionId(allSessions[0].id);
        }

        // Simpan riwayat penilaian
        setAssessments(allAssessments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  // Dapatkan ID grup mana saja yang SUDAH dinilai pada sesi yang sedang dipilih
  const assessedGroupIds = assessments
    .filter(a => a.sessionId === selectedSessionId)
    .map(a => a.groupId);

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">
            Mulai Baru
          </p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
            Pilih Grup Penilaian
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Berikut adalah daftar grup yang menjadi tanggung jawab tim Anda. Pilih sesi/semester terlebih dahulu, lalu pilih grup untuk memulai.
          </p>
        </div>

        {/* Filter Sesi / Semester */}
        {sessions.length > 0 && (
          <div className="shrink-0">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Sesi / Semester
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDays className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none shadow-sm transition-all appearance-none w-full md:w-64 cursor-pointer"
              >
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {sessions.length === 0 ? (
        // Tampilan jika Admin belum membuat Sesi satupun
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Belum ada sesi aktif</h3>
          <p className="text-slate-500 text-sm mt-1">
            Sesi/Semester penilaian belum dikonfigurasi. Silakan hubungi Administrator.
          </p>
        </div>
      ) : groups.length === 0 ? (
        // Tampilan jika Tim tidak punya grup
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Tidak ada grup tersedia</h3>
          <p className="text-slate-500 text-sm mt-1">
            Belum ada grup yang ditugaskan ke tim Anda. Silakan hubungi Administrator.
          </p>
        </div>
      ) : (
        // Tampilan Card Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => {
            const isAssessed = assessedGroupIds.includes(group.id);

            return isAssessed ? (
              // TAMPILAN JIKA SUDAH DINILAI (TERKUNCI)
              <div
                key={group.id}
                className="group bg-slate-50/70 border border-slate-200 rounded-xl p-6 shadow-sm opacity-80 relative overflow-hidden flex flex-col h-full cursor-not-allowed"
              >
                <div className="mb-6 relative z-10">
                  <div className="w-12 h-12 bg-[#0F9D6D]/10 rounded-xl flex items-center justify-center text-[#0F9D6D] mb-5">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-slate-500">
                    {group.name}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-2 uppercase tracking-wider">
                    {group.gugus}
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-[#0F9D6D] relative z-10">
                  <span>Sudah Dinilai</span>
                </div>
              </div>
            ) : (
              // TAMPILAN NORMAL (BISA DIKLIK)
              <Link
                key={group.id}
                to={`/assessment/new?groupId=${group.id}&sessionId=${selectedSessionId}`}
                className="group bg-white border border-slate-200 hover:border-[#C8933E] rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full"
              >
                {/* Efek dekorasi cahaya di sudut kanan atas saat di-hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C8933E]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="mb-6 relative z-10">
                  {/* Ikon Card */}
                  <div className="w-12 h-12 bg-slate-50 group-hover:bg-[#C8933E]/10 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#C8933E] transition-colors mb-5">
                    <Users size={24} />
                  </div>

                  {/* Judul Grup & Gugus */}
                  <h3 className="font-serif text-xl font-semibold text-[#17203A] group-hover:text-[#C8933E] transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-2 uppercase tracking-wider">
                    {group.gugus}
                  </p>
                </div>

                {/* Tombol Aksi di bagian bawah Card */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-slate-400 group-hover:text-[#C8933E] transition-colors relative z-10">
                  <span>Mulai Penilaian</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}