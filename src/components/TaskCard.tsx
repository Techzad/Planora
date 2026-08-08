import React from "react";
import { Task } from "../types";
import { CheckSquare, Square, Trash2, CalendarPlus, CheckCircle, Clock, AlertCircle, Sparkles, GripVertical } from "lucide-react";

interface TaskCardProps {
  key?: string | number;
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onPushToGCal: (task: Task) => void | Promise<void>;
  onSelectTask: (task: Task) => void;
  isConflict?: boolean;
  dragHandleProps?: any;
  setNodeRef?: any;
  style?: React.CSSProperties;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onToggleSubtask,
  onDeleteTask,
  onPushToGCal,
  onSelectTask,
  isConflict = false,
  dragHandleProps,
  setNodeRef,
  style
}: TaskCardProps) {
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const priorityStyles = {
    Low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Medium: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    High: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    Urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  const categoryStyles = {
    Work: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Personal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    Health: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    "Deep Work": "bg-purple-500/10 text-purple-400 border-purple-500/20"
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`task-card-${task.id}`}
      className={`bg-slate-950/35 border rounded-xl p-4 hover:border-zinc-700/80 transition-all shadow-md group ${
        task.status === "Completed" ? "opacity-60 border-zinc-900" : isConflict ? "border-rose-500/50 ring-1 ring-rose-500/20" : "border-white/5"
      }`}
    >
      <div className="flex items-start justify-between space-x-3">
        {/* Checkbox and Title */}
        <div className="flex-1 min-w-0 flex items-start space-x-2">
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="text-zinc-500 hover:text-zinc-300 transition cursor-grab active:cursor-grabbing p-1 -ml-1.5 -mt-0.5 flex-shrink-0 flex items-center justify-center"
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <button
                id={`task-check-${task.id}`}
                onClick={() => onToggleComplete(task.id)}
                className="text-zinc-500 hover:text-indigo-400 transition flex-shrink-0 cursor-pointer"
              >
                {task.status === "Completed" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <h3
                onClick={() => onSelectTask(task)}
                className={`text-sm font-semibold text-white truncate cursor-pointer hover:text-indigo-300 transition ${
                  task.status === "Completed" ? "line-through text-zinc-500" : ""
                }`}
              >
                {task.title}
              </h3>
            </div>
            {task.description && (
              <p
                onClick={() => onSelectTask(task)}
                className="text-xs text-zinc-400 mt-1 line-clamp-2 cursor-pointer"
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Action icons (push to GCal, delete) */}
        <div className="flex items-center space-x-1.5 opacity-40 group-hover:opacity-100 transition duration-200">
          {!task.isGCalSynced && task.status !== "Completed" && (
            <button
              id={`task-push-gcal-${task.id}`}
              onClick={() => onPushToGCal(task)}
              title="Push to Google Calendar"
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
            </button>
          )}
          {task.isGCalSynced && (
            <span
              title="Synced with Google Calendar"
              className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20"
            >
              Synced
            </span>
          )}
          <button
            id={`task-delete-${task.id}`}
            onClick={() => onDeleteTask(task.id)}
            title="Delete task"
            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-400 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Badges and details */}
      <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
        {/* Priority */}
        <span className={`px-2 py-0.5 rounded-full border font-semibold ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>

        {/* Category */}
        <span className={`px-2 py-0.5 rounded-full border font-semibold ${categoryStyles[task.category]}`}>
          {task.category}
        </span>

        {/* Duration */}
        <span className="flex items-center text-zinc-400 space-x-1">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{task.estimatedMinutes}m</span>
        </span>

        {/* Start/End schedule if defined */}
        {task.startTime && (
          <span className="text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/80 font-medium">
            ⏰ {task.startTime} - {task.endTime}
          </span>
        )}

        {/* Conflict Badge */}
        {isConflict && (
          <span className="flex items-center space-x-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-semibold animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>Overlap Conflict</span>
          </span>
        )}
      </div>

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800/60">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
            <span className="font-semibold">Subtasks Checklist</span>
            <span>
              {completedSubtasks}/{totalSubtasks} ({Math.round(subtaskProgress)}%)
            </span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1 mb-2">
            <div
              className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>

          {/* Quick Subtask Toggles (collapsible or just compact) */}
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-thin">
            {task.subtasks.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onToggleSubtask(task.id, sub.id)}
                className="flex items-center space-x-2 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer select-none"
              >
                <button className="flex-shrink-0 text-zinc-500 hover:text-indigo-400 cursor-pointer">
                  {sub.completed ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className={`truncate ${sub.completed ? "line-through opacity-50" : ""}`}>
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
