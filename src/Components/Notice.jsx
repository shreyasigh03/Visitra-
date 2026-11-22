const COLORS = {
  success: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
  error: { background: "var(--bad-bg)", color: "var(--bad-fg)" },
  warn: { background: "var(--warn-bg)", color: "var(--warn-fg)" },
  info: { background: "var(--surface)", color: "var(--muted)" },
};

const Notice = ({ type = "info", className = "", children }) => (
  <div
    role={type === "error" || type === "warn" ? "alert" : "status"}
    className={`rounded-[14px] px-4 py-3 text-sm font-bold ${className}`}
    style={COLORS[type]}
  >
    {children}
  </div>
);

export default Notice;
