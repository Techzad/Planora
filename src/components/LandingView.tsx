import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Calendar, ArrowRight, Shield, Clock, Zap, User, Mail, Lock, Eye, EyeOff, LayoutDashboard, ChevronRight, Star, Check, ChevronDown, Users, Flame, TrendingUp } from "lucide-react";
// @ts-ignore
import logoIcon from "../assets/images/lumina_logo_icon_1786225083037.jpg";

import { auth, googleProvider } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";

interface LandingViewProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
  isDarkMode: boolean;
}

export default function LandingView({ onLoginSuccess, isDarkMode }: LandingViewProps) {
  const [view, setView] = useState<"landing" | "login" | "signup">("landing");
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    setView("landing");
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Retrieve existing users or use placeholder
  const getRegisteredUsers = (): Array<{ name: string; email: string; password: string }> => {
    const raw = localStorage.getItem("aura_registered_users");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    }
    // Pre-register a default account for quick demo testing
    const defaultUser = { name: "Sarah Jenkins", email: "techseries358@gmail.com", password: "password123" };
    localStorage.setItem("aura_registered_users", JSON.stringify([defaultUser]));
    return [defaultUser];
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const u = {
          name: result.user.displayName || result.user.email?.split("@")[0] || "User",
          email: result.user.email || ""
        };
        localStorage.setItem("aura_user", JSON.stringify(u));
        onLoginSuccess(u);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
        const u = { name, email: email.toLowerCase() };
        localStorage.setItem("aura_user", JSON.stringify(u));
        onLoginSuccess(u);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else {
        setError(err.message || "Sign up failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      if (result.user) {
        const u = {
          name: result.user.displayName || result.user.email?.split("@")[0] || "User",
          email: result.user.email || ""
        };
        localStorage.setItem("aura_user", JSON.stringify(u));
        onLoginSuccess(u);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Sign in failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError("");
    setIsLoading(true);
    try {
      const demoEmail = "demo_sarah@planora.com";
      const demoPassword = "password123";
      try {
        const result = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        const u = {
          name: result.user.displayName || "Sarah Jenkins",
          email: demoEmail
        };
        localStorage.setItem("aura_user", JSON.stringify(u));
        onLoginSuccess(u);
      } catch (err: any) {
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/user-disabled") {
          const result = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          await updateProfile(result.user, { displayName: "Sarah Jenkins" });
          const u = { name: "Sarah Jenkins", email: demoEmail };
          localStorage.setItem("aura_user", JSON.stringify(u));
          onLoginSuccess(u);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error(err);
      const demoUser = { name: "Sarah Jenkins", email: "techseries358@gmail.com" };
      localStorage.setItem("aura_user", JSON.stringify(demoUser));
      onLoginSuccess(demoUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between theme-bg theme-text select-none overflow-x-hidden relative transition-colors duration-300`}>
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[180px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView("landing")}>
          <img
            src={logoIcon}
            alt="Planora"
            className="w-10 h-10 rounded-xl object-cover indigo-glow shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="brand-font font-black text-white text-xl tracking-wide block">Planora</span>
            <span className="brand-sub-font text-[10px] text-indigo-400 font-bold uppercase tracking-widest block -mt-1">AI Scheduler</span>
          </div>
        </div>

        {view === "landing" && (
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-zinc-400">
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition cursor-pointer">Features</button>
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition cursor-pointer">Integrations</button>
            <button onClick={() => scrollToSection("faq")} className="hover:text-white transition cursor-pointer">FAQ</button>
          </nav>
        )}

        <div className="flex items-center space-x-4">
          {view === "landing" ? (
            <>
              <button
                onClick={() => setView("login")}
                className="text-sm font-medium text-zinc-400 hover:text-white transition cursor-pointer px-3 py-1.5"
              >
                Sign In
              </button>
              <button
                onClick={() => setView("signup")}
                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Get Started
              </button>
            </>
          ) : (
            <button
              onClick={() => setView("landing")}
              className="text-sm font-medium text-zinc-400 hover:text-white transition cursor-pointer flex items-center space-x-1"
            >
              <span>Back to home</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Interactive Main Body Content */}
      <main className="flex-1 w-full relative z-10">
        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col relative z-10"
            >
              {/* Hero Section */}
              <section className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Side: Pitch Copy */}
                <div className="lg:col-span-6 space-y-6 text-left">
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>The Next-Gen Autonomous Scheduler</span>
                  </div>

                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none">
                    Plan Less. <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
                      Focus More.
                    </span>
                  </h1>

                  <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed">
                    Planora is a premium smart task organizer that auto-schedules your week around your real Google Calendar events, detects workflow conflicts instantly, and features manual high-priority drag-and-drop reordering.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                    <button
                      onClick={() => setView("signup")}
                      className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 transition cursor-pointer active:scale-95 group"
                    >
                      <span>Get Started Free</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={handleDemoAccess}
                      className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-zinc-300 hover:text-white hover:bg-slate-800/40 transition cursor-pointer active:scale-95"
                    >
                      <span>Instant Demo Access</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
                    <div>
                      <h4 className="text-xl font-bold text-white">100%</h4>
                      <p className="text-xs text-zinc-500">Secure Privacy</p>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Active</h4>
                      <p className="text-xs text-zinc-500">Conflict Guard</p>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Smart</h4>
                      <p className="text-xs text-zinc-500">Drag & Reorder</p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Stunning Dashboard Preview/Mockup */}
                <div className="lg:col-span-6 relative">
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl blur-2xl pointer-events-none" />
                  
                  {/* Visual Glass Card Mockup */}
                  <div className="relative border border-white/10 bg-slate-950/60 backdrop-blur-xl rounded-2xl p-6 shadow-2xl overflow-hidden text-left">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase ml-2">Planora Live Preview</span>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold">
                        🔥 5 Day Streak
                      </div>
                    </div>

                    {/* Active Queue Visual mock */}
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-900/40 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-indigo-400">☰</span>
                          <div>
                            <p className="text-xs font-bold text-white">Reorder high-priority tasks</p>
                            <p className="text-[10px] text-zinc-500">Active Task Queue (Drag & Drop)</p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">9:00 AM</span>
                      </div>

                      <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-zinc-500">☰</span>
                          <div>
                            <p className="text-xs font-semibold text-white">Review design layout systems</p>
                            <p className="text-[10px] text-zinc-500">Auto-Scheduled</p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">11:30 AM</span>
                      </div>

                      {/* Conflict notification mock */}
                      <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-center space-x-3">
                        <span className="text-rose-400">⚠️</span>
                        <div>
                          <p className="text-xs font-bold text-rose-300">Conflict Detected!</p>
                          <p className="text-[10px] text-rose-400/80">Task overlaps with "Client Presentation" on GCal.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>⚡ Optimized in 1.4s</span>
                      <span className="text-indigo-400 flex items-center cursor-pointer hover:underline" onClick={() => setView("signup")}>
                        Try it yourself <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Feature Grid Row Section */}
              <section id="features" className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/5 text-left">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Built for Maximum Productivity
                  </h2>
                  <p className="text-zinc-400 text-base leading-relaxed">
                    Planora coordinates your tasks, calendars, and focus blocks so you never have to worry about planning.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Card 1 */}
                  <div className="border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition p-6 rounded-2xl flex flex-col space-y-4 group">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">GCal Sync</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Sleek, real-time integration with your Google Calendar events. Keeps your entire workflow in perfect sync.
                    </p>
                  </div>
                  
                  {/* Card 2 */}
                  <div className="border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition p-6 rounded-2xl flex flex-col space-y-4 group">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Flame className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Streak Tracker</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Track your consistency. Keep your daily streak alive by completing auto-scheduled tasks and unlocking high-focus milestones.
                    </p>
                  </div>
                  
                  {/* Card 3 */}
                  <div className="border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition p-6 rounded-2xl flex flex-col space-y-4 group">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Focus Analytics</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Analyze your cognitive performance. Deep focus metrics reveal your most productive scheduling blocks and daily completion rates.
                    </p>
                  </div>
                  
                  {/* Card 4 */}
                  <div className="border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition p-6 rounded-2xl flex flex-col space-y-4 group">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Team Sharing</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Seamlessly collaborate with teammates. Share calendars, coordinate real-time task queues, and eliminate meeting conflicts.
                    </p>
                  </div>
                </div>
              </section>

              {/* Testimonials (Wall of Love) Section */}
              <section id="testimonials" className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/5 text-left">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Loved by High-Performers
                  </h2>
                  <p className="text-zinc-400 text-base leading-relaxed">
                    See why developers, managers, and creators rely on Planora to protect their time.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="border border-white/5 bg-slate-900/30 p-6 rounded-2xl flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-1 text-indigo-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-indigo-400" />
                        ))}
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed italic">
                        "Planora has completely transformed how I structure my day. The real-time GCal integration is flawless and prevents any overlapping meetings!"
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm uppercase">
                        AR
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Alex Rivera</h4>
                        <p className="text-xs text-zinc-500">Senior Frontend Engineer</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card 2 */}
                  <div className="border border-white/5 bg-slate-900/30 p-6 rounded-2xl flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-1 text-indigo-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-indigo-400" />
                        ))}
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed italic">
                        "No more calendar conflicts. The AI auto-scheduling resolves overlapping tasks instantly. It feels like having a personal administrative assistant."
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm uppercase">
                        MC
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Marcus Chen</h4>
                        <p className="text-xs text-zinc-500">Product Manager</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card 3 */}
                  <div className="border border-white/5 bg-slate-900/30 p-6 rounded-2xl flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-1 text-indigo-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-indigo-400" />
                        ))}
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed italic">
                        "The focus analytics helped me identify my peak productivity hours. I've increased my task completion rate by over 40% in just two weeks!"
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm uppercase">
                        SJ
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Sarah Jenkins</h4>
                        <p className="text-xs text-zinc-500">Creative Director</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>



              {/* FAQ Accordion Section */}
              <section id="faq" className="w-full max-w-4xl mx-auto px-6 py-24 border-t border-white/5 text-left">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                    Quick answers to our most common product questions.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {[
                    {
                      q: "How does Google Calendar synchronization work?",
                      a: "Planora safely syncs with your Google Calendar using secure OAuth. It reads your existing events and automatically schedules your tasks around them to prevent any overlaps."
                    },
                    {
                      q: "What is the AI Conflict Guard?",
                      a: "The AI Conflict Guard continuously monitors your queue. If a newly scheduled task overlaps with an existing GCal event or another high-priority task, it instantly highlights the conflict so you can drag and reorder."
                    },
                    {
                      q: "Can I use Planora completely offline?",
                      a: "Yes! Planora supports local storage, so all your schedules and streak tracking will be saved directly on your device even if you lose internet connection."
                    },
                    {
                      q: "Is my personal calendar data secure?",
                      a: "Absolutely. Your privacy is our absolute priority. We never store your personal calendar events on external servers; everything is kept secure and syncs directly in your client browser."
                    }
                  ].map((item, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div
                        key={index}
                        className="border border-white/5 bg-slate-900/20 rounded-xl overflow-hidden transition"
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-white text-base hover:bg-slate-900/40 transition cursor-pointer"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : ""}`}
                          />
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3"
                            >
                              {item.a}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Footer Section */}
              <footer className="w-full max-w-7xl mx-auto px-6 pt-16 pb-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-12 gap-8 text-left relative z-10">
                <div className="col-span-2 md:col-span-4 space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={logoIcon}
                      alt="Planora"
                      className="w-8 h-8 rounded-lg object-cover indigo-glow"
                      referrerPolicy="no-referrer"
                    />
                    <span className="brand-font font-black text-white text-md tracking-wider">Planora</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                    Plan Less. Focus More. Autonomous time management built for creators, engineers, and modern product teams.
                  </p>
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product</h4>
                  <ul className="space-y-2 text-xs text-zinc-500">
                    <li><button onClick={() => scrollToSection("features")} className="hover:text-zinc-300 transition text-left cursor-pointer">Features</button></li>
                    <li><button onClick={() => scrollToSection("features")} className="hover:text-zinc-300 transition text-left cursor-pointer">Integrations</button></li>
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">Security</span></li>
                  </ul>
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company</h4>
                  <ul className="space-y-2 text-xs text-zinc-500">
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">About Us</span></li>
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">Careers</span></li>
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">Press Kit</span></li>
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">Trust Center</span></li>
                  </ul>
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Resources</h4>
                  <ul className="space-y-2 text-xs text-zinc-500">
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">Developer Blog</span></li>
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">Documentation</span></li>
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">Help Center</span></li>
                    <li><span className="hover:text-zinc-300 transition cursor-pointer">API Status</span></li>
                  </ul>
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-3 flex flex-col justify-start items-start md:items-end">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                    <Star className="w-6 h-6 fill-white" />
                  </div>
                  <span className="text-[10px] text-zinc-600 mt-2 text-left md:text-right">Copyright &copy; {new Date().getFullYear()} Planora.</span>
                </div>
              </footer>
            </motion.div>
          ) : (
            <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-center py-10 min-h-[50vh]">
              {view === "signup" && (
                <motion.div
                  key="auth-signup"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md"
                >
              <div className="border border-white/10 bg-slate-950/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-left">
                <div className="mb-6">
                  <h2 className="brand-font text-2xl font-black text-white">Create your Account</h2>
                  <p className="text-sm text-zinc-400 mt-1">Get started with Planora in seconds.</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/5 focus:border-indigo-500/50 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/5 focus:border-indigo-500/50 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-white/5 focus:border-indigo-500/50 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign Up & Start Scheduling</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-4 flex items-center justify-center">
                  <span className="absolute px-3 bg-[#020617] text-xs text-zinc-500 font-semibold z-10">Or continue with</span>
                  <div className="w-full border-t border-white/5" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 font-bold rounded-xl transition cursor-pointer shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.845 15.53 1 12.24 1 5.48 1 0 6.48 0 13s5.48 12 12.24 12c7.05 0 11.75-4.97 11.75-11.95 0-.8-.08-1.41-.24-1.765H12.24z"/>
                  </svg>
                  <span>Sign Up with Google</span>
                </button>

                <div className="mt-6 pt-5 border-t border-white/5 text-center">
                  <p className="text-xs text-zinc-400">
                    Already have an account?{" "}
                    <button
                      onClick={() => setView("login")}
                      className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === "login" && (
            <motion.div
              key="auth-login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="border border-white/10 bg-slate-950/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-left">
                <div className="mb-6">
                  <h2 className="brand-font text-2xl font-black text-white">Sign In to Planora</h2>
                  <p className="text-sm text-zinc-400 mt-1">Pick up right where you left your schedules.</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/5 focus:border-indigo-500/50 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setError("For this demo, any password works as long as you've signed up! Otherwise use 'password123'");
                        }}
                        className="text-[10px] font-bold text-indigo-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-white/5 focus:border-indigo-500/50 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-4 flex items-center justify-center">
                  <span className="absolute px-3 bg-[#020617] text-xs text-zinc-500 font-semibold z-10">Or continue with</span>
                  <div className="w-full border-t border-white/5" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 font-bold rounded-xl transition cursor-pointer shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.845 15.53 1 12.24 1 5.48 1 0 6.48 0 13s5.48 12 12.24 12c7.05 0 11.75-4.97 11.75-11.95 0-.8-.08-1.41-.24-1.765H12.24z"/>
                  </svg>
                  <span>Sign In with Google</span>
                </button>

                <div className="mt-6 pt-5 border-t border-white/5 text-center">
                  <p className="text-xs text-zinc-400">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setView("signup")}
                      className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      Sign Up for free
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  </main>

      {/* Footer Branding */}
      {view !== "landing" && (
        <footer className="w-full py-6 border-t border-white/5 relative z-10 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>&copy; {new Date().getFullYear()} Planora Scheduler. All rights reserved.</span>
            <div className="flex items-center space-x-4">
              <span className="hover:text-zinc-300 cursor-pointer">Security</span>
              <span className="hover:text-zinc-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-zinc-300 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
