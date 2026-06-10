import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dumbbell, Salad, TrendingUp, Sparkles, MessageSquare, Shield, Info, Calendar } from "lucide-react";
import AnatomicalMap from "./components/AnatomicalMap";
import WorkoutBuilder from "./components/WorkoutBuilder";
import CalorieTracker from "./components/CalorieTracker";
import ProgressTracker from "./components/ProgressTracker";
import AICoach from "./components/AICoach";
import PlanScreen from "./ui/screens/PlanScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState<"routines" | "nutrition" | "progress" | "coach" | "plan">("routines");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  
  // Weights sync tracker count to force child re-renders on weight logging
  const [lastWeightLogged, setLastWeightLogged] = useState<number>(181.5);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Quick weight logged synchronization helper
  const handleWeightLoggedExternally = (newWeight: number) => {
    setLastWeightLogged(newWeight);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div id="body_build_health_root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-lime-500/30 selection:text-lime-100 antialiased">
      
      {/* Dynamic Background Noise/Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative Blueprint Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* GLOBAL APPLICATION HEADER */}
      <header id="main_header" className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md py-5 px-6 shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime-400 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.25)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold tracking-widest bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded-md uppercase">Bento Core</span>
                <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-lime-450" /> Secure Active Proxy
                </span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-white font-sans mt-0.5">
                BodyBuild<span className="text-lime-400">Health</span>
              </h1>
            </div>
          </div>

          {/* SATELLITE ATHLETE STATS MODULE */}
          <div className="flex items-center gap-5 self-start sm:self-auto ml-1">
            <div className="flex items-center gap-6 bg-slate-900/40 border border-slate-800 px-4 py-2 rounded-2xl shadow-inner">
              <div className="font-mono text-right">
                <span className="text-[9px] text-slate-505 block uppercase tracking-wider font-semibold">Current Weight</span>
                <span className="text-white font-bold text-xs">{lastWeightLogged} lbs</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="font-mono text-right">
                <span className="text-[9px] text-slate-505 block uppercase tracking-wider font-semibold">Today's Split</span>
                <span className="text-lime-450 font-bold text-xs flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" /> Upper Push
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-800 pl-5">
              <div className="text-right hidden md:block">
                <p className="text-[10px] text-slate-400">Athlete Profile</p>
                <p className="text-xs font-semibold text-white">Alex Rivers</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-lime-400 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold uppercase text-lime-400 font-mono">AR</div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* MASTER COCKPIT NAVIGATION TAB SLIDER */}
      <nav id="dashboard_tabs" className="bg-slate-950 border-b border-slate-900 py-3 px-6 z-10 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pr-2 scrollbar-none">
          
          <button
            onClick={() => setActiveTab("routines")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "routines"
                ? "bg-slate-900 text-lime-400 border border-slate-805 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Dumbbell className={`w-4 h-4 ${activeTab === "routines" ? "text-lime-400" : "text-slate-400"}`} />
            Routines & Muscle Map
          </button>

          <button
            onClick={() => setActiveTab("nutrition")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "nutrition"
                ? "bg-slate-900 text-lime-400 border border-slate-805 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-205"
            }`}
          >
            <Salad className={`w-4 h-4 ${activeTab === "nutrition" ? "text-lime-400" : "text-slate-400"}`} />
            Nutrition & AI Meals
          </button>

          <button
            onClick={() => setActiveTab("progress")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "progress"
                ? "bg-slate-900 text-lime-400 border border-slate-805 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-205"
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === "progress" ? "text-lime-400" : "text-slate-400"}`} />
            Progression logs
          </button>

          <button
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "plan"
                ? "bg-slate-900 text-lime-400 border border-slate-805 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-205"
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === "plan" ? "text-lime-400" : "text-slate-400"}`} />
            Weekly Plan
          </button>

          <button
            onClick={() => setActiveTab("coach")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "coach"
                ? "bg-slate-900 text-lime-400 border border-slate-850 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                : "text-slate-400 hover:text-slate-205"
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${activeTab === "coach" ? "text-lime-400" : "text-slate-400"}`} />
            Coach Iron Chat
            <span className="flex items-center gap-0.5 text-[9px] bg-lime-950 border border-lime-900/50 text-lime-400 px-1.5 py-0.25 rounded-md font-mono animate-pulse">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          </button>

        </div>
      </nav>

      {/* DASHBOARD CONTAINER SYSTEM */}
      <main id="dashboard_main" className="flex-1 py-6 px-6 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto h-full">
          
          <AnimatePresence mode="wait">
            
            {activeTab === "routines" && (
              <motion.div
                key="routines-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
              >
                {/* Visual muscle selector filters */}
                <div className="xl:col-span-4 h-full">
                  <AnatomicalMap
                    selectedMuscle={muscleFilter}
                    onSelectMuscle={setMuscleFilter}
                  />
                </div>
                {/* Routines Scheduler and Builder block */}
                <div className="xl:col-span-8">
                  <WorkoutBuilder
                    onAddProgressRecord={handleWeightLoggedExternally}
                    selectedMuscleFilter={muscleFilter}
                    onClearMuscleFilter={() => setMuscleFilter(null)}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "nutrition" && (
              <motion.div
                key="nutrition-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CalorieTracker />
              </motion.div>
            )}

            {activeTab === "progress" && (
              <motion.div
                key="progress-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ProgressTracker
                  onWeightLoggedExternally={handleWeightLoggedExternally}
                  onRefreshTrigger={refreshTrigger}
                />
              </motion.div>
            )}

            {activeTab === "plan" && (
              <motion.div
                key="plan-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PlanScreen />
              </motion.div>
            )}

            {activeTab === "coach" && (
              <motion.div
                key="coach-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-4xl mx-auto"
              >
                <AICoach />
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

      {/* FOOTER DESIGNS */}
      <footer id="global_footer" className="py-4 border-t border-slate-900 bg-slate-950/60 font-mono text-center text-[10px] text-slate-600 shrink-0 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <p>BodyBuildHealth — Designed for peak anabolic Hypertrophy</p>
          <div className="flex gap-4 justify-center">
            <span>ISO Standard 1.6-2.2g Protein Ratio</span>
            <span>·</span>
            <span>Local Storage Sandboxed</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
