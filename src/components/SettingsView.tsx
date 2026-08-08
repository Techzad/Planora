import { Settings, RefreshCcw, User, Bell, Shield, Cloud } from "lucide-react";

interface SettingsViewProps {
  isGCalConnected: boolean;
  userGCalEmail: string | null;
  onConnectGCal: () => void;
  onDisconnectGCal: () => void;
  onResetData: () => void;
  workdayStart: string;
  setWorkdayStart: (t: string) => void;
  workdayEnd: string;
  setWorkdayEnd: (t: string) => void;
  defaultTaskDuration: number;
  setDefaultTaskDuration: (d: number) => void;
}

export default function SettingsView({
  isGCalConnected,
  userGCalEmail,
  onConnectGCal,
  onDisconnectGCal,
  onResetData,
  workdayStart,
  setWorkdayStart,
  workdayEnd,
  setWorkdayEnd,
  defaultTaskDuration,
  setDefaultTaskDuration
}: SettingsViewProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-2.5">
        <Settings className="w-5 h-5 text-indigo-400" />
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Settings & Customization</h2>
          <p className="text-xs text-zinc-500">Configure your workday, integrations, and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Menu options */}
        <div className="frosted-glass rounded-2xl p-5 space-y-2 h-fit shadow-lg">
          <button className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-500/10 border border-indigo-500/20 text-left">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Profile & Account</span>
          </button>
          <button className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 text-left transition">
            <Cloud className="w-4 h-4 text-zinc-500" />
            <span>Google Calendar Sync</span>
          </button>
          <button className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 text-left transition">
            <Bell className="w-4 h-4 text-zinc-500" />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 text-left transition">
            <Shield className="w-4 h-4 text-zinc-500" />
            <span>Privacy & Security</span>
          </button>
        </div>

        {/* Right: Actual Settings fields */}
        <div className="md:col-span-2 space-y-6">
          {/* Google Calendar card */}
          <div className="frosted-glass rounded-2xl p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <span>Google Calendar Integration</span>
            </h3>

            {isGCalConnected ? (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Sync Connection Active</h4>
                  <p className="text-sm text-zinc-200 mt-1">{userGCalEmail || "techseries358@gmail.com"}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Permissions granted to schedule task events automatically</p>
                </div>
                <button
                  onClick={onDisconnectGCal}
                  className="bg-zinc-800 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-500/20 text-zinc-300 border border-zinc-700 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Disconnect GCal
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status: Offline</h4>
                  <p className="text-xs text-zinc-500 mt-1">Connect your calendar to merge events and avoid overlaps</p>
                </div>
                <button
                  onClick={onConnectGCal}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Connect Calendar
                </button>
              </div>
            )}
          </div>

          {/* Work Hours Settings Card */}
          <div className="frosted-glass rounded-2xl p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white">Work Hours & Scheduling Limits</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Workday Starts
                </label>
                <input
                  type="time"
                  value={workdayStart}
                  onChange={(e) => setWorkdayStart(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Workday Ends
                </label>
                <input
                  type="time"
                  value={workdayEnd}
                  onChange={(e) => setWorkdayEnd(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Default Task Estimate (Minutes)
              </label>
              <select
                value={defaultTaskDuration}
                onChange={(e) => setDefaultTaskDuration(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 px-3.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
                <option value="90">90 Minutes</option>
              </select>
            </div>
          </div>

          {/* Danger Zone / Demo Reset Card */}
          <div className="frosted-glass rounded-2xl p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white">System Operations</h3>
            <p className="text-xs text-zinc-500">
              Clear your custom scheduler modifications and reload the original 6 tasks and 3 fixed Google Calendar events.
            </p>
            <button
              onClick={onResetData}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Reset Application Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
