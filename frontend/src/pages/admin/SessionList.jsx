import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/useToast';

import sessionService from '../../services/sessionService';
import tableService from '../../services/tableService';
import userService from '../../services/userService';
import teamService from '../../services/teamService';
import groupService from '../../services/groupService';
import assessmentService from '../../services/assessmentService';

import { 
  Layers, 
  Pencil, 
  Trash, 
  ArrowRight, 
  Copy, 
  FilePlus2, 
  ChevronDown, 
  ChevronUp,
  Loader2 // <-- Tambahkan icon loading spinner
} from 'lucide-react';

export default function SessionList() {
  const [sessions, setSessions] = useState([]);
  const [tableCounts, setTableCounts] = useState({});
  
  // State untuk master data progress
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assessments, setAssessments] = useState([]);
  
  // Penanda apakah master data progress sudah pernah di-fetch atau belum
  const [isMasterDataFetched, setIsMasterDataFetched] = useState(false);
  const [isFetchingProgress, setIsFetchingProgress] = useState(false); // State untuk efek loading saat tombol ditekan

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [mode, setMode] = useState('blank');
  const [sourceSessionId, setSourceSessionId] = useState('');
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '', description: '' });
  const [expandedId, setExpandedId] = useState(null);

  // FETCH AWAL: HANYA FETCH SESSIONS DAN TABLES
  const fetchData = async () => {
    try {
      const [sessionData, tableData] = await Promise.all([
        sessionService.getAll(),
        tableService.getAll()
      ]);

      setSessions(sessionData);
      
      const counts = {};
      tableData.forEach((t) => {
        counts[t.sessionId] = (counts[t.sessionId] || 0) + 1;
      });
      setTableCounts(counts);
    } catch (err) {
      showToast('Gagal memuat data sesi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setMode('blank');
    setSourceSessionId('');
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast('Nama sesi wajib diisi', 'error');
      return;
    }
    try {
      if (editItem) {
        await sessionService.update(editItem.id, form);
        showToast('Sesi berhasil diperbarui', 'success');
      } else if (mode === 'duplicate') {
        if (!sourceSessionId) {
          showToast('Pilih sesi sumber untuk diduplikat', 'error');
          return;
        }
        await sessionService.duplicate(sourceSessionId, form);
        showToast('Sesi berhasil diduplikat', 'success');
      } else {
        await sessionService.create(form);
        showToast('Sesi berhasil dibuat', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus sesi ini? Semua Tabel, Kriteria, dan Variabel di dalamnya ikut terhapus permanen.')) return;
    try {
      await sessionService.remove(id);
      showToast('Sesi dihapus', 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus', 'error');
    }
  };

  // LOGIKA BARU: Fetch saat expand (Lazy Loading)
  const toggleExpand = async (id) => {
    // Jika tombol di-klik untuk menutup, cukup set null dan selesai
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    // Buka accordion-nya
    setExpandedId(id);

    // Jika data sudah pernah diambil, tidak usah hit API lagi (gunakan cache state)
    if (isMasterDataFetched) return;

    // Jika belum pernah, ambil datanya SEKARANG
    setIsFetchingProgress(true);
    try {
      const [userData, teamData, groupData, assessmentData] = await Promise.all([
        userService.getAll(),
        teamService.getAll(),
        groupService.getAll(),
        assessmentService.getAll()
      ]);

      setUsers(userData);
      setTeams(teamData);
      setGroups(groupData);
      setAssessments(assessmentData);
      setIsMasterDataFetched(true); // Tandai bahwa data sudah cached
    } catch (err) {
      showToast('Gagal memuat detail progress', 'error');
      setExpandedId(null); // Tutup lagi jika gagal
    } finally {
      setIsFetchingProgress(false);
    }
  };

  if (loading) return <Loading />;

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  const renderProgressUI = (sessionId) => {
    // Tampilkan indikator loading ringan di dalam accordion saat proses fetch berlangsung
    if (isFetchingProgress) {
      return (
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-8 flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="animate-spin text-[#C8933E]" size={24} />
          <p className="text-sm">Memuat data target penilaian...</p>
        </div>
      );
    }

    const juris = users.filter(u => u.role !== 'admin' && u.teamId);

    const teamsWithProgress = teams.map((team) => {
      const teamJuris = juris.filter(j => j.teamId === team.id);
      const teamGroups = groups.filter(g => g.teamId === team.id);

      if (teamJuris.length === 0) return null;

      const jurisProgress = teamJuris.map((juri) => {
        const groupStatuses = teamGroups.map((group) => {
          const isAssessed = assessments.some(
            (a) => a.sessionId === sessionId && a.userId === juri.id && a.groupId === group.id
          );
          return { id: group.id, name: group.name, isAssessed };
        });

        return { id: juri.id, name: juri.name, groupStatuses };
      });

      return {
        id: team.id,
        name: team.name,
        juris: jurisProgress
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })); 

    if (teamsWithProgress.length === 0) {
      return (
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 text-center">
          Belum ada juri yang terdaftar pada tim mana pun.
        </div>
      );
    }

    return (
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-5 shadow-inner">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Target Penilaian per Tim</h4>
        <div className="space-y-5">
          {teamsWithProgress.map((team) => (
            <div key={team.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h5 className="font-bold text-[#17203A] border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#C8933E] rounded-full inline-block"></span>
                Tim: {team.name}
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {team.juris.map((juri) => (
                  <div key={juri.id} className="bg-slate-50/50 p-3.5 rounded-lg border border-slate-100 hover:border-[#C8933E]/30 transition-colors">
                    <p className="text-sm font-bold text-slate-800 mb-3">{juri.name}</p>
                    
                    {juri.groupStatuses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Tidak ada grup di tim ini</p>
                    ) : (
                      <div className="space-y-2.5">
                        {juri.groupStatuses.map((g) => (
                          <label key={g.id} className="flex items-start gap-2.5 cursor-default group">
                            <input 
                              type="checkbox" 
                              checked={g.isAssessed} 
                              readOnly 
                              className="mt-0.5 w-4 h-4 text-[#C8933E] rounded border-slate-300 focus:ring-[#C8933E]"
                            />
                            <span className={`text-xs leading-tight transition-colors ${g.isAssessed ? 'text-slate-800 font-medium' : 'text-slate-500 group-hover:text-slate-700'}`}>
                              {g.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ... (Sisa komponen return render Tabel dan form sama persis seperti sebelumnya)
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Master Data</p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#17203A]">
            Sesi Assessment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tiap sesi punya Tabel Penilaian, Kriteria, dan Variabel sendiri.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#17203A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#232f52] transition-colors shadow-sm shrink-0"
        >
          <FilePlus2 size={16} /> Buat Assessment Baru
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState message="Belum ada sesi assessment" icon={<Layers />} />
      ) : (
        <>
          {/* MOBILE */}
          <div className="md:hidden space-y-3">
            {sessions.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/admin/sessions/${item.id}/tables`}
                        className="font-medium text-[#17203A] text-sm hover:text-[#C8933E] transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.description || '-'}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => toggleExpand(item.id)} 
                        disabled={isFetchingProgress && expandedId === item.id}
                        className={`p-2 rounded-lg transition-colors ${expandedId === item.id ? 'bg-[#C8933E]/10 text-[#C8933E]' : 'text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10'} disabled:opacity-50`}
                      >
                        {isFetchingProgress && expandedId === item.id ? <Loader2 size={16} className="animate-spin" /> : (expandedId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                      </button>
                      <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-[#C8933E] hover:bg-[#C8933E]/10 rounded-lg">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#C8933E]/10 text-[#8a6224]">
                      {tableCounts[item.id] || 0} tabel
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>
                
                {/* Expanded Content Mobile */}
                {expandedId === item.id && renderProgressUI(item.id)}
              </div>
            ))}
          </div>

          {/* DESKTOP */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <Table
              headers={['Nama Sesi', 'Deskripsi', 'Jumlah Tabel', 'Dibuat', 'Aksi']}
              data={sessions}
              renderRow={(item) => (
                <React.Fragment key={item.id}>
                  <tr className={`transition-colors border-b border-slate-100 ${expandedId === item.id ? 'bg-slate-50' : 'hover:bg-slate-50/70'}`}>
                    <td className="px-6 py-4">
                      <Link to={`/admin/sessions/${item.id}/tables`} className="font-medium text-[#17203A] hover:text-[#C8933E] transition-colors">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#C8933E]/10 text-[#8a6224]">
                        {tableCounts[item.id] || 0} tabel
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 text-sm font-medium items-center">
                        <button 
                          onClick={() => toggleExpand(item.id)} 
                          disabled={isFetchingProgress && expandedId === item.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                            expandedId === item.id 
                            ? 'border-[#C8933E] bg-[#C8933E]/10 text-[#8a6224]' 
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Progress 
                          {isFetchingProgress && expandedId === item.id ? <Loader2 size={14} className="animate-spin" /> : (expandedId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </button>
                        <Link
                          to={`/admin/sessions/${item.id}/tables`}
                          className="text-[#17203A] hover:text-[#C8933E] transition-colors inline-flex items-center gap-1"
                        >
                          Kelola <ArrowRight size={14} />
                        </Link>
                        <button onClick={() => openEdit(item)} className="text-[#17203A] hover:text-[#C8933E] transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-[#C1443A] hover:text-[#a3372f] transition-colors">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Content Desktop */}
                  {expandedId === item.id && (
                    <tr>
                      <td colSpan="5" className="p-0 border-b-2 border-slate-200">
                        {renderProgressUI(item.id)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )}
            />
          </div>
        </>
      )}

      {/* Modal form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Sesi' : 'Buat Assessment Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editItem && (
            <div>
              <label className={labelClass}>Mulai dari</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('blank')}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    mode === 'blank' ? 'border-[#C8933E] bg-[#C8933E]/5 text-[#8a6224]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Kosong
                </button>
                <button
                  type="button"
                  onClick={() => setMode('duplicate')}
                  disabled={sessions.length === 0}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode === 'duplicate' ? 'border-[#C8933E] bg-[#C8933E]/5 text-[#8a6224]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Copy size={14} /> Duplikat
                </button>
              </div>
            </div>
          )}

          {!editItem && mode === 'duplicate' && (
            <div>
              <label className={labelClass}>Duplikat dari Sesi</label>
              <select
                value={sourceSessionId}
                onChange={(e) => setSourceSessionId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">-- Pilih Sesi Sumber --</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Semua Tabel, Kriteria, dan Variabel dari sesi ini akan disalin.
              </p>
            </div>
          )}

          <div>
            <label className={labelClass}>Nama Sesi</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Misal: Semester 1 2026"
              required
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              rows="2"
            />
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