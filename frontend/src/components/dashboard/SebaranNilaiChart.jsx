import Card from '../Card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Warna selaras dengan legenda & bar chart nilai tertinggi
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
  const hasData = pieData?.some((d) => d.value > 0);

  return (
    <Card className="p-4 md:p-6 flex flex-col justify-start">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-4">
        Sebaran Nilai
      </p>

      <div className="h-64 w-full flex items-center justify-center relative">
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
          <p className="text-xs text-slate-400">Tidak ada aktivitas pada sesi ini</p>
        )}
      </div>
    </Card>
  );
}