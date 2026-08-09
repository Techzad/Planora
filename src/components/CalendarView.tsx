import { Task, GCalEvent } from "../types";
import { parseIsoDateTime } from "../utils/scheduler";
import { CalendarDays, Clock, Lock, Sparkles, CheckCircle } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  gCalEvents: GCalEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSelectTask: (task: Task) => void;
}

export default function CalendarView({
  tasks,
  gCalEvents,
  selectedDate,
  onSelectDate,
  onSelectTask
}: CalendarViewProps) {
  // We'll generate a 7-day week view centering on our current system date 2026-08-08 (Saturday)
  // Let's create an array of dates from 2026-08-05 (Wednesday) to 2026-08-11 (Tuesday)
  const daysOfWeek = [
    { name: "Wed", dateStr: "2026-08-05", label: "05" },
    { name: "Thu", dateStr: "2026-08-06", label: "06" },
    { name: "Fri", dateStr: "2026-08-07", label: "07" },
    { name: "Sat", dateStr: "2026-08-08", label: "08" },
    { name: "Sun", dateStr: "2026-08-09", label: "09" },
    { name: "Mon", dateStr: "2026-08-10", label: "10" },
    { name: "Tue", dateStr: "2026-08-11", label: "11" }
  ];

  const getGCalColorClasses = (colorId?: string) => {
    switch (colorId) {
      case "9":
        return "bg-indigo-950/45 border-indigo-500/40 text-indigo-300";
      case "11":
        return "bg-rose-950/45 border-rose-500/40 text-rose-300";
      case "5":
        return "bg-amber-950/45 border-amber-500/40 text-amber-300";
      default:
        return "bg-sky-950/45 border-sky-500/40 text-sky-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center space-x-2.5">
        <CalendarDays className="w-5 h-5 text-indigo-400" />
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Weekly Schedule Calendar</h2>
          <p className="text-xs text-zinc-500">Merged view of Google Calendar & local AI Task blocks</p>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 min-h-[580px]">
        {daysOfWeek.map((day) => {
          const isSelected = day.dateStr === selectedDate;

          // Local tasks scheduled for this day
          const dayTasks = tasks.filter((t) => t.dueDate === day.dateStr);

          // GCal events scheduled for this day
          const dayGCal = gCalEvents.filter((event) => {
            const startObj = parseIsoDateTime(event.start.dateTime || event.start.date);
            return startObj && startObj.date === day.dateStr;
          });

          return (
            <div
              key={day.dateStr}
              onClick={() => onSelectDate(day.dateStr)}
              className={`rounded-2xl p-4 border transition-all flex flex-col h-[260px] md:h-[520px] shadow-sm cursor-pointer ${
                isSelected
                  ? "frosted-glass !border-indigo-500/50 ring-1 ring-indigo-500/20"
                  : "frosted-glass hover:!bg-slate-900/40 border-white/5 hover:border-zinc-700/80"
              }`}
            >
              {/* Day Heading */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className={`text-[11px] font-bold tracking-wider uppercase ${isSelected ? "text-indigo-400" : "text-zinc-500"}`}>
                  {day.name}
                </span>
                <span
                  className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                    isSelected ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-300"
                  }`}
                >
                  {day.label}
                </span>
              </div>

              {/* Day Contents Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {/* 1. Google Calendar items */}
                {dayGCal.map((event) => {
                  const startObj = parseIsoDateTime(event.start.dateTime || event.start.date);
                  return (
                    <div
                      key={event.id}
                      className={`p-2 rounded-lg border text-[10px] space-y-0.5 ${getGCalColorClasses(event.colorId)}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold truncate max-w-[80%]">{event.summary}</span>
                        <Lock className="w-2.5 h-2.5 flex-shrink-0" />
                      </div>
                      <div className="opacity-75 font-semibold">
                        ⏰ {startObj?.time || "All Day"}
                      </div>
                    </div>
                  );
                })}

                {/* 2. Local Task blocks */}
                {dayTasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  const pBadge =
                    task.priority === "Urgent"
                      ? "border-rose-500/25 text-rose-400"
                      : task.priority === "High"
                      ? "border-violet-500/25 text-violet-400"
                      : "border-zinc-800 text-zinc-400";

                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className={`p-2 rounded-lg border bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-[10px] space-y-1 transition-all ${
                        isCompleted ? "opacity-55 line-through text-zinc-500 border-zinc-950" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-1 truncate max-w-[80%]">
                          {isCompleted ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
                          )}
                          <span className="font-bold truncate">{task.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-semibold">
                        <span>⏰ {task.startTime || `${task.estimatedMinutes}m`}</span>
                        <span className={`px-1 rounded border ${pBadge}`}>{task.priority}</span>
                      </div>
                    </div>
                  );
                })}

                {dayTasks.length === 0 && dayGCal.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center p-3 text-zinc-600 italic text-[10px]">
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
