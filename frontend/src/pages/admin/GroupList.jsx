import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import groupService from '../../services/groupService';
import teamService from '../../services/teamService';
import { Users, Edit2, Trash2 } from 'lucide-react';

export default function GroupList() {
  const [groups, setGroups] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '', gugus: '', teamId: '' });

  const fetchData = async () => {
    try {
      const [groupsData, teamsData] = await Promise.all([
        groupService.getAll(),
        teamService.getAll()
      ]);
      setGroups(groupsData);
      setTeams(teamsData);
    } catch (err) {
      showToast('Gagal memuat data grup', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', gugus: '', teamId: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, gugus: item.gugus, teamId: item.teamId || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.gugus) {
      showToast('Nama dan Gugus wajib diisi', 'error');
      return;
    }
    if (!form.teamId) {
      showToast('Tim wajib dipilih', 'error');
      return;
    }
    try {
      if (editItem) {
        await groupService.update(editItem.id, form);
        showToast('Grup berhasil diperbarui', 'success');
      } else {
        await groupService.create(form);
        showToast('Grup berhasil ditambahkan', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus grup ini?')) return;
    try {
      await groupService.remove(id);
      showToast('Grup berhasil dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast('Gagal menghapus grup', 'error');
    }
  };

  if (loading) return <Loading />;

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Master Data</p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#17203A]">Daftar Grup</h1>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-[#17203A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#232f52] transition-colors"
        >
          + Tambah Grup
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState message="Belum ada data grup" icon={<Users />} />
      ) : (
        <>
          {/* MOBILE — daftar card, satu kolom */}
          <div className="md:hidden space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-[#17203A] text-sm truncate">{group.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{group.gugus}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(group)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(group.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  {group.teamId ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#C8933E]/10 text-[#8a6224]">
                      {getTeamName(group.teamId)}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Belum ada tim</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP — tabel seperti semula */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Nama Grup</th>
                  <th className="px-6 py-4">Gugus</th>
                  <th className="px-6 py-4">Tim</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium">{group.name}</td>
                    <td className="px-6 py-4 text-slate-600">{group.gugus}</td>
                    <td className="px-6 py-4">
                      {group.teamId ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#C8933E]/10 text-[#8a6224]">
                          {getTeamName(group.teamId)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Belum ada tim</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEdit(group)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(group.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Grup' : 'Tambah Grup'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nama Grup</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Misal: Grup Alpha" required />
          </div>
          <div>
            <label className={labelClass}>Gugus</label>
            <input type="text" value={form.gugus} onChange={e => setForm({ ...form, gugus: e.target.value })} className={inputClass} placeholder="Misal: Gugus Depan 01" required />
          </div>
          <div>
            <label className={labelClass}>Tim</label>
            <select
              value={form.teamId}
              onChange={e => setForm({ ...form, teamId: e.target.value })}
              className={inputClass}
              required
            >
              <option value="">-- Pilih Tim --</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            {teams.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Belum ada Tim — buat Tim dulu sebelum menambah Grup.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
            <button type="submit" className="px-4 py-2 bg-[#17203A] text-white rounded-lg text-sm font-semibold hover:bg-[#232f52]">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}