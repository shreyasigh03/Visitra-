import StatusBadge from "./StatusBadge";
import { formatDay } from "../lib/visitors";

const BUTTON = "min-h-10 px-3 text-[13px] lg:min-h-8 lg:rounded-[11px] lg:px-2.5 lg:text-[12px]";

const Actions = ({ visitor: v, busy, onVerify, onApprove, onReject }) => (
  <>
    <button type="button" onClick={() => onVerify(v.passId)} className={`btn-soft ${BUTTON}`}>
      Verify
    </button>
    <button type="button" onClick={() => onApprove(v)} disabled={busy || v.status === "approved"} className={`btn-ok ${BUTTON}`}>
      Approve
    </button>
    <button type="button" onClick={() => onReject(v)} disabled={busy || v.status === "rejected"} className={`btn-danger ${BUTTON}`}>
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
            <button type="button" onClick={() => onDetails(v)} className="min-h-10 min-w-0 cursor-pointer break-words text-left font-extrabold underline decoration-dotted underline-offset-4">
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

    <table className="hidden w-full table-fixed border-collapse text-[13px] lg:table">
      <thead>
        <tr>
          <th className="th-clay px-2 py-2 w-[76px]">Pass ID</th>
          <th className="th-clay px-2 py-2">Visitor</th>
          <th className="th-clay px-2 py-2 hidden 2xl:table-cell">Email</th>
          <th className="th-clay px-2 py-2">To meet</th>
          <th className="th-clay px-2 py-2 w-[108px]">Date</th>
          <th className="th-clay px-2 py-2 w-[96px]">Status</th>
          <th className="th-clay px-2 py-2 w-[216px]">Actions</th>
        </tr>
      </thead>
      <tbody>
        {visitors.map((v) => (
          <tr key={v._id} className="h-[50px] transition hover:bg-[var(--surface)]">
            <td className="td-clay px-2 py-1 font-bold text-[var(--muted)]">{v.passId || "—"}</td>
            <td className="td-clay px-2 py-1">
              <button type="button" onClick={() => onDetails(v)} title="View details" className="block max-w-full cursor-pointer truncate text-left font-extrabold underline decoration-dotted underline-offset-4">
                {v.name}
              </button>
              <span className="block truncate text-[12px] leading-tight text-[var(--muted)]">{v.phone || "—"}</span>
            </td>
            <td className="td-clay px-2 py-1 hidden truncate text-[var(--muted)] 2xl:table-cell" title={v.email}>{v.email || "—"}</td>
            <td className="td-clay px-2 py-1 truncate font-semibold" title={v.toMeet}>{v.toMeet || "—"}</td>
            <td className="td-clay px-2 py-1 whitespace-nowrap text-[var(--muted)]">{formatDay(v)}</td>
            <td className="td-clay px-2 py-1"><StatusBadge status={v.status} /></td>
            <td className="td-clay px-2 py-1">
              <div className="flex gap-1.5">
                <Actions visitor={v} busy={busyId === v._id} {...handlers} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
);

export default VisitorTable;
