export default function Table({ headers, data, renderRow, emptyMessage = 'Tidak ada data' }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/60">
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-6 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-[0.1em]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
}