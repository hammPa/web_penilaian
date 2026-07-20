import Card from '../Card';
import {
  BarChart as ReBarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Warna bar berdasarkan rentang skor (sesuai legenda)
const SCORE_RANGES = [
  { min: 80, max: 100, color: '#0F9D6D' }, // hijau
  { min: 60, max: 80, color: '#2563EB' },  // biru
  { min: 40, max: 60, color: '#FACC15' },  // kuning
  { min: 20, max: 40, color: '#DC2626' },  // merah
  { min: 0, max: 20, color: '#111827' },   // hitam
];

function getColorForScore(score) {
  const range = SCORE_RANGES.find((r) =>
    score === 100 ? r.min === 80 : score >= r.min && score < r.max
  );
  return range ? range.color : '#94A3B8';
}

const ROW_HEIGHT = 32; // tinggi per baris agar nama & bar tidak berdempetan
const MIN_CHART_HEIGHT = 320;

export default function TopSkorChart({ barData }) {
  const chartHeight = Math.max(MIN_CHART_HEIGHT, (barData?.length || 0) * ROW_HEIGHT);

  return (
    <Card className="p-4 md:p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-4">
        Rata-rata Nilai Semua Grup
      </p>
      <div className="h-80 w-full overflow-y-auto overflow-x-hidden">
        {barData && barData.length > 0 ? (
          <div style={{ height: chartHeight }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart
                layout="vertical"
                data={barData}
                margin={{ top: 5, right: 40, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#17203A', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  interval={0}
                />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="Skor" radius={[0, 4, 4, 0]} barSize={16}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorForScore(entry.Skor)} />
                  ))}
                  <LabelList
                    dataKey="Skor"
                    position="right"
                    style={{ fontSize: 11, fill: '#17203A', fontWeight: 600 }}
                  />
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-slate-400">Belum ada skor yang masuk pada sesi ini</p>
          </div>
        )}
      </div>

      {/* Legenda rentang skor */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5">
        {SCORE_RANGES.map((r) => (
          <div key={r.min} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: r.color }} />
            <span className="text-[10px] text-slate-500">
              {r.min} - {r.max}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}