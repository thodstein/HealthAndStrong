import { WorkoutProgram } from "./types";

export interface StaticExerciseDetail {
  id: string;
  name: string;
  muscle: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  mechanics: "Compound" | "Isolation";
  instructions: string;
}

export const CURATED_EXERCISES: StaticExerciseDetail[] = [
  // CHEST
  {
    id: "incline_db_press",
    name: "Incline Dumbbell Bench Press",
    muscle: "Chest",
    difficulty: "Intermediate",
    mechanics: "Compound",
    instructions: "Set incline to 30 degrees. Squeeze shoulder blades together, lower dumbbells to mid-chest levels, then drive upwards keeping elbows tucked at 45 degrees."
  },
  {
    id: "flat_barbell_press",
    name: "Flat Barbell Bench Press",
    muscle: "Chest",
    difficulty: "Beginner",
    mechanics: "Compound",
    instructions: "Position bar over eyes. Place hands wider than shoulder width. Lower bar controlled to lower chest level, and push vertically with full foot drive."
  },
  {
    id: "cable_crossover",
    name: "Standing Cable Fly/Crossover",
    muscle: "Chest",
    difficulty: "Intermediate",
    mechanics: "Isolation",
    instructions: "Align cables at shoulder height. Pivot forward slightly. Sweep arms forward in a wide arc, squeezing the chest at peak contraction."
  },
  {
    id: "chest_dips",
    name: "Chest-Focused Parallel Bar Dips",
    muscle: "Chest",
    difficulty: "Advanced",
    mechanics: "Compound",
    instructions: "Lean torso forward 15-30 degrees with elbows flares slightly out. Lower until biceps approach parallel to the floor, then press up."
  },
  // BACK
  {
    id: "barbell_row",
    name: "Bent-Over Barbell Row",
    muscle: "Back",
    difficulty: "Intermediate",
    mechanics: "Compound",
    instructions: "Hinge at the hips with a flat back. Grip barbell shoulder-width apart. Pull bar towards lower abdomen, initiating the pull with the elbows."
  },
  {
    id: "pullups",
    name: "Wide Grip Pull-up",
    muscle: "Back",
    difficulty: "Advanced",
    mechanics: "Compound",
    instructions: "Grip pulls bars wide. Depress scapula and pull chest up vertically to meet the bar, focusing on driving the elbows down into your ribs."
  },
  {
    id: "lat_pulldown",
    name: "Pronated Lat Pulldown",
    muscle: "Back",
    difficulty: "Beginner",
    mechanics: "Compound",
    instructions: "Secure thighs under pads. Squeeze shoulder blades down, pull the bar down smoothly to your collarbone while leaning slightly back."
  },
  {
    id: "romanian_deadlift",
    name: "Barbell Romanian Deadlift (RDL)",
    muscle: "Hamstrings",
    difficulty: "Intermediate",
    mechanics: "Compound",
    instructions: "Push hips back horizontally while sliding bar down your thighs. Keep chest proud and shins vertical. Squeeze hamstrings and glutes on ascent."
  },
  // SHOULDERS
  {
    id: "overhead_press",
    name: "Standing Barbell Overhead Press (OHP)",
    muscle: "Shoulders",
    difficulty: "Intermediate",
    mechanics: "Compound",
    instructions: "Clean bar to front-rack. Anchor feet, brace abs, squeeze glutes, and push bar directly overhead while pushing your head forward to clear the bar."
  },
  {
    id: "lateral_raise",
    name: "Dumbbell Lateral Raise",
    muscle: "Shoulders",
    difficulty: "Beginner",
    mechanics: "Isolation",
    instructions: "Stand tall. Raise dumbbells out to your side in a wide arc (scapular plane), leading slightly with your elbows until parallel with shoulders."
  },
  {
    id: "rear_delt_fly",
    name: "Bent-Over Dumbbell Rear Delt Fly",
    muscle: "Shoulders",
    difficulty: "Beginner",
    mechanics: "Isolation",
    instructions: "Hinge forward. Keep a slight bend in the elbows. Sweep arms out to the sides, focusing purely on pulling with the back of your shoulders."
  },
  // BICEPS
  {
    id: "barbell_curl",
    name: "Standing Barbell Bicep Curl",
    muscle: "Biceps",
    difficulty: "Beginner",
    mechanics: "Isolation",
    instructions: "Keep elbows pinned to your ribs, contract biceps to lift bar under control. Squeeze at the top, and resist gravity on the 3-second descent."
  },
  {
    id: "hammer_curl",
    name: "Seated Dumbbell Hammer Curl",
    muscle: "Biceps",
    difficulty: "Beginner",
    mechanics: "Isolation",
    instructions: "Hold dumbbells with neutral (palms facing) grips. Raise bells while holding wrists rigid, engaging brachialis and forearm muscles."
  },
  // TRICEPS
  {
    id: "cable_pushdown",
    name: "Cable Rope Tricep Pushdown",
    muscle: "Triceps",
    difficulty: "Beginner",
    mechanics: "Isolation",
    instructions: "Rest elbows near side torso. Extend arms fully down, flaring the rope handles apart at peak contraction to exhaust lateral head."
  },
  {
    id: "skull_crusher",
    name: "Lying EZ-Bar Skull Crusher",
    muscle: "Triceps",
    difficulty: "Intermediate",
    mechanics: "Isolation",
    instructions: "Lie flat holding EZ-bar over chest. Tilt shoulders back slightly. Bend at elbows to lower the bar towards your forehead, then extend upwards."
  },
  // LEGS - QUADS
  {
    id: "barbell_squat",
    name: "Barbell High-Bar Back Squat",
    muscle: "Quads",
    difficulty: "Intermediate",
    mechanics: "Compound",
    instructions: "Rest bar on upper traps. Pull shoulders down, squat deep by flexing knees and pushing hips back concurrently. Push up driving through the heels."
  },
  {
    id: "leg_extension",
    name: "Seated Machine Leg Extension",
    muscle: "Quads",
    difficulty: "Beginner",
    mechanics: "Isolation",
    instructions: "Adjust roller to ankle crest. Grip handles to lock hips down. Fully extend knees and squeeze quadriceps at the top of the curve."
  },
  // LEGS - HAMSTRINGS & CALVES
  {
    id: "lying_leg_curl",
    name: "Lying Machine Leg Curl",
    muscle: "Hamstrings",
    difficulty: "Beginner",
    mechanics: "Isolation",
    instructions: "Align knee joints with pivot point. Drive heels actively towards your lower glutes while keeping hips compressed flat to the pad."
  },
  {
    id: "calf_raise",
    name: "Standing Machine Calf Raise",
    muscle: "Calves",
    difficulty: "Beginner",
    mechanics: "Isolation",
    instructions: "Position balls of feet on platform, lower heels into a deep stretch, then press high through big toes to flex soleus and gastrocnemius."
  },
  // CORE
  {
    id: "hanging_leg_raise",
    name: "Hanging Captain's Chair Knee/Leg Raise",
    muscle: "Core",
    difficulty: "Intermediate",
    mechanics: "Isolation",
    instructions: "Hang from bars or lean back on captain pad. Lift knees or straight legs up until thighs are parallel to or above waist, engaging lower abs."
  },
  {
    id: "cable_crunch",
    name: "Kneeling Rope Cable Crunch",
    muscle: "Core",
    difficulty: "Intermediate",
    mechanics: "Isolation",
    instructions: "Hold rope handles next to head. Pivot from knees, pull ribs down towards pelvis, curving spine to fully compress rectus abdominis."
  }
];

