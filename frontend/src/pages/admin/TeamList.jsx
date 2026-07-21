import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import teamService from '../../services/teamService';
import groupService from '../../services/groupService';
import { Users, Edit2, Trash2 } from 'lucide-react';

// Palet warna untuk chip grup (Soft Pastel + Border)
const CHIP_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
];

export default function TeamList() {
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '' });

  const fetchData = async () => {
    try {
      const [teamsData, groupsData] = await Promise.all([
        teamService.getAll(),
        groupService.getAll()
      ]);
      
      // Mengurutkan tim berdasarkan nama (Tim 1, Tim 2, Tim 10)
      teamsData.sort((a, b) => 
        (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
      );

      setTeams(teamsData);
      setGroups(groupsData);
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast('Nama tim wajib diisi', 'error');
      return;
    }
    try {
      if (editItem) {
        await teamService.update(editItem.id, form);
        showToast('Tim diperbarui', 'success');
      } else {
        await teamService.create(form);
        showToast('Tim ditambahkan', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
  };

  const handleDelete = async (id) => {
    const groupCount = groups.filter(g => g.teamId === id).length;
    const confirmMsg = groupCount > 0
      ? `Tim ini masih punya ${groupCount} grup terhubung. Grup-grup itu akan jadi "tanpa tim" (bukan ikut terhapus). Lanjutkan hapus tim?`
      : 'Yakin hapus tim ini?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await teamService.remove(id);
      showToast('Tim dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast('Gagal menghapus', 'error');
    }
  };

  if (loading) return <Loading />;

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  // Grup milik tim sekarang diturunkan dari group.teamId, bukan disimpan di Team
  const getGroupsForTeam = (teamId) => groups.filter(g => g.teamId === teamId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Master Data</p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#17203A]">Daftar Tim</h1>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-[#17203A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#232f52] transition-colors"
        >
          + Tambah Tim
        </button>
      </div>

      {teams.length === 0 ? (
        <EmptyState message="Belum ada data tim" icon={<Users />} />
      ) : (
        <>
          {/* MOBILE — daftar card, satu kolom */}
          <div className="md:hidden space-y-3">
            {teams.map((team) => {
              const teamGroups = getGroupsForTeam(team.id);
              return (
                <div key={team.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-slate-800 text-sm truncate">{team.name}</h3>
                      {/* UPDATE: Badge Total Dinilai (Mobile) */}
                      <span className="inline-flex w-fit items-center justify-center bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {teamGroups.length} Grup Dinilai
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(team)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(team.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Tampilan Grup ala Chip Berwarna (Mobile) */}
                  <div className="mt-3">
                    {teamGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {teamGroups.map((g, index) => {
                          const colorClass = CHIP_COLORS[index % CHIP_COLORS.length];
                          return (
                            <span 
                              key={g.id} 
                              className={`text-xs font-medium border px-2.5 py-1 rounded-md shadow-sm ${colorClass}`}
                            >
                              {g.name} <span className="opacity-75 font-normal">({g.gugus})</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400">Belum ada grup</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP — tabel */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Nama Tim</th>
                  {/* UPDATE: Kolom Baru Total Dinilai */}
                  <th className="px-6 py-4 whitespace-nowrap">Total Dinilai</th>
                  <th className="px-6 py-4 w-1/2">Grup yang akan dinilai</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.map((team) => {
                  const teamGroups = getGroupsForTeam(team.id);
                  return (
                    <tr key={team.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-800 align-top">{team.name}</td>
                      
                      {/* UPDATE: Isi Kolom Total Dinilai (Desktop) */}
                      <td className="px-6 py-4 align-top">
                        <div className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm border border-slate-200">
                          {teamGroups.length} Grup
                        </div>
                      </td>

                      {/* Tampilan Grup ala Chip Berwarna (Desktop) */}
                      <td className="px-6 py-4">
                        {teamGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {teamGroups.map((g, index) => {
                              const colorClass = CHIP_COLORS[index % CHIP_COLORS.length];
                              return (
                                <span 
                                  key={g.id} 
                                  className={`text-xs font-medium border px-2.5 py-1 rounded-md shadow-sm ${colorClass}`}
                                >
                                  {g.name} <span className="opacity-75 font-normal">({g.gugus})</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada grup</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-right align-top">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(team)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(team.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Tim' : 'Tambah Tim'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nama Tim</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Misal: Tim 1" required autoFocus />
          </div>
          <p className="text-xs text-slate-500">
            Untuk menghubungkan Grup ke tim ini, atur lewat halaman <span className="font-medium">Daftar Grup</span> (pilih Tim di form Grup).
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
            <button type="submit" className="px-4 py-2 bg-[#17203A] text-white rounded-lg text-sm font-semibold hover:bg-[#232f52]">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}