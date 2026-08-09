import { LayoutDashboard, Kanban, Calendar, Sparkles, BarChart3, Settings, LogOut } from "lucide-react";
import { motion } from "motion/react";
// @ts-ignore
import logoIcon from "../assets/images/veluntra_logo_dark_bg_1786269381371.jpg";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  streak: number;
  currentUser?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, streak, currentUser, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "kanban", label: "Task Board", icon: Kanban },
    { id: "calendar", label: "Calendar View", icon: Calendar },
    { id: "assistant", label: "AI Planner", icon: Sparkles },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      id="sidebar"
      className="w-64 frosted-glass flex flex-col h-screen sticky top-0 text-zinc-300 select-none z-10"
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center space-x-3">
        <img
          src={logoIcon}
          alt="Veluntra"
          className="w-12 h-12 rounded-2xl object-cover indigo-glow shadow-lg"
          referrerPolicy="no-referrer"
        />
        <div>
          <h1 className="brand-font font-black text-white text-lg tracking-wide">Veluntra</h1>
          <span className="brand-sub-font text-xs text-indigo-400 font-medium">AI Task Scheduler</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute inset-0 bg-indigo-500/15 border-r-2 border-indigo-500 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Streak & User Info Footer */}
      <div className="p-4 border-t border-zinc-800 bg-[#080d19]/60">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔥</span>
            <div className="text-left">
              <div className="text-xs text-zinc-400 font-medium">Streak Score</div>
              <div className="text-sm font-bold text-amber-400">{streak} Days Active</div>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold animate-pulse">
            LEVEL 3
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center space-x-3 overflow-hidden">
            <img
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.email || "johndoe"}`}
              alt="User profile"
              className="w-10 h-10 rounded-full border border-zinc-700 bg-indigo-950/40 object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-medium text-white truncate">{currentUser?.name || "John Doe"}</h4>
              <p className="text-xs text-zinc-500 truncate">{currentUser?.email || "johndoe@gmail.com"}</p>
            </div>
          </div>

          {onLogout && (
            <button
              id="sidebar-logout-btn"
              onClick={onLogout}
              className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
