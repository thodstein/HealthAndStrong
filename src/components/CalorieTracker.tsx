import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Plus, Trash2, Salad, Info, Utensils, Award, RefreshCw } from "lucide-react";
import { MealLog } from "../types";

export default function CalorieTracker() {
  // Saved daily logs
  const [meals, setMeals] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem("bbh_meals");
    return saved ? JSON.parse(saved) : [];
  });

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Target goals
  const [calorieTarget] = useState(2500);
  const [proteinTarget] = useState(170); // grams
  const [carbsTarget] = useState(260); // grams
  const [fatTarget] = useState(75); // grams

  // Manual Input State
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualMealName, setManualMealName] = useState("");
  const [manualCals, setManualCals] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

  // AI Parser Input State
  const [mealDescription, setMealDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Temporary container for analyzed AI results before user commits
  const [pendingMeal, setPendingMeal] = useState<{
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    breakdown: string;
  } | null>(null);

  // Save changes
  useEffect(() => {
    localStorage.setItem("bbh_meals", JSON.stringify(meals));
  }, [meals]);

  // Aggregate totals
  const totalCals = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  // Manual Log Food item
  const handleLogManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMealName.trim()) return;

    const newMeal: MealLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      mealName: manualMealName,
      calories: Math.max(0, parseInt(manualCals) || 0),
      protein: Math.max(0, parseInt(manualProtein) || 0),
      carbs: Math.max(0, parseInt(manualCarbs) || 0),
      fat: Math.max(0, parseInt(manualFat) || 0),
      breakdown: "Manually entered bodybuilding intake.",
    };

    setMeals([newMeal, ...meals]);
    // Reset manual fields
    setManualMealName("");
    setManualCals("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    setIsManualInput(false);
  };

  // Run AI food deconstructor on description
  const handleAiDeconstruct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDescription.trim()) return;

    setIsAnalyzing(true);
    setAiError(null);
    setPendingMeal(null);

    try {
      const response = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze your meal description.");
      }

      setPendingMeal(data);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Could not deconstruct your meal. Check Secrets API installation.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Commit pending AI Meal into persistent tracker
  const handleApprovePendingMeal = () => {
    if (!pendingMeal) return;

    const newMeal: MealLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      ...pendingMeal,
    };

    setMeals([newMeal, ...meals]);
    setPendingMeal(null);
    setMealDescription("");
  };

  // Delete log item
  const handleDeleteMeal = (id: string) => {
    setMeals(meals.filter((m) => m.id !== id));
  };

  // Clear all for the day
  const handleClearAllMeals = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAllMeals = () => {
    setMeals([]);
    setShowClearConfirm(false);
  };

  return (
    <>
      <div id="calorie_tracker_root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Nutrition Status Rings and Counters */}
      <div className="lg:col-span-12 flex flex-col gap-6">
        
        {/* Dynamic macro target status board */}
        <div id="nutrition_targets_board" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden">
          
          {/* Calorie Progress Card */}
          <div className="md:border-r border-slate-800/80 pr-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-505 uppercase tracking-widest block font-bold">Intake Energy</span>
              <h2 className="text-3xl font-extrabold font-mono text-slate-100 mt-2">
                {totalCals} <span className="text-sm font-medium text-slate-500">/ {calorieTarget} kcal</span>
              </h2>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                <div
                  className="bg-lime-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCals / calorieTarget) * 105)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                {Math.round((totalCals / calorieTarget) * 100)}% of daily allowance completed
              </p>
            </div>
          </div>

          {/* Protein Counter */}
          <div className="md:border-r border-slate-800/80 md:px-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-blue-400">Protein (Growth)</span>
              <h2 className="text-2xl font-bold font-mono text-slate-100 mt-2">
                {totalProtein}g <span className="text-xs font-medium text-slate-500">/ {proteinTarget}g</span>
              </h2>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalProtein / proteinTarget) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                Supports muscle repair synthesis
              </p>
            </div>
          </div>

          {/* Carbs Counter */}
          <div className="md:border-r border-slate-800/80 md:px-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-amber-400">Glucose (Energy)</span>
              <h2 className="text-2xl font-bold font-mono text-slate-100 mt-2">
                {totalCarbs}g <span className="text-xs font-medium text-slate-500">/ {carbsTarget}g</span>
              </h2>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalCarbs / carbsTarget) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                Replenishes muscle glycogen stores
              </p>
            </div>
          </div>

          {/* Fat Counter */}
          <div className="md:px-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-purple-400">Fat (Hormones)</span>
              <h2 className="text-2xl font-bold font-mono text-slate-100 mt-2">
                {totalFat}g <span className="text-xs font-medium text-slate-500">/ {fatTarget}g</span>
              </h2>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalFat / fatTarget) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                Regulates essential hormone production
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* LEFT COLUMN: Input and logs */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Gemini-Powered Natural Deconstructor Form */}
        <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">AI Macro Deconstructor</h3>
            <span className="flex items-center gap-1 text-[11px] bg-lime-400/10 text-lime-400 border border-lime-400/20 px-2.5 py-0.5 rounded-full font-mono">
              <Sparkles className="w-3 h-3 text-lime-400 shadow-sm" /> Gemini AI
            </span>
          </div>

          <p className="text-xs text-slate-405 mb-5 leading-relaxed">
            Hate checking labels? Simply write out what you consumed, and our AI Trainer will calculate realistic macronutrient values for you!
          </p>

          <form onSubmit={handleAiDeconstruct} className="flex flex-col gap-4">
            <textarea
              placeholder="e.g., A post-workout smoothie containing 1 scoop of chocolate whey protein, a medium banana, a tablespoon of organic peanut butter, and 1 cup of unsweetened almond milk..."
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              className="w-full h-28 bg-slate-950 border border-slate-805 hover:border-slate-800 focus:border-lime-400 rounded-xl p-3 text-xs text-white placeholder-slate-650 focus:outline-none resize-none transition-colors"
              required
            />
            
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsManualInput(!isManualInput)}
                className="text-[11px] text-lime-404 hover:underline font-mono text-lime-400"
              >
                {isManualInput ? "Use AI Analyzer" : "Switch to Manual Log"}
              </button>
              
              <button
                type="submit"
                disabled={isAnalyzing || !mealDescription.trim()}
                className="py-2 px-5 bg-lime-400 hover:bg-lime-300 disabled:bg-slate-800 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-black" /> Deconstruct Meal
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-start gap-2 text-[11px] text-red-500 leading-relaxed font-sans">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>
                  {aiError}
                  <br />
                  <span className="text-slate-400">
                    Switch to manual entry below to record details directly.
                  </span>
                </span>
              </div>
            )}
          </form>

          {/* COMMITTING AI RESULTS COMPONENT */}
          {pendingMeal && (
            <div className="mt-5 p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col gap-3.5">
              <span className="text-[10px] font-mono text-lime-400 uppercase tracking-widest font-bold block">
                Detected Nutrients
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">{pendingMeal.mealName}</h4>
                <p className="text-[11px] text-slate-405 mt-1 pl-1 italic border-l-2 border-slate-800">
                  💡 {pendingMeal.breakdown}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono py-2 bg-slate-900/55 rounded-xl border border-slate-900">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-bold">CALORIES</span>
                  <strong className="text-lime-400 text-sm mt-0.5">{pendingMeal.calories}</strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-blue-400">PROTEIN</span>
                  <strong className="text-blue-400 text-sm mt-0.5">{pendingMeal.protein}g</strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-amber-400">CARBS</span>
                  <strong className="text-amber-400 text-sm mt-0.5">{pendingMeal.carbs}g</strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-purple-400">FAT</span>
                  <strong className="text-purple-400 text-sm mt-0.5">{pendingMeal.fat}g</strong>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApprovePendingMeal}
                  className="flex-1 py-1.5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs rounded-lg transition-colors shadow"
                >
                  Log To History
                </button>
                <button
                  onClick={() => setPendingMeal(null)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-450 text-xs rounded-lg transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual Input form */}
        {isManualInput && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">Manual Macro Input</h3>
              <button onClick={() => setIsManualInput(false)} className="text-xs text-slate-505 hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleLogManual} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1">Meal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Greek Yogurt bowl, Snack bar"
                  value={manualMealName}
                  onChange={(e) => setManualMealName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 block mb-1">Cals (kcal)</label>
                  <input
                    type="number"
                    value={manualCals}
                    onChange={(e) => setManualCals(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 block mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-lime-400 hover:bg-lime-300 mt-2 text-black font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Assemble and Log Manual meal
              </button>
            </form>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Logged foods history for the day */}
      <div id="calorie_history_dashboard" className="lg:col-span-12">
        <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">Today's Intake Log</h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">Chronological bodybuilding meals list</p>
              </div>

              {meals.length > 0 && (
                <button
                  id="calorie_reset_all_meals_btn"
                  onClick={handleClearAllMeals}
                  className="text-[10.5px] text-slate-500 hover:text-red-400 font-mono transition-colors"
                >
                  Clear All Today
                </button>
              )}
            </div>

            {meals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Salad className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 italic">No food logged today yet. Use the macro deconstructor to start.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
                {meals.map((m) => (
                  <div key={m.id} className="bg-slate-950/75 border border-slate-850 p-4 rounded-2xl flex items-center justify-between gap-4 flex-wrap hover:border-slate-800 transition-all">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-lime-400 font-semibold bg-lime-950/30 px-1.5 py-0.5 rounded">
                          {m.timestamp}
                        </span>
                        <h4 className="text-[13px] font-bold text-slate-200">{m.mealName}</h4>
                      </div>
                      {m.breakdown && m.breakdown !== "Manually entered bodybuilding intake." && (
                        <p className="text-[10px] text-slate-400 mt-1 italic pl-1 border-l border-slate-800 leading-relaxed">
                          💡 <strong>Nutritionist Note:</strong> {m.breakdown}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap justify-between md:justify-end">
                      {/* Macros blocks */}
                      <div className="flex gap-3 text-center text-[10px] font-mono">
                        <div className="bg-slate-900 border border-slate-850 px-2 py-1 rounded">
                          <span className="text-slate-505 font-bold">ENERGY</span>
                          <strong className="block text-lime-400 text-xs mt-0.5">{m.calories}kcal</strong>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 px-2 py-1 rounded">
                          <span className="text-blue-450 font-bold">P</span>
                          <strong className="block text-blue-400 text-xs mt-0.5">{m.protein}g</strong>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 px-2 py-1 rounded">
                          <span className="text-amber-450 font-bold">C</span>
                          <strong className="block text-amber-400 text-xs mt-0.5">{m.carbs}g</strong>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 px-2 py-1 rounded">
                          <span className="text-purple-450 font-bold">F</span>
                          <strong className="block text-purple-400 text-xs mt-0.5">{m.fat}g</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMeal(m.id)}
                        className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-550 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div id="calorie_tracker_footer" className="mt-6 pt-4 border-t border-slate-850 flex items-center gap-3 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-850">
            <Award className="w-5 h-5 text-lime-400 shrink-0" />
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              <strong>Bodybuilder Protip:</strong> Keep daily protein consistent (1.6 - 2.2 grams per kilogram / 0.8-1g per pound) to sustain optimal hypertrophic rate.
            </p>
          </div>
        </div>
      </div>
    </div>

    <AnimatePresence>
      {showClearConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 15 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm shadow-2xl flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-red-950/40 text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-900/50">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Clear Intake Logs?</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to completely clear your daily bodybuilding meal log? This cannot be undone.
            </p>
            <div className="flex gap-2.5 mt-5 w-full">
              <button
                onClick={confirmClearAllMeals}
                className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
