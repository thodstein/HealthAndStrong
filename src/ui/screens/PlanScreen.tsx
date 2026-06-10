import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Dumbbell, 
  Plus, 
  Trash2, 
  Sparkles, 
  Trophy, 
  Check, 
  Clock, 
  Search, 
  ChevronRight, 
  BarChart2, 
  ListTodo, 
  Target
} from "lucide-react";

// Types matching the workout structure
interface MealPlan {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  items: string[];
}

interface MuscleTarget {
  name: string;
  volumeTarget: number; // Sets per week
  volumeDone: number;
}

export default function PlanScreen() {
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [showAiRecommendations, setShowAiRecommendations] = useState<boolean>(true);
  const [customGoal, setCustomGoal] = useState<string>("");
  
  // Local storage or state-driven workout goals
  const [goals, setGoals] = useState<string[]>([
    "Increase total weekly chest sets to 16",
    "Consistently log 150g+ protein daily",
    "Record tempo variables for Barbell Squats"
  ]);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Mock schedule data for preview/download alignment
  const scheduleDayPlans: Record<string, { title: string; focus: string; duration: number; exercises: string[]; intensity: string }> = {
    Monday: {
      title: "Upper Body Hypertrophy",
      focus: "Chest, Back, Shoulders",
      duration: 65,
      exercises: ["Bench Press (4 sets x 8 reps)", "Weighted Pull-Ups (4 sets x 6 reps)", "Dumbbell Lateral Raises (3 sets x 12 reps)", "Incline DB Flyes (3 sets x 10 reps)"],
      intensity: "High"
    },
    Tuesday: {
      title: "Lower Body Quad Focus",
      focus: "Quads, Calves, Core",
      duration: 70,
      exercises: ["Barbell Back Squat (4 sets x 8 reps)", "Leg Press (3 sets x 12 reps)", "Leg Extensions (3 sets x 15 reps)", "Standing Calf Raises (4 sets x 20 reps)"],
      intensity: "vHigh"
    },
    Wednesday: {
      title: "Active Recovery Cycle",
      focus: "Mobility & Zone 2 Cardio",
      duration: 45,
      exercises: ["Dynamic Hip & Shoulder Warmup", "Incline Treadmill Walk (30 mins)", "Deep Posterior Chain Stretching"],
      intensity: "Low"
    },
    Thursday: {
      title: "Posterior Chain Overload",
      focus: "Hamstrings, Glutes, Back Width",
      duration: 60,
      exercises: ["Romanian Deadlifts (4 sets x 10 reps)", "Barbell Rows (4 sets x 8 reps)", "Lying Leg Curls (3 sets x 12 reps)", "Face Pulls (3 sets x 15 reps)"],
      intensity: "High"
    },
    Friday: {
      title: "Arms & Deltoid Pump",
      focus: "Biceps, Triceps, Lateral Delts",
      duration: 50,
      exercises: ["Incline Dumbbell Curls (3 sets x 12 reps)", "Tricep Overhead Extensions (3 sets x 12 reps)", "Hammer Curls (3 sets x 10 reps)", "Dips (3 sets x Max reps)"],
      intensity: "Medium"
    },
    Saturday: {
      title: "Off-Day Rest Phase",
      focus: "Protein Synthesis & Connective Tissue Repair",
      duration: 0,
      exercises: ["Sufficient sleep (8-9 hours)", "Optimal hydration check (3L+ water)"],
      intensity: "None"
    },
    Sunday: {
      title: "Conditioning & Performance",
      focus: "Full Body Work capacity",
      duration: 45,
      exercises: ["Kettlebell Swings (4 sets x 20 reps)", "Sandbag Carries (3 laps x 50m)", "Hanging Leg Raises (3 sets to failure)"],
      intensity: "Medium"
    }
  };

  const muscleVolumeStatus: MuscleTarget[] = [
    { name: "Chest", volumeTarget: 16, volumeDone: 11 },
    { name: "Back", volumeTarget: 16, volumeDone: 14 },
    { name: "Quads", volumeTarget: 12, volumeDone: 8 },
    { name: "Hamstrings", volumeTarget: 12, volumeDone: 10 },
    { name: "Shoulders", volumeTarget: 14, volumeDone: 9 },
    { name: "Arms", volumeTarget: 10, volumeDone: 6 }
  ];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;
    setGoals([...goals, customGoal.trim()]);
    setCustomGoal("");
  };

  const handleDeleteGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const activePlan = scheduleDayPlans[selectedDay];

  return (
    <div id="plan_screen_root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 font-sans">
      
      {/* Header section with specific BodyBuildHealth visual cues */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest bg-lime-400/10 text-lime-400 px-2.5 py-1 rounded-md uppercase font-bold">
              Screen Module
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500">Live Client Workspace Tracker</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1.5">
            Hypertrophy Planner <span className="text-lime-400">Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Design and review your weekly training splits, volume progression targets, and fitness checkpoints.
          </p>
        </div>

        {/* Sync details */}
        <div className="bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 self-start md:self-auto font-mono text-[11px]">
          <Calendar className="w-4 h-4 text-lime-400" />
          <div>
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Plan Sync State</span>
            <span className="text-white font-semibold">Ready to Sync with Local Storage</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPACT SECTION: Weekly Calendar Navigator */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center justify-between">
              <span>Weekly Split Schedule</span>
              <Clock className="w-3.5 h-3.5 text-slate-500" />
            </h3>

            <div className="flex flex-col gap-2">
              {daysOfWeek.map((day) => {
                const isSelected = selectedDay === day;
                const doc = scheduleDayPlans[day];
                const isRest = doc.duration === 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-slate-950 border-lime-404 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.1)]"
                        : "bg-slate-950/45 border-slate-800/80 hover:border-slate-700/80"
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isSelected ? "text-lime-400" : "text-slate-505"}`}>
                        {day}
                      </span>
                      <h4 className={`text-xs font-bold mt-0.5 ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {doc.title}
                      </h4>
                    </div>
                    
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-medium ${
                      isRest 
                        ? "bg-amber-950/30 text-amber-400 border border-amber-900/40" 
                        : "bg-slate-900 text-slate-400"
                    }`}>
                      {isRest ? "REST" : `${doc.duration}m`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Muscle Volume Periodization Targets */}
          <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center justify-between">
              <span>Weekly Hypertrophy Targets</span>
              <BarChart2 className="w-3.5 h-3.5 text-lime-400" />
            </h3>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Target sets weekly to drive consistent muscle protein synthesis. Filter with the Anatomical Map.
            </p>

            <div className="flex flex-col gap-3.5">
              {muscleVolumeStatus.map((target) => {
                const progressPercentage = Math.min(100, Math.round((target.volumeDone / target.volumeTarget) * 107));
                return (
                  <div key={target.name}>
                    <div className="flex justify-between items-center text-xs font-mono mb-1">
                      <span className="font-bold text-slate-200">{target.name}</span>
                      <span className="text-[11px] text-slate-400">
                        <strong className="text-lime-400">{target.volumeDone}</strong> / {target.volumeTarget} Sets
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="bg-lime-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT METABOLIC COMPACT: Active Day Tracker & Dynamic Goals */}
        <div className="xl:col-span-8 flex flex-col gap-6">

          {/* Rest / Exercise Action card */}
          <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            
            {/* Ambient Background Grid Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/60 mb-5">
              <div>
                <span className="text-[9px] bg-slate-950 text-slate-400 font-mono border border-slate-850 px-2 py-0.5 rounded-full uppercase">
                  Daily Detailed Schedule
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">
                  {selectedDay} Split Blueprint
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 font-sans">Workout Focus:</span>
                <span className="text-xs text-lime-400 bg-lime-950/25 border border-lime-900/50 px-3 py-1 rounded-xl font-bold font-mono">
                  {activePlan.focus}
                </span>
              </div>
            </div>

            {/* List of routine items */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Planned Movements ({activePlan.exercises.length})</h4>
              
              {activePlan.exercises.map((item, index) => (
                <div key={index} className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-lime-400 text-xs font-bold font-mono border border-slate-800">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">{item.split(" (")[0]}</p>
                      <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                        {item.includes("(") ? item.substring(item.indexOf("(")) : "Custom Intensity Routine"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded-md font-mono font-semibold">
                    Target Hypertrophy
                  </span>
                </div>
              ))}
            </div>

            {/* Intensity Warning or restorative guidelines */}
            <div className="mt-5 p-4 bg-slate-950/50 border border-slate-850 rounded-2xl flex gap-3 text-xs text-slate-450 leading-relaxed">
              <Trophy className="w-5 h-5 text-lime-405 text-lime-400 shrink-0" />
              <div>
                <strong>Active Muscle Intensity: {activePlan.intensity} Overload</strong>
                <p className="mt-0.5 text-slate-400 font-sans">
                  Ensure strict eccentric control on first compound movements. Hydrate sufficiently 45 minutes prior to load.
                </p>
              </div>
            </div>
          </div>

          {/* GOALS MANAGEMENT SYSTEM (JSX enclosed correctly in fragment) */}
          <div className="bg-slate-900 border border-slate-855 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-lime-400" /> Goal Checkpoints & Focus Benchmarks
            </h3>
            <p className="text-[11.5px] text-slate-400 mb-4 font-sans leading-relaxed">
              Define your custom periodization guidelines, calorie/carb ratios, or personal record goals for this mesocycle.
            </p>

            <form onSubmit={handleAddGoal} className="flex gap-2.5 mb-5">
              <input
                type="text"
                placeholder="Next performance goal (e.g. increase squat 10 lbs, strict pull-ups)..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-lime-400 px-4 py-2 text-xs text-white rounded-xl focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-lime-400 hover:bg-lime-350 text-black font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Goal
              </button>
            </form>

            <div className="flex flex-col gap-2">
              {goals.map((g, idx) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-lime-950 border border-lime-900/55 rounded flex items-center justify-center">
                      <Check className="w-3 h-3 text-lime-400" />
                    </span>
                    <span className="text-slate-205 font-medium">{g}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(idx)}
                    className="p-1 hover:bg-slate-900 rounded-md text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {goals.length === 0 && (
                <p className="text-xs text-slate-505 italic text-center py-4 bg-slate-950/30 rounded-xl">
                  No checkpoints. Add one above.
                </p>
              )}
            </div>
          </div>

          {/* AI COACH MEAL PREP SUGGESTION PANEL WITH CORRECT JSX PARENT */}
          {showAiRecommendations && (
            <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-3">
                <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-lime-400 animate-pulse" /> AI Split Generation Assistant
                </span>
                <button 
                  onClick={() => setShowAiRecommendations(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-350 cursor-pointer"
                >
                  Dismiss Tip
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Based on your preference for <strong className="text-slate-250">Muscle Hypertrophy</strong>, your weekly schedule shows a total volume of <strong>64 sets</strong>.
                For enhanced muscle tissue synthesis, maintain your protein intake at <strong>1.6 to 2.2 grams per kilogram</strong> of target body mass (~181 lbs Athlete current profile). 
                Make sure you log your completed workouts regularly in the "Progression logs" menu to adapt volume parameters continuously.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
