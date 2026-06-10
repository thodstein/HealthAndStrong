import { useState } from "react";
import { motion } from "motion/react";
import { MUSCLE_COLORS } from "../exerciseData";

interface AnatomicalMapProps {
  selectedMuscle: string | null;
  onSelectMuscle: (muscle: string | null) => void;
}

export default function AnatomicalMap({ selectedMuscle, onSelectMuscle }: AnatomicalMapProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  // Muscle anatomical regions
  const frontMuscles = [
    { name: "Chest", label: "Pectorals", x: 150, y: 120, rx: 35, ry: 20 },
    { name: "Shoulders", label: "Deltoids", x: 92, y: 115, rx: 16, ry: 25 },
    { name: "Shoulders", label: "Deltoids", x: 208, y: 115, rx: 16, ry: 25 },
    { name: "Biceps", label: "Curls (Biceps)", x: 74, y: 160, rx: 12, ry: 22 },
    { name: "Biceps", label: "Curls (Biceps)", x: 226, y: 160, rx: 12, ry: 22 },
    { name: "Core", label: "Abdominals", x: 150, y: 180, rx: 25, ry: 35 },
    { name: "Quads", label: "Quadriceps", x: 118, y: 260, rx: 20, ry: 45 },
    { name: "Quads", label: "Quadriceps", x: 182, y: 260, rx: 20, ry: 45 },
  ];

  const backMuscles = [
    { name: "Back", label: "Latissimus / Lats", x: 150, y: 140, rx: 38, ry: 35 },
    { name: "Shoulders", label: "Rear Delts", x: 96, y: 115, rx: 14, ry: 18 },
    { name: "Shoulders", label: "Rear Delts", x: 204, y: 115, rx: 14, ry: 18 },
    { name: "Triceps", label: "Triceps", x: 70, y: 160, rx: 11, ry: 24 },
    { name: "Triceps", label: "Triceps", x: 230, y: 160, rx: 11, ry: 24 },
    { name: "Hamstrings", label: "Hamstrings", x: 118, y: 275, rx: 18, ry: 40 },
    { name: "Hamstrings", label: "Hamstrings", x: 182, y: 275, rx: 18, ry: 40 },
    { name: "Calves", label: "Gastrocnemius", x: 118, y: 360, rx: 14, ry: 28 },
    { name: "Calves", label: "Gastrocnemius", x: 182, y: 360, rx: 14, ry: 28 },
  ];

  const muscles = view === "front" ? frontMuscles : backMuscles;

  const handleGroupClick = (muscleName: string) => {
    if (selectedMuscle === muscleName) {
      onSelectMuscle(null); // Toggle off
    } else {
      onSelectMuscle(muscleName);
    }
  };

  return (
    <div id="anatomical_map_root" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 flex flex-col justify-between h-full relative overflow-hidden shadow-2xl">
      {/* Decorative Blueprint Lines */}
      <div className="absolute inset-0 border border-dashed border-slate-800/60 pointer-events-none rounded-3xl m-2" />
      
      <div id="anatomical_map_header" className="flex items-center justify-between z-10 mb-4 h-12">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">My Muscle Map</h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Click groups to view exercises</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="map_btn_front"
            onClick={() => setView("front")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === "front"
                ? "bg-lime-400 text-black shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Anterior
          </button>
          <button
            id="map_btn_back"
            onClick={() => setView("back")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === "back"
                ? "bg-lime-400 text-black shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Posterior
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[420px]">
        {/* Anatomical Silhouette Grid */}
        <svg
          viewBox="0 0 300 440"
          className="w-full max-w-[280px] h-auto drop-shadow-[0_0_20px_rgba(163,230,53,0.08)]"
        >
          {/* Main Body Schema Background */}
          {/* Head */}
          <circle cx="150" cy="50" r="18" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Neck */}
          <rect x="145" y="65" width="10" height="15" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Torso Outline */}
          <path
            d="M 100,85 C 100,85 110,130 110,210 C 110,210 115,220 150,220 C 185,220 190,210 190,210 C 190,130 200,85 200,85 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Left Arm Outline */}
          <path
            d="M 96,85 C 80,100 68,130 68,180 C 68,195 72,205 78,205 C 84,205 88,190 92,150 L 100,100 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Right Arm Outline */}
          <path
            d="M 204,85 C 220,100 232,130 232,180 C 232,195 228,205 222,205 C 216,205 212,190 208,150 L 200,100 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Left Leg Outline */}
          <path
            d="M 110,220 C 110,220 100,300 102,410 C 102,420 110,425 118,425 C 126,425 132,410 144,310 L 148,220 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Right Leg Outline */}
          <path
            d="M 190,220 C 190,220 200,300 198,410 C 198,420 190,425 182,425 C 174,425 168,410 156,310 L 152,220 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Interactive Muscle Plates overlays */}
          {muscles.map((muscle, idx) => {
            const isGroupSelected = selectedMuscle === muscle.name;
            const isGroupHovered = hoveredGroup === muscle.name;
            
            // Generate fill colors
            let fill = "rgba(71, 85, 105, 0.15)";
            let stroke = "#475569";
            
            if (isGroupSelected) {
              fill = "rgba(163, 230, 53, 0.45)";
              stroke = "#a3e635";
            } else if (isGroupHovered) {
              fill = "rgba(163, 230, 53, 0.2)";
              stroke = "#bef264";
            }

            return (
              <g
                key={`${view}-${muscle.name}-${idx}`}
                onClick={() => handleGroupClick(muscle.name)}
                onMouseEnter={() => setHoveredGroup(muscle.name)}
                onMouseLeave={() => setHoveredGroup(null)}
                className="cursor-pointer transition-all duration-300"
              >
                <ellipse
                  cx={muscle.x}
                  cy={muscle.y}
                  rx={muscle.rx}
                  ry={muscle.ry}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isGroupSelected ? "1.75" : "1"}
                  className="transition-all duration-300 transform-gpu"
                />
                
                {/* Micro target circle dots */}
                <circle
                  cx={muscle.x}
                  cy={muscle.y}
                  r="3.5"
                  fill={isGroupSelected ? "#a3e635" : "#475569"}
                  className="transition-colors duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltips or Legends */}
        <div id="anatomical_map_floating_overlay" className="absolute bottom-1 bg-slate-950/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3 w-max max-w-full shadow-lg z-10 transition-all">
          <div className="flex gap-2 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-mono">Target Selected:</span>
          </div>
          <span className="text-[11px] font-semibold text-white tracking-wide font-mono">
            {selectedMuscle ? selectedMuscle : "All Muscles (Click to filter)"}
          </span>
          {selectedMuscle && (
            <button
               id="clear_muscle_btn"
              onClick={() => onSelectMuscle(null)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Muscle Quick Filters Map Foot */}
      <div id="anatomical_map_footer font-sans" className="mt-4 pt-4 border-t border-slate-800/60 z-10 flex flex-wrap gap-1.5 justify-center">
        {Object.keys(MUSCLE_COLORS).map((muscle) => {
          const isSelected = selectedMuscle === muscle;
          return (
            <button
              key={muscle}
              onClick={() => handleGroupClick(muscle)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-semibold border transition-all ${
                isSelected
                  ? "bg-lime-400 border-lime-500 text-black scale-105 shadow-md font-bold"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {muscle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
