import StatusBadge from "./StatusBadge";
import { formatDay } from "../lib/visitors";

const HEADINGS = ["Pass ID", "Name", "Email", "Phone", "To Meet", "Date", "Status"];

const Actions = ({ visitor: v, busy, onVerify, onApprove, onReject }) => (
  <>
    <button type="button" onClick={() => onVerify(v.passId)} className="btn-soft px-3 py-2 text-xs">
      Verify
    </button>
    <button type="button" onClick={() => onApprove(v)} disabled={busy || v.status === "approved"} className="btn-ok px-3 py-2 text-xs">
      Approve
    </button>
    <button type="button" onClick={() => onReject(v)} disabled={busy || v.status === "rejected"} className="btn-danger px-3 py-2 text-xs">
      Reject
    </button>
  </>
);

// Table on large screens, cards on phones and tablets.
const VisitorTable = ({ visitors, busyId, onDetails, ...handlers }) => (
  <>
    <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
      {visitors.map((v) => (
        <li key={v._id} className="clay-sm min-w-0 rounded-[22px] p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <button type="button" onClick={() => onDetails(v)} className="min-w-0 cursor-pointer break-words text-left font-extrabold underline decoration-dotted underline-offset-4">
              {v.name}
            </button>
            <StatusBadge status={v.status} />
          </div>
          <p className="text-[13px] text-[var(--muted)]">
            Meeting <b className="text-[var(--ink)]">{v.toMeet || "—"}</b> · {formatDay(v)}
          </p>
          <p className="mb-3 break-all text-[13px] text-[var(--muted)]">
            Pass {v.passId || "—"} · {v.phone}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Actions visitor={v} busy={busyId === v._id} {...handlers} />
          </div>
        </li>
      ))}
    </ul>

    <div className="clay hidden overflow-x-auto rounded-[26px] p-6 lg:block">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {HEADINGS.map((h) => (
              <th key={h} className="th-clay">{h}</th>
            ))}
            <th className="th-clay">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => (
            <tr key={v._id} className="transition hover:bg-[var(--surface)]">
              <td className="td-clay font-bold text-[var(--muted)]">{v.passId || "—"}</td>
              <td className="td-clay">
                <button type="button" onClick={() => onDetails(v)} title="View details" className="cursor-pointer text-left font-extrabold underline decoration-dotted underline-offset-4">
                  {v.name}
                </button>
              </td>
              <td className="td-clay break-all text-[var(--muted)]">{v.email || "—"}</td>
              <td className="td-clay text-[var(--muted)]">{v.phone || "—"}</td>
              <td className="td-clay font-semibold">{v.toMeet || "—"}</td>
              <td className="td-clay whitespace-nowrap text-[var(--muted)]">{formatDay(v)}</td>
              <td className="td-clay"><StatusBadge status={v.status} /></td>
              <td className="td-clay">
                <div className="flex gap-1.5">
                  <Actions visitor={v} busy={busyId === v._id} {...handlers} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

export default VisitorTable;
