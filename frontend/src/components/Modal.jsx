export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#17203A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
          <h2 className="font-serif text-lg font-semibold text-[#17203A]">{title}</h2>
          <button
            onClick={onClose}
            className="grid place-items-center h-8 w-8 rounded-full text-slate-400 hover:text-[#17203A] hover:bg-slate-100 transition-colors text-xl leading-none"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}