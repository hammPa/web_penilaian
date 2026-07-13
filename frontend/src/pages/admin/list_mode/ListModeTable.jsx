import { Link } from 'react-router-dom';
import { Pencil, Trash, ArrowRight } from 'lucide-react';
import Table from '../../../components/Table';

export default function ListModeTable({ 
  tables, 
  criteriaCounts, 
  onEditTable, 
  onDeleteTable 
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <Table
        headers={['Nama Tabel', 'Deskripsi', 'Jumlah Kriteria', 'Aksi']}
        data={tables}
        renderRow={(item) => (
          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
            <td className="px-6 py-4">
              <Link 
                to={`/admin/tables/${item.id}`} 
                className="font-medium text-[#17203A] hover:text-[#C8933E] transition-colors"
              >
                {item.name}
              </Link>
            </td>
            <td className="px-6 py-4 text-slate-500">{item.description || '-'}</td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#C8933E]/10 text-[#8a6224]">
                {criteriaCounts[item.id] || 0} kriteria
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex gap-4 text-sm font-medium items-center">
                <Link
                  to={`/admin/tables/${item.id}`}
                  className="text-[#17203A] hover:text-[#C8933E] transition-colors inline-flex items-center gap-1"
                >
                  Kelola <ArrowRight size={14} />
                </Link>
                <button 
                  onClick={(e) => onEditTable(item, e)} 
                  className="text-[#17203A] cursor-pointer hover:text-[#C8933E] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => onDeleteTable(item.id, e)} 
                  className="text-[#C1443A] cursor-pointer hover:text-[#a3372f] transition-colors"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}