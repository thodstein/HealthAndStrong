import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dumbbell, Plus, Trash2, Sparkles, Trophy, CheckSquare, Square, Play, X, Info } from "lucide-react";
import { WorkoutProgram, WorkoutDay, Exercise, ActiveWorkoutSession, ActiveExerciseSession, ActiveSet } from "../types";
import { DEFAULT_WORKOUT_PROGRAMS, CURATED_EXERCISES } from "../exerciseData";

interface WorkoutBuilderProps {
  onAddProgressRecord?: (weight: number) => void;
  selectedMuscleFilter: string | null;
  onClearMuscleFilter: () => void;
}

export default function WorkoutBuilder({ onAddProgressRecord, selectedMuscleFilter, onClearMuscleFilter }: WorkoutBuilderProps) {
  // Programs loading and storage
  const [programs, setPrograms] = useState<WorkoutProgram[]>(() => {
    const saved = localStorage.getItem("bbh_programs");
    return saved ? JSON.parse(saved) : DEFAULT_WORKOUT_PROGRAMS;
  });
  const [selectedProgramIdx, setSelectedProgramIdx] = useState<number>(0);

  // Active Program being monitored
  const currentProgram = programs[selectedProgramIdx] || null;

  // AI Generation States
  const [equipment, setEquipment] = useState("Full Gym");
  const [level, setLevel] = useState("Intermediate");
  const [goals, setGoals] = useState("Muscle Hypertrophy");
  const [frequency, setFrequency] = useState("3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Manual Add States
  const [isAddingExercise, setIsAddingExercise] = useState<number | null>(null); // day Index
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("Chest");
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState("8-12");
  const [newExTempo, setNewExTempo] = useState("3-0-1-0");
  const [newExCue, setNewExCue] = useState("Controlled tempo, squeeze muscle.");

  // Manual Program Creation States
  const [createNewProgramName, setCreateNewProgramName] = useState("");
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);

  // Active running workout session tracker
  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(() => {
    const saved = localStorage.getItem("bbh_active_session");
    return saved ? JSON.parse(saved) : null;
  });

  // Native dialog replacement states
  const [modalAlert, setModalAlert] = useState<{ title: string; message: string } | null>(null);
  const [modalConfirm, setModalConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Persist workouts
  useEffect(() => {
    localStorage.setItem("bbh_programs", JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem("bbh_active_session", JSON.stringify(activeSession));
    } else {
      localStorage.removeItem("bbh_active_session");
    }
  }, [activeSession]);

  // AI Program Generation Call
  const generateAiProgram = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const response = await fetch("/api/workout/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment,
          level,
          goals,
          days: frequency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate workout schedule.");
      }

      // Prepend or add generated program to programs list
      setPrograms([data, ...programs]);
      setSelectedProgramIdx(0);
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || "Ensure server is configured and Secrets/API keys are set.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Add empty routine program
  const handleCreateEmptyProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNewProgramName.trim()) return;

    const newProg: WorkoutProgram = {
      programName: createNewProgramName,
      summary: "Custom user routine program.",
      splits: [
        { dayName: "Day 1: Training Day", focus: "All Muscle Groups", isRestDay: false, exercises: [] },
        { dayName: "Day 2: Rest Day", focus: "Recovery Cycle", isRestDay: true, exercises: [] }
      ]
    };

    setPrograms([...programs, newProg]);
    setSelectedProgramIdx(programs.length);
    setCreateNewProgramName("");
    setIsCreatingProgram(false);
  };

  // Delete program
  const handleDeleteProgram = (idx: number) => {
    if (programs.length <= 1) {
      setModalAlert({
        title: "Deletion Restricted",
        message: "You must retain at least one workout routine profile in your system logs."
      });
      return;
    }
    const filtered = programs.filter((_, i) => i !== idx);
    setPrograms(filtered);
    setSelectedProgramIdx(0);
  };

  // Delete exercise
  const handleDeleteExercise = (dayIdx: number, exerciseIdx: number) => {
    const updated = [...programs];
    updated[selectedProgramIdx].splits[dayIdx].exercises = updated[selectedProgramIdx].splits[dayIdx].exercises.filter(
      (_, i) => i !== exerciseIdx
    );
    setPrograms(updated);
  };

  // Add customized exercise
  const handleAddExerciseSubmit = (dayIdx: number) => {
    if (!newExName.trim()) return;

    const newEx: Exercise = {
      name: newExName,
      sets: newExSets,
      reps: newExReps,
      tempo: newExTempo,
      cue: newExCue,
      targetMuscle: newExMuscle,
    };

    const updated = [...programs];
    updated[selectedProgramIdx].splits[dayIdx].exercises.push(newEx);
    setPrograms(updated);

    // Reset States
    setNewExName("");
    setNewExSets(3);
    setNewExReps("8-12");
    setNewExTempo("3-0-1-0");
    setNewExCue("Controlled tempo, squeeze muscle.");
    setIsAddingExercise(null);
  };

  // Add default curated exercise directly to training day
  const handleAddCuratedExercise = (dayIdx: number, curated: typeof CURATED_EXERCISES[0]) => {
    const newEx: Exercise = {
      name: curated.name,
      sets: 3,
      reps: "8-12",
      tempo: "3-0-1-0",
      cue: curated.instructions,
      targetMuscle: curated.muscle,
    };

    const updated = [...programs];
    updated[selectedProgramIdx].splits[dayIdx].exercises.push(newEx);
    setPrograms(updated);
    setIsAddingExercise(null);
  };

  // Start Workout Active Logic
  const handleStartWorkout = (day: WorkoutDay) => {
    if (day.isRestDay || day.exercises.length === 0) {
      setModalAlert({
        title: "No Available Workout Tasks",
        message: "There are no customizable exercises defined for this schedule today. Define movements or select an training split first."
      });
      return;
    }

    const sessions: ActiveExerciseSession[] = day.exercises.map((ex) => {
      const sets: ActiveSet[] = [];
      for (let i = 1; i <= ex.sets; i++) {
        sets.push({
          setNum: i,
          weight: "45", // default weight
          reps: ex.reps.includes("-") ? ex.reps.split("-")[1] : ex.reps,
          completed: false,
        });
      }
      return {
        exerciseName: ex.name,
        targetSetsCount: ex.sets,
        targetRepsRange: ex.reps,
        targetMuscle: ex.targetMuscle,
        sets,
      };
    });

    const session: ActiveWorkoutSession = {
      dayName: day.dayName,
      focus: day.focus,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      exercises: sessions,
    };

    setActiveSession(session);
  };

  // Complete set checkbox
  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    updated.exercises[exIdx].sets[setIdx].completed = !updated.exercises[exIdx].sets[setIdx].completed;
    setActiveSession(updated);
  };

  // Update set weight or reps
  const handleUpdateActiveSet = (exIdx: number, setIdx: number, field: "weight" | "reps", value: string) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    updated.exercises[exIdx].sets[setIdx][field] = value;
    setActiveSession(updated);
  };

  // Finish active workout log
  const handleFinishWorkout = () => {
    if (!activeSession) return;
    
    // Save to historical workout summary if desired
    const totalVolume = activeSession.exercises.reduce((acc, ex) => {
      const completedSets = ex.sets.filter(s => s.completed);
      const exerciseVolume = completedSets.reduce((sum, s) => {
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        return sum + (w * r);
      }, 0);
      return acc + exerciseVolume;
    }, 0);

    const completedExCount = activeSession.exercises.filter(ex => ex.sets.some(s => s.completed)).length;

    setModalAlert({
      title: "🏆 Session Completed Successfully!",
      message: `Splendid output! You completed '${activeSession.dayName}'.\n\n💪 Exercises Logged: ${completedExCount}/${activeSession.exercises.length}\n🔥 Est. Total Volume Transferred: ${totalVolume} lbs.\n\nKeep pushing progressive overload, champion!`
    });
    
    // Reset active session
    setActiveSession(null);
  };

  // Filter schedules by muscle from the anatomical map
  const activeSplits = currentProgram?.splits || [];
  const filteredCuratedExercises = selectedMuscleFilter
    ? CURATED_EXERCISES.filter(ex => ex.muscle.toLowerCase() === selectedMuscleFilter.toLowerCase())
    : CURATED_EXERCISES;

  return (
    <div id="workout_builder_root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Routine Generator and Selector */}
      <div id="workout_control_panel" className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Selected Program Title Select Cards */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono mb-4">Select Workout Routine</h3>
          
          <div className="flex flex-col gap-2.5">
            {programs.map((prog, idx) => (
              <div
                key={prog.programName + "-" + idx}
                onClick={() => setSelectedProgramIdx(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                   idx === selectedProgramIdx
                    ? "bg-slate-950 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.1)]"
                    : "bg-slate-950/45 border-slate-805 hover:border-slate-700"
                }`}
              >
                <div className="flex-1 pr-3">
                  <h4 className={`text-sm font-bold transition-colors ${idx === selectedProgramIdx ? "text-lime-400" : "text-slate-200"}`}>
                    {prog.programName}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{prog.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-medium">
                    {prog.splits.length} Days
                  </span>
                  {programs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProgram(idx);
                      }}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isCreatingProgram ? (
            <button
              id="create_new_prog_btn"
              onClick={() => setIsCreatingProgram(true)}
              className="mt-4 w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-350 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 text-lime-400" /> Create Custom Routine
            </button>
          ) : (
            <form onSubmit={handleCreateEmptyProgram} className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3">
              <input
                type="text"
                placeholder="Routine Name (e.g. Arnold Split)"
                value={createNewProgramName}
                onChange={(e) => setCreateNewProgramName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-lime-400 hover:bg-lime-350 text-black font-extrabold text-xs rounded-lg transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingProgram(false)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-305 font-bold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* AI Generator Panel */}
        <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">AI Custom Routine</h3>
            <span className="flex items-center gap-1 text-[11px] bg-lime-404/10 text-lime-400 border border-lime-400/20 px-2.5 py-0.5 rounded-full font-mono">
              <Sparkles className="w-3 h-3 text-lime-400" /> Powered by Gemini
            </span>
          </div>

          <p className="text-xs text-slate-405 mb-5 leading-relaxed">
            Generate customized weightlifting splits, exercises, rep schemes, and tempo cues suited exactly to your goals.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Equipment Available</label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-lime-400 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none transition-colors font-semibold"
              >
                <option value="Full Commercial Gym">Full Commercial Gym</option>
                <option value="Dumbbells & Bench Only">Dumbbells & Adjustable Bench</option>
                <option value="Home Gym Barbell/Rack">Home Rack Barbell Setup</option>
                <option value="Calisthenics Bodyweight Only">Bodyweight Only</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Training Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-755 focus:border-lime-400 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none transition-colors font-semibold"
              >
                <option value="Beginner">Beginner (Perfecting Posture)</option>
                <option value="Intermediate">Intermediate (Consistent Lifter)</option>
                <option value="Advanced">Advanced (Heavy Volume Overload)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Fitness Goals</label>
              <select
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-lime-400 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none transition-colors font-semibold"
              >
                <option value="Muscle Hypertrophy">Muscle Hypertrophy (Size/Growth)</option>
                <option value="Maximum Strength">Maximum Strength (Powerlifting focus)</option>
                <option value="Tone & Fat Loss">High-Intense Conditioning / Fat Loss</option>
                <option value="Lean Athletic Endurance">Lean Athletic Endurance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-1">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">Split Days</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-lime-400 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none transition-colors font-semibold"
                >
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                  <option value="4">4 Days</option>
                  <option value="5">5 Days</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateAiProgram}
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-lime-400 hover:bg-lime-350 disabled:bg-slate-800 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                      Designing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-black" /> Generate Split
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {genError && (
            <div className="p-3 bg-red-950/20 border border-red-950/40 rounded-xl flex items-start gap-2 text-[11px] text-red-400">
              <Info className="w-4 h-4 shrink-0 text-red-500" />
              <span>
                {genError}
                <br />
                <span className="text-slate-400 font-sans">
                  You can still use the custom creator or default splits offline!
                </span>
              </span>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Splits Calendar Display / Active Session */}
      <div id="workout_splits_dashboard" className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Dynamic filter banner */}
        {selectedMuscleFilter && (
          <div className="bg-slate-900 border border-slate-805 p-4 rounded-3xl flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
              <p className="text-xs text-slate-300">
                Filtering curated directory exercises by muscle group: <strong className="text-white uppercase font-mono">{selectedMuscleFilter}</strong>
              </p>
            </div>
            <button
               id="clear_filter_banner_btn"
              onClick={onClearMuscleFilter}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-medium transition-all"
            >
              Show All Exercises
            </button>
          </div>
        )}

        {/* Current Active Split Details */}
        {currentProgram ? (
          <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60 mb-6">
              <div>
                <span className="text-[10px] bg-lime-950 border border-lime-900/50 text-lime-400 font-mono px-2.5 py-1 rounded-full font-bold tracking-wider uppercase">
                  Routine Program Profile
                </span>
                <h2 className="text-xl font-bold font-sans text-white mt-2">{currentProgram.programName}</h2>
                <p className="text-xs text-slate-400 font-sans mt-1 max-w-2xl leading-relaxed">{currentProgram.summary}</p>
              </div>
            </div>

            {/* Loop through schedules splits */}
            <div className="flex flex-col gap-6">
              {activeSplits.map((day, dayIdx) => (
                <div key={day.dayName + "-" + dayIdx} className="bg-slate-950/65 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-800 transition-all">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 font-mono tracking-wider">{day.dayName}</h4>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5">Focus: {day.focus}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!day.isRestDay && (
                        <button
                          onClick={() => handleStartWorkout(day)}
                          className="px-3.5 py-1.5 bg-lime-400 hover:bg-lime-300 text-black text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-black text-black" /> Start Training
                        </button>
                      )}
                      <button
                        onClick={() => setIsAddingExercise(isAddingExercise === dayIdx ? null : dayIdx)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1 hover:bg-slate-850 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Exercise
                      </button>
                    </div>
                  </div>

                  {/* Add Exercise Drawer */}
                  {isAddingExercise === dayIdx && (
                    <div className="mb-4 p-4 border border-slate-805 bg-slate-950 rounded-xl flex flex-col gap-4">
                      {/* Sub-tabs for Add exercise */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60 font-semibold">
                        <span className="text-xs font-semibold text-lime-400 font-sans">Option A: Quick Add Curated Movements</span>
                        <button onClick={() => setIsAddingExercise(null)} className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Filtered curated list */}
                      <div className="max-h-40 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 pr-1">
                        {filteredCuratedExercises.map((cur) => (
                          <div
                            key={cur.id}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 flex justify-between items-center transition-all cursor-pointer"
                            onClick={() => handleAddCuratedExercise(dayIdx, cur)}
                          >
                            <div className="pr-2">
                              <h5 className="text-[11.5px] font-bold text-slate-200">{cur.name}</h5>
                              <p className="text-[9px] text-slate-500">{cur.muscle} · {cur.mechanics}</p>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-lime-400 px-1.5 py-0.5 rounded font-mono font-bold">+ Add</span>
                          </div>
                        ))}
                      </div>

                      <div className="pb-2 pt-2 border-t border-slate-800/60">
                        <span className="text-xs font-semibold text-lime-400 font-sans">Option B: Custom Input exercise</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-semibold">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-mono text-slate-500 block mb-1">Exercise Name</label>
                          <input
                            type="text"
                            placeholder="Bench Press, Barbell Row..."
                            value={newExName}
                            onChange={(e) => setNewExName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-lime-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-500 block mb-1">Target Muscle</label>
                          <select
                            value={newExMuscle}
                            onChange={(e) => setNewExMuscle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-lime-400 font-bold"
                          >
                            {["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Calves", "Core"].map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-500 block mb-1">Sets Count</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={newExSets}
                            onChange={(e) => setNewExSets(parseInt(e.target.value) || 3)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-lime-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-500 block mb-1">Reps Range / Mode</label>
                          <input
                            type="text"
                            placeholder="e.g. 8-12, 5, AMRAP"
                            value={newExReps}
                            onChange={(e) => setNewExReps(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-lime-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-500 block mb-1">Tempo Cadence</label>
                          <input
                            type="text"
                            placeholder="e.g. 3-0-1-0"
                            value={newExTempo}
                            onChange={(e) => setNewExTempo(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-lime-400 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block mb-1 font-semibold">Trainer Cues & Posture Advice</label>
                        <input
                          type="text"
                          placeholder="Push knees out smoothly, brace core locks..."
                          value={newExCue}
                          onChange={(e) => setNewExCue(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-lime-400"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => handleAddExerciseSubmit(dayIdx)}
                          className="px-4 py-1.5 bg-lime-404 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Confirm custom addition
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Exercises Details Display */}
                  {day.isRestDay ? (
                    <div className="flex items-center gap-3 p-4 bg-slate-900/40 border border-slate-800/40 rounded-xl text-slate-500">
                      <Trophy className="w-5 h-5 text-amber-500/50" />
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Complete Recovery & Growth Phase</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Let muscle building protein synthesis repair microtears completely.</p>
                      </div>
                    </div>
                  ) : day.exercises.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-900/20 rounded-xl">
                      No exercises. Click "Add Exercise" above or create with AI to begin.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {day.exercises.map((ex, exIdx) => (
                        <div key={ex.name + "-" + exIdx} className="bg-slate-900 border border-slate-800/60 p-3.5 rounded-xl flex items-center justify-between flex-wrap gap-3">
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-slate-800 border border-slate-700/60 text-slate-300 font-mono font-medium px-2 py-0.5 rounded-full uppercase">
                                {ex.targetMuscle}
                              </span>
                              <h5 className="text-[13px] font-bold text-slate-200">{ex.name}</h5>
                            </div>
                            <p className="text-[10.5px] text-slate-400 mt-1 italic pl-1 leading-relaxed">
                              💡 <strong>Coach Tip:</strong> {ex.cue}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-right font-mono text-[11px] text-slate-400">
                              <span>SETS</span>
                              <span>REPS</span>
                              <span>TEMPO</span>
                              <strong className="text-lime-400">{ex.sets}</strong>
                              <strong className="text-lime-400">{ex.reps}</strong>
                              <strong className="text-slate-200">{ex.tempo}</strong>
                            </div>
                            <button
                              onClick={() => handleDeleteExercise(dayIdx, exIdx)}
                              className="p-1.5 bg-slate-950/40 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center shadow-xl">
            <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No workout program selected</h3>
            <p className="text-xs text-slate-400 mt-1">Please select or generate one under the selectors panel.</p>
          </div>
        )}

      </div>

      {/* ACTIVE WORKOUT SESSION TRACKER DRAWER / MODAL */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            id="active_session_mask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div
              id="active_session_card"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-905 bg-[#0d1527] border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
                    <span className="text-[10px] font-bold font-mono text-lime-400 tracking-wider uppercase">Active Gym Session</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{activeSession.dayName}</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Focusing on {activeSession.focus}</p>
                </div>
                <button
                  onClick={() => {
                    setModalConfirm({
                      title: "Cancel Workout Session?",
                      message: "Are you sure you want to terminate this training session? All active logs and completed sets for this session will be lost.",
                      onConfirm: () => {
                        setActiveSession(null);
                        setModalConfirm(null);
                      }
                    });
                  }}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Exercises listed */}
              <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6 pr-1">
                {activeSession.exercises.map((ex, exIdx) => (
                  <div key={ex.exerciseName + "-" + exIdx} className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{ex.exerciseName}</h4>
                        <p className="text-[10.5px] text-slate-500">Target Range: {ex.targetSetsCount} Sets · {ex.targetRepsRange} Reps</p>
                      </div>
                      <span className="text-[9.5px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-850 uppercase font-mono">
                        {ex.targetMuscle}
                      </span>
                    </div>

                    {/* Sets Logger */}
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-semibold text-slate-500 pb-1 border-b border-slate-900">
                        <span>SET</span>
                        <span>WEIGHT (LBS)</span>
                        <span>REPS</span>
                        <span>DONE</span>
                      </div>

                      {ex.sets.map((set, setIdx) => (
                        <div
                          key={set.setNum}
                          className={`grid grid-cols-4 gap-2 text-center items-center py-2.5 rounded-lg border transition-colors ${
                            set.completed
                              ? "bg-slate-900/60 border-lime-400/30 text-lime-400 font-semibold"
                              : "bg-slate-900/20 border-slate-850 text-slate-300"
                          }`}
                        >
                          <span className="text-xs font-semibold font-mono">#{set.setNum}</span>
                          <input
                            type="text"
                            value={set.weight}
                            onChange={(e) => handleUpdateActiveSet(exIdx, setIdx, "weight", e.target.value)}
                            disabled={set.completed}
                            className="bg-slate-950/80 border border-slate-850 text-slate-100 font-mono text-center text-xs rounded-lg py-1 max-w-[80px] mx-auto focus:outline-none focus:border-slate-700 disabled:opacity-50 font-bold"
                          />
                          <input
                            type="text"
                            value={set.reps}
                            onChange={(e) => handleUpdateActiveSet(exIdx, setIdx, "reps", e.target.value)}
                            disabled={set.completed}
                            className="bg-slate-950/80 border border-slate-850 text-slate-100 font-mono text-center text-xs rounded-lg py-1 max-w-[80px] mx-auto focus:outline-none focus:border-slate-700 disabled:opacity-50 font-bold"
                          />
                          <button
                            onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                            className="mx-auto text-slate-400 hover:text-lime-400 transition-colors"
                          >
                            {set.completed ? (
                              <CheckSquare className="w-4 h-4 text-lime-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* End Workout Button */}
              <div className="pt-4 border-t border-slate-800 flex gap-3">
                <button
                  onClick={handleFinishWorkout}
                  className="flex-1 py-3 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-sm rounded-xl transition-all shadow-lg text-center cursor-pointer"
                >
                  Conclude Session & Log Volume
                </button>
                <button
                  onClick={() => {
                    setModalConfirm({
                      title: "Minimize Session View?",
                      message: "This panel will minimize, keeping your live workout status and filled sets intact in local memory.",
                      onConfirm: () => {
                        setActiveSession(null);
                        setModalConfirm(null);
                      }
                    });
                  }}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Minimize
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM OVERLAY DIALOGS (REPLACING NATIVE WINDOW ALERTS & CONFIRMS) */}
      <AnimatePresence>
        {modalAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm shadow-2xl flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-lime-950/40 text-lime-404 rounded-full flex items-center justify-center mb-4 border border-lime-900/50">
                <Trophy className="w-5 h-5 text-lime-400 animate-bounce" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">{modalAlert.title}</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-line">
                {modalAlert.message}
              </p>
              <button
                onClick={() => setModalAlert(null)}
                className="mt-5 w-full py-2.5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Understood, Champ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm shadow-2xl flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-900/50">
                <X className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">{modalConfirm.title}</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {modalConfirm.message}
              </p>
              <div className="flex gap-2.5 mt-5 w-full">
                <button
                  onClick={() => modalConfirm.onConfirm()}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setModalConfirm(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
