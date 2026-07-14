import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Trash } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import variableService from '../../../services/variableService';
import { getKriteriaNilai } from './scoreUtils';

export default function CriteriaRow({ tableId, criteria, variables, onVariableChanged, onDeleteCriteria, totalCell, levelIndices }) {
  const config = variables && variables.length > 0 ? variables[0] : null;
  const nilai = getKriteriaNilai(config);
  const ownLevelCount = config?.variables?.length || 0;

  const [editingLevel, setEditingLevel] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  // true saat blur terjadi sebagai efek samping dari paste (textarea di-unmount
  // otomatis begitu saveLevels() selesai) -> jangan trigger save lagi
  const suppressBlurRef = useRef(false);

  const startEdit = (lvl) => {
    if (saving) return;
    suppressBlurRef.current = false;
    setEditingLevel(lvl);
    setDraft(config?.variables?.[lvl]?.description || '');
  };

  const cancelEdit = () => {
    setEditingLevel(null);
    setDraft('');
  };

  const saveLevels = async (updates) => {
    if (saving) return; // cegah request dobel yang tumpang tindih
    setSaving(true);
    try {
      if (config) {
        // Variabel sudah ada -> update deskripsi level yang diedit saja.
        // Kalau ada index di luar jangkauan array lama (mis. tabel melebar
        // karena kriteria lain), array-nya diperpanjang dulu.
        const maxIdx = Math.max(...Object.keys(updates).map(Number), config.variables.length - 1);
        const newLevels = Array.from({ length: maxIdx + 1 }, (_, idx) => {
          if (updates[idx] !== undefined) return { description: updates[idx] };
          return config.variables[idx] || { description: '' };
        });
        await variableService.update(config.id, { variables: newLevels });
      } else {
        // Belum ada variabel untuk kriteria ini -> buat baru, ukuran mengikuti
        // jumlah kolom yang sedang tampil di tabel (levelIndices), supaya
        // pas dibuat langsung sejajar dengan kriteria lain di tabel yang sama.
        const size = Math.max(levelIndices?.length || 0, ...Object.keys(updates).map(Number).map(n => n + 1));
        const defaultLevels = Array.from({ length: size }, (_, idx) => ({
          description: updates[idx] !== undefined ? updates[idx] : ''
        }));
        await variableService.create({
          name: criteria.name,
          criteriaId: criteria.id,
          weight: 1,
          formula: 'bobot * skor',
          variables: defaultLevels
        });
      }
      showToast('Deskripsi level disimpan', 'success');
      setEditingLevel(null);
      setDraft('');
      onVariableChanged?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = (lvl) => saveLevels({ [lvl]: draft });

  // Paste beberapa kolom sekaligus (mis. dari Excel/Sheets, dipisah Tab).
  const handlePaste = (e, lvl) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\t') && !text.includes('\n')) return;
    e.preventDefault();
    const firstRow = text.split(/\r\n|\r|\n/)[0];
    const parts = firstRow.split('\t').map((p) => p.trim());
    const updates = {};
    parts.forEach((val, i) => {
      updates[lvl + i] = val;
    });
    if (Object.keys(updates).length > 0) {
      suppressBlurRef.current = true;
      saveLevels(updates);
    }
  };

  const handleDeleteCriteria = () => {
    if (!window.confirm(`Hapus kriteria "${criteria.name}"? Variabel di dalamnya ikut terhapus.`)) return;
    onDeleteCriteria?.(criteria.id);
  };

  return (
    <tr>
      <td className="border border-slate-300 px-3 py-3 align-top">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[#17203A] uppercase text-xs">{criteria.name}</span>
            <Link
              to={`/admin/tables/${tableId}/criteria/${criteria.id}`}
              className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider text-[#C8933E] hover:text-[#a97a30] transition-colors"
            >
              <Wrench size={12} /> Pengaturan Lengkap
            </Link>
          </div>
          <button
            onClick={handleDeleteCriteria}
            className="text-slate-300 hover:text-[#C1443A] transition-colors shrink-0"
            aria-label="Hapus kriteria"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      {levelIndices.map((lvl) => {
        // Kalau variabel ini punya level lebih sedikit dari kolom maksimal
        // tabel (kriteria lain lebih panjang), sel ekstra tetap bisa diklik
        // untuk diisi -- begitu disimpan, array levels-nya otomatis
        // diperpanjang (lihat saveLevels).
        const isEditing = editingLevel === lvl;
        const value = config?.variables?.[lvl]?.description || '';
        const beyondOwnLength = lvl >= ownLevelCount;
        return (
          <td
            key={lvl}
            className={`border border-slate-300 px-3 py-3 text-center align-top text-[11px] ${
              isEditing
                ? 'bg-[#C8933E]/5'
                : beyondOwnLength
                ? 'text-slate-300 cursor-pointer hover:bg-slate-50'
                : 'text-slate-600 cursor-pointer hover:bg-slate-50'
            }`}
            onClick={() => !isEditing && startEdit(lvl)}
          >
            {isEditing ? (
              <textarea
                autoFocus
                value={draft}
                disabled={saving}
                onChange={(e) => setDraft(e.target.value)}
                onPaste={(e) => handlePaste(e, lvl)}
                onBlur={() => {
                  if (suppressBlurRef.current) {
                    suppressBlurRef.current = false;
                    return;
                  }
                  saveEdit(lvl);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit(lvl);
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                  }
                }}
                className="w-full min-h-[60px] text-[11px] text-slate-700 border border-[#C8933E] rounded px-1.5 py-1 outline-none resize-none"
              />
            ) : (
              value || <span className="text-slate-300">-</span>
            )}
          </td>
        );
      })}
      <td className="border border-slate-300 px-3 py-3 text-center align-top font-semibold text-[#17203A] text-xs">
        {nilai}
      </td>
      {totalCell && (
        <td
          rowSpan={totalCell.rowSpan}
          className="border border-slate-300 px-3 py-3 text-center align-middle bg-[#17203A] text-white font-serif font-semibold text-sm"
        >
          {totalCell.value}
        </td>
      )}
    </tr>
  );
}