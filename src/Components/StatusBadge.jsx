const STYLES = {
  approved: { background: "var(--ok-bg)", color: "var(--ok-fg)" },
  verified: { background: "var(--accent-soft)", color: "var(--accent)" },
  pending: { background: "var(--warn-bg)", color: "var(--warn-fg)" },
  rejected: { background: "var(--bad-bg)", color: "var(--bad-fg)" },
};

const StatusBadge = ({ status = "pending" }) => (
  <span className="rounded-full px-3 py-1 text-[11.5px] font-extrabold capitalize" style={STYLES[status]}>
    {status}
  </span>
);

export default StatusBadge;
