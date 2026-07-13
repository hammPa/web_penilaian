import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { Link } from 'react-router-dom';
import CriteriaSpreadsheet from "./CriteriaSpreadsheet";
import { Pencil, Trash, ArrowRight, Plus, Check, X } from 'lucide-react';

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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

      <div className="p-4 space-y-6">
        {criteriaList.length === 0 && !addingRow && (
          <p className="text-sm text-slate-400 px-2">Belum ada kriteria pada tabel ini</p>
        )}

        {criteriaList.map((criteria) => (
          <CriteriaSpreadsheet
            key={criteria.id}
            tableId={table.id}
            tableName={table.name}
            criteria={criteria}
            variables={variablesByCriteria[criteria.id] || []}
          />
        ))}

        {addingRow ? (
          <div className="flex items-center gap-2 rounded-lg border border-[#C8933E]/40 bg-[#C8933E]/5 p-3">
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
              aria-label="Simpan"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={cancelAddRow}
              className="text-slate-400 hover:text-[#17203A] transition-colors"
              aria-label="Batal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
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