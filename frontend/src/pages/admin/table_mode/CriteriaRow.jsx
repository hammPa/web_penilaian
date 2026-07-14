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
  
  const bobot = config?.weight ?? 1;

  // --- STATE UNTUK LEVEL (Sudah ada) ---
  const [editingLevel, setEditingLevel] = useState(null);
  const [draft, setDraft] = useState('');
  
  // --- STATE BARU UNTUK BOBOT ---
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [draftWeight, setDraftWeight] = useState('');

  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  
  const suppressBlurRef = useRef(false);

  // --- FUNGSI UNTUK EDIT LEVEL (Sudah ada) ---
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
    if (saving) return; 
    setSaving(true);
    try {
      if (config) {
        const maxIdx = Math.max(...Object.keys(updates).map(Number), config.variables.length - 1);
        const newLevels = Array.from({ length: maxIdx + 1 }, (_, idx) => {
          if (updates[idx] !== undefined) return { description: updates[idx] };
          return config.variables[idx] || { description: '' };
        });
        await variableService.update(config.id, { variables: newLevels });
      } else {
        const size = Math.max(levelIndices?.length || 0, ...Object.keys(updates).map(Number).map(n => n + 1));
        const defaultLevels = Array.from({ length: size }, (_, idx) => ({
          description: updates[idx] !== undefined ? updates[idx] : ''
        }));
        await variableService.create({
          name: criteria.name,
          criteriaId: criteria.id,
          weight: bobot, // Tetap pertahankan bobot lama jika bikin baru
          formula: 'koefisien * skor',
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

  // --- FUNGSI BARU UNTUK EDIT BOBOT ---
  const startEditWeight = () => {
    if (saving) return;
    setIsEditingWeight(true);
    setDraftWeight(bobot);
  };

  const cancelEditWeight = () => {
    setIsEditingWeight(false);
    setDraftWeight('');
  };

  const saveWeight = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const parsedWeight = parseFloat(draftWeight);
      const finalWeight = isNaN(parsedWeight) ? 1 : parsedWeight;

      if (config) {
        await variableService.update(config.id, { weight: finalWeight });
      } else {
        const size = levelIndices?.length || 0;
        const defaultLevels = Array.from({ length: size }, () => ({ description: '' }));
        await variableService.create({
          name: criteria.name,
          criteriaId: criteria.id,
          weight: finalWeight,
          formula: 'koefisien * skor',
          variables: defaultLevels
        });
      }
      showToast('Bobot berhasil disimpan', 'success');
      setIsEditingWeight(false);
      onVariableChanged?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan bobot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCriteria = () => {
    if (!window.confirm(`Hapus kriteria "${criteria.name}"? Variabel di dalamnya ikut terhapus.`)) return;
    onDeleteCriteria?.(criteria.id);
  };

  return (
    <tr>
      {/* Kolom 1: Nama Kriteria & Aksi */}
      <td className="border border-slate-300 px-3 py-3 align-top bg-white">
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

      {/* Kolom 2: Loop Level Deskripsi */}
      {levelIndices.map((lvl) => {
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

      {/* Kolom 3: Bobot / Koefisien (Sekarang Bisa Diklik) */}
      <td 
        className={`border border-slate-300 px-3 py-3 text-center align-top text-xs transition-colors ${
          isEditingWeight ? 'bg-[#C8933E]/5' : 'bg-[#C8933E]/10 cursor-pointer hover:bg-[#C8933E]/20'
        }`}
        onClick={() => !isEditingWeight && startEditWeight()}
      >
        {isEditingWeight ? (
          <input
            type="number"
            step="0.01"
            autoFocus
            value={draftWeight}
            disabled={saving}
            onChange={(e) => setDraftWeight(e.target.value)}
            onBlur={saveWeight}
            onPaste={(e) => e.stopPropagation()} // Memastikan paste disini tidak mengganggu ke sebelahnya
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveWeight();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelEditWeight();
              }
            }}
            className="w-16 text-center text-[11px] font-semibold text-slate-700 border border-[#C8933E] rounded py-1 outline-none appearance-none"
          />
        ) : (
          <span className="font-semibold text-[#8a6224]" title="Klik untuk edit">{bobot}</span>
        )}
      </td>

      {/* Kolom 4: Nilai Akhir baris ini */}
      <td className="border border-slate-300 px-3 py-3 text-center align-top font-bold text-[#17203A] text-xs bg-slate-50">
        {nilai}
      </td>

      {/* Kolom 5: Total (Rowspan) */}
      {totalCell && (
        <td
          rowSpan={totalCell.rowSpan}
          className="border border-slate-300 px-3 py-3 text-center align-middle bg-[#17203A] text-white font-serif font-bold text-base"
        >
          {totalCell.value}
        </td>
      )}
    </tr>
  );
}