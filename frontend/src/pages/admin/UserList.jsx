import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';
import userService from '../../services/userService';
import teamService from '../../services/teamService';
import { Users, Edit2, Trash2, KeyRound, Shuffle, Copy } from 'lucide-react';

const generateRandomPassword = (length = 12) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { showToast } = useToast();

  // State terpisah untuk modal Reset Password
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

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
    setForm({ name: '', username: '', password: '', role: 'user', teamId: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    // Password sengaja TIDAK dimuat/diedit dari sini lagi -- ganti password
    // sekarang lewat tombol "Reset Password" khusus (lebih jelas alurnya,
    // dan tercatat sebagai aksi admin di backend).
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
      const payload = { ...form };
      if (editItem) delete payload.password; // reset password lewat modal terpisah

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

  const openResetPassword = (user) => {
    setResetTarget(user);
    setNewPassword('');
    setResetModalOpen(true);
  };

  const handleGeneratePassword = () => {
    setNewPassword(generateRandomPassword());
  };

  const handleCopyPassword = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      showToast('Password disalin ke clipboard', 'success');
    } catch {
      showToast('Gagal menyalin, salin manual', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }
    setResetting(true);
    try {
      await userService.resetPassword(resetTarget.id, newPassword);
      showToast(`Password ${resetTarget.name} berhasil direset`, 'success');
      setResetModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal reset password', 'error');
    } finally {
      setResetting(false);
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
                    <button onClick={() => openResetPassword(user)} className="p-2 text-slate-400 hover:text-[#0F9D6D] hover:bg-[#0F9D6D]/10 rounded-lg transition-colors" title="Reset Password">
                      <KeyRound size={16} />
                    </button>
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
                      <button onClick={() => openResetPassword(user)} className="p-2 text-slate-400 hover:text-[#0F9D6D] hover:bg-[#0F9D6D]/10 rounded-lg transition-colors" title="Reset Password">
                        <KeyRound size={16} />
                      </button>
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

      {/* Modal Tambah/Edit Pengguna (TANPA password lagi) */}
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
          {!editItem && (
            <div>
              <label className={labelClass}>Password Awal</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
          )}
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
          {editItem && (
            <p className="text-xs text-slate-500">
              Untuk mengganti password, gunakan tombol <KeyRound size={12} className="inline align-text-bottom" /> Reset Password di daftar pengguna.
            </p>
          )}
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

      {/* Modal Reset Password */}
      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title={`Reset Password — ${resetTarget?.name || ''}`}>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-slate-500">
            Password baru akan langsung aktif. Pastikan disampaikan ke <span className="font-medium text-slate-700">{resetTarget?.name}</span> lewat jalur yang aman.
          </p>
          <div>
            <label className={labelClass}>Password Baru</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="Minimal 6 karakter"
                required
              />
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="shrink-0 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                title="Generate password acak"
              >
                <Shuffle size={16} />
              </button>
              {newPassword && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="shrink-0 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Salin password"
                >
                  <Copy size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setResetModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={resetting}
              className="px-4 py-2 bg-[#17203A] hover:bg-[#232f52] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {resetting ? 'Menyimpan...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}