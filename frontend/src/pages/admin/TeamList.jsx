import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import teamService from '../../services/teamService';
import groupService from '../../services/groupService';
import { Users, Edit2, Trash2 } from 'lucide-react';

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Master Data</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">Daftar Tim</h1>
        </div>
        <button onClick={openCreate} className="bg-[#17203A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#232f52] transition-colors">
          + Tambah Tim
        </button>
      </div>

      {teams.length === 0 ? (
        <EmptyState message="Belum ada data tim" icon={<Users />} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Nama Tim</th>
                <th className="px-6 py-4">Grup Terdaftar</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((team) => {
                const teamGroups = getGroupsForTeam(team.id);
                return (
                  <tr key={team.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-800">{team.name}</td>
                    <td className="px-6 py-4 text-slate-600 leading-relaxed">
                      {teamGroups.length > 0 ? (
                        teamGroups.map(g => `${g.name} (${g.gugus})`).join(', ')
                      ) : (
                        <span className="text-slate-400 italic">Belum ada grup</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEdit(team)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(team.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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