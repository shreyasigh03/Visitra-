import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { REASONS, reasonGroup, visitDay } from "../lib/visitors";

// Each purpose keeps its own color, whatever else is in the chart.
const PURPOSES = [...REASONS, "Other"];
const colorOf = (name) => `var(--chart-${PURPOSES.indexOf(name) + 1})`;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TOOLTIP = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 },
  itemStyle: { color: "var(--ink)" },
  labelStyle: { color: "var(--ink)" },
};
const TICK = { fill: "var(--muted)", fontSize: 11 };

const DashboardCharts = ({ visitors }) => {
  const purposes = useMemo(() => {
    const counts = {};
    for (const v of visitors) {
      const name = reasonGroup(v.reason);
      counts[name] = (counts[name] || 0) + 1;
    }
    return PURPOSES.filter((name) => counts[name]).map((name) => ({ name, value: counts[name] }));
  }, [visitors]);

  const weekdays = useMemo(() => {
    const counts = DAYS.map((day) => ({ day, visitors: 0 }));
    for (const v of visitors) {
      const day = visitDay(v);
      if (day) counts[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7].visitors += 1;
    }
    return counts;
  }, [visitors]);

  return (
    <>
      <section className="clay flex min-h-0 min-w-0 flex-col rounded-[22px] p-4">
        <h2 className="font-display mb-2 text-[15px] font-extrabold">Visitors by purpose</h2>
        {purposes.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">No visitor data yet</p>
        ) : (
          <div className="flex min-h-0 flex-1 items-center gap-3">
            <div className="h-[130px] w-[130px] shrink-0 fit:h-[108px] fit:w-[108px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={purposes} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="96%" stroke="var(--card)" strokeWidth={2} startAngle={90} endAngle={-270}>
                    {purposes.map(({ name }) => (
                      <Cell key={name} fill={colorOf(name)} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid min-w-0 flex-1 gap-y-1 text-[12.5px] leading-[1.15]">
              {purposes.map(({ name, value }) => (
                <li key={name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorOf(name) }} />
                  <span className="truncate text-[var(--muted)]">{name}</span>
                  <b className="ml-auto">{value}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="clay flex min-h-0 min-w-0 flex-col rounded-[22px] p-4">
        <h2 className="font-display mb-2 text-[15px] font-extrabold">Visits by weekday</h2>
        <div className="h-[130px] min-h-0 fit:h-auto fit:flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdays} margin={{ top: 4, right: 0, bottom: -8, left: -32 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="day" tick={TICK} interval={0} tickLine={false} />
              <YAxis allowDecimals={false} tick={TICK} tickCount={3} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP} cursor={{ fill: "var(--accent-soft)" }} />
              <Bar dataKey="visitors" name="Visitors" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
};

export default DashboardCharts;
