import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { reasonGroup, visitDay } from "../lib/visitors";

const COLORS = ["#314ca3", "#6485d8", "#f2d36b", "#a9b5d6", "#79b6c9", "#c58fb8"];
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
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
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
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={purposes} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {purposes.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP} />
              <Legend verticalAlign="bottom" formatter={(text) => <span style={{ color: "var(--ink)" }}>{text}</span>} />
            </PieChart>
          </ResponsiveContainer>
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
            <Bar dataKey="visitors" name="Visitors" fill="var(--accent)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
};

export default DashboardCharts;
