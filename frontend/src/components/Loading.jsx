export default function Loading({ message = 'Memuat...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative h-10 w-10 mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#C8933E] animate-spin"></div>
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}