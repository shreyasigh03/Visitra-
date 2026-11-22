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
const TICK = { fill: "var(--muted)", fontSize: 12 };

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
    <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className="clay min-w-0 rounded-[26px] p-4 sm:p-6">
        <h2 className="font-display mb-3 text-lg font-extrabold">Visitors by purpose</h2>
        {purposes.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-[var(--muted)]">No visitor data yet</div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-[200px] w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={purposes} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} stroke="var(--card)" strokeWidth={2} startAngle={90} endAngle={-270}>
                    {purposes.map(({ name }) => (
                      <Cell key={name} fill={colorOf(name)} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm sm:w-1/2 sm:grid-cols-1">
              {purposes.map(({ name, value }) => (
                <li key={name} className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: colorOf(name) }} />
                  <span className="text-[var(--muted)]">{name}</span>
                  <b className="ml-auto">{value}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="clay min-w-0 rounded-[26px] p-4 sm:p-6">
        <h2 className="font-display mb-3 text-lg font-extrabold">Visits by weekday</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weekdays} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="day" tick={TICK} interval={0} />
            <YAxis allowDecimals={false} tick={TICK} />
            <Tooltip {...TOOLTIP} cursor={{ fill: "var(--accent-soft)" }} />
            <Bar dataKey="visitors" name="Visitors" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
};

export default DashboardCharts;
