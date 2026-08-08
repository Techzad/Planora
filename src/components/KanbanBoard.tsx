import { Task, TaskStatus } from "../types";
import { Plus, CheckCircle2, Circle, ArrowRight, KanbanSquare, CheckSquare, Square } from "lucide-react";

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateModal: () => void;
}

export default function KanbanBoard({
  tasks,
  onUpdateTaskStatus,
  onSelectTask,
  onOpenCreateModal
}: KanbanBoardProps) {
  const columns: { id: TaskStatus; label: string; bg: string; border: string; text: string }[] = [
    {
      id: "Todo",
      label: "To Do",
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      text: "text-blue-400"
    },
    {
      id: "In Progress",
      label: "In Progress",
      bg: "bg-indigo-500/5",
      border: "border-indigo-500/20",
      text: "text-indigo-400"
    },
    {
      id: "Completed",
      label: "Completed",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      text: "text-emerald-400"
    }
  ];

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case "Low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Medium":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "High":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Urgent":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Kanban Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <KanbanSquare className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Kanban Board</h2>
            <p className="text-xs text-zinc-500">Drag or shift tasks across workflow columns</p>
          </div>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="frosted-glass rounded-2xl p-5 flex flex-col h-[640px] shadow-lg"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold tracking-wider uppercase ${col.text}`}>
                    {col.label}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 font-semibold border border-white/5">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {colTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-600">
                    <p className="text-xs italic">No tasks here</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-950/45 border border-white/5 hover:border-zinc-700/80 p-4 rounded-xl shadow-md space-y-3.5 group transition-all"
                    >
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex-1 min-w-0">
                          <h4
                            onClick={() => onSelectTask(task)}
                            className="text-xs font-bold text-white hover:text-indigo-400 cursor-pointer truncate transition"
                          >
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subtask checklist snippet */}
                      {task.subtasks.length > 0 && (
                        <div className="text-[10px] text-zinc-500">
                          📈 Subtasks:{" "}
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                        </div>
                      )}

                      {/* Footer Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md border font-bold ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority}
                        </span>

                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition duration-150">
                          {col.id !== "Todo" && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, col.id === "Completed" ? "In Progress" : "Todo")}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition text-[10px] font-bold"
                              title="Move Left"
                            >
                              ←
                            </button>
                          )}
                          {col.id !== "Completed" && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, col.id === "Todo" ? "In Progress" : "Completed")}
                              className="p-1.5 hover:bg-zinc-800 rounded text-indigo-400 hover:text-white transition text-xs font-bold flex items-center space-x-1"
                              title="Move Right"
                            >
                              <span>Next</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
