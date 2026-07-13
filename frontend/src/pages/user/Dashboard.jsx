import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import groupService from '../../services/groupService';
import teamService from '../../services/teamService';
import { Users, ArrowRight } from 'lucide-react';

export default function UserDashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data user dari LocalStorage
    const userJson = localStorage.getItem('user'); 
    const currentUser = userJson ? JSON.parse(userJson) : null;

    // Hanya ambil data Grup dan Tim (Penilaian Terbaru sudah dihapus)
    Promise.all([
      groupService.getAll(),
      currentUser?.teamId ? teamService.getById(currentUser.teamId) : Promise.resolve(null)
    ])
      .then(([groupsData, teamData]) => {
        if (teamData && teamData.groupIds && teamData.groupIds.length > 0) {
          // Filter grup sesuai dengan yang dimiliki tim
          const allowedGroups = groupsData.filter(g => teamData.groupIds.includes(g.id));
          setGroups(allowedGroups);
        } else {
          setGroups([]); 
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">
          Mulai Baru
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
          Pilih Grup Penilaian
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Berikut adalah daftar grup yang menjadi tanggung jawab tim Anda. Pilih salah satu grup di bawah ini untuk memulai proses penilaian baru.
        </p>
      </header>

      {groups.length === 0 ? (
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
          {groups.map(group => (
            <Link
              key={group.id}
              to={`/assessment/new?groupId=${group.id}`}
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
          ))}
        </div>
      )}
    </div>
  );
}