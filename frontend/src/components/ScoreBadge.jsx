export default function ScoreBadge({ percentage }) {
  const score = Number(percentage);
  let tone = '';

  if (score >= 80) {
    tone = 'bg-[#0F9D6D]/10 text-[#0F9D6D]'; // Hijau (Sangat Baik)
  }
  else if (score >= 60) {
    tone = 'bg-[#2563EB]/10 text-[#2563EB]'; // Biru (Baik)
  }
  else if (score >= 40) {
    // Background kuning, tapi teksnya kuning gelap (#ca8a04) agar mudah dibaca di layar putih
    tone = 'bg-[#FACC15]/20 text-[#ca8a04]'; 
  }
  else if (score >= 20) {
    tone = 'bg-[#DC2626]/10 text-[#DC2626]'; // Merah (Kurang)
  }
  else {
    tone = 'bg-[#111827]/10 text-[#111827]'; // Hitam (Sangat Kurang)
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tracking-wide ${tone}`}>
      {score.toFixed(2)}
    </span>
  );
}