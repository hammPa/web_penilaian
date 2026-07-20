import Card from '../Card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sudah Dinilai (hijau), Belum Dinilai (merah)
const COLORS = ['#0F9D6D', '#C1443A'];

export default function StatusPengisianGrupChart({
  pieData,
  sudahList,
  belumList,
  totalGroups,
}) {
  const hasData = pieData?.some((d) => d.value > 0);

  return (
    <Card className="p-4 md:p-6 flex flex-col justify-start">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-4">
        Status Pengisian Grup
      </p>

      <div className="h-64 w-full flex items-center justify-center relative">
        {hasData ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Grup`, 'Jumlah']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>

            {/* Overlay Persentase: Pas di tengah lingkaran */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-[10%]">
              <p className="font-serif text-3xl font-bold text-[#17203A] leading-none">
                {totalGroups > 0
                  ? Math.round((sudahList.length / totalGroups) * 100)
                  : 0}
                %
              </p>
            </div>

            {/* Overlay Teks Pecahan: Di luar lingkaran, di atas legend */}
            <div className="absolute inset-x-0 bottom-[40px] flex items-center justify-center pointer-events-none">
              <p className="text-xs font-medium text-slate-500">
                {sudahList.length} / {totalGroups} Selesai
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400">Tidak ada aktivitas pada sesi ini</p>
        )}
      </div>

      {/* Daftar nama grup: 2 kolom - Belum Dinilai, Sudah Dinilai */}
      <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
        {/* Kolom Belum Dinilai */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C1443A] mb-1.5">
            Belum Dinilai ({belumList?.length || 0})
          </p>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
            {belumList?.length > 0 ? (
              belumList.map((item, i) => (
                <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                  <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#C1443A]/60 shrink-0" />
                  <span className="break-words">
                    {item.name}{' '}
                    <span className="text-slate-400">({item.teamName})</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-300">-</p>
            )}
          </div>
        </div>

        {/* Kolom Sudah Dinilai */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0F9D6D] mb-1.5">
            Sudah Dinilai ({sudahList?.length || 0})
          </p>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
            {sudahList?.length > 0 ? (
              sudahList.map((item, i) => (
                <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                  <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#0F9D6D]/60 shrink-0" />
                  <span className="break-words">
                    {item.name}{' '}
                    <span className="text-slate-400">({item.assessedCount} juri · {item.teamName})</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-300">-</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}