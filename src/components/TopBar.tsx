import React, { useState } from "react";
import { Sparkles, Calendar, Search, Loader2, RefreshCw, Sun, Moon, Menu } from "lucide-react";
import { motion } from "motion/react";

interface TopBarProps {
  isGCalConnected: boolean;
  userGCalEmail: string | null;
  lastSynced: string | null;
  onConnectGCal: () => void;
  onSyncGCal: () => void;
  onAutoSchedule: () => void;
  onSmartAddTask: (prompt: string) => Promise<void>;
  isAutoScheduling: boolean;
  isSyncing: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
}

export default function TopBar({
  isGCalConnected,
  userGCalEmail,
  lastSynced,
  onConnectGCal,
  onSyncGCal,
  onAutoSchedule,
  onSmartAddTask,
  isAutoScheduling,
  isSyncing,
  isDarkMode,
  onToggleTheme,
  onToggleSidebar
}: TopBarProps) {
  const [smartPrompt, setSmartPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartPrompt.trim()) return;
    setIsParsing(true);
    try {
      await onSmartAddTask(smartPrompt);
      setSmartPrompt("");
    } catch (err) {
      console.error("Failed to parse task via smart bar", err);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <header
      id="topbar"
      className="bg-slate-950/40 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-3.5 md:py-4 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-20 gap-4"
    >
      {/* Top Mobile Row containing Hamburger, App Brand name, and actions */}
      <div className="flex items-center justify-between w-full md:w-auto md:hidden">
        <div className="flex items-center space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 bg-slate-900/60 border border-white/5 hover:border-zinc-500/50 rounded-xl text-zinc-300 cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="brand-font font-black text-white text-base tracking-wide">Veluntra</h1>
            <span className="brand-sub-font text-[10px] text-indigo-400 font-medium">AI Scheduler</span>
          </div>
        </div>

        {/* Action icons on mobile (compact row of buttons) */}
        <div className="flex items-center space-x-2">
          {/* Google Calendar Icon Button on Mobile */}
          {isGCalConnected ? (
            <button
              onClick={onSyncGCal}
              disabled={isSyncing}
              title={`Synced with ${userGCalEmail || "Google Calendar"}`}
              className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl transition cursor-pointer flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
          ) : (
            <button
              onClick={onConnectGCal}
              className="p-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 rounded-xl transition cursor-pointer flex items-center justify-center"
              title="Connect Google Calendar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.3-1.15 3.32h5.51c.32-.3.62-.64.89-1.01 1.76-2.34 2.8-5.26 2.8-8.16z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3c-1.08.72-2.47 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5H1.23v3.1c2 3.97 6.1 6.65 10.77 6.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.25c-.24-.72-.38-1.49-.38-2.25s.14-1.53.38-2.25V6.65H1.23C.44 8.24 0 10.07 0 12s.44 3.76 1.23 5.35l4.01-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.23 2.68 1.23 6.65l4.01 3.1c.95-2.87 3.61-5 6.76-5z"
                />
              </svg>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 bg-slate-900/60 border border-white/5 hover:border-zinc-500/50 rounded-xl text-zinc-300 hover:text-white transition cursor-pointer flex items-center justify-center shadow-md shadow-black/10"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Compact Auto-Schedule CTA */}
          <button
            onClick={onAutoSchedule}
            disabled={isAutoScheduling}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white p-2 rounded-xl flex items-center justify-center transition shadow-lg shadow-indigo-600/20 cursor-pointer"
            title="Auto-Schedule Day"
          >
            {isAutoScheduling ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Smart Add Task input */}
      <div className="flex-1 max-w-2xl w-full">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400" />
            <input
              id="smart-add-input"
              type="text"
              placeholder="AI Smart Add: 'Strategy sync at 2pm for 60m with Alex tomorrow'..."
              value={smartPrompt}
              onChange={(e) => setSmartPrompt(e.target.value)}
              disabled={isParsing}
              className="w-full bg-slate-900/40 border border-white/5 focus:border-indigo-500/80 rounded-xl py-3 pl-11 pr-24 sm:pr-32 text-sm text-zinc-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
            />
            <div className="absolute right-2 top-2">
              <button
                id="smart-add-submit-btn"
                type="submit"
                disabled={isParsing || !smartPrompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold px-2.5 sm:px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">Parsing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-200" />
                    <span>AI Add</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Action Buttons & Status (Hidden on mobile, flex on desktop) */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Google Calendar Connection button */}
        <div className="flex items-center space-x-2">
          {isGCalConnected ? (
            <div className="flex items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl space-x-2.5">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <div className="text-left">
                <p className="text-xs text-zinc-400 font-medium truncate max-w-[140px]">
                  {userGCalEmail || "Connected"}
                </p>
                {lastSynced && (
                  <p className="text-[10px] text-zinc-500">Synced {lastSynced}</p>
                )}
              </div>
              <button
                id="gcal-sync-now-btn"
                onClick={onSyncGCal}
                disabled={isSyncing}
                title="Sync Google Calendar events now"
                className="p-1 hover:bg-zinc-800 rounded-md text-emerald-400 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              </button>
            </div>
          ) : (
            <button
              id="gcal-connect-btn"
              onClick={onConnectGCal}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 flex items-center space-x-2.5 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.3-1.15 3.32h5.51c.32-.3.62-.64.89-1.01 1.76-2.34 2.8-5.26 2.8-8.16z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3c-1.08.72-2.47 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5H1.23v3.1c2 3.97 6.1 6.65 10.77 6.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.25c-.24-.72-.38-1.49-.38-2.25s.14-1.53.38-2.25V6.65H1.23C.44 8.24 0 10.07 0 12s.44 3.76 1.23 5.35l4.01-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.23 2.68 1.23 6.65l4.01 3.1c.95-2.87 3.61-5 6.76-5z"
                />
              </svg>
              <span>Connect Google Calendar</span>
            </button>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          className="p-2.5 bg-slate-900/60 border border-white/5 hover:border-zinc-500/50 rounded-xl text-zinc-300 hover:text-white transition cursor-pointer flex items-center justify-center shadow-md shadow-black/10"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* Auto-Schedule Week CTA */}
        <button
          id="auto-schedule-btn"
          onClick={onAutoSchedule}
          disabled={isAutoScheduling}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
        >
          {isAutoScheduling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
              <span>Optimizing Schedule...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
              <span>Auto-Schedule Day</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
