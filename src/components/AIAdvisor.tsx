import React, { useState, useRef, useEffect } from "react";
import { Task, GCalEvent, ChatMessage } from "../types";
import { Sparkles, Send, AlertTriangle, Lightbulb, User, Bot, Loader2, RefreshCcw } from "lucide-react";

interface AIAdvisorProps {
  tasks: Task[];
  gCalEvents: GCalEvent[];
  conflicts: { taskId: string; conflictWith: string }[];
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void>;
  isGeneratingAdvice: boolean;
  onAutoSchedule: () => void;
  isAutoScheduling: boolean;
  className?: string;
}

export default function AIAdvisor({
  tasks,
  gCalEvents,
  conflicts,
  chatHistory,
  onSendMessage,
  isGeneratingAdvice,
  onAutoSchedule,
  isAutoScheduling,
  className
}: AIAdvisorProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGeneratingAdvice) return;
    const msg = input;
    setInput("");
    await onSendMessage(msg);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Calculate some simple metrics for optimization insights
  const totalTasks = tasks.length;
  const scheduledTasksCount = tasks.filter((t) => t.startTime && t.status !== "Completed").length;
  const completedTasksCount = tasks.filter((t) => t.status === "Completed").length;
  const totalGCalEventsCount = gCalEvents.length;

  const totalMinutesScheduled = tasks
    .filter((t) => t.status !== "Completed" && t.startTime)
    .reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const hoursScheduled = (totalMinutesScheduled / 60).toFixed(1);

  return (
    <div className={`frosted-glass rounded-2xl p-6 flex flex-col overflow-hidden shadow-xl ${className || "h-[780px]"}`}>
      {/* Advisor Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-md font-bold text-white tracking-wide">AI Planner & Advisor</h2>
        </div>
        <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-full font-semibold border border-indigo-500/20">
          Powered by Gemini
        </span>
      </div>

      {/* Main Panel Grid */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* SECTION A: Conflict & Optimizer Status Card */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Conflict & Workload Advisor</span>
            </h3>
            {conflicts.length > 0 && (
              <span className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-md font-bold">
                {conflicts.length} Overlaps
              </span>
            )}
          </div>

          {conflicts.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-zinc-400 font-medium">
                We detected the following timeline collisions with locked calendar events:
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {conflicts.map((conflict, idx) => {
                  const task = tasks.find((t) => t.id === conflict.taskId);
                  return (
                    <div
                      key={idx}
                      className="flex items-start space-x-2 text-[11px] bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2 rounded-lg"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>"{task?.title || "Task"}"</strong> overlaps with {conflict.conflictWith}.
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={onAutoSchedule}
                disabled={isAutoScheduling}
                className="w-full mt-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isAutoScheduling ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Resolving Conflicts...</span>
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-3 h-3" />
                    <span>Auto-Resolve & Reschedule</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 leading-relaxed">
              🎉 <strong>Schedule clear!</strong> No task conflicts or GCal overlaps detected. Your daily workload ({hoursScheduled}h scheduled across {scheduledTasksCount} tasks) is balanced perfectly around your fixed meetings.
            </div>
          )}
        </div>

        {/* SECTION B: Interactive Chat Advisor */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20 border border-slate-800/40 rounded-xl overflow-hidden p-3">
          <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mb-2">
            Ask Your Productivity Coach
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3.5 mb-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <Bot className="w-10 h-10 text-zinc-700 mb-2" />
                <p className="text-xs font-medium">
                  Ask me questions about your schedule:
                </p>
                <div className="flex flex-col gap-1.5 mt-3 max-w-[240px]">
                  <button
                    onClick={() => onSendMessage("Am I overbooked today?")}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-lg p-2 transition text-left"
                  >
                    💡 "Am I overbooked today?"
                  </button>
                  <button
                    onClick={() => onSendMessage("Find 2 hours for deep work today.")}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-lg p-2 transition text-left"
                  >
                    💡 "Find 2 hours for deep work today"
                  </button>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role !== "user" && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isGeneratingAdvice && (
              <div className="flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl rounded-tl-none p-3 text-xs flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Analyzing workload...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSubmit} className="relative flex items-center mt-auto">
            <input
              type="text"
              placeholder="Ask about your workload or advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGeneratingAdvice}
              className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 pl-3.5 pr-12 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            <button
              type="submit"
              disabled={isGeneratingAdvice || !input.trim()}
              className="absolute right-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-2 rounded-lg transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
