import React, { useState, useEffect } from "react";
import { Task, Priority, Category, RiskLevel, SubTask } from "../types";
import { X, Sparkles, Plus, Trash2, Loader2, ListTodo } from "lucide-react";

interface TaskEditModalProps {
  task: Task | null; // If null, we are in "Create" mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onGenerateAISubtasks: (title: string, description: string) => Promise<SubTask[]>;
}

export default function TaskEditModal({
  task,
  isOpen,
  onClose,
  onSave,
  onGenerateAISubtasks
}: TaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("2026-08-08");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [priority, setPriority] = useState<Priority>("Medium");
  const [category, setCategory] = useState<Category>("Work");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Low");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  // Load task details when modal opens or changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.dueDate);
      setEstimatedMinutes(task.estimatedMinutes);
      setPriority(task.priority);
      setCategory(task.category);
      setRiskLevel(task.riskLevel);
      setStartTime(task.startTime || "");
      setEndTime(task.endTime || "");
      setSubtasks(task.subtasks || []);
    } else {
      // Create mode defaults
      setTitle("");
      setDescription("");
      setDueDate("2026-08-08");
      setEstimatedMinutes(60);
      setPriority("Medium");
      setCategory("Work");
      setRiskLevel("Low");
      setStartTime("");
      setEndTime("");
      setSubtasks([]);
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    // Build the updated task object
    const savedTask: Task = {
      id: task ? task.id : "local-task-" + Date.now(),
      title,
      description,
      dueDate,
      estimatedMinutes: Number(estimatedMinutes),
      priority,
      status: task ? task.status : "Todo",
      category,
      riskLevel,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      subtasks,
      isGCalSynced: task ? task.isGCalSynced : false,
      gCalEventId: task ? task.gCalEventId : undefined
    };

    onSave(savedTask);
    onClose();
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: "subtask-" + Date.now() + Math.random(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (subId: string) => {
    setSubtasks(
      subtasks.map((sub) =>
        sub.id === subId ? { ...sub, completed: !sub.completed } : sub
      )
    );
  };

  const handleDeleteSubtask = (subId: string) => {
    setSubtasks(subtasks.filter((sub) => sub.id !== subId));
  };

  const handleGenerateAI = async () => {
    if (!title.trim()) return;
    setIsGeneratingSubtasks(true);
    try {
      const parsedSubs = await onGenerateAISubtasks(title, description);
      setSubtasks([...subtasks, ...parsedSubs]);
    } catch (err) {
      console.error("AI Subtasks error", err);
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        id="task-edit-modal"
        className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-md font-bold text-white flex items-center space-x-2">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            <span>{task ? "Edit AI Task" : "Create New Task"}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Brainstorm marketing roadmap"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Add key details or references..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 focus:outline-none h-20 resize-none"
            />
          </div>

          {/* Priority, Category, Risk Level Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Deep Work">Deep Work</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Risk Level
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Due Date & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-3.5 text-sm text-zinc-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Estimate (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-3.5 text-sm text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Time block positioning */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Start Time (Optional)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-3.5 text-sm text-zinc-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                End Time (Optional)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-3.5 text-sm text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="border-t border-zinc-800/80 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Subtasks Checklist
              </label>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGeneratingSubtasks || !title.trim()}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 hover:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingSubtasks ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                    <span>AI Split Substeps</span>
                  </>
                )}
              </button>
            </div>

            {/* List of subtasks */}
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
              {subtasks.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No sub-steps added yet.</p>
              ) : (
                subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/60 p-2.5 rounded-xl text-xs"
                  >
                    <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <span className={`truncate text-zinc-300 ${sub.completed ? "line-through opacity-50" : ""}`}>
                        {sub.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="p-1 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new subtask row */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add manually e.g. Design wireframes..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                className="flex-1 bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white p-2.5 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#090d16]/20 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/15 disabled:opacity-50 transition cursor-pointer"
          >
            {task ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