export const MUSCLE_COLORS: Record<string, string> = {
  Chest: "bg-red-500 hover:bg-red-600 border-red-700 text-red-100",
  Back: "bg-lime-500 hover:bg-lime-400 border-lime-600 text-black font-extrabold",
  Shoulders: "bg-amber-500 hover:bg-amber-600 border-amber-700 text-amber-100",
  Biceps: "bg-blue-500 hover:bg-blue-600 border-blue-700 text-blue-100",
  Triceps: "bg-indigo-500 hover:bg-indigo-600 border-indigo-700 text-indigo-100",
  Quads: "bg-orange-500 hover:bg-orange-600 border-orange-700 text-orange-100",
  Hamstrings: "bg-purple-500 hover:bg-purple-600 border-purple-700 text-purple-100",
  Calves: "bg-pink-500 hover:bg-pink-600 border-pink-700 text-pink-100",
  Core: "bg-teal-500 hover:bg-teal-600 border-teal-700 text-teal-100"
};

export const DEFAULT_WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    programName: "Gold-Era Aesthetics (Push/Pull/Legs)",
    summary: "A fundamental 3-day high-frequency split targeting muscle hypertrophy, maximizing volume per muscle group while maintaining optimal rest-recovery intervals per muscle system.",
    splits: [
      {
        dayName: "Day 1: Upper Push (Chest, Delts, Triceps)",
        focus: "Chest, Shoulders, Triceps",
        isRestDay: false,
        exercises: [
          { name: "Incline Dumbbell Bench Press", sets: 4, reps: "8-12", tempo: "3-1-1-0", cue: "Lower dumbbells deep keeping elbows arched at 45 degrees.", targetMuscle: "Chest" },
          { name: "Flat Barbell Bench Press", sets: 3, reps: "6-8", tempo: "3-0-1-0", cue: "Drive feet hard, retract shoulder blades.", targetMuscle: "Chest" },
          { name: "Standing Barbell Overhead Press", sets: 3, reps: "8-10", tempo: "2-1-1-0", cue: "Brace abs, push bar straight past ears.", targetMuscle: "Shoulders" },
          { name: "Dumbbell Lateral Raise", sets: 4, reps: "12-15", tempo: "2-0-1-1", cue: "Pull weights outward sideways with Pinkies up.", targetMuscle: "Shoulders" },
          { name: "Cable Rope Tricep Pushdown", sets: 3, reps: "10-12", tempo: "3-0-1-1", cue: "Flare rope endpoints at absolute locking stretch.", targetMuscle: "Triceps" }
        ]
      },
      {
        dayName: "Day 2: Upper Pull (Back & Biceps)",
        focus: "Back, Biceps, Rear Delts",
        isRestDay: false,
        exercises: [
          { name: "Wide Grip Pull-up", sets: 4, reps: "Max-8", tempo: "2-0-1-1", cue: "Lead with collarbones, squeeze the lats.", targetMuscle: "Back" },
          { name: "Bent-Over Barbell Row", sets: 3, reps: "8-10", tempo: "3-0-1-0", cue: "Pull towards belly button, squeeze shoulder blades.", targetMuscle: "Back" },
          { name: "Lat Pulldown", sets: 3, reps: "10-12", tempo: "3-1-1-0", cue: "Lean slightly back, drive the elbows low.", targetMuscle: "Back" },
          { name: "Standing Barbell Bicep Curl", sets: 4, reps: "8-12", tempo: "3-1-1-1", cue: "Keep wrist solid, do not swing shoulders.", targetMuscle: "Biceps" },
          { name: "Hammer Curl", sets: 3, reps: "12-15", tempo: "2-0-1-0", cue: "Hold neutral grip to stress brachial muscles.", targetMuscle: "Biceps" }
        ]
      },
      {
        dayName: "Day 3: Lower Body (Quads, Hamstrings, Calves)",
        focus: "Quads, Hamstrings, Calves",
        isRestDay: false,
        exercises: [
          { name: "Barbell High-Bar Back Squat", sets: 4, reps: "6-8", tempo: "3-1-1-0", cue: "Push knees out, squat past parallel level.", targetMuscle: "Quads" },
          { name: "Barbell Romanian Deadlift", sets: 3, reps: "8-10", tempo: "3-0-1-0", cue: "Push hips way back until hamstrings pull.", targetMuscle: "Hamstrings" },
          { name: "Leg Extension", sets: 3, reps: "12-15", tempo: "2-1-1-1", cue: "Point toes forward, flex quads tight.", targetMuscle: "Quads" },
          { name: "Lying Machine Leg Curl", sets: 3, reps: "10-12", tempo: "3-1-1-0", cue: "Keep pelvis pressed flat to pads.", targetMuscle: "Hamstrings" },
          { name: "Standing Machine Calf Raise", sets: 4, reps: "15-20", tempo: "3-2-1-1", cue: "2-second deep stretch, 1-second top flex.", targetMuscle: "Calves" }
        ]
      }
    ]
  }
];
