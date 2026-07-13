import { useState } from 'react';
import { useToast } from '../../../hooks/useToast';
import { Link } from 'react-router-dom';
import CriteriaRow from "./CriteriaRow"; // Pastikan import mengarah ke file yang baru
import criteriaService from '../../../services/criteriaService';
import { Pencil, Trash, ArrowRight, Plus, Check, X } from 'lucide-react';

const LEVELS = [0, 1, 2, 3, 4, 5];

export default function GridModeTable({ table, criteriaList, variablesByCriteria, onCriteriaChanged, onEditTable, onDeleteTable }) {
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const startAddRow = () => {
    setNewRow({ name: '', description: '' });
    setAddingRow(true);
  };

  const cancelAddRow = () => setAddingRow(false);

  const saveRow = async () => {
    if (!newRow.name.trim()) {
      showToast('Nama kriteria wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      await criteriaService.create({ ...newRow, tableId: table.id });
      showToast('Kriteria ditambahkan', 'success');
      setAddingRow(false);
      onCriteriaChanged();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menambah kriteria', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-[#17203A]">{table.name}</h2>
          {table.description && (
            <p className="text-xs text-slate-500 mt-0.5">{table.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/admin/tables/${table.id}`}
            className="text-xs font-medium text-slate-500 hover:text-[#17203A] transition-colors inline-flex items-center gap-1"
          >
            Kelola detail <ArrowRight size={12} />
          </Link>
          <button
            onClick={() => onEditTable(table)}
            className="text-[#17203A] hover:text-[#C8933E] transition-colors"
            aria-label="Edit nama tabel"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteTable(table.id)}
            className="text-[#C1443A] hover:text-[#a3372f] transition-colors"
            aria-label="Hapus tabel"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              {/* INI HEADER UTAMA YANG DIPAKAI */}
              <tr>
                <th
                  rowSpan={2}
                  className="border border-slate-300 bg-[#F7D9B8] px-3 py-2 text-left font-bold text-[#17203A] w-56 align-middle"
                >
                  KRITERIA {table.name?.toUpperCase()}
                </th>
                <th
                  colSpan={LEVELS.length}
                  className="border border-slate-300 bg-[#F7D9B8] px-3 py-1.5 text-center font-bold text-[#17203A]"
                >
                  NILAI {table.name?.toUpperCase()}
                </th>
              </tr>
              <tr>
                {LEVELS.map((lvl) => (
                  <th
                    key={lvl}
                    className="border border-slate-300 bg-slate-100 px-3 py-1.5 text-center font-semibold text-slate-600 w-32"
                  >
                    {lvl}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* DATA BARIS DIMASUKKAN KE SINI */}
            <tbody>
              {criteriaList.length === 0 && !addingRow ? (
                <tr>
                  <td colSpan={LEVELS.length + 1} className="border border-slate-300 px-3 py-6 text-center text-sm text-slate-400">
                    Belum ada kriteria pada tabel ini
                  </td>
                </tr>
              ) : (
                criteriaList.map((criteria) => (
                  <CriteriaRow
                    key={criteria.id}
                    tableId={table.id}
                    criteria={criteria}
                    variables={variablesByCriteria[criteria.id] || []}
                  />
                ))
              )}

              {/* FORM TAMBAH KRITERIA */}
              {addingRow && (
                <tr>
                  <td colSpan={LEVELS.length + 1} className="border border-slate-300 p-2 bg-[#C8933E]/5">
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={newRow.name}
                        onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                        placeholder="Nama kriteria baru"
                        className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRow();
                          if (e.key === 'Escape') cancelAddRow();
                        }}
                      />
                      <input
                        type="text"
                        value={newRow.description}
                        onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                        placeholder="Deskripsi (opsional)"
                        className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[#C8933E]/40 focus:border-[#C8933E] outline-none transition"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRow();
                          if (e.key === 'Escape') cancelAddRow();
                        }}
                      />
                      <button
                        onClick={saveRow}
                        disabled={saving}
                        className="text-[#0F9D6D] hover:text-[#0c7d58] transition-colors disabled:opacity-50"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={cancelAddRow}
                        className="text-slate-400 hover:text-[#17203A] transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!addingRow && (
          <button
            onClick={startAddRow}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C8933E] hover:text-[#a97a30] transition-colors"
          >
            <Plus size={16} /> Tambah Kriteria
          </button>
        )}
      </div>
    </div>
  );
}