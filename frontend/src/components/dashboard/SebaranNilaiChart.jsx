import Card from '../Card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Warna selaras dengan legenda
const RANGE_COLORS = {
  '80 - 100': '#0F9D6D', // hijau
  '60 - 80': '#2563EB',  // biru
  '40 - 60': '#FACC15',  // kuning
  '20 - 40': '#DC2626',  // merah
  '0 - 20': '#111827',   // hitam
};

function renderPercentLabel({ percent }) {
  if (!percent) return null;
  const pct = Math.round(percent * 100);
  if (pct === 0) return null;
  return `${pct}%`;
}

export default function SebaranNilaiChart({ pieData }) {
  // Filter data yang ada isinya saja (value > 0)
  const activeData = pieData?.filter((d) => d.value > 0) || [];
  const hasData = activeData.length > 0;

  return (
    <Card className="p-4 md:p-6 flex flex-col h-full overflow-hidden max-h-[800px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-4 shrink-0">
        Sebaran Nilai
      </p>

      {/* --- BAGIAN GRAFIK PIE --- */}
      <div className="h-56 sm:h-64 w-full flex items-center justify-center relative shrink-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={0}
                outerRadius={85}
                dataKey="value"
                label={renderPercentLabel}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RANGE_COLORS[entry.name] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} Grup`, 'Jumlah']} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center">
            <p className="text-xs text-slate-400">Tidak ada aktivitas pada sesi ini</p>
          </div>
        )}
      </div>

      {/* --- DAFTAR GRUP (SCROLL KE BAWAH) --- */}
      {hasData && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex-1 min-h-0 flex flex-col">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3 shrink-0">
            Daftar Grup per Rentang Nilai
          </p>
          
          {/* Container Scroll Vertikal */}
          <div className="overflow-y-auto pr-1 space-y-3 flex-1 custom-scrollbar">
            {activeData.map((range, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col"
              >
                {/* Header Kartu (Judul Rentang) */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: RANGE_COLORS[range.name] || '#94A3B8' }}
                    ></span>
                    <span className="font-bold text-sm text-[#17203A]">{range.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                    {range.value} Grup
                  </span>
                </div>

                {/* List Nama Grup (Bentuk Chip/Tag menyamping) */}
                <div className="flex flex-wrap gap-1.5">
                  {range.groups && range.groups.length > 0 ? (
                    range.groups.map((groupName, i) => (
                      <span 
                        key={i} 
                        className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm"
                      >
                        {groupName}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Nama grup tidak tersedia di data
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}