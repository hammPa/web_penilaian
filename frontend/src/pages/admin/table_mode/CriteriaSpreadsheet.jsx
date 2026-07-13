import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const LEVELS = [0, 1, 2, 3, 4, 5];

export default function CriteriaSpreadsheet({ tableId, tableName, criteria, variables }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="border border-slate-300 bg-[#F7D9B8] px-3 py-2 text-left font-bold text-[#17203A] w-56 align-middle"
            >
              KRITERIA&nbsp;{tableName?.toUpperCase()}
            </th>
            <th
              colSpan={LEVELS.length}
              className="border border-slate-300 bg-[#F7D9B8] px-3 py-1.5 text-center font-bold text-[#17203A]"
            >
              NILAI {tableName?.toUpperCase()}
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
        <tbody>
          {variables.length === 0 ? (
            <tr>
              <td className="border border-slate-300 px-3 py-3 font-medium text-slate-700">-</td>
              <td colSpan={LEVELS.length} className="border border-slate-300 px-3 py-3 text-center text-slate-400">
                Belum ada variabel
              </td>
            </tr>
          ) : (
            variables.map((v) => (
              <tr key={v.id}>
                <td className="border border-slate-300 px-3 py-3 font-medium text-[#17203A] align-top">
                  <Link
                    to={`/admin/tables/${tableId}/criteria/${criteria.id}`}
                    className="hover:text-[#C8933E] transition-colors"
                  >
                    {criteria.name}
                  </Link>
                </td>
                {LEVELS.map((lvl) => (
                  <td key={lvl} className="border border-slate-300 px-3 py-3 text-center text-slate-600 align-top">
                    {v.levels?.[lvl]?.description || '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
          <tr>
            <td colSpan={LEVELS.length + 1} className="border border-slate-300 px-3 py-2 bg-slate-50/60">
              <Link
                to={`/admin/tables/${tableId}/criteria/${criteria.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C8933E] hover:text-[#a97a30] transition-colors"
              >
                <Plus size={14} /> Tambah Variabel
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}