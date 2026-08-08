import { Task } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle, Flame } from "lucide-react";

interface AnalyticsViewProps {
  tasks: Task[];
  streak: number;
}

export default function AnalyticsView({ tasks, streak }: AnalyticsViewProps) {
  // 1. Calculate productivity stats
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const todoCount = tasks.filter((t) => t.status === "Todo").length;
  const totalCount = tasks.length;

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 2. Data for Category Distribution (Pie Chart)
  const categoryCounts = tasks.reduce((acc: { [key: string]: number }, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#ec4899"];

  // 3. Data for Hours Scheduled per Day (Area Chart)
  const dates = ["2026-08-05", "2026-08-06", "2026-08-07", "2026-08-08", "2026-08-09", "2026-08-10", "2026-08-11"];
  const dailyHoursData = dates.map((dateStr) => {
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
    const totalMins = dayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    return {
      name: formattedDate,
      hours: Number((totalMins / 60).toFixed(1))
    };
  });

  // 4. Tasks at Risk counts
  const tasksAtRiskCount = tasks.filter((t) => t.riskLevel === "High" && t.status !== "Completed").length;

  return (
    <div className="space-y-6">
      {/* Analytics Title */}
      <div className="flex items-center space-x-2.5">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Productivity Insights & Analytics</h2>
          <p className="text-xs text-zinc-500">Track task completions, scheduled workloads, and streaks</p>
        </div>
      </div>

      {/* Grid Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Streak score */}
        <div className="frosted-glass rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Streaks</span>
            <h4 className="text-2xl font-bold text-amber-400 mt-1">{streak} Days Active</h4>
            <span className="text-[10px] text-zinc-400">Keep scheduling to level up!</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="frosted-glass rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <h4 className="text-2xl font-bold text-emerald-400 mt-1">{completionRate}%</h4>
            <span className="text-[10px] text-zinc-400">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Workload trend */}
        <div className="frosted-glass rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Load</span>
            <h4 className="text-2xl font-bold text-indigo-400 mt-1">
              {tasks.filter((t) => t.status !== "Completed").length} Active
            </h4>
            <span className="text-[10px] text-zinc-400">{inProgressCount} currently in progress</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* High Risk tasks */}
        <div className="frosted-glass rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks at Risk</span>
            <h4 className="text-2xl font-bold text-rose-400 mt-1">{tasksAtRiskCount} Urgent</h4>
            <span className="text-[10px] text-rose-400/80 font-medium">High risk of schedule slips</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Scheduled Area Chart */}
        <div className="frosted-glass rounded-2xl p-5 h-[340px] flex flex-col justify-between shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4">Hours Scheduled per Day</h3>
          <div className="flex-1 w-full min-h-0 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHoursData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#27272a",
                    borderRadius: "12px",
                    color: "#fff"
                  }}
                />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution Pie Chart */}
        <div className="frosted-glass rounded-2xl p-5 h-[340px] flex flex-col justify-between shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4">Task Category Breakdown</h3>
          {categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 italic text-xs">
              No tasks categorized yet
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between min-h-0">
              <div className="w-[50%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#090d16",
                        borderColor: "#27272a",
                        borderRadius: "12px",
                        color: "#fff"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Legends */}
              <div className="flex-1 flex flex-col gap-3.5 pl-6 text-xs text-zinc-300">
                {categoryData.map((data, index) => (
                  <div key={data.name} className="flex items-center space-x-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex justify-between w-full pr-4">
                      <span className="font-semibold text-zinc-400">{data.name}</span>
                      <span className="font-bold text-white">{data.value} tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
