import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import assessmentService from '../../services/assessmentService';

// Signature element: a brass-toned instrument dial that echoes the
// "measuring / scoring" nature of the tool instead of a plain number.
function ScoreDial({ percentage = 0, size = 128 }) {
  const angle = Math.min(100, Math.max(0, percentage)) * 3.6;
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#C8933E ${angle}deg, #E7E5E0 ${angle}deg)`,
      }}
    >
      <div className="absolute inset-[7px] rounded-full bg-white shadow-inner" />
      <div className="relative flex flex-col items-center">
        <span className="font-serif text-3xl font-semibold text-[#17203A] tracking-tight">
          {percentage}%
        </span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">skor</span>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assessmentService.getAll()
      .then(data => setAssessments(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const latest = assessments[0];

  if (loading) return <Loading />;

  return (
    <div className="min-h-full bg-[#F3F4F7] -m-6 p-6 md:-m-8 md:p-8">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">Ringkasan</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#17203A]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau hasil penilaian terakhir dan mulai penilaian baru.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="md:col-span-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 mb-4">
            Penilaian Terbaru
          </p>

          {latest ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreDial percentage={latest.results.percentage} />
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-500">Tanggal</span>
                  <span className="font-medium text-[#17203A]">
                    {new Date(latest.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pb-1">
                  <span className="text-sm text-slate-500">Total Nilai</span>
                  <span className="font-serif text-xl font-semibold text-[#17203A]">
                    {latest.results.total}
                  </span>
                </div>
                <Link
                  to={`/assessments/${latest.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#C8933E] hover:text-[#a97a30]"
                >
                  Lihat detail hasil →
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-slate-500 text-sm">Belum ada penilaian yang tercatat.</p>
            </div>
          )}
        </Card>

        <div className="md:col-span-2 flex flex-col justify-between rounded-xl shadow-sm p-6 bg-[#17203A] text-white">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C8933E]">
              Mulai Baru
            </p>
            <h2 className="font-serif text-xl font-semibold mt-1">Penilaian Baru</h2>
            <p className="mt-2 text-sm text-slate-300">
              Isi kriteria dan variabel untuk menghasilkan skor penilaian baru.
            </p>
          </div>
          <Link
            to="/assessment/new"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#C8933E] hover:bg-[#b3822f] text-[#17203A] font-semibold px-4 py-3 transition-colors"
          >
            Buat Penilaian
          </Link>
        </div>
      </div>
    </div>
  );
}