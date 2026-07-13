import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import variableService from '../../../services/variableService';
import { getKriteriaNilai } from './scoreUtils';

const LEVELS = [0, 1, 2, 3, 4, 5];

export default function CriteriaRow({ tableId, criteria, variables, onVariableChanged, totalCell }) {
  const config = variables && variables.length > 0 ? variables[0] : null;
  const nilai = getKriteriaNilai(config);
  const [editingLevel, setEditingLevel] = useState(null); // index level yang sedang diedit
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  // true saat blur terjadi sebagai efek samping dari paste (textarea di-unmount
  // otomatis begitu saveLevels() dari handlePaste selesai) -> jangan trigger save lagi
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
    // updates: { levelIndex: description }
    setSaving(true);
    try {
      if (config) {
        const newLevels = config.variables.map((v, idx) =>
          updates[idx] !== undefined ? { description: updates[idx] } : v
        );
        await variableService.update(config.id, { variables: newLevels });
      } else {
        const defaultLevels = LEVELS.map((idx) => ({
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
  // Nilai disebar mulai dari level yang sedang diedit ke level-level berikutnya.
  const handlePaste = (e, lvl) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\t') && !text.includes('\n')) return; // paste satu nilai biasa, biarkan default
    e.preventDefault();
    const firstRow = text.split(/\r\n|\r|\n/)[0];
    const parts = firstRow.split('\t').map((p) => p.trim());
    const updates = {};
    parts.forEach((val, i) => {
      const targetLevel = lvl + i;
      if (targetLevel <= 5) updates[targetLevel] = val;
    });
    if (Object.keys(updates).length > 0) {
      suppressBlurRef.current = true; // blur yang terjadi setelah ini bukan permintaan save baru
      saveLevels(updates);
    }
  };

  return (
    <tr>
      <td className="border border-slate-300 px-3 py-3 align-top">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-[#17203A] uppercase text-xs">{criteria.name}</span>
          <Link
            to={`/admin/tables/${tableId}/criteria/${criteria.id}`}
            className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider text-[#C8933E] hover:text-[#a97a30] transition-colors"
          >
            <Wrench size={12} /> {config ? 'Edit Pengaturan' : 'Atur Pengaturan'}
          </Link>
        </div>
      </td>
      {/* RENDER DESKRIPSI UNTUK SETIAP LEVEL - klik untuk edit inline */}
      {LEVELS.map((lvl) => {
        const isEditing = editingLevel === lvl;
        const value = config?.variables?.[lvl]?.description || '';
        return (
          <td
            key={lvl}
            className={`border border-slate-300 px-3 py-3 text-center align-top text-[11px] ${
              isEditing ? 'bg-[#C8933E]/5' : 'text-slate-600 cursor-pointer hover:bg-slate-50'
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