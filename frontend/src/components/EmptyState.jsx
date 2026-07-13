import { Inbox } from "lucide-react";

export default function EmptyState({ message = 'Tidak ada data', icon = <Inbox /> }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid place-items-center h-16 w-16 rounded-full bg-[#C8933E]/10 mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-slate-500">{message}</p>
    </div>
  );
}