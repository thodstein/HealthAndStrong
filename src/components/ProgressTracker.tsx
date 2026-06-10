import React, { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Scale, Activity, TrendingUp, Compass } from "lucide-react";
import { ProgressMeasurement } from "../types";

interface ProgressTrackerProps {
  onWeightLoggedExternally?: (weight: number) => void;
  onRefreshTrigger?: number;
}

export default function ProgressTracker({ onWeightLoggedExternally, onRefreshTrigger }: ProgressTrackerProps) {
  // Store measurements in localStorage
  const [records, setRecords] = useState<ProgressMeasurement[]>(() => {
    const saved = localStorage.getItem("bbh_progress_records");
    if (saved) return JSON.parse(saved);

    // Initial default progressive timeline records
    return [
      { id: "1", date: "2026-05-10", weight: 178.5, bodyFat: 15.2, muscleMass: 151.3, chest: 38.2, waist: 32.5, arms: 14.1 },
      { id: "2", date: "2026-05-20", weight: 179.2, bodyFat: 14.8, muscleMass: 152.6, chest: 38.4, waist: 32.2, arms: 14.2 },
      { id: "3", date: "2026-05-30", weight: 180.1, bodyFat: 14.5, muscleMass: 153.9, chest: 38.6, waist: 32.0, arms: 14.4 },
      { id: "4", date: "2026-06-10", weight: 181.5, bodyFat: 14.2, muscleMass: 155.7, chest: 39.0, waist: 31.8, arms: 14.6 }
    ];
  });

  // Track state
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [arms, setArms] = useState("");

  const [activeTab, setActiveTab] = useState<"weight" | "composition" | "dimensions">("weight");
  const [hoveredDataIdx, setHoveredDataIdx] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("bbh_progress_records", JSON.stringify(records));
  }, [records]);

  // Handle external addition triggers if any
  useEffect(() => {
    if (onRefreshTrigger) {
      const saved = localStorage.getItem("bbh_progress_records");
      if (saved) setRecords(JSON.parse(saved));
    }
  }, [onRefreshTrigger]);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    const wNum = parseFloat(weight);
    if (isNaN(wNum)) return;

    const newRecord: ProgressMeasurement = {
      id: Date.now().toString(),
      date,
      weight: wNum,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      chest: chest ? parseFloat(chest) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      arms: arms ? parseFloat(arms) : undefined,
    };

    // Replace if duplicate date
    const filtered = records.filter(r => r.date !== date);
    const sorted = [...filtered, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setRecords(sorted);
    
    if (onWeightLoggedExternally) {
      onWeightLoggedExternally(wNum);
    }

    // Reset fields except date
    setWeight("");
    setBodyFat("");
    setMuscleMass("");
    setChest("");
    setWaist("");
    setArms("");
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  // SVG Chart Computations (Pure Custom High-fidelity responsive graph)
  const renderChart = () => {
    if (records.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-xs italic">
          <TrendingUp className="w-8 h-8 text-slate-700 mb-2" />
          <span>Need at least two log entries to chart progressive trends.</span>
        </div>
      );
    }

    // Chronological sort
    const sortedData = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Pick active field to map on Y coordinates
    let getYValue = (r: ProgressMeasurement): number => r.weight;
    let label = "Weight (lbs)";
    let lineColor = "#a3e635"; // neon lime
    let gradientStart = "rgba(163, 230, 53, 0.25)";

    if (activeTab === "composition") {
      getYValue = (r: ProgressMeasurement) => r.bodyFat || 0;
      label = "Body Fat (%)";
      lineColor = "#3b82f6"; // blue
      gradientStart = "rgba(59, 130, 246, 0.25)";
    } else if (activeTab === "dimensions") {
      getYValue = (r: ProgressMeasurement) => r.arms || 0;
      label = "Arm Girth (in)";
      lineColor = "#f59e0b"; // amber
      gradientStart = "rgba(245, 158, 11, 0.25)";
    }

    // Math metrics
    const values = sortedData.map(getYValue);
    const nonZeroValues = values.filter(v => v > 0);
    const yMin = Math.max(0, Math.min(...nonZeroValues) - (activeTab === "weight" ? 5 : 1));
    const yMax = Math.max(...nonZeroValues) + (activeTab === "weight" ? 5 : 1);
    const yRange = yMax - yMin || 1;

    // Viewport coordinates layout
    const width = 580;
    const height = 240;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 35;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Calculate (X,Y) coordinates mapping functions
    const points = sortedData.map((d, idx) => {
      const val = getYValue(d);
      const x = paddingLeft + (idx / (sortedData.length - 1)) * chartWidth;
      // Flip Y axis
      const y = paddingTop + chartHeight - ((val - yMin) / yRange) * chartHeight;
      return { x, y, val, original: d, idx };
    });

    // Create SVG PATH syntax strings
    let linePathStr = "";
    let areaPathStr = "";

    if (points.length > 0) {
      // Build polyline path
      linePathStr = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        linePathStr += ` L ${points[i].x} ${points[i].y}`;
      }

      // Build filled gradient polygon path
      areaPathStr = `${linePathStr} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    }

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-400 font-mono">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const h = paddingTop + ratio * chartHeight;
            const valueLabel = (yMax - ratio * yRange).toFixed(1);
            return (
              <g key={`grid-${index}`}>
                <line
                  x1={paddingLeft}
                  y1={h}
                  x2={width - paddingRight}
                  y2={h}
                  stroke="#1e293b"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={h + 4}
                  textAnchor="end"
                  fill="#475569"
                  className="text-[9px]"
                >
                  {valueLabel}
                </text>
              </g>
            );
          })}

          {/* Area under curve fill */}
          {areaPathStr && (
            <path d={areaPathStr} fill="url(#chartGlow)" />
          )}

          {/* Line stroke */}
          {linePathStr && (
            <path
              d={linePathStr}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive touch targets or dots */}
          {points.map((pt, i) => {
            const isHovered = hoveredDataIdx === i;
            return (
              <g
                key={`dot-${i}`}
                onMouseEnter={() => setHoveredDataIdx(i)}
                onMouseLeave={() => setHoveredDataIdx(null)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + chartHeight}
                    stroke="#475569"
                    strokeWidth="0.75"
                    strokeDasharray="2 2"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? "5.5" : "3.5"}
                  fill={isHovered ? "#fff" : lineColor}
                  stroke={isHovered ? lineColor : "#0f172a"}
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Time timeline X axis markers */}
          {points.map((pt, i) => {
            const dateStr = new Date(pt.original.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              timeZone: "UTC"
            });
            // Show only first, last, and every other point to prevent text overlaps
            const showLabel = i === 0 || i === points.length - 1 || (points.length > 3 && i === Math.floor(points.length / 2));
            if (!showLabel) return null;
            return (
              <text
                key={`xlabel-${i}`}
                x={pt.x}
                y={paddingTop + chartHeight + 16}
                textAnchor="middle"
                fill="#475569"
                className="text-[9px]"
              >
                {dateStr}
              </text>
            );
          })}
        </svg>

        {/* Hover card coordinates readout overlay */}
        {hoveredDataIdx !== null && points[hoveredDataIdx] && (
          <div className="absolute top-2 right-2 bg-slate-950/95 backdrop-blur border border-slate-800 rounded-xl p-2.5 shadow-xl text-[11px] font-mono z-10 flex flex-col gap-1 select-none">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider block">
              Log Record Details
            </span>
            <span className="text-slate-105 font-bold">
              🗓️ {new Date(points[hoveredDataIdx].original.date).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}
            </span>
            <span className="text-white">
              📈 {label}: <strong className="text-lime-400 font-bold">{points[hoveredDataIdx].val}</strong>
            </span>
            {activeTab === "weight" && points[hoveredDataIdx].original.bodyFat && (
              <span className="text-slate-400">
                ⚡ Fat: {points[hoveredDataIdx].original.bodyFat}%
              </span>
            )}
            {activeTab === "composition" && points[hoveredDataIdx].original.muscleMass && (
              <span className="text-slate-400">
                💪 Muscle: {points[hoveredDataIdx].original.muscleMass} lbs
              </span>
            )}
            {activeTab === "dimensions" && points[hoveredDataIdx].original.chest && (
              <span className="text-slate-400">
                📏 Chest: {points[hoveredDataIdx].original.chest} in
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="progress_tracker_root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Main progression chart */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Trend Graph Grid Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60 mb-6">
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono">Bodybuild Progression Trends</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Custom visual metrics logs</p>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 self-start md:self-auto">
              <button
                onClick={() => {
                  setActiveTab("weight");
                  setHoveredDataIdx(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-tight uppercase transition-all cursor-pointer ${
                  activeTab === "weight"
                    ? "bg-slate-900 text-lime-400 border border-slate-800 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Weight Logs
              </button>
              <button
                onClick={() => {
                  setActiveTab("composition");
                  setHoveredDataIdx(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-tight uppercase transition-all ${
                  activeTab === "composition"
                    ? "bg-slate-900 text-blue-400 border border-slate-800 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Body Fat %
              </button>
              <button
                onClick={() => {
                  setActiveTab("dimensions");
                  setHoveredDataIdx(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-tight uppercase transition-all ${
                  activeTab === "dimensions"
                    ? "bg-slate-900 text-amber-400 border border-slate-800 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Arm Girth
              </button>
            </div>
          </div>

          {/* SVG canvas stage output container */}
          {renderChart()}

        </div>

        {/* Detailed history log registry */}
        <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase font-mono mb-4">Historical Records Registry</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold tracking-wider">
                  <th className="py-2.5 font-semibold">DATE</th>
                  <th className="py-2.5 font-semibold">WEIGHT (LBS)</th>
                  <th className="py-2.5 font-semibold text-blue-400">BODY FAT %</th>
                  <th className="py-2.5 font-semibold text-lime-400 font-bold">MUSCLE MASS</th>
                  <th className="py-2.5 font-semibold text-slate-400">DIMENSIONS (CHEST/WAIST/ARM)</th>
                  <th className="py-2.5 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500 italic">No historical data recorded yet.</td>
                  </tr>
                ) : (
                  [...records].reverse().map((r) => (
                    <tr key={r.id} className="text-slate-300 hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 flex items-center gap-1.5 font-sans font-bold text-white">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                      </td>
                      <td className="py-3 font-bold text-slate-100">{r.weight} lbs</td>
                      <td className="py-3 text-blue-400">{r.bodyFat ? `${r.bodyFat}%` : "—"}</td>
                      <td className="py-3 text-slate-300">{r.muscleMass ? `${r.muscleMass} lbs` : "—"}</td>
                      <td className="py-3 text-slate-400">
                        {r.chest || r.waist || r.arms ? (
                          <span>
                            {r.chest ? `Chest: ${r.chest} "` : ""}
                            {r.waist ? `· Waist: ${r.waist} "` : ""}
                            {r.arms ? `· Arms: ${r.arms} "` : ""}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive metrics logging form */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Logistics Form Panel */}
        <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-lime-400" />
            <h3 className="text-sm font-semibold tracking-wider text-slate-100 uppercase font-mono">Capture Metrics</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Record detailed structural data points down to body fat breakdown indices and tape dimensions over time to compute hypertrophic accuracy.
          </p>

          <form onSubmit={handleAddRecord} className="flex flex-col gap-4">
            
            <div>
              <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">Log Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">Body Weight (LBS) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 182.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none placeholder-slate-650"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold text-blue-400">Body Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 14.5"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none placeholder-slate-650"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold text-lime-400">Muscle (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 156.0"
                  value={muscleMass}
                  onChange={(e) => setMuscleMass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none placeholder-slate-650"
                />
              </div>
            </div>

            <div className="my-2 border-t border-slate-800/60 pt-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-3">Tape Dimensions (optional)</span>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1 uppercase">Chest (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="39.0"
                    value={chest}
                    onChange={(e) => setChest(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1 uppercase">Waist (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="31.5"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 focus:border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none animate-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1 uppercase">Arms (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="14.8"
                    value={arms}
                    onChange={(e) => setArms(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-808 focus:border-slate-750 rounded-xl p-2 text-xs text-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-lime-404 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black" /> Add To History Logs
            </button>

          </form>
        </div>

        {/* Dynamic progression insights panel */}
        <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-5 h-5 text-lime-404 text-lime-400" />
            <h3 className="text-sm font-semibold tracking-wider text-slate-100 uppercase font-mono">Structural Indicators</h3>
          </div>
          {records.length > 1 ? (
            <div className="flex flex-col gap-3 font-mono text-[11px] text-slate-400">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-slate-500 text-[9px] block">TOTAL WEIGHT DELTA</span>
                <span className="text-white font-bold text-xs mt-0.5 inline-block">
                  {(records[records.length - 1].weight - records[0].weight).toFixed(1)} lbs
                </span>
                <span className="text-[10px] text-slate-500 ml-1">since {new Date(records[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-blue-400 text-[9px] block">FAT REDUCTION RATE</span>
                <span className="text-white font-bold text-xs mt-0.5 inline-block">
                  {records[records.length - 1].bodyFat && records[0].bodyFat
                    ? `${(records[0].bodyFat - records[records.length - 1].bodyFat).toFixed(1)}%`
                    : "0.0%"}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">body fat loss ratio</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Insights will display once you record multiple logs over several days.</p>
          )}
        </div>

      </div>

    </div>
  );
}
