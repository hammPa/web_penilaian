import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import userService from '../../services/userService';
import teamService from '../../services/teamService';
import { Users, Edit2, Trash2 } from 'lucide-react';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'user', teamId: '' });

  const fetchData = async () => {
    try {
      const [usersData, teamsData] = await Promise.all([
        userService.getAll(),
        teamService.getAll()
      ]);
      setUsers(usersData);
      setTeams(teamsData);
    } catch (err) {
      console.error("Detail Error Fetch:", err.response || err.message || err);
      showToast('Gagal memuat data pengguna', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    // teamId ikut di-reset -- sebelumnya field ini hilang dari form baru,
    // jadi pengguna baru selalu ke-create tanpa tim walau dropdown-nya dipilih
    setForm({ name: '', username: '', password: '', role: 'user', teamId: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    // Kosongkan password saat edit. Hanya diisi jika ingin diubah.
    // teamId ikut di-load dari data existing -- sebelumnya selalu kosong,
    // jadi tim yang sudah di-assign sebelumnya tidak kelihatan saat edit
    setForm({ name: item.name, username: item.username, password: '', role: item.role, teamId: item.teamId || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username) {
      showToast('Nama dan Username wajib diisi', 'error');
      return;
    }
    if (!editItem && !form.password) {
      showToast('Password wajib diisi untuk pengguna baru', 'error');
      return;
    }

    try {
      // Hapus password dari payload jika kosong (saat update)
      const payload = { ...form };
      if (editItem && !payload.password) delete payload.password;

      if (editItem) {
        await userService.update(editItem.id, payload);
        showToast('Pengguna berhasil diperbarui', 'success');
      } else {
        await userService.create(payload);
        showToast('Pengguna berhasil ditambahkan', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengguna ini?')) return;
    try {
      await userService.remove(id);
      showToast('Pengguna dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus', 'error');
    }
  };

  if (loading) return <Loading />;

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Manajemen Akun</p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#17203A]">
            Daftar Pengguna
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-[#17203A] cursor-pointer hover:bg-[#232f52] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          + Tambah Pengguna
        </button>
      </div>

      {users.length === 0 ? (
        <EmptyState message="Belum ada data pengguna" icon={<Users />} />
      ) : (
        <>
          {/* MOBILE — daftar card, satu kolom */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-800 text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">@{user.username}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(user)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-[#C8933E]/10 text-[#C8933E]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">
                    {teams.find(t => t.id === user.teamId)?.name || 'Tanpa tim'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP — tabel seperti semula */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Peran (Role)</th>
                  <th className="px-6 py-4">Tim</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">@{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-[#C8933E]/10 text-[#C8933E]' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {teams.find(t => t.id === user.teamId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEdit(user)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Pengguna' : 'Tambah Pengguna'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nama Lengkap</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Misal: Budi Santoso"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className={inputClass}
              placeholder="Misal: budi_s"
              required
            />
          </div>
          <div>
            <label className={labelClass}>
              Password {editItem && <span className="text-slate-400 font-normal text-xs">(Kosongkan jika tidak ingin diubah)</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="Masukkan password"
              required={!editItem}
            />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className={inputClass}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tim Asal</label>
            <select
              value={form.teamId}
              onChange={e => setForm({ ...form, teamId: e.target.value })}
              className={inputClass}
            >
              <option value="">-- Pilih Tim --</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-[#17203A] hover:bg-[#232f52] text-white rounded-lg text-sm font-semibold transition-colors">
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}