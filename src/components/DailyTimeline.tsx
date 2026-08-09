import { Task, GCalEvent } from "../types";
import { timeToMinutes, parseIsoDateTime, isOverlapping } from "../utils/scheduler";
import { Lock, AlertTriangle, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { motion } from "motion/react";

interface DailyTimelineProps {
  tasks: Task[];
  gCalEvents: GCalEvent[];
  selectedDate: string; // "YYYY-MM-DD"
  onSelectTask: (task: Task) => void;
  conflicts: { taskId: string; conflictWith: string }[];
}

export default function DailyTimeline({
  tasks,
  gCalEvents,
  selectedDate,
  onSelectTask,
  conflicts
}: DailyTimelineProps) {
  const startHour = 6;
  const endHour = 22; // 10 PM
  const hourHeight = 72; // pixels per hour

  // Filter local tasks scheduled for today
  const dayTasks = tasks.filter(
    (t) => t.dueDate === selectedDate && t.startTime && t.endTime
  );

  // Filter GCal events scheduled for today
  const dayGCalEvents = gCalEvents.filter((event) => {
    const startObj = parseIsoDateTime(event.start.dateTime || event.start.date);
    return startObj && startObj.date === selectedDate;
  });

  // Convert "HH:MM" to vertical pixel offset from 6:00 AM
  const getTopOffset = (timeStr: string): number => {
    const minutes = timeToMinutes(timeStr);
    const startMinutes = startHour * 60;
    const diff = minutes - startMinutes;
    return Math.max(0, (diff / 60) * hourHeight);
  };

  // Get height in pixels for a given duration in minutes
  const getHeight = (durationMins: number): number => {
    return (durationMins / 60) * hourHeight;
  };

  // Generate hour labels
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // GCal color mapping (Google Calendar standard colors)
  const getGCalColorClasses = (colorId?: string) => {
    switch (colorId) {
      case "9": // Blueberry / Lavender
        return "bg-indigo-900/30 border-indigo-500/50 text-indigo-200";
      case "11": // Tomato / bold red
        return "bg-rose-900/30 border-rose-500/50 text-rose-200";
      case "5": // Banana / Yellow
        return "bg-amber-900/30 border-amber-500/50 text-amber-200";
      default:
        return "bg-sky-900/30 border-sky-500/50 text-sky-200";
    }
  };

  return (
    <div className="frosted-glass backdrop-blur-md rounded-2xl p-4 md:p-6 flex flex-col h-[600px] md:h-[780px] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <CalendarDays className="w-5 h-5 text-indigo-400" />
          <h2 className="text-md font-bold text-white tracking-wide">Daily Timeline</h2>
        </div>
        <span className="text-xs text-zinc-400 bg-zinc-800/60 px-3 py-1.5 rounded-full font-medium">
          {new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Grid container with relative timeline */}
      <div className="flex-1 overflow-y-auto pr-2 relative scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {/* Horizontal Hour Lines */}
        <div className="absolute inset-0 pl-16 pointer-events-none">
          {hours.map((hour, idx) => (
            <div
              key={hour}
              className="border-t border-zinc-800/60"
              style={{
                height: `${hourHeight}px`,
                transform: `translateY(${idx * hourHeight}px)`,
              }}
            />
          ))}
        </div>

        {/* Timeline hour labels */}
        <div className="relative w-full" style={{ height: `${hours.length * hourHeight}px` }}>
          {hours.map((hour, idx) => {
            const displayHour = hour > 12 ? hour - 12 : hour;
            const ampm = hour >= 12 ? "PM" : "AM";
            return (
              <div
                key={hour}
                className="absolute left-0 text-[11px] font-bold text-zinc-500 w-12 text-right select-none"
                style={{ top: `${idx * hourHeight - 8}px` }}
              >
                {displayHour}:00 {ampm}
              </div>
            );
          })}

          {/* Time blocks area */}
          <div className="absolute inset-y-0 left-16 right-0">
            {/* 1. Google Calendar Events (LOCKED) */}
            {dayGCalEvents.map((event) => {
              const startObj = parseIsoDateTime(event.start.dateTime || event.start.date);
              const endObj = parseIsoDateTime(event.end.dateTime || event.end.date);
              if (!startObj || !endObj) return null;

              const top = getTopOffset(startObj.time);
              const startMinutes = timeToMinutes(startObj.time);
              const endMinutes = timeToMinutes(endObj.time);
              const duration = endMinutes - startMinutes;
              const height = getHeight(duration);

              const colorClasses = getGCalColorClasses(event.colorId);

              return (
                <div
                  key={event.id}
                  className={`absolute left-1 right-1 p-3 rounded-xl border ${colorClasses} shadow-sm backdrop-blur-sm transition-all text-xs overflow-hidden`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    minHeight: "44px",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold truncate">{event.summary}</span>
                    <Lock className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5 font-medium">
                    {startObj.time} - {endObj.time} • Google Calendar
                  </div>
                  {event.description && (
                    <p className="text-[10px] opacity-60 mt-1 line-clamp-1">{event.description}</p>
                  )}
                </div>
              );
            })}

            {/* 2. Local AI Scheduled Tasks */}
            {dayTasks.map((task) => {
              const top = getTopOffset(task.startTime!);
              const startMins = timeToMinutes(task.startTime!);
              const endMins = timeToMinutes(task.endTime!);
              const duration = endMins - startMins;
              const height = getHeight(duration);

              // Check if task is at conflict
              const taskConflict = conflicts.find((c) => c.taskId === task.id);

              const isCompleted = task.status === "Completed";

              const priorityColors = {
                Low: "from-blue-500/20 to-sky-500/10 border-blue-500/40 text-blue-200",
                Medium: "from-indigo-500/20 to-indigo-500/10 border-indigo-500/40 text-indigo-200",
                High: "from-violet-500/20 to-violet-500/10 border-violet-500/40 text-violet-200",
                Urgent: "from-rose-500/20 to-rose-500/10 border-rose-500/40 text-rose-200"
              };

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`absolute left-4 right-4 p-3 rounded-xl border bg-gradient-to-br ${
                    isCompleted
                      ? "from-zinc-800/40 to-zinc-800/10 border-zinc-700/50 text-zinc-400 line-through opacity-75"
                      : priorityColors[task.priority]
                  } ${
                    taskConflict ? "ring-2 ring-rose-500/80 ring-offset-2 ring-offset-[#090d16]" : ""
                  } shadow-md backdrop-blur-sm cursor-pointer hover:brightness-110 transition-all overflow-hidden flex flex-col justify-between`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    minHeight: "48px",
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between space-x-1.5">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        )}
                        <span className="font-bold truncate text-xs">{task.title}</span>
                      </div>

                      {taskConflict && (
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-bounce" title={`Conflict detected: ${taskConflict.conflictWith}`} />
                      )}
                    </div>

                    <div className="text-[10px] font-semibold opacity-75 mt-0.5">
                      {task.startTime} - {task.endTime} • {task.category}
                    </div>
                  </div>

                  {/* Tiny progress footer for longer blocks */}
                  {height > 60 && task.subtasks.length > 0 && (
                    <div className="mt-1">
                      <div className="flex justify-between text-[9px] opacity-75 mb-0.5">
                        <span>Subtasks</span>
                        <span>
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800/60 rounded-full h-1">
                        <div
                          className="bg-indigo-400 h-1 rounded-full"
                          style={{
                            width: `${
                              (task.subtasks.filter((s) => s.completed).length /
                                task.subtasks.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
