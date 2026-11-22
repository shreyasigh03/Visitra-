import { useEffect } from "react";

const Drawer = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="clay absolute right-0 top-0 h-full w-full overflow-y-auto p-6 sm:w-[380px] sm:rounded-l-[28px]"
        style={{ animation: "slideIn .25s ease both" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="btn-soft h-11 w-11 text-sm">
            ✕
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
};

export default Drawer;
