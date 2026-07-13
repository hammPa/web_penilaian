import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

const LEVELS = [0, 1, 2, 3, 4, 5];

export default function CriteriaRow({ tableId, criteria, variables }) {
  const config = variables && variables.length > 0 ? variables[0] : null;

  return (
    // LANGSUNG TR, JANGAN ADA TABLE/THEAD/TBODY LAGI
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
      
      {/* RENDER DESKRIPSI UNTUK SETIAP LEVEL */}
      {LEVELS.map((lvl) => (
        <td key={lvl} className="border border-slate-300 px-3 py-3 text-center text-slate-600 align-top text-[11px]">
          {config?.variables?.[lvl]?.description || '-'}
        </td>
      ))}
    </tr>
  );
}