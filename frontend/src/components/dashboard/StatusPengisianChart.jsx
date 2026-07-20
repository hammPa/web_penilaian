import Card from '../Card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sudah Lengkap (hijau), Belum Lengkap (kuning/amber), Belum Isi Sama Sekali (merah)
const COLORS = ['#0F9D6D', '#C8933E', '#C1443A'];

export default function StatusPengisianChart({
  pieData,
  lengkapList,
  belumLengkapList,
  belumIsiList,
  totalParticipants,
}) {
  const hasData = pieData?.some((d) => d.value > 0);

  return (
    <Card className="p-4 md:p-6 flex flex-col justify-start">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-4">
        Status Pengisian Peserta
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
                <Tooltip formatter={(value) => [`${value} User`, 'Jumlah']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>

            {/* Overlay Persentase: Pas di tengah lingkaran */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-[10%]">
              <p className="font-serif text-3xl font-bold text-[#17203A] leading-none">
                {totalParticipants > 0
                  ? Math.round((lengkapList.length / totalParticipants) * 100)
                  : 0}
                %
              </p>
            </div>

            {/* Overlay Teks Pecahan: Di luar lingkaran, di atas legend */}
            <div className="absolute inset-x-0 bottom-[40px] flex items-center justify-center pointer-events-none">
              <p className="text-xs font-medium text-slate-500">
                {lengkapList.length} / {totalParticipants} Selesai
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400">Tidak ada aktivitas pada sesi ini</p>
        )}
      </div>

      {/* Daftar nama peserta: 3 kolom - Belum Isi, Belum Lengkap, Lengkap */}
      <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
        {/* Kolom Belum Isi */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C1443A] mb-1.5">
            Belum Isi ({belumIsiList?.length || 0})
          </p>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
            {belumIsiList?.length > 0 ? (
              belumIsiList.map((name, i) => (
                <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                  <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#C1443A]/60 shrink-0" />
                  <span className="break-words">{name}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-300">-</p>
            )}
          </div>
        </div>

        {/* Kolom Belum Lengkap */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C8933E] mb-1.5">
            Belum Lengkap ({belumLengkapList?.length || 0})
          </p>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
            {belumLengkapList?.length > 0 ? (
              belumLengkapList.map((item, i) => (
                <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                  <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#C8933E]/60 shrink-0" />
                  <span className="break-words">
                    {item.name}{' '}
                    <span className="text-slate-400">
                      ({item.assessedCount}/{item.targetCount})
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-300">-</p>
            )}
          </div>
        </div>

        {/* Kolom Lengkap */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0F9D6D] mb-1.5">
            Lengkap ({lengkapList?.length || 0})
          </p>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
            {lengkapList?.length > 0 ? (
              lengkapList.map((name, i) => (
                <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                  <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#0F9D6D]/60 shrink-0" />
                  <span className="break-words">{name}</span>
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